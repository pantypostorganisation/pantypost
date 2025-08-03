// pantypost-backend/routes/order.routes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES, ORDER_STATUS } = require('../utils/constants');
const webSocketService = require('../config/websocket'); // ADD THIS

// ============= ORDER ROUTES =============

// GET /api/orders - Get all orders (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { buyer, seller, status } = req.query;
    let filter = {};
    
    // Filter based on user role and query params
    if (req.user.role === 'buyer') {
      filter.buyer = req.user.username;
    } else if (req.user.role === 'seller') {
      filter.seller = req.user.username;
    } else if (req.user.role === 'admin') {
      // Admin can see all, apply filters if provided
      if (buyer) filter.buyer = buyer;
      if (seller) filter.seller = seller;
    }
    
    if (status) filter.shippingStatus = status;
    
    const orders = await Order.find(filter).sort({ date: -1 });
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/orders - Create an order with wallet payment (NO TRANSACTIONS)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const orderData = req.body;
    const buyer = req.user.username;
    
    // Only buyers can create orders
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only buyers can create orders'
      });
    }
    
    // Validate required fields
    if (!orderData.deliveryAddress || !orderData.seller || !orderData.price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Get buyer's wallet
    const buyerWallet = await Wallet.findOne({ username: buyer });
    if (!buyerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Buyer wallet not found. Please deposit funds first.'
      });
    }
    
    // Check if buyer has enough balance
    const totalAmount = orderData.price;
    if (!buyerWallet.hasBalance(totalAmount)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You have $${buyerWallet.balance.toFixed(2)} but need $${totalAmount.toFixed(2)}`
      });
    }
    
    // Get seller's wallet
    let sellerWallet = await Wallet.findOne({ username: orderData.seller });
    if (!sellerWallet) {
      // Create seller wallet if it doesn't exist
      sellerWallet = new Wallet({
        username: orderData.seller,
        role: 'seller',
        balance: 0
      });
      await sellerWallet.save();
    }
    
    // Calculate fees and earnings
    const platformFee = Math.round(totalAmount * 0.1 * 100) / 100; // 10% platform fee
    const sellerEarnings = Math.round((totalAmount - platformFee) * 100) / 100;
    
    // Create the order
    const newOrder = new Order({
      ...orderData,
      buyer: buyer,
      platformFee: platformFee,
      sellerEarnings: sellerEarnings,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      date: new Date()
    });
    
    // Calculate tier credit if applicable
    if (orderData.markedUpPrice && orderData.markedUpPrice > orderData.price) {
      newOrder.tierCreditAmount = newOrder.calculateTierCredit();
    }
    
    // Save the order first
    await newOrder.save();
    
    try {
      // Process payment: Deduct from buyer
      await buyerWallet.withdraw(totalAmount);
      
      // Create purchase transaction
      const purchaseTransaction = new Transaction({
        type: 'purchase',
        amount: totalAmount,
        from: buyer,
        to: orderData.seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Purchase: ${orderData.title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          listingId: orderData.listingId
        }
      });
      await purchaseTransaction.save();
      
      // Add earnings to seller
      await sellerWallet.deposit(sellerEarnings);
      
      // Create sale transaction
      const saleTransaction = new Transaction({
        type: 'sale',
        amount: sellerEarnings,
        from: buyer,
        to: orderData.seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Sale: ${orderData.title} (after fees)`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          originalPrice: totalAmount,
          platformFee: platformFee
        }
      });
      await saleTransaction.save();
      
      // Create platform fee transaction
      const feeTransaction = new Transaction({
        type: 'fee',
        amount: platformFee,
        from: orderData.seller,
        to: 'platform',
        fromRole: 'seller',
        toRole: 'admin',
        description: `Platform fee (10%) for: ${orderData.title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          percentage: 10
        }
      });
      await feeTransaction.save();
      
      // Update order with transaction references
      newOrder.paymentStatus = 'completed';
      newOrder.paymentCompletedAt = new Date();
      newOrder.paymentTransactionId = purchaseTransaction._id;
      newOrder.feeTransactionId = feeTransaction._id;
      await newOrder.save();
      
      // Update listing to sold if provided
      if (orderData.listingId) {
        await Listing.findByIdAndUpdate(
          orderData.listingId,
          { status: 'sold' }
        );
      }
      
      // WEBSOCKET: Emit new order event
      webSocketService.emitNewOrder(newOrder);
      
      // WEBSOCKET: Emit wallet balance updates
      webSocketService.emitBalanceUpdate(
        buyer, 
        'buyer', 
        buyerWallet.balance + totalAmount, 
        buyerWallet.balance, 
        'purchase'
      );
      
      webSocketService.emitBalanceUpdate(
        orderData.seller, 
        'seller', 
        sellerWallet.balance - sellerEarnings, 
        sellerWallet.balance, 
        'sale'
      );
      
      // WEBSOCKET: Emit transaction events
      webSocketService.emitTransaction(purchaseTransaction);
      webSocketService.emitTransaction(saleTransaction);
      
      res.json({
        success: true,
        data: newOrder,
        message: 'Order created successfully! Payment processed.'
      });
      
    } catch (paymentError) {
      // If payment fails, delete the order
      await Order.findByIdAndDelete(newOrder._id);
      
      // Return the error
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
    if (req.user.role !== 'admin' && 
        order.buyer !== req.user.username && 
        order.seller !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this order'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/orders/:id/status - Update order shipping status
router.post('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { shippingStatus, trackingNumber } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Only seller or admin can update order status
    if (order.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can update order status'
      });
    }
    
    // Validate status transition
    const validTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'pending-auction': ['processing']
    };
    
    const currentStatus = order.shippingStatus;
    if (!validTransitions[currentStatus]?.includes(shippingStatus)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${currentStatus} to ${shippingStatus}`
      });
    }
    
    // Store previous status for WebSocket event
    const previousStatus = order.shippingStatus;
    
    // Update order
    order.shippingStatus = shippingStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    
    if (shippingStatus === 'shipped') {
      order.shippedDate = new Date();
    } else if (shippingStatus === 'delivered') {
      order.deliveredDate = new Date();
    }
    
    await order.save();
    
    // WEBSOCKET: Emit order status change
    webSocketService.emitOrderStatusChange(order, previousStatus);
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/orders/stats/summary - Get order statistics (admin or user's own)
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'buyer') {
      filter.buyer = req.user.username;
    } else if (req.user.role === 'seller') {
      filter.seller = req.user.username;
    }
    // Admin sees all
    
    const totalOrders = await Order.countDocuments(filter);
    const pendingOrders = await Order.countDocuments({ ...filter, shippingStatus: 'pending' });
    const shippedOrders = await Order.countDocuments({ ...filter, shippingStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ ...filter, shippingStatus: 'delivered' });
    
    // Calculate total sales/purchases
    const orders = await Order.find(filter);
    const totalAmount = orders.reduce((sum, order) => sum + order.price, 0);
    
    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        totalAmount: Math.round(totalAmount * 100) / 100
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