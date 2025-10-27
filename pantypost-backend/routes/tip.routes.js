// pantypost-backend/routes/tip.routes.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');
const { incrementPaymentStats } = require('../utils/paymentStats');

// ✅ Use the initialized singleton websocket service
const webSocketService = require('../config/websocket');

// Validation middleware for tip amount
const validateTip = [
  body('amount')
    .isFloat({ min: 1, max: 500 })
    .withMessage('Tip amount must be between $1 and $500'),
  body('recipientUsername')
    .notEmpty()
    .isString()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid recipient username'),
  body('message')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters')
];

// POST /api/tips/send - Send a tip to a seller (WITHOUT TRANSACTIONS)
router.post('/send', authMiddleware, validateTip, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Coerce amount to number
    const amount = Number(req.body.amount);
    const { recipientUsername, message } = req.body;
    const senderUsername = req.user.username;

    console.log('[Tip] Processing tip:', { from: senderUsername, to: recipientUsername, amount });

    if (senderUsername === recipientUsername) {
      return res.status(400).json({ success: false, error: 'You cannot tip yourself' });
    }

    // Sender wallet
    let senderWallet = await Wallet.findOne({ username: senderUsername });
    if (!senderWallet) {
      senderWallet = new Wallet({ username: senderUsername, role: 'buyer', balance: 0 });
      await senderWallet.save();
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    if (senderWallet.balance < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // Recipient
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'Recipient not found' });
    }
    if (recipient.role !== 'seller') {
      return res.status(400).json({ success: false, error: 'Tips can only be sent to sellers' });
    }

    // Recipient wallet
    let recipientWallet = await Wallet.findOne({ username: recipientUsername });
    if (!recipientWallet) {
      recipientWallet = new Wallet({ username: recipientUsername, role: 'seller', balance: 0 });
      await recipientWallet.save();
    }

    try {
      // 1) Deduct sender
      const prevSenderBalance = senderWallet.balance;
      senderWallet.balance = Number((senderWallet.balance - amount).toFixed(2));
      senderWallet.lastTransaction = new Date();
      await senderWallet.save();

      // 2) Credit recipient
      const prevRecipientBalance = recipientWallet.balance;
      recipientWallet.balance = Number((recipientWallet.balance + amount).toFixed(2));
      recipientWallet.lastTransaction = new Date();
      await recipientWallet.save();

      // 3) Transaction record
      const transaction = new Transaction({
        type: 'tip',
        amount,
        from: senderUsername,
        to: recipientUsername,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Tip from ${senderUsername} to ${recipientUsername}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          message: message || null,
          paymentMethod: 'wallet',
          platformFee: 0,
          sellerEarnings: amount,
          buyerPayment: amount
        }
      });
      await transaction.save();

      // 4) DB notification (persists) - THIS AUTOMATICALLY EMITS notification:new via the model
      await Notification.createTipNotification(recipientUsername, senderUsername, amount);
      console.log('[Tip] DB notification created for', recipientUsername);

      // REMOVED DUPLICATE EMISSIONS - The DB notification already handles WebSocket emission
      // The Notification.createTipNotification method in the model already calls:
      // global.webSocketService.emitToUser(data.recipient, 'notification:new', ...)
      
      // 5) Balance update signals (keeping these as they're different events)
      try {
        webSocketService.emitBalanceUpdate(
          senderUsername, 'buyer',
          prevSenderBalance, senderWallet.balance, 'tip_sent'
        );
        webSocketService.emitBalanceUpdate(
          recipientUsername, 'seller',
          prevRecipientBalance, recipientWallet.balance, 'tip_received'
        );
      } catch (_) {}

      try {
        await incrementPaymentStats(amount);
      } catch (statsError) {
        console.error('[Tip] Failed to increment payment stats:', statsError);
      }

      return res.json({
        success: true,
        message: `Successfully sent $${amount.toFixed(2)} tip to ${recipientUsername}`,
        transaction: {
          id: transaction._id,
          amount,
          recipient: recipientUsername,
          timestamp: transaction.createdAt
        }
      });

    } catch (saveError) {
      console.error('[Tip] Error during save operations:', saveError);
      // Manual rollback sender
      try {
        senderWallet.balance = Number((senderWallet.balance + amount).toFixed(2));
        await senderWallet.save();
      } catch (rbErr) {
        console.error('[Tip] Failed to rollback sender balance:', rbErr);
      }
      throw saveError;
    }

  } catch (error) {
    console.error('[Tip] Error sending tip:', error);
    return res.status(500).json({ success: false, error: 'Failed to send tip' });
  }
});

// GET /api/tips/received - Get tips received by a seller
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const username = req.query.username || req.user.username;
    if (username !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only view your own tips' });
    }

    const dateFilter = {};
    if (req.query.startDate) dateFilter.createdAt = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) dateFilter.createdAt = { ...(dateFilter.createdAt || {}), $lte: new Date(req.query.endDate) };

    const tips = await Transaction.find({ type: 'tip', to: username, status: 'completed', ...dateFilter })
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    const total = tips.reduce((sum, tip) => sum + tip.amount, 0);

    return res.json({
      success: true,
      data: {
        tips: tips.map(tip => ({
          id: tip._id,
          from: tip.from,
          amount: tip.amount,
          message: tip.metadata?.message || null,
          date: tip.createdAt
        })),
        total,
        count: tips.length
      }
    });

  } catch (error) {
    console.error('[Tip] Error fetching received tips:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tips' });
  }
});

// GET /api/tips/sent - Get tips sent by a buyer
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;

    const dateFilter = {};
    if (req.query.startDate) dateFilter.createdAt = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) dateFilter.createdAt = { ...(dateFilter.createdAt || {}), $lte: new Date(req.query.endDate) };

    const tips = await Transaction.find({ type: 'tip', from: username, status: 'completed', ...dateFilter })
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    const total = tips.reduce((sum, tip) => sum + tip.amount, 0);

    return res.json({
      success: true,
      data: {
        tips: tips.map(tip => ({
          id: tip._id,
          to: tip.to,
          amount: tip.amount,
          message: tip.metadata?.message || null,
          date: tip.createdAt
        })),
        total,
        count: tips.length
      }
    });

  } catch (error) {
    console.error('[Tip] Error fetching sent tips:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tips' });
  }
});

// GET /api/tips/stats/:username - Get tipping statistics for a seller
router.get('/stats/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user || user.role !== 'seller') {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    const tips = await Transaction.find({ type: 'tip', to: username, status: 'completed' });

    const stats = {
      totalTips: tips.length,
      totalAmount: tips.reduce((sum, tip) => sum + tip.amount, 0),
      averageTip: tips.length > 0 ? tips.reduce((s, t) => s + t.amount, 0) / tips.length : 0,
      largestTip: tips.length > 0 ? Math.max(...tips.map(t => t.amount)) : 0,
      uniqueTippers: [...new Set(tips.map(t => t.from))].length,
      recentTips: tips
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(tip => ({ from: tip.from, amount: tip.amount, date: tip.createdAt }))
    };

    return res.json({ success: true, data: stats });

  } catch (error) {
    console.error('[Tip] Error fetching tip stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch tip statistics' });
  }
});

module.exports = router;
