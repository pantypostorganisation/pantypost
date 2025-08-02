// pantypost-backend/models/PasswordReset.js
const mongoose = require('mongoose');
const crypto = require('crypto');

// Create password reset schema
const passwordResetSchema = new mongoose.Schema({
  // The user's email address
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // The username of the user
  username: {
    type: String,
    required: true
  },
  
  // The reset token (we'll store a hashed version for security)
  token: {
    type: String,
    required: true
  },
  
  // When the token expires (1 hour from creation)
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Token expires after 1 hour (3600 seconds)
  },
  
  // Has this token been used?
  used: {
    type: Boolean,
    default: false
  },
  
  // When was it created?
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ email: 1 });

// Static method to generate a reset token
passwordResetSchema.statics.generateToken = function() {
  // Generate a random token
  return crypto.randomBytes(32).toString('hex');
};

// Static method to hash a token (for secure storage)
passwordResetSchema.statics.hashToken = function(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// Method to check if token is expired
passwordResetSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

// Method to check if token is valid (not used and not expired)
passwordResetSchema.methods.isValid = function() {
  return !this.used && !this.isExpired();
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;