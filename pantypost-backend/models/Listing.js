// pantypost-backend/models/Listing.js
const mongoose = require('mongoose');

// Create listing schema
const listingSchema = new mongoose.Schema({
  // Basic listing info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Pricing
  price: {
    type: Number,
    required: function() {
      // Price is required only if it's not an auction
      return !this.auction || !this.auction.isAuction;
    },
    min: 0
  },
  markedUpPrice: {
    type: Number,
    default: function() {
      if (this.price) {
        return Math.round(this.price * 1.1 * 100) / 100; // 10% markup
      }
      return 0;
    }
  },
  
  // Images
  imageUrls: [{
    type: String,
    required: true
  }],
  
  // Seller info
  seller: {
    type: String,
    required: true,
    ref: 'User'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Listing details
  tags: [{
    type: String,
    lowercase: true,
    trim: true,
    maxlength: 20
  }],
  hoursWorn: {
    type: Number,
    min: 0,
    max: 168 // Max 1 week
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // Listing status
  status: {
    type: String,
    enum: ['active', 'sold', 'expired', 'cancelled'],
    default: 'active'
  },
  
  // Stats
  views: {
    type: Number,
    default: 0
  },
  
  // Dates
  createdAt: {
    type: Date,
    default: Date.now
  },
  soldAt: Date,
  soldTo: String,
  soldPrice: Number,
  
  // AUCTION FIELDS
  auction: {
    isAuction: {
      type: Boolean,
      default: false
    },
    startingPrice: {
      type: Number,
      min: 0,
      required: function() {
        return this.auction && this.auction.isAuction;
      }
    },
    reservePrice: {
      type: Number,
      min: 0
    },
    currentBid: {
      type: Number,
      default: 0
    },
    highestBid: {  // CRITICAL: Add this field to store the highest bid
      type: Number,
      default: 0
    },
    bidIncrement: {
      type: Number,
      default: 1, // Always use whole dollars
      min: 1      // No decimals allowed
    },
    highestBidder: {
      type: String,
      ref: 'User'
    },
    endTime: {
      type: Date,
      required: function() {
        return this.auction && this.auction.isAuction;
      }
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'cancelled', 'reserve_not_met', 'processing', 'error'],
      default: 'active'
    },
    bidCount: {
      type: Number,
      default: 0
    },
    // Array to track all bids
    bids: [{
      bidder: {
        type: String,
        required: true,
        ref: 'User'
      },
      amount: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  }
});

// Indexes for better performance
listingSchema.index({ seller: 1, status: 1 });
listingSchema.index({ tags: 1 });
listingSchema.index({ 'auction.endTime': 1, 'auction.status': 1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ 'auction.isAuction': 1, 'auction.status': 1 });

// Virtual to check if auction is still active
listingSchema.virtual('auction.isActive').get(function() {
  if (!this.auction || !this.auction.isAuction) return false;
  return this.auction.status === 'active' && new Date() < this.auction.endTime;
});

// Virtual to check if reserve price is met
listingSchema.virtual('auction.reserveMet').get(function() {
  if (!this.auction || !this.auction.reservePrice) return true;
  return (this.auction.highestBid || this.auction.currentBid) >= this.auction.reservePrice;
});

// Method to place a bid
listingSchema.methods.placeBid = async function(bidder, amount) {
  // Ensure amount is an integer
  amount = Math.floor(amount);
  
  // Validate auction is active
  if (!this.auction.isActive) {
    throw new Error('Auction is not active');
  }
  
  // Calculate minimum bid with integer math
  const currentBid = Math.floor(this.auction.highestBid || this.auction.currentBid || 0);
  const increment = Math.floor(this.auction.bidIncrement || 1);
  const startingPrice = Math.floor(this.auction.startingPrice || 0);
  
  const minimumBid = currentBid > 0 
    ? currentBid + increment
    : startingPrice;
    
  if (amount < minimumBid) {
    throw new Error(`Bid must be at least $${minimumBid}`);
  }
  
  // Can't bid on own auction
  if (bidder === this.seller) {
    throw new Error('Cannot bid on your own auction');
  }
  
  // Update auction with integer values - UPDATE BOTH FIELDS
  this.auction.currentBid = amount;
  this.auction.highestBid = amount;  // CRITICAL: Always update highestBid too
  this.auction.highestBidder = bidder;
  this.auction.bidCount += 1;
  
  // Add to bids array
  this.auction.bids.push({
    bidder: bidder,
    amount: amount,
    date: new Date()
  });
  
  // Save changes
  await this.save();
  
  return this;
};

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;