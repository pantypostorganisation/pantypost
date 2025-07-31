const mongoose = require('mongoose');

// Create order schema
const orderSchema = new mongoose.Schema({
  // Listing details (copied at time of purchase)
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  markedUpPrice: {
    type: Number,
    default: function() {
      return this.price * 1.1; // 10% markup
    }
  },
  imageUrl: {
    type: String,
    required: true
  },
  
  // Order details
  date: {
    type: Date,
    default: Date.now
  },
  seller: {
    type: String,
    required: true,
    ref: 'User'
  },
  buyer: {
    type: String,
    required: true,
    ref: 'User'
  },
  tags: [{
    type: String,
    maxlength: 20
  }],
  
  // Auction info (if applicable)
  wasAuction: {
    type: Boolean,
    default: false
  },
  finalBid: Number,
  
  // Delivery info
  deliveryAddress: {
    fullName: {
      type: String,
      required: true
    },
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'US'
    }
  },
  
  // Shipping status
  shippingStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: String,
  shippedDate: Date,
  
  // Financial
  tierCreditAmount: {
    type: Number,
    default: 0
  }
});

// Indexes for better query performance
orderSchema.index({ buyer: 1, date: -1 });
orderSchema.index({ seller: 1, date: -1 });
orderSchema.index({ shippingStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;