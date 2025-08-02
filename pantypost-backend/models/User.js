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
  
  // PROFILE FIELDS
  bio: {
    type: String,
    maxlength: 500,
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
    enum: ['Tease', 'Tempt', 'Indulge', 'Crave'],
    default: 'Tease'
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
  
  // TIMESTAMPS
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
});

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

// Method to get safe user data (without password)
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationData; // Don't send verification data to frontend
  return user;
};

// Update lastActive timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Create the model
const User = mongoose.model('User', userSchema);

module.exports = User;