// pantypost-backend/routes/order.routes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES, ORDER_STATUS } = require('../utils/constants');
const webSocketService = require('../config/websocket');

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

// POST /api/orders - Create an order with wallet payment and DOUBLE 10% FEE MODEL
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
    if (!orderData.deliveryAddress || !orderData.seller || !orderData.price || !orderData.markedUpPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields (deliveryAddress, seller, price, markedUpPrice)'
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
    
    // ✅ CORRECTED FEE CALCULATION FOR DOUBLE 10% MODEL
    const originalPrice = orderData.price;          // $100 (what seller listed)
    const buyerPayment = orderData.markedUpPrice;   // $110 (what buyer pays)
    const buyerMarkupFee = Math.round((buyerPayment - originalPrice) * 100) / 100; // $10 (buyer's 10%)
    const sellerPlatformFee = Math.round(originalPrice * 0.1 * 100) / 100;         // $10 (seller's 10%)
    const totalPlatformFee = buyerMarkupFee + sellerPlatformFee;                   // $20 total
    const sellerEarnings = Math.round((originalPrice - sellerPlatformFee) * 100) / 100; // $90
    
    console.log('💰 Order Fee Calculation:', {
      originalPrice,
      buyerPayment,
      buyerMarkupFee,
      sellerPlatformFee,
      totalPlatformFee,
      sellerEarnings,
      verification: {
        buyerPays: buyerPayment,
        sellerGets: sellerEarnings,
        platformProfit: totalPlatformFee,
        totalCheck: sellerEarnings + totalPlatformFee // Should equal buyerPayment
      }
    });
    
    // Verify our math is correct
    if (Math.abs((sellerEarnings + totalPlatformFee) - buyerPayment) > 0.01) {
      console.error('❌ Fee calculation error! Numbers don\'t add up:', {
        sellerEarnings,
        totalPlatformFee,
        sum: sellerEarnings + totalPlatformFee,
        buyerPayment
      });
      return res.status(500).json({
        success: false,
        error: 'Internal fee calculation error'
      });
    }
    
    // Check if buyer has enough balance (they need to pay the marked up price)
    if (!buyerWallet.hasBalance(buyerPayment)) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You have $${buyerWallet.balance.toFixed(2)} but need $${buyerPayment.toFixed(2)}`
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
    
    // 🔧 CRITICAL FIX: Get or create admin wallet for platform fees
    const adminUser = await require('../models/User').findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found! Please create an admin user first');
      return res.status(500).json({
        success: false,
        error: 'Platform admin not configured. Please contact support.'
      });
    }
    
    // Find admin wallet by username OR role (in case wallet exists with wrong role)
    let adminWallet = await Wallet.findOne({ 
      $or: [
        { username: adminUser.username },
        { role: 'admin' }
      ]
    });
    
    if (!adminWallet) {
      // Create new admin wallet
      adminWallet = new Wallet({
        username: adminUser.username,
        role: 'admin',
        balance: 0
      });
      await adminWallet.save();
      console.log('✅ Created admin wallet for platform fees');
    } else if (adminWallet.role !== 'admin') {
      // Update existing wallet to admin role
      adminWallet.role = 'admin';
      await adminWallet.save();
      console.log('✅ Updated existing wallet to admin role');
    }
    
    console.log('💳 Admin wallet before transaction:', {
      username: adminWallet.username,
      balance: adminWallet.balance,
      willReceive: totalPlatformFee
    });
    
    // Create the order with correct fee breakdown
    const newOrder = new Order({
      ...orderData,
      buyer: buyer,
      platformFee: totalPlatformFee,
      sellerEarnings: sellerEarnings,
      paymentStatus: 'pending',
      shippingStatus: 'pending',
      date: new Date(),
      // Add breakdown for transparency
      buyerMarkupFee: buyerMarkupFee,
      sellerPlatformFee: sellerPlatformFee
    });
    
    // Calculate tier credit if applicable
    if (orderData.markedUpPrice && orderData.markedUpPrice > orderData.price) {
      newOrder.tierCreditAmount = newOrder.calculateTierCredit();
    }
    
    // Save the order first
    await newOrder.save();
    
    try {
      // ✅ CORRECTED PAYMENT PROCESSING WITH ADMIN WALLET CREDITING
      
      // 1. Deduct the FULL amount buyer pays ($110)
      await buyerWallet.withdraw(buyerPayment);
      
      // 2. Add earnings to seller (after platform fee deduction) - $90
      await sellerWallet.deposit(sellerEarnings);
      
      // 🔧 3. CRITICAL FIX: Credit the TOTAL platform fees to admin wallet - $20
      await adminWallet.deposit(totalPlatformFee);
      
      console.log('💰 Admin wallet after crediting fees:', {
        username: adminWallet.username,
        newBalance: adminWallet.balance,
        credited: totalPlatformFee
      });
      
      // 4. Create purchase transaction for the full amount
      const purchaseTransaction = new Transaction({
        type: 'purchase',
        amount: buyerPayment,
        from: buyer,
        to: orderData.seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Purchase: ${orderData.title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          listingId: orderData.listingId,
          originalPrice: originalPrice,
          buyerMarkupFee: buyerMarkupFee
        }
      });
      await purchaseTransaction.save();
      
      // 5. Create sale transaction for seller earnings
      const saleTransaction = new Transaction({
        type: 'sale',
        amount: sellerEarnings,
        from: buyer,
        to: orderData.seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Sale: ${orderData.title} (after platform fees)`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          originalPrice: originalPrice,
          sellerPlatformFee: sellerPlatformFee,
          buyerMarkupFee: buyerMarkupFee,
          totalPlatformFee: totalPlatformFee
        }
      });
      await saleTransaction.save();
      
      // 6. Create buyer markup fee transaction
      const buyerFeeTransaction = new Transaction({
        type: 'fee',
        amount: buyerMarkupFee,
        from: buyer,
        to: adminWallet.username,
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Buyer markup fee (10%) for: ${orderData.title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          feeType: 'buyer_markup',
          percentage: 10,
          originalPrice: originalPrice
        }
      });
      await buyerFeeTransaction.save();
      
      // 7. Create seller platform fee transaction
      const sellerFeeTransaction = new Transaction({
        type: 'fee',
        amount: sellerPlatformFee,
        from: orderData.seller,
        to: adminWallet.username,
        fromRole: 'seller',
        toRole: 'admin',
        description: `Seller platform fee (10%) for: ${orderData.title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          feeType: 'seller_platform',
          percentage: 10,
          originalPrice: originalPrice
        }
      });
      await sellerFeeTransaction.save();
      
      // 🔧 8. NEW: Create combined platform fee transaction for admin tracking
      const adminFeeTransaction = new Transaction({
        type: 'platform_fee',
        amount: totalPlatformFee,
        from: 'system',
        to: adminWallet.username,
        fromRole: 'system',
        toRole: 'admin',
        description: `Platform fees collected for order: ${orderData.title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: newOrder._id.toString(),
          breakdown: {
            buyerMarkupFee: buyerMarkupFee,
            sellerPlatformFee: sellerPlatformFee,
            originalPrice: originalPrice
          }
        }
      });
      await adminFeeTransaction.save();
      
      // Update order with transaction references
      newOrder.paymentStatus = 'completed';
      newOrder.paymentCompletedAt = new Date();
      newOrder.paymentTransactionId = purchaseTransaction._id;
      newOrder.feeTransactionId = sellerFeeTransaction._id;
      newOrder.buyerFeeTransactionId = buyerFeeTransaction._id;
      newOrder.adminFeeTransactionId = adminFeeTransaction._id;
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
        buyerWallet.balance + buyerPayment, 
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
      
      // 🔧 NEW: Emit admin wallet balance update
      webSocketService.emitBalanceUpdate(
        adminWallet.username,
        'admin',
        adminWallet.balance - totalPlatformFee,
        adminWallet.balance,
        'platform_fee'
      );
      
      // WEBSOCKET: Emit transaction events
      webSocketService.emitTransaction(purchaseTransaction);
      webSocketService.emitTransaction(saleTransaction);
      webSocketService.emitTransaction(buyerFeeTransaction);
      webSocketService.emitTransaction(sellerFeeTransaction);
      webSocketService.emitTransaction(adminFeeTransaction); // New admin transaction
      
      console.log('✅ Order completed successfully!', {
        orderId: newOrder._id,
        buyerBalance: buyerWallet.balance,
        sellerBalance: sellerWallet.balance,
        adminBalance: adminWallet.balance,
        platformFeesCollected: totalPlatformFee
      });
      
      res.json({
        success: true,
        data: newOrder,
        message: 'Order created successfully! Payment processed.',
        breakdown: {
          buyerPaid: buyerPayment,
          sellerReceived: sellerEarnings,
          platformFeesCollected: totalPlatformFee,
          platformFees: {
            fromBuyer: buyerMarkupFee,
            fromSeller: sellerPlatformFee,
            total: totalPlatformFee
          },
          walletBalances: {
            buyer: buyerWallet.balance,
            seller: sellerWallet.balance,
            admin: adminWallet.balance
          }
        }
      });
      
    } catch (paymentError) {
      // If payment fails, delete the order
      await Order.findByIdAndDelete(newOrder._id);
      
      console.error('Payment processing failed:', paymentError);
      return res.status(400).json({
        success: false,
        error: `Payment failed: ${paymentError.message}`
      });
    }
    
  } catch (error) {
    console.error('Order creation error:', error);
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
    
    // Calculate total sales/purchases based on role
    const orders = await Order.find(filter);
    
    let totalAmount = 0;
    if (req.user.role === 'buyer') {
      // For buyers, show what they paid (markedUpPrice)
      totalAmount = orders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);
    } else if (req.user.role === 'seller') {
      // For sellers, show what they earned (sellerEarnings)
      totalAmount = orders.reduce((sum, order) => sum + (order.sellerEarnings || (order.price * 0.9)), 0);
    } else {
      // For admin, show platform fees earned
      totalAmount = orders.reduce((sum, order) => sum + (order.platformFee || (order.price * 0.2)), 0);
    }
    
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