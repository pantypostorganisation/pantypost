// pantypost-backend/routes/order.routes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth.middleware');
const tierService = require('../services/tierService');
const TIER_CONFIG = require('../config/tierConfig');

// ============= HELPER FUNCTIONS =============

/**
 * Check if a user is subscribed to a seller
 */
async function isUserSubscribedToSeller(buyer, seller) {
  if (!buyer || !seller) return false;
  
  try {
    const subscription = await Subscription.findOne({
      subscriber: buyer,
      creator: seller,
      status: 'active'
    });
    
    return !!subscription;
  } catch (error) {
    console.error('[Order] Error checking subscription:', error);
    return false;
  }
}

// POST /api/orders - Create new order with proper fee tracking and TIER SUPPORT
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      markedUpPrice,
      seller,
      buyer,
      tags,
      wasAuction,
      imageUrl,
      listingId,
      deliveryAddress,
      isPremium // NEW: Add premium flag from frontend
    } = req.body;

    console.log('[Order] Creating order with tier support:', {
      title,
      buyer,
      seller,
      price,
      markedUpPrice,
      listingId,
      isPremium
    });

    // Validate buyer is the authenticated user
    if (buyer !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'You can only create orders for yourself'
      });
    }

    // Validate required fields
    if (!title || !description || !price || !seller || !buyer || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // PREMIUM CHECK: If the item is premium, verify subscription
    if (isPremium) {
      const isSubscribed = await isUserSubscribedToSeller(buyer, seller);
      
      if (!isSubscribed) {
        console.log('[Order] Premium content purchase blocked - no subscription');
        return res.status(403).json({
          success: false,
          error: 'You must be subscribed to this seller to purchase premium content',
          requiresSubscription: true,
          seller: seller
        });
      }
      console.log('[Order] Premium content purchase allowed - user is subscribed');
    }

    // Get seller's current tier
    const sellerUser = await User.findOne({ username: seller });
    if (!sellerUser) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    const sellerTier = sellerUser.tier || 'Tease';
    const tierInfo = TIER_CONFIG.getTierByName(sellerTier);
    
    console.log('[Order] Seller tier:', sellerTier, 'Bonus:', (tierInfo.bonusPercentage * 100).toFixed(0) + '%');

    // Calculate fees with tier bonus
    const actualPrice = Number(price) || 0;
    const actualMarkedUpPrice = Number(markedUpPrice) || Math.round(actualPrice * 1.1 * 100) / 100;
    
    // Calculate tier-based earnings
    const sellerEarnings = TIER_CONFIG.calculateSellerEarnings(actualPrice, sellerTier);
    const platformFee = TIER_CONFIG.calculatePlatformFee(actualPrice, sellerTier);
    const tierBonus = Math.round((actualPrice * tierInfo.bonusPercentage) * 100) / 100;
    const buyerMarkupFee = Math.round((actualMarkedUpPrice - actualPrice) * 100) / 100;
    const totalPlatformRevenue = Math.round((platformFee + buyerMarkupFee) * 100) / 100;

    console.log('[Order] Tier-based calculation:', {
      price: actualPrice,
      markedUpPrice: actualMarkedUpPrice,
      sellerTier,
      tierBonus,
      sellerEarnings,
      platformFee,
      buyerMarkupFee,
      totalPlatformRevenue
    });

    // Get buyer wallet
    const buyerWallet = await Wallet.findOne({ username: buyer });
    if (!buyerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Buyer wallet not found. Please deposit funds first.'
      });
    }

    // FIX: Round to cents to avoid floating-point precision issues
    const balanceInCents = Math.round(buyerWallet.balance * 100);
    const priceInCents = Math.round(actualMarkedUpPrice * 100);

    // Check buyer has sufficient balance (using integer cents)
    if (balanceInCents < priceInCents) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You need $${(priceInCents/100).toFixed(2)} but only have $${(balanceInCents/100).toFixed(2)}`
      });
    }

    // Get or create seller wallet
    let sellerWallet = await Wallet.findOne({ username: seller });
    if (!sellerWallet) {
      sellerWallet = new Wallet({
        username: seller,
        role: 'seller',
        balance: 0
      });
      await sellerWallet.save();
    }

    // Get or create platform wallet
    let platformWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
    if (!platformWallet) {
      platformWallet = new Wallet({
        username: 'platform',
        role: 'admin',
        balance: 0
      });
      await platformWallet.save();
      console.log('[Order] Created platform wallet');
    }

    // Store previous balances for WebSocket events
    const previousBuyerBalance = buyerWallet.balance;
    const previousSellerBalance = sellerWallet.balance;
    const previousPlatformBalance = platformWallet.balance;

    // Process the transaction atomically
    try {
      // 1. Deduct from buyer (full marked up price)
      await buyerWallet.withdraw(actualMarkedUpPrice);
      console.log('[Order] Deducted', actualMarkedUpPrice, 'from buyer', buyer);

      // 2. Credit to seller (with tier bonus)
      await sellerWallet.deposit(sellerEarnings);
      console.log('[Order] Credited', sellerEarnings, 'to seller', seller, '(includes', tierBonus, 'tier bonus)');

      // 3. Credit platform fee to platform wallet (MINUS tier bonus that goes to seller)
      const netPlatformRevenue = totalPlatformRevenue - tierBonus;
      await platformWallet.deposit(netPlatformRevenue);
      console.log('[Order] Credited', netPlatformRevenue, 'to platform wallet (after', tierBonus, 'tier bonus to seller)');

      // Update listing status
      if (listingId) {
        console.log('[Order] Updating listing status for ID:', listingId);
        
        const listing = await Listing.findById(listingId);
        if (listing) {
          listing.status = 'sold';
          listing.soldAt = new Date();
          listing.soldTo = buyer;
          await listing.save();
          
          console.log('[Order] Successfully updated listing status to sold:', listingId);
          
          // Emit WebSocket event for real-time update
          if (global.webSocketService) {
            if (global.webSocketService.emitListingSold) {
              global.webSocketService.emitListingSold({
                _id: listing._id,
                id: listing._id.toString(),
                title: listing.title,
                seller: listing.seller,
                buyer: buyer,
                status: 'sold'
              });
            }
            
            if (global.webSocketService.io && global.webSocketService.io.emit) {
              global.webSocketService.io.emit('listing:sold', {
                listingId: listing._id.toString(),
                seller: listing.seller,
                buyer: buyer
              });
            }
          }
        } else {
          console.warn('[Order] Warning: Listing not found for ID:', listingId);
        }
      }

      // Create the order with tier information
      const order = new Order({
        title,
        description,
        price: actualPrice,
        markedUpPrice: actualMarkedUpPrice,
        imageUrl: imageUrl || '',
        date: new Date(),
        seller,
        buyer,
        tags: tags || [],
        listingId,
        wasAuction: wasAuction || false,
        deliveryAddress,
        shippingStatus: 'pending',
        paymentStatus: 'completed',
        paymentCompletedAt: new Date(),
        // Tier-based fee tracking
        platformFee: platformFee,
        buyerMarkupFee,
        sellerPlatformFee: platformFee,
        sellerEarnings,
        tierCreditAmount: tierBonus,
        sellerTier: sellerTier // ADD THIS: Store the seller's tier with the order
      });

      await order.save();
      console.log('[Order] Order created with tier:', order._id);

      // Create database notification for seller
      await Notification.createSaleNotification(seller, buyer, { 
        _id: order._id, 
        title: order.title 
      }, actualMarkedUpPrice);
      console.log('[Order] Created database notification for seller');

      // Create transaction records
      // 1. Main purchase transaction with tier info
      const purchaseTransaction = new Transaction({
        type: 'purchase',
        amount: actualMarkedUpPrice,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Purchase: ${title} (${sellerTier} tier)`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          listingId,
          listingTitle: title,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          sellerEarnings,
          seller,
          buyer,
          sellerTier,
          tierBonus,
          isPremium // Store premium status in transaction
        }
      });
      await purchaseTransaction.save();

      // 2. Platform fee transaction
      const feeTransaction = new Transaction({
        type: 'platform_fee',
        amount: totalPlatformRevenue,
        from: buyer,
        to: 'platform',
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Platform fee for: ${title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          listingId,
          listingTitle: title,
          buyerFee: buyerMarkupFee,
          sellerFee: platformFee,
          totalFee: totalPlatformRevenue,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          seller,
          buyer,
          sellerTier,
          tierAdjustedFee: platformFee
        }
      });
      await feeTransaction.save();

      // 3. Create tier credit transaction if there's a bonus
      if (tierBonus > 0) {
        const tierCreditTransaction = new Transaction({
          type: 'tier_credit',
          amount: tierBonus,
          from: 'platform',
          to: seller,
          fromRole: 'admin',
          toRole: 'seller',
          description: `Tier bonus (${sellerTier}): +${(tierInfo.bonusPercentage * 100).toFixed(0)}%`,
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            orderId: order._id.toString(),
            listingTitle: title,
            tierBonus,
            sellerTier,
            bonusPercentage: tierInfo.bonusPercentage
          }
        });
        await tierCreditTransaction.save();
        console.log('[Order] Created tier credit transaction:', tierBonus);

        // CRITICAL: Create admin action to track tier credit payout
        // This will show up in the admin dashboard
        const AdminAction = require('../models/AdminAction');
        const tierCreditAction = new AdminAction({
          type: 'debit',
          amount: tierBonus,
          reason: `Tier bonus paid to ${seller} (${sellerTier} tier - ${(tierInfo.bonusPercentage * 100).toFixed(0)}%)`,
          date: new Date(),
          metadata: {
            orderId: order._id.toString(),
            seller,
            sellerTier,
            bonusPercentage: tierInfo.bonusPercentage,
            orderTitle: title
          }
        });
        await tierCreditAction.save();
        console.log('[Order] Created admin action for tier credit payout');
      }

      // Update order with transaction references
      order.paymentTransactionId = purchaseTransaction._id;
      order.feeTransactionId = feeTransaction._id;
      await order.save();

      // UPDATE SELLER TIER after successful sale
      console.log('[Order] Updating seller tier after sale...');
      const tierUpdateResult = await tierService.updateSellerTier(seller);
      if (tierUpdateResult.changed) {
        console.log('[Order] Seller tier updated:', tierUpdateResult.oldTier, '->', tierUpdateResult.newTier);
      }

      // Emit WebSocket events using global webSocketService
      if (global.webSocketService) {
        // Buyer balance update
        global.webSocketService.emitBalanceUpdate(
          buyer,
          'buyer',
          previousBuyerBalance,
          buyerWallet.balance,
          'purchase'
        );

        // Seller balance update
        global.webSocketService.emitBalanceUpdate(
          seller,
          'seller',
          previousSellerBalance,
          sellerWallet.balance,
          'sale'
        );

        // Platform balance update
        global.webSocketService.emitBalanceUpdate(
          'platform',
          'admin',
          previousPlatformBalance,
          platformWallet.balance,
          'platform_fee'
        );
        
        if (global.webSocketService.emitPlatformBalanceUpdate) {
          global.webSocketService.emitPlatformBalanceUpdate(platformWallet.balance);
        }

        // Emit transaction events
        global.webSocketService.emitTransaction(purchaseTransaction.toObject());
        global.webSocketService.emitTransaction(feeTransaction.toObject());

        // Emit order created event
        if (global.webSocketService.emitOrderCreated) {
          global.webSocketService.emitOrderCreated({
            _id: order._id,
            id: order._id.toString(),
            title: order.title,
            seller: order.seller,
            buyer: order.buyer,
            price: order.price,
            markedUpPrice: order.markedUpPrice,
            sellerTier,
            tierBonus
          });
        }

        // Emit user update if tier changed
        if (tierUpdateResult && tierUpdateResult.changed) {
          global.webSocketService.emitUserUpdate(seller, {
            tier: tierUpdateResult.newTier,
            totalSales: tierUpdateResult.stats.totalSales
          });
        }
      }

      console.log('[Order] Order processing complete with tier support');

      // CRITICAL FIX: Return order data with both _id and id fields
      res.json({
        success: true,
        data: {
          _id: order._id.toString(),  // Include MongoDB _id
          id: order._id.toString(),   // Also include as id for frontend compatibility
          title: order.title,
          description: order.description,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          imageUrl: order.imageUrl,
          date: order.date.toISOString(),
          seller: order.seller,
          buyer: order.buyer,
          tags: order.tags,
          listingId: order.listingId,
          wasAuction: order.wasAuction,
          deliveryAddress: order.deliveryAddress,
          shippingStatus: order.shippingStatus,
          paymentStatus: order.paymentStatus,
          platformFee: order.platformFee,
          sellerEarnings: order.sellerEarnings,
          tierCreditAmount: order.tierCreditAmount,
          sellerTier
        }
      });

    } catch (error) {
      console.error('[Order] Transaction failed:', error);
      
      // Attempt to rollback (best effort)
      try {
        if (buyerWallet.balance < previousBuyerBalance) {
          buyerWallet.balance = previousBuyerBalance;
          await buyerWallet.save();
        }
        
        if (sellerWallet.balance > previousSellerBalance) {
          sellerWallet.balance = previousSellerBalance;
          await sellerWallet.save();
        }
        
        if (platformWallet.balance > previousPlatformBalance) {
          platformWallet.balance = previousPlatformBalance;
          await platformWallet.save();
        }
      } catch (rollbackError) {
        console.error('[Order] Rollback failed:', rollbackError);
      }

      throw error;
    }

  } catch (error) {
    console.error('[Order] Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
});

