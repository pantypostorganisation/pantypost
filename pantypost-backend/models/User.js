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
  /* 'moderator' reviews the approval queue and nothing else. It exists
     so content review can be delegated without handing over wallets,
     bans, payouts and analytics, which is everything an admin can
     reach. Kept as a distinct role rather than a flag on admin so the
     permission checks stay readable. */
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin', 'moderator'],
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
  isLocationPublic: {
    type: Boolean,
    default: true
  },

  // =====================================================================
  // DELIVERY ADDRESS
  //
  // The buyer's shipping address, stored ON THE BUYER rather than per
  // order. That choice does the work of three requirements at once:
  //
  //  1. Bidding: the address is captured once, after the first bid. Bid
  //     again on the same or another auction and it is already here, so
  //     the buyer is never asked twice.
  //  2. Auction settlement can attach a real address to the winning
  //     order. It previously created them with deliveryAddress:
  //     undefined, so nobody knew where to ship.
  //  3. Checkout prefills, so a repeat buyer confirms rather than retypes.
  //
  // Orders still keep their OWN copy at purchase time (Order.deliveryAddress).
  // That is deliberate: an order must record where it was actually sent,
  // and must not silently change if the buyer later moves house.
  // =====================================================================
  deliveryAddress: {
    fullName: { type: String, maxlength: 100, trim: true },
    addressLine1: { type: String, maxlength: 200, trim: true },
    addressLine2: { type: String, maxlength: 200, trim: true },
    city: { type: String, maxlength: 100, trim: true },
    state: { type: String, maxlength: 100, trim: true },
    postalCode: { type: String, maxlength: 20, trim: true },
    country: { type: String, maxlength: 56, trim: true },
    updatedAt: { type: Date }
  },
  profilePic: {
    // Was `https://via.placeholder.com/150`. That service is dead, so every
    // account that never uploaded a picture held a URL that resolves to a
    // broken image — which is what buyers appeared as in chat.
    //
    // null means "no picture"; the client renders an initial-based avatar
    // instead. Existing rows still holding the dead URL are cleaned up by
    // scripts/clear-dead-placeholder-avatars.js, and the client also treats
    // any via.placeholder.com URL as absent.
    type: String,
    default: null
  },

  // =====================================================
  // COVER PHOTO
  //
  // Banner image on the seller profile. Like profile pictures and
  // gallery images, the live field holds only APPROVED media — a new
  // upload lands in pendingCoverPhoto until an administrator reviews
  // it. Exempting a large, prominent public image from review would be
  // an odd hole in the moderation policy.
  // =====================================================
  coverPhoto: {
    type: String,
    default: null
  },

  pendingCoverPhoto: {
    url: String,
    submittedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'denied'],
      default: 'pending'
    },
    deniedAt: Date,
    deniedBy: String,
    denialReason: String
  },

  // =====================================================
  // PRE-PUBLICATION REVIEW FOR PROFILE MEDIA
  //
  // profilePic and galleryImages above hold APPROVED media only —
  // whatever the public sees. Newly uploaded images land in the
  // pending fields below and only move across once an admin approves
  // them.
  //
  // Keeping the live fields as plain strings means nothing that reads
  // them needs to change; the moderation layer sits alongside rather
  // than replacing the existing shape.
  // =====================================================
  pendingProfilePic: {
    url: String,
    submittedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'denied'],
      default: 'pending'
    },
    deniedAt: Date,
    deniedBy: String,
    denialReason: String
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

  // Gallery images awaiting review. Approved images are moved into
  // galleryImages above and removed from here, so this array only ever
  // holds items that are pending or were denied.
  pendingGalleryImages: [{
    url: {
      type: String,
      maxlength: 500
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'denied'],
      default: 'pending'
    },
    deniedAt: Date,
    deniedBy: String,
    denialReason: String
  }],
  
  // =====================================================
  // AGE ASSURANCE
  //
  // Established by an independent provider, because regulators do not
  // accept self-declaration. We store only the verdict — never the
  // document, the selfie, the name or the date of birth. Those stay
  // with the provider, so there is nothing here to leak.
  // =====================================================
  ageVerification: {
    status: {
      type: String,
      enum: ['not_started', 'pending', 'approved', 'declined', 'in_review', 'abandoned', 'expired'],
      default: 'not_started',
      index: true
    },
    provider: String,
    sessionId: String,
    // 'age_estimation' when the selfie was sufficient, 'document' when
    // the borderline fallback fired.
    method: String,
    // Rounded to a whole year. Coarse on purpose.
    estimatedAge: Number,
    verifiedAge: Number,
    warnings: [String],
    startedAt: Date,
    verifiedAt: Date,
    lastAttemptAt: Date,
    updatedAt: Date,
    attempts: {
      type: Number,
      default: 0
    }
  },

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
  
  // REFERRAL FIELDS (NEW)
  referredBy: {
    type: String,
    ref: 'User'
  },
  referralCode: {
    type: String
  },
  referredAt: {
    type: Date
  },
  referralEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  referralCount: {
    type: Number,
    default: 0,
    min: 0
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
userSchema.index({ referredBy: 1 }); // NEW: Index for referral queries
// Supports the admin moderation queue, which looks for users holding
// media awaiting review.
userSchema.index({ 'pendingProfilePic.status': 1 });
userSchema.index({ 'pendingCoverPhoto.status': 1 });
userSchema.index({ 'pendingGalleryImages.status': 1 });

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
  // Unreviewed media must not leak through generic serialisation.
  // Endpoints that legitimately need it (the owner's own profile, the
  // admin moderation queue) add it back explicitly.
  delete user.pendingProfilePic;
  delete user.pendingGalleryImages;
  delete user.pendingCoverPhoto;
  return user;
};

