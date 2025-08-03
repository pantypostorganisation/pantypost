// pantypost-backend/routes/subscription.routes.js
const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth.middleware');
const webSocketService = require('../config/websocket'); // ADD THIS

// ============= SUBSCRIPTION ROUTES =============

// GET /api/subscriptions/:username - Get user's subscriptions
router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if user can view these subscriptions
    if (req.user.username !== username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own subscriptions'
      });
    }
    
    // Get subscriptions where user is subscriber
    const subscriptions = await Subscription.find({ 
      subscriber: username 
    }).sort({ startDate: -1 });
    
    // Get subscriptions where user is creator (their subscribers)
    const subscribers = await Subscription.find({ 
      creator: username,
      status: 'active'
    }).sort({ startDate: -1 });
    
    res.json({
      success: true,
      data: {
        subscriptions: subscriptions,
        subscribers: subscribers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/subscriptions/subscribe - Subscribe to a creator
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { seller, price } = req.body;
    const buyer = req.user.username;
    
    // Validate buyer role
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only buyers can subscribe to sellers'
      });
    }
    
    // Check if seller exists and is actually a seller
    const sellerUser = await User.findOne({ username: seller });
    if (!sellerUser || sellerUser.role !== 'seller') {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      subscriber: buyer,
      creator: seller
    });
    
    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Already subscribed to this seller'
      });
    }
    
    // Get buyer's wallet
    const buyerWallet = await Wallet.findOne({ username: buyer });
    if (!buyerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Please add funds to your wallet first'
      });
    }
    
    // Check if buyer has enough balance
    if (!buyerWallet.hasBalance(price)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You have $${buyerWallet.balance.toFixed(2)} but need $${price.toFixed(2)}`
      });
    }
    
    // Get or create seller's wallet
    let sellerWallet = await Wallet.findOne({ username: seller });
    if (!sellerWallet) {
      sellerWallet = new Wallet({
        username: seller,
        role: 'seller',
        balance: 0
      });
      await sellerWallet.save();
    }
    
    // Calculate fees
    const platformFee = Math.round(price * 0.1 * 100) / 100;
    const creatorEarnings = Math.round((price - platformFee) * 100) / 100;
    
    // Create or reactivate subscription
    let subscription;
    if (existingSubscription) {
      // Reactivate cancelled subscription
      existingSubscription.status = 'active';
      existingSubscription.startDate = new Date();
      existingSubscription.autoRenew = true;
      existingSubscription.price = price;
      existingSubscription.platformFee = platformFee;
      existingSubscription.creatorEarnings = creatorEarnings;
      existingSubscription.failedPaymentAttempts = 0;
      
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      existingSubscription.nextBillingDate = nextBilling;
      
      subscription = await existingSubscription.save();
    } else {
      // Create new subscription
      subscription = new Subscription({
        subscriber: buyer,
        creator: seller,
        price: price,
        platformFee: platformFee,
        creatorEarnings: creatorEarnings,
        status: 'active',
        autoRenew: true
      });
      await subscription.save();
    }
    
    try {
      // Store previous balances for WebSocket events
      const buyerPreviousBalance = buyerWallet.balance;
      const sellerPreviousBalance = sellerWallet.balance;
      
      // Process payment
      await buyerWallet.withdraw(price);
      
      // Create subscription payment transaction
      const paymentTransaction = new Transaction({
        type: 'subscription',
        amount: price,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Subscription to ${seller}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          subscriptionId: subscription._id.toString()
        }
      });
      await paymentTransaction.save();
      
      // Add earnings to seller
      await sellerWallet.deposit(creatorEarnings);
      
      // Create platform fee transaction
      const feeTransaction = new Transaction({
        type: 'fee',
        amount: platformFee,
        from: seller,
        to: 'platform',
        fromRole: 'seller',
        toRole: 'admin',
        description: `Subscription fee (10%) for subscription from ${buyer}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          subscriptionId: subscription._id.toString(),
          percentage: 10
        }
      });
      await feeTransaction.save();
      
      // WEBSOCKET: Emit new subscription event
      webSocketService.emitNewSubscription({
        id: subscription._id,
        subscriber: subscription.subscriber,
        creator: subscription.creator,
        price: subscription.price,
        startDate: subscription.startDate
      });
      
      // WEBSOCKET: Emit balance updates
      webSocketService.emitBalanceUpdate(
        buyer,
        'buyer',
        buyerPreviousBalance,
        buyerWallet.balance,
        'subscription'
      );
      
      webSocketService.emitBalanceUpdate(
        seller,
        'seller',
        sellerPreviousBalance,
        sellerWallet.balance,
        'subscription'
      );
      
      // WEBSOCKET: Emit transaction events
      webSocketService.emitTransaction(paymentTransaction);
      webSocketService.emitTransaction(feeTransaction);
      
      res.json({
        success: true,
        data: {
          subscription: subscription,
          transaction: paymentTransaction
        }
      });
      
    } catch (paymentError) {
      // If payment fails, cancel the subscription
      await subscription.cancel('Payment failed');
      
      return res.status(400).json({
        success: false,
        error: `Payment failed: ${paymentError.message}`
      });
    }
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/subscriptions/unsubscribe - Cancel a subscription
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { seller } = req.body;
    const buyer = req.user.username;
    
    // Find the subscription
    const subscription = await Subscription.findOne({
      subscriber: buyer,
      creator: seller,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Active subscription not found'
      });
    }
    
    // Cancel the subscription
    await subscription.cancel('User requested cancellation');
    
    // WEBSOCKET: Emit subscription cancelled event
    webSocketService.emitSubscriptionCancelled(
      {
        id: subscription._id,
        subscriber: subscription.subscriber,
        creator: subscription.creator
      },
      'user_cancelled'
    );
    
    res.json({
      success: true,
      data: subscription
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/subscriptions/check - Check if subscribed
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const { buyer, seller } = req.query;
    
    if (!buyer || !seller) {
      return res.status(400).json({
        success: false,
        error: 'Both buyer and seller parameters are required'
      });
    }
    
    // Check if user can view this subscription
    if (req.user.username !== buyer && 
        req.user.username !== seller && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this subscription'
      });
    }
    
    const subscription = await Subscription.findOne({
      subscriber: buyer,
      creator: seller,
      status: 'active'
    });
    
    res.json({
      success: true,
      data: subscription
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/subscriptions/stats/:username - Get subscription statistics
router.get('/stats/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check authorization
    if (req.user.username !== username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these statistics'
      });
    }
    
    // Get active subscriber count
    const activeSubscribers = await Subscription.getActiveSubscriberCount(username);
    
    // Get monthly revenue
    const monthlyRevenue = await Subscription.getMonthlyRevenue(username);
    
    // Get total earnings from subscriptions
    const allSubscriptions = await Subscription.find({
      creator: username,
      status: 'active'
    });
    
    res.json({
      success: true,
      data: {
        activeSubscribers: activeSubscribers,
        monthlyRevenue: monthlyRevenue,
        averageSubscriptionPrice: allSubscriptions.length > 0 
          ? Math.round((monthlyRevenue / activeSubscribers) * 100) / 100 
          : 0
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/subscriptions/process-renewals - Process due subscription renewals (admin only)
router.post('/process-renewals', authMiddleware, async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Find all due subscriptions
    const dueSubscriptions = await Subscription.find({
      status: 'active',
      autoRenew: true,
      nextBillingDate: { $lte: new Date() }
    });
    
    let processed = 0;
    let failed = 0;
    
    for (const subscription of dueSubscriptions) {
      try {
        // Get wallets
        const buyerWallet = await Wallet.findOne({ username: subscription.subscriber });
        const sellerWallet = await Wallet.findOne({ username: subscription.creator });
        
        if (!buyerWallet || !buyerWallet.hasBalance(subscription.price)) {
          await subscription.handleFailedPayment();
          failed++;
          continue;
        }
        
        // Store previous balances for WebSocket events
        const buyerPreviousBalance = buyerWallet.balance;
        const sellerPreviousBalance = sellerWallet.balance;
        
        // Process payment
        await buyerWallet.withdraw(subscription.price);
        await sellerWallet.deposit(subscription.creatorEarnings);
        
        // Create transactions
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
            renewal: true
          }
        });
        await paymentTransaction.save();
        
        // Update subscription
        await subscription.processRenewal();
        processed++;
        
        // WEBSOCKET: Emit balance updates
        webSocketService.emitBalanceUpdate(
          subscription.subscriber,
          'buyer',
          buyerPreviousBalance,
          buyerWallet.balance,
          'subscription'
        );
        
        webSocketService.emitBalanceUpdate(
          subscription.creator,
          'seller',
          sellerPreviousBalance,
          sellerWallet.balance,
          'subscription'
        );
        
        // WEBSOCKET: Emit transaction event
        webSocketService.emitTransaction(paymentTransaction);
        
      } catch (error) {
        await subscription.handleFailedPayment();
        
        // If subscription was cancelled due to failed payment
        if (subscription.status === 'cancelled') {
          // WEBSOCKET: Emit subscription cancelled event
          webSocketService.emitSubscriptionCancelled(
            {
              id: subscription._id,
              subscriber: subscription.subscriber,
              creator: subscription.creator
            },
            'failed_payment'
          );
        }
        
        failed++;
      }
    }
    
    res.json({
      success: true,
      data: {
        totalDue: dueSubscriptions.length,
        processed: processed,
        failed: failed
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export the router
module.exports = router;