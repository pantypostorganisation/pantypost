// pantypost-backend/models/Ban.js
const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true
  },
  bannedBy: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  customReason: {
    type: String
  },
  duration: {
    type: Number, // hours, null for permanent
    default: null
  },
  isPermanent: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxLength: 1000
  },
  relatedReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  appealSubmitted: {
    type: Boolean,
    default: false
  },
  appealText: {
    type: String,
    maxLength: 1000
  },
  appealDate: {
    type: Date
  },
  appealStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null
  },
  appealReviewedBy: {
    type: String
  },
  appealReviewDate: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  tier: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
banSchema.index({ username: 1, active: 1 });
banSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
banSchema.index({ createdAt: -1 });

// Instance methods
banSchema.methods.lift = async function(liftedBy, reason) {
  this.active = false;
  this.liftedBy = liftedBy;
  this.liftReason = reason;
  this.liftedAt = new Date();
  return this.save();
};

banSchema.methods.submitAppeal = async function(appealText) {
  this.appealSubmitted = true;
  this.appealText = appealText;
  this.appealDate = new Date();
  this.appealStatus = 'pending';
  return this.save();
};

banSchema.methods.reviewAppeal = async function(status, reviewedBy, reviewNotes) {
  this.appealStatus = status;
  this.appealReviewedBy = reviewedBy;
  this.appealReviewDate = new Date();
  this.appealReviewNotes = reviewNotes;
  
  if (status === 'approved') {
    this.active = false;
    this.liftedBy = reviewedBy;
    this.liftReason = 'Appeal approved';
    this.liftedAt = new Date();
  }
  
  return this.save();
};

// Static methods
banSchema.statics.createBan = async function(banData) {
  // Calculate expiry
  if (!banData.isPermanent && banData.duration) {
    banData.expiresAt = new Date(Date.now() + banData.duration * 60 * 60 * 1000);
  }
  
  return this.create(banData);
};

banSchema.statics.getActiveBans = async function() {
  return this.find({
    active: true,
    $or: [
      { isPermanent: true },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

banSchema.statics.checkAndExpireBans = async function() {
  const expiredBans = await this.find({
    active: true,
    isPermanent: false,
    expiresAt: { $lte: new Date() }
  });

  for (const ban of expiredBans) {
    ban.active = false;
    ban.expiredAt = new Date();
    await ban.save();
    
    // Update user
    const User = require('./User');
    await User.findOneAndUpdate(
      { username: ban.username },
      { 
        isBanned: false,
        banReason: null,
        banExpiry: null,
        bannedBy: null
      }
    );
  }
  
  return expiredBans.length;
};

banSchema.statics.getBanStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        totalActive: [
          { $match: { active: true } },
          { $count: 'count' }
        ],
        permanent: [
          { $match: { active: true, isPermanent: true } },
          { $count: 'count' }
        ],
        temporary: [
          { $match: { active: true, isPermanent: false } },
          { $count: 'count' }
        ],
        pendingAppeals: [
          { $match: { active: true, appealStatus: 'pending' } },
          { $count: 'count' }
        ],
        last24h: [
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ]);

  return {
    totalActiveBans: stats[0].totalActive[0]?.count || 0,
    permanentBans: stats[0].permanent[0]?.count || 0,
    temporaryBans: stats[0].temporary[0]?.count || 0,
    pendingAppeals: stats[0].pendingAppeals[0]?.count || 0,
    bansLast24h: stats[0].last24h[0]?.count || 0
  };
};

const Ban = mongoose.model('Ban', banSchema);

module.exports = Ban;