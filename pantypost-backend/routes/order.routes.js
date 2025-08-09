// pantypost-backend/routes/order.routes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const webSocketService = require('../config/websocket');

// POST /api/orders - Create new order with proper fee tracking
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

    console.log('[Order] Creating order:', {
      title,
      buyer,
      seller,
      price,
      markedUpPrice
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

    // Calculate fees
    const actualPrice = Number(price) || 0;
    const actualMarkedUpPrice = Number(markedUpPrice) || Math.round(actualPrice * 1.1 * 100) / 100;
    const buyerMarkupFee = Math.round((actualMarkedUpPrice - actualPrice) * 100) / 100;
    const sellerPlatformFee = Math.round(actualPrice * 0.1 * 100) / 100;
    const totalPlatformFee = Math.round((buyerMarkupFee + sellerPlatformFee) * 100) / 100;
    const sellerEarnings = Math.round((actualPrice - sellerPlatformFee) * 100) / 100;

    console.log('[Order] Fee calculation:', {
      price: actualPrice,
      markedUpPrice: actualMarkedUpPrice,
      buyerMarkupFee,
      sellerPlatformFee,
      totalPlatformFee,
      sellerEarnings
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
      // Get seller user to know their role
      const sellerUser = await User.findOne({ username: seller });
      if (!sellerUser) {
        return res.status(404).json({
          success: false,
          error: 'Seller not found'
        });
      }
      
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

      // 2. Credit to seller (price minus their 10% fee)
      await sellerWallet.deposit(sellerEarnings);
      console.log('[Order] Credited', sellerEarnings, 'to seller', seller);

      // 3. Credit platform fee to platform wallet
      await platformWallet.deposit(totalPlatformFee);
      console.log('[Order] Credited', totalPlatformFee, 'to platform wallet');

      // Create the order
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
        // Fee tracking
        platformFee: totalPlatformFee,
        buyerMarkupFee,
        sellerPlatformFee,
        sellerEarnings,
        tierCreditAmount: 0
      });

      await order.save();
      console.log('[Order] Order created:', order._id);

      // Create transaction records
      // 1. Main purchase transaction
      const purchaseTransaction = new Transaction({
        type: 'purchase',
        amount: actualMarkedUpPrice,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Purchase: ${title}`,
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
          buyer
        }
      });
      await purchaseTransaction.save();

      // 2. Platform fee transaction
      const feeTransaction = new Transaction({
        type: 'platform_fee',
        amount: totalPlatformFee,
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
          sellerFee: sellerPlatformFee,
          totalFee: totalPlatformFee,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          seller,
          buyer
        }
      });
      await feeTransaction.save();

      // Update order with transaction references
      order.paymentTransactionId = purchaseTransaction._id;
      order.feeTransactionId = feeTransaction._id;
      await order.save();

      // Emit WebSocket events
      if (webSocketService) {
        // Buyer balance update
        webSocketService.emitBalanceUpdate(
          buyer,
          'buyer',
          previousBuyerBalance,
          buyerWallet.balance,
          'purchase'
        );

        // Seller balance update
        webSocketService.emitBalanceUpdate(
          seller,
          'seller',
          previousSellerBalance,
          sellerWallet.balance,
          'sale'
        );

        // Platform balance update
        webSocketService.emitBalanceUpdate(
          'platform',
          'admin',
          previousPlatformBalance,
          platformWallet.balance,
          'platform_fee'
        );

        // Emit transaction events
        webSocketService.emitTransaction(purchaseTransaction);
        webSocketService.emitTransaction(feeTransaction);

        // Emit order event
        webSocketService.emitOrderCreated(order);
      }

      console.log('[Order] Order processing complete');

      // Return order data
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
          sellerEarnings: order.sellerEarnings
        }
      });

    } catch (error) {
      console.error('[Order] Transaction failed:', error);
      
      // Attempt to rollback (best effort)
      try {
        // Refund buyer if their balance was deducted
        if (buyerWallet.balance < previousBuyerBalance) {
          buyerWallet.balance = previousBuyerBalance;
          await buyerWallet.save();
        }
        
        // Revert seller balance if it was credited
        if (sellerWallet.balance > previousSellerBalance) {
          sellerWallet.balance = previousSellerBalance;
          await sellerWallet.save();
        }
        
        // Revert platform balance if it was credited
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
      sellerEarnings: order.sellerEarnings
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
        sellerEarnings: order.sellerEarnings
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
    if (webSocketService) {
      webSocketService.emitOrderUpdated(order);
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