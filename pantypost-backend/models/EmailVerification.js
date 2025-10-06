// pantypost-backend/models/EmailVerification.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  
  username: {
    type: String,
    required: true
  },
  
  // Verification token for URL
  token: {
    type: String,
    required: true,
    unique: true
  },
  
  // 6-digit verification code as backup
  verificationCode: {
    type: String,
    required: true,
    length: 6
  },
  
  // Track verification attempts
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  
  // Verification type
  verificationType: {
    type: String,
    enum: ['signup', 'email_change'],
    default: 'signup'
  },
  
  // Expiration - 24 hours for signup verification
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  verifiedAt: {
    type: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster lookups
emailVerificationSchema.index({ email: 1, verificationCode: 1 });
emailVerificationSchema.index({ token: 1 });
emailVerificationSchema.index({ userId: 1 });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate a 6-digit verification code
emailVerificationSchema.statics.generateVerificationCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a secure token for URL
emailVerificationSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Hash a token for secure storage
emailVerificationSchema.statics.hashToken = function(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// Check if verification is expired
emailVerificationSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Check if verification is still valid
emailVerificationSchema.methods.isValid = function() {
  return !this.verified && !this.isExpired() && this.attempts < 5;
};

// Increment failed attempts
emailVerificationSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  await this.save();
  return this.attempts >= 5;
};

// Mark as verified
emailVerificationSchema.methods.markAsVerified = async function() {
  this.verified = true;
  this.verifiedAt = new Date();
  await this.save();
};

// Clean up old verifications for a user
emailVerificationSchema.statics.cleanupOldVerifications = async function(userId) {
  await this.deleteMany({
    userId,
    verified: false,
    expiresAt: { $lt: new Date() }
  });
};

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

module.exports = EmailVerification;