// pantypost-backend/models/PasswordReset.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  
  username: {
    type: String,
    required: true
  },
  
  // Store both token and verification code
  token: {
    type: String,
    required: true
  },
  
  // Add verification code field
  verificationCode: {
    type: String,
    required: true,
    length: 6
  },
  
  // Track attempts to prevent brute force
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 900 // 15 minutes for code-based resets
  },
  
  used: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
passwordResetSchema.index({ email: 1, verificationCode: 1 });
passwordResetSchema.index({ token: 1 });

// Generate a 6-digit verification code
passwordResetSchema.statics.generateVerificationCode = function() {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to generate a reset token
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to hash a token
passwordResetSchema.statics.hashToken = function(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// Method to check if code/token is expired
passwordResetSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Method to check if code/token is valid
passwordResetSchema.methods.isValid = function() {
  return !this.used && !this.isExpired() && this.attempts < 5;
};

// Method to increment attempts
passwordResetSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  await this.save();
  return this.attempts >= 5;
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;