// pantypost-backend/models/ReferralCode.js
const mongoose = require('mongoose');
const crypto = require('crypto');

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
  
  // The custom code (min 3 chars, case-insensitive)
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true, // Always store in uppercase
    minlength: 3,
    maxlength: 20
  },
  
  // Auto-generated code as fallback
  autoCode: {
    type: String,
    required: true,
    unique: true,
    index: true
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
    default: 'active'
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

// Pre-save middleware to ensure uppercase and generate auto code
referralCodeSchema.pre('save', async function(next) {
  // Ensure code is uppercase
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  
  // Generate auto code if not present
  if (!this.autoCode) {
    this.autoCode = await this.constructor.generateUniqueAutoCode();
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Virtual for getting the referral URL
referralCodeSchema.virtual('referralUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'https://pantypost.com';
  return `${baseUrl}/signup/${this.code}`;
});

// Virtual for getting the auto-generated URL
referralCodeSchema.virtual('autoReferralUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'https://pantypost.com';
  return `${baseUrl}/signup/${this.autoCode}`;
});

// Method to track a click
referralCodeSchema.methods.trackClick = async function(metadata = {}) {
  this.clickCount += 1;
  
  // Update conversion rate
  if (this.clickCount > 0) {
    this.conversionRate = Math.round((this.usageCount / this.clickCount) * 10000) / 100;
  }
  
  await this.save();
  
  // Could log analytics here
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
  
  // Check if code exists (both custom and auto codes)
  const existing = await this.findOne({
    $or: [
      { code: upperCode },
      { autoCode: upperCode }
    ]
  });
  
  return !existing;
};

// Static method to generate unique auto code
referralCodeSchema.statics.generateUniqueAutoCode = async function() {
  let code;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    // Generate 8-character alphanumeric code
    code = crypto.randomBytes(4).toString('hex').toUpperCase();
    attempts++;
    
    if (attempts >= maxAttempts) {
      // Fallback to timestamp-based code
      code = 'R' + Date.now().toString(36).toUpperCase();
      break;
    }
  } while (!(await this.isCodeAvailable(code)));
  
  return code;
};

// Static method to find by code (checks both custom and auto)
referralCodeSchema.statics.findByCode = async function(code) {
  if (!code) return null;
  
  const upperCode = code.toUpperCase();
  
  return await this.findOne({
    $or: [
      { code: upperCode },
      { autoCode: upperCode }
    ],
    status: 'active'
  });
};

// Static method to get or create code for user
referralCodeSchema.statics.getOrCreateForUser = async function(username) {
  let referralCode = await this.findOne({ username });
  
  if (!referralCode) {
    // Generate auto code
    const autoCode = await this.generateUniqueAutoCode();
    
    // Try to use first 3 letters of username as custom code
    let customCode = username.substring(0, 3).toUpperCase();
    
    // If too short or not available, use auto code as custom too
    if (customCode.length < 3 || !(await this.isCodeAvailable(customCode))) {
      customCode = autoCode;
    }
    
    referralCode = new this({
      username,
      code: customCode,
      autoCode
    });
    
    await referralCode.save();
  }
  
  return referralCode;
};

const ReferralCode = mongoose.model('ReferralCode', referralCodeSchema);

module.exports = ReferralCode;