// POST /api/orders/custom-request - Convert custom request to order (NEW ENDPOINT)
router.post('/custom-request', authMiddleware, async (req, res) => {
  try {
    const {
      requestId,
      title,
      description,
      price,
      seller,
      buyer,
      tags,
      deliveryAddress,
      isPremium // NEW: Add premium flag
    } = req.body;

    console.log('[Order] Converting custom request to order:', {
      requestId,
      title,
      buyer,
      seller,
      price,
      isPremium
    });

    // Validate buyer is the authenticated user
    if (buyer !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'You can only create orders for yourself'
      });
    }

    // Validate required fields
    if (!requestId || !title || !description || !price || !seller || !buyer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for custom request order'
      });
    }

    // PREMIUM CHECK: If the custom request is for premium content, verify subscription
    if (isPremium) {
      const isSubscribed = await isUserSubscribedToSeller(buyer, seller);
      
      if (!isSubscribed) {
        console.log('[Order] Premium custom request blocked - no subscription');
        return res.status(403).json({
          success: false,
          error: 'You must be subscribed to this seller to pay for premium custom requests',
          requiresSubscription: true,
          seller: seller
        });
      }
      console.log('[Order] Premium custom request allowed - user is subscribed');
    }

    // Get seller's current tier
    const sellerUser = await User.findOne({ username: seller });
    if (!sellerUser) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    const sellerTier = sellerUser.tier || 'Tease';
    const tierInfo = TIER_CONFIG.getTierByName(sellerTier);
    
    console.log('[Order] Custom request - Seller tier:', sellerTier, 'Bonus:', (tierInfo.bonusPercentage * 100).toFixed(0) + '%');

    // Calculate fees with tier bonus (custom requests use regular pricing model)
    const actualPrice = Number(price) || 0;
    const actualMarkedUpPrice = Math.round(actualPrice * 1.1 * 100) / 100; // 10% markup for buyer
    
    // Calculate tier-based earnings
    const sellerEarnings = TIER_CONFIG.calculateSellerEarnings(actualPrice, sellerTier);
    const platformFee = TIER_CONFIG.calculatePlatformFee(actualPrice, sellerTier);
    const tierBonus = Math.round((actualPrice * tierInfo.bonusPercentage) * 100) / 100;
    const buyerMarkupFee = Math.round((actualMarkedUpPrice - actualPrice) * 100) / 100;
    const totalPlatformRevenue = Math.round((platformFee + buyerMarkupFee) * 100) / 100;

    console.log('[Order] Custom request tier-based calculation:', {
      price: actualPrice,
      markedUpPrice: actualMarkedUpPrice,
      sellerTier,
      tierBonus,
      sellerEarnings,
      platformFee,
      buyerMarkupFee,
      totalPlatformRevenue
    });

    // Get buyer wallet
    const buyerWallet = await Wallet.findOne({ username: buyer });
    if (!buyerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Buyer wallet not found. Please deposit funds first.'
      });
    }

    // Check buyer has sufficient balance
    const balanceInCents = Math.round(buyerWallet.balance * 100);
    const priceInCents = Math.round(actualMarkedUpPrice * 100);

    if (balanceInCents < priceInCents) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You need $${(priceInCents/100).toFixed(2)} but only have $${(balanceInCents/100).toFixed(2)}`
      });
    }

    // Get or create seller wallet
    let sellerWallet = await Wallet.findOne({ username: seller });
    if (!sellerWallet) {
      sellerWallet = new Wallet({
        username: seller,
        role: 'seller',
        balance: 0
      });
      await sellerWallet.save();
    }

    // Get or create platform wallet
    let platformWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
    if (!platformWallet) {
      platformWallet = new Wallet({
        username: 'platform',
        role: 'admin',
        balance: 0
      });
      await platformWallet.save();
    }

    // Store previous balances for WebSocket events
    const previousBuyerBalance = buyerWallet.balance;
    const previousSellerBalance = sellerWallet.balance;
    const previousPlatformBalance = platformWallet.balance;

    // Process the transaction atomically
    try {
      // 1. Deduct from buyer (full marked up price)
      await buyerWallet.withdraw(actualMarkedUpPrice);
      console.log('[Order] Custom request - Deducted', actualMarkedUpPrice, 'from buyer', buyer);

      // 2. Credit to seller (with tier bonus)
      await sellerWallet.deposit(sellerEarnings);
      console.log('[Order] Custom request - Credited', sellerEarnings, 'to seller', seller, '(includes', tierBonus, 'tier bonus)');

      // 3. Credit platform fee to platform wallet (MINUS tier bonus that goes to seller)
      const netPlatformRevenue = totalPlatformRevenue - tierBonus;
      await platformWallet.deposit(netPlatformRevenue);
      console.log('[Order] Custom request - Credited', netPlatformRevenue, 'to platform wallet');

      // Create the order with custom request flag
      const order = new Order({
        title,
        description,
        price: actualPrice,
        markedUpPrice: actualMarkedUpPrice,
        imageUrl: '/api/placeholder/400/300', // Default image for custom requests
        date: new Date(),
        seller,
        buyer,
        tags: tags || [],
        isCustomRequest: true,
        originalRequestId: requestId,
        deliveryAddress: deliveryAddress || undefined, // Make it optional initially
        shippingStatus: 'pending',
        paymentStatus: 'completed',
        paymentCompletedAt: new Date(),
        // Tier-based fee tracking
        platformFee: platformFee,
        buyerMarkupFee,
        sellerPlatformFee: platformFee,
        sellerEarnings,
        tierCreditAmount: tierBonus,
        sellerTier: sellerTier
      });

      await order.save();
      console.log('[Order] Custom request order created:', order._id);

      // Create database notification for seller
      await Notification.create({
        recipient: seller,
        type: 'custom_request_paid',
        title: 'Custom Request Paid!',
        message: `${buyer} has paid for your custom request: "${title}"`,
        link: `/sellers/orders-to-fulfil`,
        metadata: {
          orderId: order._id.toString(),
          requestId,
          buyer,
          amount: actualMarkedUpPrice,
          isPremium
        }
      });

      // Send a message to the seller about the payment
      const Message = require('../models/Message');
      const { v4: uuidv4 } = require('uuid');
      
      const paymentMessage = new Message({
        _id: uuidv4(),
        sender: buyer,
        receiver: seller,
        content: `✅ Custom request "${title}" has been paid! ($${actualPrice.toFixed(2)})`,
        type: 'normal',
        meta: {
          orderId: order._id.toString(),
          requestId,
          isPaidNotification: true,
          isPremium
        },
        threadId: Message.getThreadId(buyer, seller),
        isRead: false
      });
      await paymentMessage.save();

      // Create transaction records
      const purchaseTransaction = new Transaction({
        type: 'custom_request',
        amount: actualMarkedUpPrice,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Custom Request: ${title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          requestId,
          customRequest: true,
          listingTitle: title,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          sellerEarnings,
          seller,
          buyer,
          sellerTier,
          tierBonus,
          isPremium
        }
      });
      await purchaseTransaction.save();

      // Create platform fee transaction
      const feeTransaction = new Transaction({
        type: 'platform_fee',
        amount: totalPlatformRevenue,
        from: buyer,
        to: 'platform',
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Platform fee for custom request: ${title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          requestId,
          customRequest: true,
          buyerFee: buyerMarkupFee,
          sellerFee: platformFee,
          totalFee: totalPlatformRevenue,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          seller,
          buyer,
          sellerTier
        }
      });
      await feeTransaction.save();

      // Create tier credit transaction if there's a bonus
      if (tierBonus > 0) {
        const tierCreditTransaction = new Transaction({
          type: 'tier_credit',
          amount: tierBonus,
          from: 'platform',
          to: seller,
          fromRole: 'admin',
          toRole: 'seller',
          description: `Tier bonus (${sellerTier}) for custom request`,
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            orderId: order._id.toString(),
            requestId,
            customRequest: true,
            tierBonus,
            sellerTier,
            bonusPercentage: tierInfo.bonusPercentage
          }
        });
        await tierCreditTransaction.save();
      }

      // Update order with transaction references
      order.paymentTransactionId = purchaseTransaction._id;
      order.feeTransactionId = feeTransaction._id;
      await order.save();

      // UPDATE SELLER TIER after successful sale
      const tierUpdateResult = await tierService.updateSellerTier(seller);
      if (tierUpdateResult.changed) {
        console.log('[Order] Custom request - Seller tier updated:', tierUpdateResult.oldTier, '->', tierUpdateResult.newTier);
      }

      // Emit WebSocket events
      if (global.webSocketService) {
        // Balance updates
        global.webSocketService.emitBalanceUpdate(buyer, 'buyer', previousBuyerBalance, buyerWallet.balance, 'custom_request');
        global.webSocketService.emitBalanceUpdate(seller, 'seller', previousSellerBalance, sellerWallet.balance, 'custom_request_sale');
        global.webSocketService.emitBalanceUpdate('platform', 'admin', previousPlatformBalance, platformWallet.balance, 'platform_fee');
        
        // Transaction events
        global.webSocketService.emitTransaction(purchaseTransaction.toObject());
        global.webSocketService.emitTransaction(feeTransaction.toObject());

        // Custom request paid event
        global.webSocketService.emitToUser(seller, 'custom_request:paid', {
          requestId,
          orderId: order._id.toString(),
          buyer,
          title,
          amount: actualPrice,
          isPremium
        });

        // Emit new message event for the payment notification
        global.webSocketService.emitNewMessage({
          id: paymentMessage._id.toString(),
          sender: paymentMessage.sender,
          receiver: paymentMessage.receiver,
          content: paymentMessage.content,
          type: paymentMessage.type,
          date: paymentMessage.createdAt,
          createdAt: paymentMessage.createdAt,
          threadId: paymentMessage.threadId,
          meta: paymentMessage.meta,
          isRead: false,
          read: false
        });

        // User update if tier changed
        if (tierUpdateResult && tierUpdateResult.changed) {
          global.webSocketService.emitUserUpdate(seller, {
            tier: tierUpdateResult.newTier,
            totalSales: tierUpdateResult.stats.totalSales
          });
        }
      }

      console.log('[Order] Custom request processing complete');

      // CRITICAL FIX: Return order data with both _id and id fields
      res.json({
        success: true,
        data: {
          _id: order._id.toString(),  // Include MongoDB _id
          id: order._id.toString(),   // Also include as id for frontend compatibility
          title: order.title,
          description: order.description,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          imageUrl: order.imageUrl,
          date: order.date.toISOString(),
          seller: order.seller,
          buyer: order.buyer,
          tags: order.tags,
          isCustomRequest: true,
          originalRequestId: requestId,
          deliveryAddress: order.deliveryAddress,
          shippingStatus: order.shippingStatus,
          paymentStatus: order.paymentStatus,
          platformFee: order.platformFee,
          sellerEarnings: order.sellerEarnings,
          tierCreditAmount: order.tierCreditAmount,
          sellerTier
        }
      });

    } catch (error) {
      console.error('[Order] Custom request transaction failed:', error);
      
      // Attempt to rollback
      try {
        if (buyerWallet.balance < previousBuyerBalance) {
          buyerWallet.balance = previousBuyerBalance;
          await buyerWallet.save();
        }
        
        if (sellerWallet.balance > previousSellerBalance) {
          sellerWallet.balance = previousSellerBalance;
          await sellerWallet.save();
        }
        
        if (platformWallet.balance > previousPlatformBalance) {
          platformWallet.balance = previousPlatformBalance;
          await platformWallet.save();
        }
      } catch (rollbackError) {
        console.error('[Order] Rollback failed:', rollbackError);
      }

      throw error;
    }

  } catch (error) {
    console.error('[Order] Error converting custom request to order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert custom request to order'
    });
  }
});

// GET /api/orders - Get orders for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, limit = 50, page = 1, status, buyer, seller } = req.query;
    const username = req.user.username;
    
    // Build query based on role and params
    const query = {};
    
    // CRITICAL FIX: Handle explicit buyer/seller params for filtering
    if (buyer) {
      query.buyer = buyer;
    } else if (seller) {
      query.seller = seller;
    } else if (role === 'buyer' || req.user.role === 'buyer') {
      query.buyer = username;
    } else if (role === 'seller' || req.user.role === 'seller') {
      query.seller = username;
    } else if (req.user.role === 'admin') {
      // Admin can see all orders
    } else {
      // Default to orders where user is buyer or seller
      query.$or = [
        { buyer: username },
        { seller: username }
      ];
    }

    if (status) {
      query.shippingStatus = status;
    }

    console.log('[Order] GET /api/orders query:', query);

    // Get orders with pagination
    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    console.log(`[Order] Found ${orders.length} orders (total: ${total})`);

    // CRITICAL FIX: Format orders with both _id and id fields
    const formattedOrders = orders.map(order => ({
      _id: order._id.toString(),  // Include MongoDB _id
      id: order._id.toString(),   // Also include as id for frontend compatibility
      title: order.title,
      description: order.description,
      price: order.price,
      markedUpPrice: order.markedUpPrice,
      imageUrl: order.imageUrl,
      date: order.date.toISOString(),
      seller: order.seller,
      buyer: order.buyer,
      tags: order.tags,
      listingId: order.listingId,
      wasAuction: order.wasAuction,
      finalBid: order.finalBid,
      deliveryAddress: order.deliveryAddress,
      shippingStatus: order.shippingStatus,
      trackingNumber: order.trackingNumber,
      shippedDate: order.shippedDate,
      deliveredDate: order.deliveredDate,
      paymentStatus: order.paymentStatus,
      platformFee: order.platformFee,
      sellerEarnings: order.sellerEarnings,
      tierCreditAmount: order.tierCreditAmount,
      sellerTier: order.sellerTier,
      isCustomRequest: order.isCustomRequest,
      originalRequestId: order.originalRequestId
    }));

    res.json({
      success: true,
      data: formattedOrders,
      meta: {
        page: parseInt(page),
        pageSize: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[Order] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user can view this order
    if (req.user.username !== order.buyer && 
        req.user.username !== order.seller && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own orders'
      });
    }

    // CRITICAL FIX: Return with both _id and id fields
    res.json({
      success: true,
      data: {
        _id: order._id.toString(),  // Include MongoDB _id
        id: order._id.toString(),   // Also include as id for frontend compatibility
        title: order.title,
        description: order.description,
        price: order.price,
        markedUpPrice: order.markedUpPrice,
        imageUrl: order.imageUrl,
        date: order.date.toISOString(),
        seller: order.seller,
        buyer: order.buyer,
        tags: order.tags,
        listingId: order.listingId,
        wasAuction: order.wasAuction,
        finalBid: order.finalBid,
        deliveryAddress: order.deliveryAddress,
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate,
        paymentStatus: order.paymentStatus,
        platformFee: order.platformFee,
        sellerEarnings: order.sellerEarnings,
        tierCreditAmount: order.tierCreditAmount,
        sellerTier: order.sellerTier,
        isCustomRequest: order.isCustomRequest,
        originalRequestId: order.originalRequestId
      }
    });

  } catch (error) {
    console.error('[Order] Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/orders/:id/shipping - Update shipping status
router.put('/:id/shipping', authMiddleware, async (req, res) => {
  try {
    const { shippingStatus, trackingNumber } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only seller or admin can update shipping
    if (req.user.username !== order.seller && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can update shipping status'
      });
    }

    // Update shipping status
    if (shippingStatus) {
      order.shippingStatus = shippingStatus;
      
      if (shippingStatus === 'shipped' && !order.shippedDate) {
        order.shippedDate = new Date();
      } else if (shippingStatus === 'delivered' && !order.deliveredDate) {
        order.deliveredDate = new Date();
      }
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    // Create notification for buyer when shipped
    if (shippingStatus === 'shipped') {
      await Notification.create({
        recipient: order.buyer,
        type: 'shipping_update',
        title: 'Order Shipped',
        message: `Your order "${order.title}" has been shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}`,
        link: `/buyers/my-orders`,
        metadata: {
          orderId: order._id.toString(),
          seller: order.seller,
          trackingNumber
        }
      });
    }

    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        buyer: order.buyer,
        seller: order.seller
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate
      }
    });

  } catch (error) {
    console.error('[Order] Error updating shipping:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/orders/:id/shipping - Update shipping status (alternative to PUT for frontend compatibility)
router.post('/:id/shipping', authMiddleware, async (req, res) => {
  try {
    const { shippingStatus, trackingNumber } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only seller or admin can update shipping
    if (req.user.username !== order.seller && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can update shipping status'
      });
    }

    // Update shipping status
    if (shippingStatus) {
      order.shippingStatus = shippingStatus;
      
      if (shippingStatus === 'shipped' && !order.shippedDate) {
        order.shippedDate = new Date();
      } else if (shippingStatus === 'delivered' && !order.deliveredDate) {
        order.deliveredDate = new Date();
      }
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    // Create notification for buyer when shipped
    if (shippingStatus === 'shipped') {
      await Notification.create({
        recipient: order.buyer,
        type: 'shipping_update',
        title: 'Order Shipped',
        message: `Your order "${order.title}" has been shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}`,
        link: `/buyers/my-orders`,
        metadata: {
          orderId: order._id.toString(),
          seller: order.seller,
          trackingNumber
        }
      });
    }

    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        buyer: order.buyer,
        seller: order.seller
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate
      }
    });

  } catch (error) {
    console.error('[Order] Error updating shipping:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/orders/:id/address - Update delivery address
router.put('/:id/address', authMiddleware, async (req, res) => {
  try {
    const { deliveryAddress } = req.body;
    
    // Validate delivery address
    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.addressLine1 || 
        !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.postalCode || 
        !deliveryAddress.country) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery address. All required fields must be provided.'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only buyer or admin can update delivery address
    if (req.user.username !== order.buyer && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the buyer can update the delivery address'
      });
    }

    // Don't allow address change if order is already shipped
    if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update address for shipped or delivered orders'
      });
    }

    // Update the delivery address
    order.deliveryAddress = {
      fullName: deliveryAddress.fullName.trim(),
      addressLine1: deliveryAddress.addressLine1.trim(),
      addressLine2: deliveryAddress.addressLine2 ? deliveryAddress.addressLine2.trim() : undefined,
      city: deliveryAddress.city.trim(),
      state: deliveryAddress.state.trim(),
      postalCode: deliveryAddress.postalCode.trim(),
      country: deliveryAddress.country.trim(),
      specialInstructions: deliveryAddress.specialInstructions ? deliveryAddress.specialInstructions.trim() : undefined
    };

    await order.save();

    console.log('[Order] Address updated for order:', order._id);

    // Create notification for seller about address update
    await Notification.create({
      recipient: order.seller,
      type: 'address_update',
      title: 'Delivery Address Updated',
      message: `${order.buyer} has ${order.deliveryAddress ? 'updated' : 'added'} the delivery address for "${order.title}"`,
      link: `/sellers/orders-to-fulfil`,
      metadata: {
        orderId: order._id.toString(),
        buyer: order.buyer
      }
    });

    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        buyer: order.buyer,
        seller: order.seller,
        hasAddress: true,
        addressUpdated: true
      });

      // Send notification to seller via WebSocket
      global.webSocketService.emitToUser(order.seller, 'order:address-updated', {
        orderId: order._id.toString(),
        orderTitle: order.title,
        buyer: order.buyer,
        hasAddress: true
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        deliveryAddress: order.deliveryAddress,
        message: 'Delivery address updated successfully'
      }
    });

  } catch (error) {
    console.error('[Order] Error updating address:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update delivery address'
    });
  }
});

// POST /api/orders/:id/address - Update delivery address (alternative to PUT for frontend compatibility)
router.post('/:id/address', authMiddleware, async (req, res) => {
  try {
    const { deliveryAddress } = req.body;
    
    // Validate delivery address
    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.addressLine1 || 
        !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.postalCode || 
        !deliveryAddress.country) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery address. All required fields must be provided.'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only buyer or admin can update delivery address
    if (req.user.username !== order.buyer && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the buyer can update the delivery address'
      });
    }

    // Don't allow address change if order is already shipped
    if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update address for shipped or delivered orders'
      });
    }

    // Update the delivery address
    order.deliveryAddress = {
      fullName: deliveryAddress.fullName.trim(),
      addressLine1: deliveryAddress.addressLine1.trim(),
      addressLine2: deliveryAddress.addressLine2 ? deliveryAddress.addressLine2.trim() : undefined,
      city: deliveryAddress.city.trim(),
      state: deliveryAddress.state.trim(),
      postalCode: deliveryAddress.postalCode.trim(),
      country: deliveryAddress.country.trim(),
      specialInstructions: deliveryAddress.specialInstructions ? deliveryAddress.specialInstructions.trim() : undefined
    };

    await order.save();

    console.log('[Order] Address updated for order:', order._id);

    // Create notification for seller about address update
    await Notification.create({
      recipient: order.seller,
      type: 'address_update',
      title: 'Delivery Address Updated',
      message: `${order.buyer} has ${order.deliveryAddress ? 'updated' : 'added'} the delivery address for "${order.title}"`,
      link: `/sellers/orders-to-fulfil`,
      metadata: {
        orderId: order._id.toString(),
        buyer: order.buyer
      }
    });

    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        buyer: order.buyer,
        seller: order.seller,
        hasAddress: true,
        addressUpdated: true
      });

      // Send notification to seller via WebSocket
      global.webSocketService.emitToUser(order.seller, 'order:address-updated', {
        orderId: order._id.toString(),
        orderTitle: order.title,
        buyer: order.buyer,
        hasAddress: true
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        deliveryAddress: order.deliveryAddress,
        message: 'Delivery address updated successfully'
      }
    });

  } catch (error) {
    console.error('[Order] Error updating address:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update delivery address'
    });
  }
});

// PATCH /api/orders/:id - Update order (general update endpoint)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check permissions
    const canUpdate = req.user.username === order.buyer || 
                     req.user.username === order.seller || 
                     req.user.role === 'admin';
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this order'
      });
    }

    // Handle specific updates based on role
    const updates = {};
    
    // Buyer can update delivery address
    if (req.user.username === order.buyer && req.body.deliveryAddress) {
      // Don't allow if already shipped
      if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
        return res.status(400).json({
          success: false,
          error: 'Cannot update address for shipped orders'
        });
      }
      updates.deliveryAddress = req.body.deliveryAddress;
    }
    
    // Seller can update shipping info
    if (req.user.username === order.seller) {
      if (req.body.shippingStatus) {
        updates.shippingStatus = req.body.shippingStatus;
        
        if (req.body.shippingStatus === 'shipped' && !order.shippedDate) {
          updates.shippedDate = new Date();
        } else if (req.body.shippingStatus === 'delivered' && !order.deliveredDate) {
          updates.deliveredDate = new Date();
        }
      }
      
      if (req.body.trackingNumber) {
        updates.trackingNumber = req.body.trackingNumber;
      }
    }
    
    // Admin can update anything
    if (req.user.role === 'admin') {
      Object.assign(updates, req.body);
    }

    // Apply updates
    Object.assign(order, updates);
    await order.save();

    // Emit WebSocket event if there were updates
    if (Object.keys(updates).length > 0 && global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        ...updates,
        buyer: order.buyer,
        seller: order.seller
      });
    }

    // CRITICAL FIX: Return with both _id and id fields
    res.json({
      success: true,
      data: {
        _id: order._id.toString(),  // Include MongoDB _id
        id: order._id.toString(),   // Also include as id for frontend compatibility
        title: order.title,
        description: order.description,
        price: order.price,
        markedUpPrice: order.markedUpPrice,
        imageUrl: order.imageUrl,
        date: order.date.toISOString(),
        seller: order.seller,
        buyer: order.buyer,
        tags: order.tags,
        listingId: order.listingId,
        wasAuction: order.wasAuction,
        finalBid: order.finalBid,
        deliveryAddress: order.deliveryAddress,
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate,
        paymentStatus: order.paymentStatus,
        sellerTier: order.sellerTier,
        isCustomRequest: order.isCustomRequest,
        originalRequestId: order.originalRequestId
      }
    });

  } catch (error) {
    console.error('[Order] Error updating order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/orders/:id - Cancel order (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can cancel orders'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Only allow cancellation of pending orders
    if (order.shippingStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Can only cancel pending orders'
      });
    }

    order.shippingStatus = 'cancelled';
    await order.save();

    // TODO: Process refund if payment was completed

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        message: 'Order cancelled successfully'
      }
    });

  } catch (error) {
    console.error('[Order] Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export the router
module.exports = router;