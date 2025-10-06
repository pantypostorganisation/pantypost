// pantypost-backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Create a schema (like a blueprint for users)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  
  // EMAIL VERIFICATION FIELDS (NEW)
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: {
    type: Date,
    default: null
  },
  
  // PROFILE FIELDS
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  country: {
    type: String,
    maxlength: 56,
    default: ''
  },
  profilePic: {
    type: String,
    default: 'https://via.placeholder.com/150' // Default avatar
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  
  // SELLER-SPECIFIC FIELDS
  tier: {
    type: String,
    enum: ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess', 'Tempt', 'Indulge', 'Crave'], // Include old names for compatibility
    default: 'Tease',
    get: function(value) {
      // Automatically convert old tier names to new ones when reading
      const tierMapping = {
        'Tempt': 'Flirt',
        'Indulge': 'Obsession',
        'Crave': 'Desire'
      };
      return tierMapping[value] || value;
    },
    set: function(value) {
      // Automatically convert old tier names to new ones when setting
      const tierMapping = {
        'Tempt': 'Flirt',
        'Indulge': 'Obsession',
        'Crave': 'Desire'
      };
      return tierMapping[value] || value;
    }
  },
  subscriptionPrice: {
    type: Number,
    default: 9.99,
    min: 0.01,
    max: 999.99
  },
  galleryImages: [{
    type: String,
    maxlength: 500
  }],
  
  // VERIFICATION
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationData: {
    codePhoto: String,
    idFront: String,
    idBack: String,
    code: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: String,
    rejectionReason: String
  },
  
  // STATS
  subscriberCount: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // REPORT FIELDS (NEW)
  reportCount: {
    type: Number,
    default: 0
  },
  lastReportedAt: {
    type: Date,
    default: null
  },
  
  // FAVORITES FIELDS
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Favorite'
  }],
  favoriteCount: {
    type: Number,
    default: 0
  },
  
  // STORAGE FIELDS FOR BACKEND STORAGE SERVICE (NEW)
  storage: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  uiPreferences: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  storageUpdatedAt: {
    type: Date,
    default: Date.now
  },
  
  // SETTINGS
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: false
    },
    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    }
  },
  
  // BAN STATUS
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banExpiry: Date,
  bannedBy: String,
  
  // ACTIVITY TRACKING
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // TIMESTAMPS
  createdAt: {
    type: Date,
    default: Date.now
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
});

// Enable getters for tier field
userSchema.set('toObject', { getters: true });
userSchema.set('toJSON', { getters: true });

// Add indexes for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ 'storage': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get safe user data (without password and storage)
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationData; // Don't send verification data to frontend
  delete user.storage; // Don't send storage data to frontend
  delete user.storageUpdatedAt;
  return user;
};

// Override toJSON to exclude sensitive fields
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationData;
  delete user.storage; // Don't expose storage in API responses
  delete user.storageUpdatedAt;
  return user;
};

// Update lastActive timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  this.isOnline = true;
  return this.save();
};

// Set user offline
userSchema.methods.setOffline = function() {
  this.isOnline = false;
  this.lastActive = new Date();
  return this.save();
};

// Check if email is verified (NEW)
userSchema.methods.isEmailVerified = function() {
  return this.emailVerified === true;
};

// Mark email as verified (NEW)
userSchema.methods.markEmailAsVerified = async function() {
  this.emailVerified = true;
  this.emailVerifiedAt = new Date();
  return this.save();
};

// Create the model
const User = mongoose.model('User', userSchema);

module.exports = User;