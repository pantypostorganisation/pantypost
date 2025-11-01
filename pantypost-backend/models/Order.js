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
      // For auctions, no markup
      if (this.wasAuction) {
        return this.price;
      }
      // For regular listings, 10% markup
      return Math.round(this.price * 1.1 * 100) / 100;
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
  
  // Delivery info - FIXED: Made deliveryAddress optional at root level
  deliveryAddress: {
    type: {
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
      },
      specialInstructions: String
    },
    required: false, // FIXED: Made optional so orders can be created without address initially
    default: undefined // FIXED: Explicitly set to undefined when not provided
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
  
  // TIER INFORMATION - THIS IS THE CRITICAL MISSING FIELD
  sellerTier: {
    type: String,
    enum: ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess', null],
    default: function() {
      // Auctions don't use tiers
      if (this.wasAuction) {
        return null;
      }
      return 'Tease';
    }
  },
  
  // 🔧 ENHANCED FINANCIAL FIELDS FOR DOUBLE 10% FEE MODEL (Regular) or 20% SELLER FEE (Auctions)
  tierCreditAmount: {
    type: Number,
    default: function() {
      // No tier credits for auctions
      if (this.wasAuction) {
        return 0;
      }
      return 0;
    }
  },
  
  // Platform fee breakdown - UPDATED FOR NEW AUCTION MODEL
  platformFee: {
    type: Number,
    default: function() {
      if (this.wasAuction) {
        // Auctions: 20% from seller only
        return Math.round(this.price * 0.2 * 100) / 100;
      }
      // Regular: 20% total (10% from buyer + 10% from seller)
      return Math.round(this.price * 0.2 * 100) / 100;
    }
  },
  
  // 🔧 NEW: Individual fee components
  buyerMarkupFee: {
    type: Number,
    default: function() {
      if (this.wasAuction) {
        // No buyer fee for auctions
        return 0;
      }
      // Regular listings: 10% buyer markup
      if (this.markedUpPrice && this.price) {
        return Math.round((this.markedUpPrice - this.price) * 100) / 100;
      }
      return Math.round(this.price * 0.1 * 100) / 100;
    }
  },
  
  sellerPlatformFee: {
    type: Number,
    default: function() {
      if (this.wasAuction) {
        // Auctions: 20% from seller
        return Math.round(this.price * 0.2 * 100) / 100;
      }
      // Regular: 10% from seller
      return Math.round(this.price * 0.1 * 100) / 100;
    }
  },
  
  sellerEarnings: {
    type: Number,
    default: function() {
      // Check if there's a referral commission
      if (this.referralCommission && this.referralCommission > 0) {
        // Seller gets base amount minus platform fee minus referral commission
        if (this.wasAuction) {
          const sellerFee = Math.round(this.price * 0.2 * 100) / 100;
          const baseEarnings = Math.round((this.price - sellerFee) * 100) / 100;
          return Math.round((baseEarnings - this.referralCommission) * 100) / 100;
        }
        // Regular: 90% to seller minus referral commission
        const sellerFee = Math.round(this.price * 0.1 * 100) / 100;
        const baseEarnings = Math.round((this.price - sellerFee) * 100) / 100;
        return Math.round((baseEarnings - this.referralCommission) * 100) / 100;
      }
      
      // Original calculation if no referral
      if (this.wasAuction) {
        // Auctions: 80% to seller (after 20% fee)
        const sellerFee = Math.round(this.price * 0.2 * 100) / 100;
        return Math.round((this.price - sellerFee) * 100) / 100;
      }
      // Regular: 90% to seller (after 10% fee)
      const sellerFee = Math.round(this.price * 0.1 * 100) / 100;
      return Math.round((this.price - sellerFee) * 100) / 100;
    }
  },
  
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentCompletedAt: Date,
  
  // Custom request fields
  isCustomRequest: {
    type: Boolean,
    default: false
  },
  originalRequestId: String,
  
  // REFERRAL FIELDS
  referralCommission: {
    type: Number,
    default: 0,
    min: 0
  },
  referrer: {
    type: String,
    ref: 'User'
  },
  adjustedSellerEarnings: {
    type: Number,
    min: 0
  },
  
  // 🔧 ENHANCED TRANSACTION REFERENCES
  paymentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  feeTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  tierCreditTransactionId: {
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
orderSchema.index({ sellerTier: 1 });
orderSchema.index({ wasAuction: 1 });

// Virtual to check if address is complete
orderSchema.virtual('hasCompleteAddress').get(function() {
  return !!(
    this.deliveryAddress &&
    this.deliveryAddress.fullName &&
    this.deliveryAddress.addressLine1 &&
    this.deliveryAddress.city &&
    this.deliveryAddress.state &&
    this.deliveryAddress.postalCode &&
    this.deliveryAddress.country
  );
});

// Calculate tier credit (difference between marked up price and original price)
orderSchema.methods.calculateTierCredit = function() {
  // No tier credits for auctions
  if (this.wasAuction) {
    return 0;
  }
  if (this.tierCreditAmount) {
    return this.tierCreditAmount;
  }
  return 0;
};

// 🔧 NEW: Calculate total platform profit for this order
orderSchema.methods.calculatePlatformProfit = function() {
  if (this.wasAuction) {
    // Auctions: 20% from seller only
    return Math.round(this.price * 0.2 * 100) / 100;
  }
  
  // Regular: buyer fee + seller fee - tier credits
  const buyerFee = this.buyerMarkupFee || Math.round((this.markedUpPrice - this.price) * 100) / 100;
  const sellerFee = this.sellerPlatformFee || Math.round(this.price * 0.1 * 100) / 100;
  const tierCredit = this.tierCreditAmount || 0;
  
  // Platform profit is fees minus tier credits paid out
  return Math.round((buyerFee + sellerFee - tierCredit) * 100) / 100;
};

// Helper method to determine if tier should apply
orderSchema.methods.shouldApplyTier = function() {
  // Auctions don't use tier system
  return !this.wasAuction;
};

// Method to check if address can be updated
orderSchema.methods.canUpdateAddress = function() {
  // Can't update address if order is already shipped or delivered
  return this.shippingStatus !== 'shipped' && this.shippingStatus !== 'delivered';
};

// Method to safely update address
orderSchema.methods.updateAddress = function(newAddress) {
  if (!this.canUpdateAddress()) {
    throw new Error('Cannot update address for shipped or delivered orders');
  }
  
  this.deliveryAddress = {
    fullName: newAddress.fullName,
    addressLine1: newAddress.addressLine1,
    addressLine2: newAddress.addressLine2 || undefined,
    city: newAddress.city,
    state: newAddress.state,
    postalCode: newAddress.postalCode,
    country: newAddress.country || 'US',
    specialInstructions: newAddress.specialInstructions || undefined
  };
  
  return this.deliveryAddress;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;