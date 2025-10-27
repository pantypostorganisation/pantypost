// pantypost-backend/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const webSocketService = require('../config/websocket');
const { incrementPaymentStats } = require('../utils/paymentStats');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * ---------------------------------------------------------------------------
 * SAFE CHECK (LEGACY) — NEVER 401
 * GET /api/subscriptions/check/:creator
 * If no/invalid token -> { success:true, isSubscribed:false }
 * If token present    -> returns actual subscription status
 * NOTE: Must be defined BEFORE '/:username' or it will never match.
 * ---------------------------------------------------------------------------
 */
router.get('/check/:creator', async (req, res) => {
  try {
    const { creator } = req.params;

    // Best-effort token decode (do NOT require it)
    let subscriber = null;
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        subscriber = decoded?.username || null;
      } catch {
        // ignore invalid token; return not subscribed below
      }
    }

    if (!subscriber) {
      return res.json({ success: true, isSubscribed: false, data: null });
    }

    const sub = await Subscription.findOne({
      subscriber,
      creator,
      status: 'active',
    });

    return res.json({
      success: true,
      isSubscribed: !!sub,
      data: sub || null,
    });
  } catch {
    // Never 401 or 5xx for this probe — avoid knocking users offline
    return res.json({ success: true, isSubscribed: false, data: null });
  }
});

// ====================== SUBSCRIPTION ROUTES ======================

