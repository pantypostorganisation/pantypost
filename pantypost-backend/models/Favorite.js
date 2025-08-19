// pantypost-backend/models/Favorite.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  sellerUsername: {
    type: String,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    profilePicture: String,
    tier: String,
    isVerified: Boolean
  }
});

// Compound index for uniqueness
favoriteSchema.index({ userId: 1, sellerId: 1 }, { unique: true });

// Method to get user's favorites
favoriteSchema.statics.getUserFavorites = async function(userId) {
  return this.find({ userId })
    .sort({ addedAt: -1 })
    .lean();
};

// Method to check if favorited
favoriteSchema.statics.isFavorited = async function(userId, sellerId) {
  const favorite = await this.findOne({ userId, sellerId });
  return !!favorite;
};

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;