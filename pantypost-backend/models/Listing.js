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
  verifiedSeller: {
    type: Boolean,
    default: false
  },

  // =====================================================
  // THIRD-PARTY CONSENT ATTESTATION
  //
  // Recorded per listing rather than relying on a blanket clause in the
  // Terms. A timestamped attestation against a specific listing is
  // evidence; a term nobody re-reads is only a statement.
  //
  // Required by card scheme and payment processor rules covering
  // user-generated content depicting third parties.
  // =====================================================
  consentAttestation: {
    // True when the seller confirms nobody other than themselves
    // appears in the content.
    noThirdPartyDepicted: {
      type: Boolean,
      default: false
    },
    // True when the seller confirms they hold identity, age and written
    // consent records for every person depicted.
    holdsConsentRecords: {
      type: Boolean,
      default: false
    },
    attestedAt: Date,
    attestedBy: String
  },

  requiresApproval: {
    type: Boolean,
    // Fails closed: new listings require review unless explicitly approved.
    default: true
  },

  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    // Previously defaulted to 'approved', which meant any listing created
    // outside the main POST route went live without ever being reviewed.
    default: 'pending',
    index: true
  },

  approvedAt: Date,
  approvedBy: String,
  deniedAt: Date,
  deniedBy: String,
  denialReason: String,
  moderationNote: String,
  
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
    // âœ… FIXED: Added 'deleted' to allow soft deletes
    enum: ['active', 'sold', 'expired', 'cancelled', 'deleted'],
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
  
  // =====================================================
  // DROP FIELDS
  //
  // A "drop" is one moderated listing sold as N numbered units — the
  // creator-drop mechanic (e.g. 500 pairs worn on camera during a
  // filmed drop day). One listing means ONE pass through the
  // moderation queue regardless of unit count; the alternative (N
  // listings) would either bury the admin queue or invite an
  // auto-approve bypass, and the moderation pipeline is what makes
  // this platform approvable by a payment processor.
  //
  // Inventory truth lives in unitsRemaining and is only ever moved by
  // the atomic $inc claim in POST /api/orders/drop. Do not mutate it
  // from anywhere else.
  // =====================================================
  drop: {
    isDrop: {
      type: Boolean,
      default: false
    },
    totalUnits: {
      type: Number,
      min: 2,
      max: 2000
    },
    unitsRemaining: {
      type: Number,
      min: 0
    },
    unitsSold: {
      type: Number,
      default: 0
    },
    // Optional countdown: purchases are refused until this time.
    scheduledFor: Date,
    // Provenance framing: units are put on during the filmed drop, and
    // listings must say so. Selling drop units under the implied
    // meaning "worn" is the chargeback pattern that kills adult
    // merchant accounts.
    wornOnCamera: {
      type: Boolean,
      default: true
    }
  },

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
    /* Optional instant-purchase price. Bids are capped BELOW this
       value (see the bid route), so buy-now and bidding can never
       collide: there is no winning bidder to refund, because nobody
       could ever have bid this high. A buy-now sale settles at the
       direct-sale rate (90% to the seller), not the auction rate --
       it is a fixed-price purchase that happens to sit on an auction
       listing. */
    buyNowPrice: {
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
// Supports the public browse query, which now always filters on
// approvalStatus before anything else.
listingSchema.index({ approvalStatus: 1, status: 1, createdAt: -1 });
listingSchema.index({ 'drop.isDrop': 1, status: 1, approvalStatus: 1 });

// =====================================================
// DROP IMMUTABILITY GUARD
//
// Generic update paths (the edit controller uses findOneAndUpdate)
// must never be able to rewrite a drop's identity or size: changing
// totalUnits after sales corrupts every buyer's "unit #X of N", and
// replacing the whole `drop` object would clobber the live counters.
// The claim endpoint moves inventory exclusively via $inc, which this
// guard deliberately leaves untouched.
// =====================================================
listingSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  const strip = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    delete obj['drop.isDrop'];
    delete obj['drop.totalUnits'];
    delete obj.drop;
  };
  strip(update.$set);
  strip(update);
  next();
});

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