// Override toJSON to exclude sensitive fields
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationData;
  delete user.storage; // Don't expose storage in API responses
  delete user.storageUpdatedAt;
  // Fail closed: pending media is stripped from every response by
  // default, and only re-added where the viewer is entitled to see it.
  delete user.pendingProfilePic;
  delete user.pendingGalleryImages;
  delete user.pendingCoverPhoto;
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

// =====================================================
// PROFILE MEDIA MODERATION HELPERS
// =====================================================

/**
 * Queue a new profile picture for review.
 * The live profilePic is left untouched until an admin approves.
 */
userSchema.methods.submitCoverPhotoForReview = function(url) {
  this.pendingCoverPhoto = {
    url,
    submittedAt: new Date(),
    status: 'pending',
    deniedAt: undefined,
    deniedBy: undefined,
    denialReason: undefined
  };
  return this;
};

/** Owner view: their pending cover if one is queued, else the live one. */
userSchema.methods.getOwnCoverPhoto = function() {
  if (this.pendingCoverPhoto?.url && this.pendingCoverPhoto.status === 'pending') {
    return this.pendingCoverPhoto.url;
  }
  return this.coverPhoto;
};

userSchema.methods.submitProfilePicForReview = function(url) {
  this.pendingProfilePic = {
    url,
    submittedAt: new Date(),
    status: 'pending',
    deniedAt: undefined,
    deniedBy: undefined,
    denialReason: undefined
  };
  return this;
};

/**
 * Queue one or more gallery images for review.
 * Returns the pending entries that were added.
 */
userSchema.methods.submitGalleryImagesForReview = function(urls) {
  if (!Array.isArray(this.pendingGalleryImages)) {
    this.pendingGalleryImages = [];
  }

  const added = [];
  for (const url of urls) {
    const entry = { url, submittedAt: new Date(), status: 'pending' };
    this.pendingGalleryImages.push(entry);
    added.push(this.pendingGalleryImages[this.pendingGalleryImages.length - 1]);
  }
  return added;
};

/**
 * What the owner themselves should see: their pending image if one is
 * awaiting review, otherwise the approved one. Prevents the confusing
 * experience of uploading a picture and seeing no change at all.
 */
/** Whether this user has passed age assurance. */
userSchema.methods.isAgeVerified = function() {
  return this.ageVerification?.status === 'approved';
};

userSchema.methods.getOwnProfilePic = function() {
  if (this.pendingProfilePic?.url && this.pendingProfilePic.status === 'pending') {
    return this.pendingProfilePic.url;
  }
  return this.profilePic;
};

// Mark email as verified (NEW)
userSchema.methods.markEmailAsVerified = async function() {
  this.emailVerified = true;
  this.emailVerifiedAt = new Date();
  return this.save();
};

// Create the model
/**
 * True when the stored address is complete by the platform's own
 * definition -- the same field set AddressConfirmationModal validates and
 * PUT /api/orders/:id/address requires. Line 2 is the only optional part.
 */
userSchema.methods.hasDeliveryAddress = function () {
  const a = this.deliveryAddress;
  return Boolean(
    a && a.fullName && a.addressLine1 && a.city && a.state && a.postalCode && a.country
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;

