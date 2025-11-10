// pantypost-backend/models/CryptoDeposit.js
const mongoose = require('mongoose');

const cryptoDepositSchema = new mongoose.Schema({
  // Unique deposit ID
  depositId: {
    type: String,
    required: true,
    unique: true,
    default: () => `crypto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },

  // User making the deposit
  username: {
    type: String,
    required: true,
    ref: 'User'
  },

  // Amount in USD that user wants to deposit
  amountUSD: {
    type: Number,
    required: true,
    min: 10,
    max: 10000
  },

  // Crypto details
  cryptoCurrency: {
    type: String,
    required: true,
    enum: ['USDT_POLYGON', 'USDC_POLYGON', 'USDT_TRC20', 'USDT_ERC20', 'BTC', 'ETH'],
    default: 'USDT_POLYGON'  // Changed default to cheapest option!
  },

  // Expected amount in crypto (calculated at time of request)
  expectedCryptoAmount: {
    type: Number,
    required: true
  },

  // Our wallet address for this deposit
  walletAddress: {
    type: String,
    required: true
  },

  // Transaction hash (provided by user or found via monitoring)
  txHash: {
    type: String,
    sparse: true, // Allow null but must be unique if provided
    index: true
  },

  // Actual amount received (verified by admin)
  actualCryptoReceived: {
    type: Number
  },

  // Actual USD value credited (after verification)
  actualUSDCredited: {
    type: Number
  },

  // Status tracking
  status: {
    type: String,
    enum: [
      'pending',      // Waiting for payment
      'confirming',   // User claims sent, awaiting admin verification
      'completed',    // Verified and credited
      'expired',      // Expired without payment
      'cancelled',    // Cancelled by user
      'rejected'      // Rejected by admin (wrong amount, wrong address, etc.)
    ],
    default: 'pending'
  },

  // Admin verification
  verifiedBy: {
    type: String,
    ref: 'User'
  },

  verifiedAt: {
    type: Date
  },

  verificationNotes: {
    type: String
  },

  // Rejection details if applicable
  rejectionReason: {
    type: String
  },

  // Exchange rate at time of request (for reference)
  exchangeRate: {
    type: Number
  },

  // QR code data URL for easy scanning
  qrCodeData: {
    type: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Auto-delete after 7 days if still pending
  },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  },

  completedAt: {
    type: Date
  },

  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    network: String,
    blockConfirmations: Number,
    blockExplorerUrl: String
  }
});

// Indexes for efficient queries
cryptoDepositSchema.index({ username: 1, createdAt: -1 });
cryptoDepositSchema.index({ status: 1, createdAt: -1 });
cryptoDepositSchema.index({ txHash: 1 });
cryptoDepositSchema.index({ expiresAt: 1 });

// Auto-expire old pending deposits
cryptoDepositSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending') {
    // Set TTL for pending deposits
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  next();
});

// Method to check if deposit is expired
cryptoDepositSchema.methods.isExpired = function() {
  return this.status === 'pending' && new Date() > this.expiresAt;
};

// Method to mark as confirming (user claims they sent payment)
cryptoDepositSchema.methods.markAsConfirming = async function(txHash) {
  this.status = 'confirming';
  this.txHash = txHash;
  return await this.save();
};

// Method to complete deposit (admin verified)
cryptoDepositSchema.methods.complete = async function(actualAmount, adminUsername, notes) {
  this.status = 'completed';
  this.actualCryptoReceived = actualAmount;
  this.actualUSDCredited = this.amountUSD; // Credit the requested USD amount
  this.verifiedBy = adminUsername;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  this.completedAt = new Date();
  return await this.save();
};

// Method to reject deposit
cryptoDepositSchema.methods.reject = async function(reason, adminUsername) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  this.verifiedBy = adminUsername;
  this.verifiedAt = new Date();
  return await this.save();
};

const CryptoDeposit = mongoose.model('CryptoDeposit', cryptoDepositSchema);

module.exports = CryptoDeposit;