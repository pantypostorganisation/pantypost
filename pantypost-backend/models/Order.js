// pantypost-backend/models/Order.js
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
      return Math.round(this.price * 1.1 * 100) / 100; // 10% markup, rounded to 2 decimals
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
  
  // Reference to original listing
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  
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
  deliveredDate: Date,
  
  // Financial
  tierCreditAmount: {
    type: Number,
    default: 0
  },
  platformFee: {
    type: Number,
    default: function() {
      return Math.round(this.price * 0.1 * 100) / 100; // 10% platform fee
    }
  },
  sellerEarnings: {
    type: Number,
    default: function() {
      return Math.round((this.price - this.platformFee) * 100) / 100; // Price minus platform fee
    }
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentCompletedAt: Date,
  
  // Transaction references
  paymentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  feeTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
});

// Indexes for better query performance
orderSchema.index({ buyer: 1, date: -1 });
orderSchema.index({ seller: 1, date: -1 });
orderSchema.index({ shippingStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

// Calculate tier credit (difference between marked up price and original price)
orderSchema.methods.calculateTierCredit = function() {
  if (this.markedUpPrice && this.price) {
    return Math.round((this.markedUpPrice - this.price) * 100) / 100;
  }
  return 0;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;