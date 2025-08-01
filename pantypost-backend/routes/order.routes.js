// order.routes.js
// This file contains all order-related routes

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES, ORDER_STATUS } = require('../utils/constants');

// ============= ORDER ROUTES =============

// GET /api/orders - Get all orders (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { buyer, seller } = req.query;
    let filter = {};
    
    // Filter based on user role and query params
    if (req.user.role === 'buyer') {
      filter.buyer = req.user.username;
    } else if (req.user.role === 'seller') {
      filter.seller = req.user.username;
    } else if (buyer || seller) {
      if (buyer) filter.buyer = buyer;
      if (seller) filter.seller = seller;
    }
    
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

// POST /api/orders - Create an order (protected)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const orderData = req.body;
    
    // Only buyers can create orders
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only buyers can create orders'
      });
    }
    
    // Find and update the listing to sold
    if (orderData.listingId) {
      const listing = await Listing.findById(orderData.listingId);
      if (listing) {
        listing.status = 'sold';
        await listing.save();
      }
    }
    
    const newOrder = new Order({
      ...orderData,
      buyer: orderData.buyer || req.user.username,
      shippingStatus: 'pending',
      date: new Date()
    });
    
    await newOrder.save();
    
    res.json({
      success: true,
      data: newOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/orders/:id/status - Update order status (protected)
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
    
    order.shippingStatus = shippingStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingStatus === 'shipped') order.shippedDate = new Date();
    
    await order.save();
    
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

// Export the router
module.exports = router;