// pantypost-backend/models/ReferralCode.js
const mongoose = require('mongoose');

// Create referral code schema
const referralCodeSchema = new mongoose.Schema({
  // The seller who owns this code
  username: {
    type: String,
    required: true,
    unique: true,
    ref: 'User',
    index: true
  },
  
  // The custom code (optional - seller must create one)
  code: {
    type: String,
    sparse: true, // Sparse index allows null values while maintaining uniqueness for non-null values
    unique: true,
    index: true,
    uppercase: true, // Always store in uppercase
    minlength: 3,
    maxlength: 20
  },
  
  // Track usage
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Track clicks/visits
  clickCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Conversion rate tracking
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'inactive' // Changed from 'active' - inactive until they create a code
  },
  
  // Track creation and updates
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Last used date
  lastUsedAt: Date,
  
  // Settings
  settings: {
    allowedDomains: [String], // Future: restrict to certain domains
    expiresAt: Date, // Future: time-limited codes
    maxUses: Number, // Future: limit number of uses
    bonusRate: Number // Future: special commission rates
  }
});

// Pre-save middleware to ensure uppercase
referralCodeSchema.pre('save', async function(next) {
  // Ensure code is uppercase if it exists
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Virtual for getting the referral URL (only if code exists)
referralCodeSchema.virtual('referralUrl').get(function() {
  if (!this.code) return null;
  const baseUrl = process.env.FRONTEND_URL || 'https://pantypost.com';
  return `${baseUrl}/signup/${this.code}`;
});

// Method to track a click
referralCodeSchema.methods.trackClick = async function(metadata = {}) {
  this.clickCount += 1;
  
  // Update conversion rate
  if (this.clickCount > 0) {
    this.conversionRate = Math.round((this.usageCount / this.clickCount) * 10000) / 100;
  }
  
  await this.save();
  
  console.log(`[ReferralCode] Click tracked for code: ${this.code}`, metadata);
};

// Method to track a successful signup
referralCodeSchema.methods.trackSignup = async function(newUsername) {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  
  // Update conversion rate
  if (this.clickCount > 0) {
    this.conversionRate = Math.round((this.usageCount / this.clickCount) * 10000) / 100;
  }
  
  await this.save();
  
  console.log(`[ReferralCode] Signup tracked for code: ${this.code} -> ${newUsername}`);
};

// Static method to validate code format
referralCodeSchema.statics.isValidCodeFormat = function(code) {
  if (!code || typeof code !== 'string') return false;
  
  // Min 3 chars, max 20 chars
  if (code.length < 3 || code.length > 20) return false;
  
  // Only alphanumeric, underscore, and hyphen
  const validPattern = /^[A-Z0-9_-]+$/i;
  return validPattern.test(code);
};

// Static method to check if code is available
referralCodeSchema.statics.isCodeAvailable = async function(code) {
  if (!this.isValidCodeFormat(code)) return false;

  const upperCode = code.toUpperCase();

  // Check if code exists (case-insensitive)
  const existing = await this.findOne({ code: upperCode })
    .collation({ locale: 'en', strength: 2 });

  return !existing;
};

// Static method to find by code
referralCodeSchema.statics.findByCode = async function(code) {
  if (!code) return null;
  
  const upperCode = code.toUpperCase();
  
  return await this.findOne({
    code: upperCode,
    status: 'active'
  });
};

// Static method to get or create placeholder for user (without code)
referralCodeSchema.statics.getOrCreateForUser = async function(username) {
  let referralCode = await this.findOne({ username });
  
  if (!referralCode) {
    // Create entry without a code - user must set one manually
    referralCode = new this({
      username,
      code: null, // No code initially
      status: 'inactive' // Inactive until they create a code
    });
    
    await referralCode.save();
  }
  
  return referralCode;
};

const ReferralCode = mongoose.model('ReferralCode', referralCodeSchema);

module.exports = ReferralCode;