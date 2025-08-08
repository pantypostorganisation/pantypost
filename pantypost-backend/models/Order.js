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
  
  // 🔧 ENHANCED FINANCIAL FIELDS FOR DOUBLE 10% FEE MODEL
  tierCreditAmount: {
    type: Number,
    default: 0
  },
  
  // Platform fee breakdown
  platformFee: {
    type: Number,
    default: function() {
      return Math.round(this.price * 0.2 * 100) / 100; // 20% total platform fee (10% from buyer + 10% from seller)
    }
  },
  
  // 🔧 NEW: Individual fee components
  buyerMarkupFee: {
    type: Number,
    default: function() {
      if (this.markedUpPrice && this.price) {
        return Math.round((this.markedUpPrice - this.price) * 100) / 100; // 10% buyer markup fee
      }
      return Math.round(this.price * 0.1 * 100) / 100;
    }
  },
  
  sellerPlatformFee: {
    type: Number,
    default: function() {
      return Math.round(this.price * 0.1 * 100) / 100; // 10% seller platform fee
    }
  },
  
  sellerEarnings: {
    type: Number,
    default: function() {
      const sellerFee = Math.round(this.price * 0.1 * 100) / 100;
      return Math.round((this.price - sellerFee) * 100) / 100; // Original price minus seller's 10%
    }
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentCompletedAt: Date,
  
  // 🔧 ENHANCED TRANSACTION REFERENCES
  paymentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  feeTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  buyerFeeTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  adminFeeTransactionId: {
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

// 🔧 NEW: Calculate total platform profit for this order
orderSchema.methods.calculatePlatformProfit = function() {
  const buyerFee = this.buyerMarkupFee || Math.round((this.markedUpPrice - this.price) * 100) / 100;
  const sellerFee = this.sellerPlatformFee || Math.round(this.price * 0.1 * 100) / 100;
  return Math.round((buyerFee + sellerFee) * 100) / 100;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;