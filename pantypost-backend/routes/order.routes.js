// pantypost-backend/routes/order.routes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const tierService = require('../services/tierService');
const TIER_CONFIG = require('../config/tierConfig');

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
      deliveryAddress
    } = req.body;

    console.log('[Order] Creating order with tier support:', {
      title,
      buyer,
      seller,
      price,
      markedUpPrice,
      listingId
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

    // Check buyer has sufficient balance
    if (!buyerWallet.hasBalance(actualMarkedUpPrice)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You need $${actualMarkedUpPrice.toFixed(2)} but only have $${buyerWallet.balance.toFixed(2)}`
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

      // 3. Credit platform fee to platform wallet
      await platformWallet.deposit(totalPlatformRevenue);
      console.log('[Order] Credited', totalPlatformRevenue, 'to platform wallet');

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
        tierCreditAmount: tierBonus
      });

      await order.save();
      console.log('[Order] Order created with tier:', order._id);

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
          tierBonus
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

      // Return order data with tier info
      res.json({
        success: true,
        data: {
          id: order._id.toString(),
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

// GET /api/orders - Get orders for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, limit = 50, page = 1, status } = req.query;
    const username = req.user.username;
    
    // Build query based on role
    const query = {};
    if (role === 'buyer' || req.user.role === 'buyer') {
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

    // Get orders with pagination
    const skip = (page - 1) * limit;
    const orders = await Order.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      id: order._id.toString(),
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
      tierCreditAmount: order.tierCreditAmount
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

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
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
        tierCreditAmount: order.tierCreditAmount
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

// Export the router
module.exports = router;