// GET /api/subscriptions/:username - Get user's subscriptions (auth required)
router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;

    if (req.user.username !== username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own subscriptions',
      });
    }

    const subscriptions = await Subscription.find({
      subscriber: username,
    }).sort({ startDate: -1 });

    const subscribers = await Subscription.find({
      creator: username,
      status: 'active',
    }).sort({ startDate: -1 });

    res.json({
      success: true,
      data: { subscriptions, subscribers },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/subscriptions/subscribe - Subscribe to a creator
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { seller, price } = req.body;
    const buyer = req.user.username;

    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only buyers can subscribe to sellers' });
    }

    const sellerUser = await User.findOne({ username: seller });
    if (!sellerUser || sellerUser.role !== 'seller') {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }

    // Final price: prefer body.price, else seller’s stored subscriptionPrice
    let finalPrice = Number(price ?? sellerUser.subscriptionPrice ?? 0);
    if (!Number.isFinite(finalPrice)) finalPrice = 0;
    finalPrice = Math.max(0.01, Math.min(999.99, finalPrice));

    const existingSubscription = await Subscription.findOne({
      subscriber: buyer,
      creator: seller,
    });

    const buyerWallet = await Wallet.findOne({ username: buyer });
    if (!buyerWallet) {
      return res.status(404).json({ success: false, error: 'Please add funds to your wallet first' });
    }

    if (!buyerWallet.hasBalance(finalPrice)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You have $${buyerWallet.balance.toFixed(2)} but need $${finalPrice.toFixed(2)}`,
      });
    }

    let sellerWallet = await Wallet.findOne({ username: seller });
    if (!sellerWallet) {
      sellerWallet = new Wallet({ username: seller, role: 'seller', balance: 0 });
      await sellerWallet.save();
    }

    let adminWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
    if (!adminWallet) {
      adminWallet = new Wallet({ username: 'platform', role: 'admin', balance: 0 });
      await adminWallet.save();
    }

    const platformFee = Math.round(finalPrice * 0.25 * 100) / 100; // 25%
    const creatorEarnings = Math.round((finalPrice - platformFee) * 100) / 100; // 75%

    let subscription;
    if (existingSubscription) {
      // Reactivate
      existingSubscription.status = 'active';
      existingSubscription.startDate = new Date();
      existingSubscription.autoRenew = true;
      existingSubscription.price = finalPrice;
      existingSubscription.platformFee = platformFee;
      existingSubscription.creatorEarnings = creatorEarnings;
      existingSubscription.failedPaymentAttempts = 0;

      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      existingSubscription.nextBillingDate = nextBilling;

      subscription = await existingSubscription.save();
    } else {
      subscription = new Subscription({
        subscriber: buyer,
        creator: seller,
        price: finalPrice,
        platformFee,
        creatorEarnings,
        status: 'active',
        autoRenew: true,
      });
      await subscription.save();
    }

    try {
      const buyerPrev = buyerWallet.balance;
      const sellerPrev = sellerWallet.balance;
      const adminPrev = adminWallet.balance;

      // Withdraw buyer full price
      await buyerWallet.withdraw(finalPrice);

      const paymentTransaction = new Transaction({
        type: 'subscription',
        amount: finalPrice,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Subscription to ${seller}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          subscriptionId: subscription._id.toString(),
          platformFee,
          creatorEarnings,
        },
      });
      await paymentTransaction.save();

      // Payouts
      await sellerWallet.deposit(creatorEarnings);
      await adminWallet.deposit(platformFee);

      const feeTransaction = new Transaction({
        type: 'platform_fee',
        amount: platformFee,
        from: buyer,
        to: 'platform',
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Platform fee (25%) for subscription to ${seller}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          subscriptionId: subscription._id.toString(),
          percentage: 25,
          originalAmount: finalPrice,
          seller,
          buyer,
        },
      });
      await feeTransaction.save();

      // Notifications + WS
      await Notification.createSubscriptionNotification(seller, buyer);

      webSocketService.emitNewSubscription({
        id: subscription._id,
        subscriber: subscription.subscriber,
        creator: subscription.creator,
        price: subscription.price,
        startDate: subscription.startDate,
      });

      webSocketService.emitBalanceUpdate(buyer, 'buyer', buyerPrev, buyerWallet.balance, 'subscription');
      webSocketService.emitBalanceUpdate(seller, 'seller', sellerPrev, sellerWallet.balance, 'subscription');
      webSocketService.emitBalanceUpdate('platform', 'admin', adminPrev, adminWallet.balance, 'platform_fee');
      webSocketService.emitTransaction(paymentTransaction);
      webSocketService.emitTransaction(feeTransaction);

      try {
        await incrementPaymentStats(finalPrice);
      } catch (statsError) {
        console.error('[Subscription] Failed to increment payment stats:', statsError);
      }

      res.json({
        success: true,
        data: {
          subscription,
          transaction: paymentTransaction,
          platformFeeCollected: platformFee,
        },
      });
    } catch (paymentError) {
      await subscription.cancel('Payment failed');
      return res.status(400).json({ success: false, error: `Payment failed: ${paymentError.message}` });
    }
  } catch (error) {
    console.error('[Subscription] Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/subscriptions/unsubscribe - Cancel a subscription
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { seller } = req.body;
    const buyer = req.user.username;

    const subscription = await Subscription.findOne({
      subscriber: buyer,
      creator: seller,
      status: 'active',
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Active subscription not found' });
    }

    await subscription.cancel('User requested cancellation');

    webSocketService.emitSubscriptionCancelled(
      { id: subscription._id, subscriber: subscription.subscriber, creator: subscription.creator },
      'user_cancelled'
    );

    res.json({ success: true, data: subscription, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('[Subscription] Unsubscribe error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/subscriptions/check - Check if subscribed (auth required, precise)
router.post('/check', authMiddleware, async (req, res) => {
  try {
    const { subscriber, creator } = req.body || {};

    if (!subscriber || !creator) {
      return res.status(400).json({ success: false, error: 'Both subscriber and creator parameters are required' });
    }

    if (req.user.username !== subscriber && req.user.username !== creator && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view this subscription' });
    }

    const subscription = await Subscription.findOne({ subscriber, creator, status: 'active' });

    res.json({ success: true, isSubscribed: !!subscription, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subscriptions/active - Get all active subscriptions for the current user
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;

    const subscriptions = await Subscription.find({ subscriber: username, status: 'active' });

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subscriptions/stats/:username - Get subscription statistics
router.get('/stats/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;

    if (req.user.username !== username && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view these statistics' });
    }

    const activeSubscribers = await Subscription.getActiveSubscriberCount(username);
    const monthlyRevenue = await Subscription.getMonthlyRevenue(username);
    const allSubscriptions = await Subscription.find({ creator: username, status: 'active' });

    res.json({
      success: true,
      data: {
        activeSubscribers,
        monthlyRevenue,
        averageSubscriptionPrice:
          allSubscriptions.length > 0 ? Math.round((monthlyRevenue / activeSubscribers) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/subscriptions/process-renewals - Process due subscription renewals (admin only)
router.post('/process-renewals', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    let adminWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
    if (!adminWallet) {
      adminWallet = new Wallet({ username: 'platform', role: 'admin', balance: 0 });
      await adminWallet.save();
    }

    const dueSubscriptions = await Subscription.find({
      status: 'active',
      autoRenew: true,
      nextBillingDate: { $lte: new Date() },
    });

    let processed = 0;
    let failed = 0;

    for (const subscription of dueSubscriptions) {
      try {
        const buyerWallet = await Wallet.findOne({ username: subscription.subscriber });
        const sellerWallet = await Wallet.findOne({ username: subscription.creator });

        if (!buyerWallet || !buyerWallet.hasBalance(subscription.price)) {
          await subscription.handleFailedPayment();
          failed++;
          continue;
        }

        const buyerPrev = buyerWallet.balance;
        const sellerPrev = sellerWallet.balance;
        const adminPrev = adminWallet.balance;

        await buyerWallet.withdraw(subscription.price);
        await sellerWallet.deposit(subscription.creatorEarnings);
        await adminWallet.deposit(subscription.platformFee);

        const paymentTransaction = new Transaction({
          type: 'subscription',
          amount: subscription.price,
          from: subscription.subscriber,
          to: subscription.creator,
          fromRole: 'buyer',
          toRole: 'seller',
          description: `Monthly subscription renewal to ${subscription.creator}`,
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            subscriptionId: subscription._id.toString(),
            renewal: true,
            platformFee: subscription.platformFee,
            creatorEarnings: subscription.creatorEarnings,
          },
        });
        await paymentTransaction.save();

        const feeTransaction = new Transaction({
          type: 'platform_fee',
          amount: subscription.platformFee,
          from: subscription.subscriber,
          to: 'platform',
          fromRole: 'buyer',
          toRole: 'admin',
          description: `Platform fee (25%) for renewal to ${subscription.creator}`,
          status: 'completed',
          completedAt: new Date(),
          metadata: { subscriptionId: subscription._id.toString(), percentage: 25, renewal: true },
        });
        await feeTransaction.save();

        await subscription.processRenewal();
        processed++;

        webSocketService.emitBalanceUpdate(subscription.subscriber, 'buyer', buyerPrev, buyerWallet.balance, 'subscription');
        webSocketService.emitBalanceUpdate(subscription.creator, 'seller', sellerPrev, sellerWallet.balance, 'subscription');
        webSocketService.emitBalanceUpdate('platform', 'admin', adminPrev, adminWallet.balance, 'platform_fee');
        webSocketService.emitTransaction(paymentTransaction);
        webSocketService.emitTransaction(feeTransaction);
      } catch (error) {
        await subscription.handleFailedPayment();
        if (subscription.status === 'cancelled') {
          webSocketService.emitSubscriptionCancelled(
            { id: subscription._id, subscriber: subscription.subscriber, creator: subscription.creator },
            'failed_payment'
          );
        }
        failed++;
      }
    }

    res.json({ success: true, data: { totalDue: dueSubscriptions.length, processed, failed } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
