// pantypost-backend/routes/tip.routes.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');

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
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amount, recipientUsername, message } = req.body;
    const senderUsername = req.user.username;

    console.log('[Tip] Processing tip:', {
      from: senderUsername,
      to: recipientUsername,
      amount: amount
    });

    // Prevent self-tipping
    if (senderUsername === recipientUsername) {
      return res.status(400).json({
        success: false,
        error: 'You cannot tip yourself'
      });
    }

    // Get sender wallet
    let senderWallet = await Wallet.findOne({ username: senderUsername });
    if (!senderWallet) {
      // Create wallet if it doesn't exist
      senderWallet = new Wallet({
        username: senderUsername,
        role: 'buyer',
        balance: 0
      });
      await senderWallet.save();
      
      // If wallet was just created with 0 balance, they can't tip
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Check balance
    if (senderWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Get recipient user and wallet
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Only sellers can receive tips
    if (recipient.role !== 'seller') {
      return res.status(400).json({
        success: false,
        error: 'Tips can only be sent to sellers'
      });
    }

    // Get or create recipient wallet
    let recipientWallet = await Wallet.findOne({ username: recipientUsername });
    if (!recipientWallet) {
      recipientWallet = new Wallet({
        username: recipientUsername,
        role: 'seller',
        balance: 0
      });
      await recipientWallet.save();
    }

    // Process the tip transaction WITHOUT MongoDB transactions
    try {
      // 1. Deduct from sender
      senderWallet.balance -= amount;
      senderWallet.lastTransaction = new Date();
      await senderWallet.save();

      // 2. Add to recipient (100% - no platform fees on tips)
      recipientWallet.balance += amount;
      recipientWallet.lastTransaction = new Date();
      await recipientWallet.save();

      // 3. Create transaction record
      const transaction = new Transaction({
        type: 'tip',
        amount: amount,
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

      // Create database notification for the recipient
      await Notification.createTipNotification(recipientUsername, senderUsername, amount);
      console.log('[Tip] Created database notification for recipient');

      // Send WebSocket notification if available
      try {
        // Try to get webSocketService from the app context (the correct way in your setup)
        const webSocketService = req.app.get('webSocketService');
        if (webSocketService && typeof webSocketService.sendToUser === 'function') {
          webSocketService.sendToUser(recipientUsername, {
            type: 'tip_received',
            from: senderUsername,
            amount: amount,
            message: message || null,
            timestamp: new Date()
          });
        } else if (global.webSocketService && typeof global.webSocketService.emit === 'function') {
          // Fallback to global webSocketService with emit method
          global.webSocketService.emit('tip_received', {
            to: recipientUsername,
            from: senderUsername,
            amount: amount,
            message: message || null,
            timestamp: new Date()
          });
        }
      } catch (wsError) {
        // Don't fail the tip if WebSocket notification fails
        console.log('[Tip] WebSocket notification failed (non-critical):', wsError.message);
      }

      res.json({
        success: true,
        message: `Successfully sent $${amount.toFixed(2)} tip to ${recipientUsername}`,
        transaction: {
          id: transaction._id,
          amount: amount,
          recipient: recipientUsername,
          timestamp: transaction.createdAt
        }
      });

    } catch (saveError) {
      // If something fails, try to rollback manually
      console.error('[Tip] Error during save operations:', saveError);
      
      // Try to restore sender balance
      try {
        senderWallet.balance += amount;
        await senderWallet.save();
      } catch (rollbackError) {
        console.error('[Tip] Failed to rollback sender balance:', rollbackError);
      }
      
      throw saveError;
    }

  } catch (error) {
    console.error('[Tip] Error sending tip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send tip'
    });
  }
});

// GET /api/tips/received - Get tips received by a seller
router.get('/received', authMiddleware, async (req, res) => {
  try {
    const username = req.query.username || req.user.username;
    
    // Check if user can view these tips
    if (username !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own tips'
      });
    }

    // Get date filter
    const dateFilter = {};
    if (req.query.startDate) {
      dateFilter.createdAt = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      dateFilter.createdAt = { 
        ...dateFilter.createdAt, 
        $lte: new Date(req.query.endDate) 
      };
    }

    // Find all tips received
    const tips = await Transaction.find({
      type: 'tip',
      to: username,
      status: 'completed',
      ...dateFilter
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit) || 50);

    // Calculate total
    const total = tips.reduce((sum, tip) => sum + tip.amount, 0);

    res.json({
      success: true,
      data: {
        tips: tips.map(tip => ({
          id: tip._id,
          from: tip.from,
          amount: tip.amount,
          message: tip.metadata?.message || null,
          date: tip.createdAt
        })),
        total: total,
        count: tips.length
      }
    });

  } catch (error) {
    console.error('[Tip] Error fetching received tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tips'
    });
  }
});

// GET /api/tips/sent - Get tips sent by a buyer
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;

    // Get date filter
    const dateFilter = {};
    if (req.query.startDate) {
      dateFilter.createdAt = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      dateFilter.createdAt = { 
        ...dateFilter.createdAt, 
        $lte: new Date(req.query.endDate) 
      };
    }

    // Find all tips sent
    const tips = await Transaction.find({
      type: 'tip',
      from: username,
      status: 'completed',
      ...dateFilter
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit) || 50);

    // Calculate total
    const total = tips.reduce((sum, tip) => sum + tip.amount, 0);

    res.json({
      success: true,
      data: {
        tips: tips.map(tip => ({
          id: tip._id,
          to: tip.to,
          amount: tip.amount,
          message: tip.metadata?.message || null,
          date: tip.createdAt
        })),
        total: total,
        count: tips.length
      }
    });

  } catch (error) {
    console.error('[Tip] Error fetching sent tips:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tips'
    });
  }
});

// GET /api/tips/stats/:username - Get tipping statistics for a seller
router.get('/stats/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Verify user exists and is a seller
    const user = await User.findOne({ username });
    if (!user || user.role !== 'seller') {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }

    // Get all tips for this seller
    const tips = await Transaction.find({
      type: 'tip',
      to: username,
      status: 'completed'
    });

    // Calculate statistics
    const stats = {
      totalTips: tips.length,
      totalAmount: tips.reduce((sum, tip) => sum + tip.amount, 0),
      averageTip: tips.length > 0 ? tips.reduce((sum, tip) => sum + tip.amount, 0) / tips.length : 0,
      largestTip: tips.length > 0 ? Math.max(...tips.map(tip => tip.amount)) : 0,
      uniqueTippers: [...new Set(tips.map(tip => tip.from))].length,
      recentTips: tips
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5)
        .map(tip => ({
          from: tip.from,
          amount: tip.amount,
          date: tip.createdAt
        }))
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Tip] Error fetching tip stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tip statistics'
    });
  }
});

module.exports = router;