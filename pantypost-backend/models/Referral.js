// pantypost-backend/models/Referral.js
const mongoose = require('mongoose');

// Create referral schema
const referralSchema = new mongoose.Schema({
  // The seller who is doing the referring (gets commission)
  referrer: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // The seller who was referred (signed up with code)
  referredSeller: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // The custom referral code used
  referralCode: {
    type: String,
    required: true,
    index: true
  },
  
  // Track lifetime earnings
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Track number of sales
  totalSales: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Commission rate (5% by default, but configurable for future)
  commissionRate: {
    type: Number,
    default: 0.05, // 5%
    min: 0,
    max: 1
  },
  
  // Status of the referral relationship
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Track when the referral was made
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Track last commission earned
  lastEarningDate: {
    type: Date
  },
  
  // Email of referred user at time of signup (for tracking)
  referredEmail: {
    type: String
  },
  
  // IP address at time of signup (for fraud detection)
  signupIp: {
    type: String
  },
  
  // Metadata for analytics
  metadata: {
    signupSource: String, // 'direct_link', 'code_entry', etc.
    landingPage: String,
    userAgent: String,
    campaign: String
  }
});

// Indexes for better query performance
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referredSeller: 1, status: 1 });
referralSchema.index({ referralCode: 1, status: 1 });
referralSchema.index({ createdAt: -1 });
referralSchema.index({ referrer: 1, createdAt: -1 });

// Virtual to check if referral is active
referralSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Method to calculate commission for an order
referralSchema.methods.calculateCommission = function(orderAmount) {
  if (!this.isActive) return 0;
  return Math.round(orderAmount * this.commissionRate * 100) / 100;
};

// Method to record a commission earned
referralSchema.methods.recordCommission = async function(amount, orderId) {
  this.totalEarnings = Math.round((this.totalEarnings + amount) * 100) / 100;
  this.totalSales += 1;
  this.lastEarningDate = new Date();
  
  await this.save();
  
  // Create a commission record for tracking
  const ReferralCommission = mongoose.model('ReferralCommission');
  const commission = new ReferralCommission({
    referralId: this._id,
    referrer: this.referrer,
    referredSeller: this.referredSeller,
    orderId: orderId,
    commissionAmount: amount,
    commissionRate: this.commissionRate,
    status: 'earned'
  });
  
  await commission.save();
  
  return commission;
};

// Static method to find active referral for a seller
referralSchema.statics.findActiveReferral = async function(sellerUsername) {
  return await this.findOne({
    referredSeller: sellerUsername,
    status: 'active'
  });
};

// Static method to get referral stats for a referrer
referralSchema.statics.getReferrerStats = async function(referrerUsername) {
  const referrals = await this.find({
    referrer: referrerUsername,
    status: 'active'
  });
  
  const stats = {
    totalReferrals: referrals.length,
    totalEarnings: 0,
    totalSales: 0,
    activeReferrals: []
  };
  
  for (const referral of referrals) {
    stats.totalEarnings += referral.totalEarnings;
    stats.totalSales += referral.totalSales;
    stats.activeReferrals.push({
      username: referral.referredSeller,
      earnings: referral.totalEarnings,
      sales: referral.totalSales,
      joinedDate: referral.createdAt
    });
  }
  
  stats.totalEarnings = Math.round(stats.totalEarnings * 100) / 100;
  
  return stats;
};

const Referral = mongoose.model('Referral', referralSchema);

// ==================== REFERRAL COMMISSION SCHEMA ====================

const referralCommissionSchema = new mongoose.Schema({
  // Reference to the referral relationship
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    required: true,
    index: true
  },
  
  // The referrer who earned the commission
  referrer: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // The seller who made the sale
  referredSeller: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  
  // The order that generated this commission
  orderId: {
    type: String,
    required: true,
    index: true
  },
  
  // Commission details
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  commissionRate: {
    type: Number,
    required: true
  },
  
  // Original order amount (for reference)
  orderAmount: {
    type: Number
  },
  
  // Status of the commission
  status: {
    type: String,
    enum: ['earned', 'paid', 'pending', 'cancelled'],
    default: 'earned'
  },
  
  // Payment tracking
  paidAt: Date,
  paymentMethod: String,
  paymentReference: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for commission tracking
referralCommissionSchema.index({ referrer: 1, createdAt: -1 });
referralCommissionSchema.index({ referrer: 1, status: 1 });
referralCommissionSchema.index({ referredSeller: 1, createdAt: -1 });

const ReferralCommission = mongoose.model('ReferralCommission', referralCommissionSchema);

module.exports = {
  Referral,
  ReferralCommission
};