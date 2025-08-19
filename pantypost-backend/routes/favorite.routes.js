// pantypost-backend/routes/favorite.routes.js
const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');

// GET /api/favorites - Get user's favorites
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const favorites = await Favorite.getUserFavorites(userId);
    
    // Enrich with current user data
    const enrichedFavorites = await Promise.all(
      favorites.map(async (fav) => {
        const seller = await User.findOne({ username: fav.sellerUsername })
          .select('username profilePic tier isVerified bio rating reviewCount');
        
        return {
          ...fav,
          seller: seller ? {
            username: seller.username,
            profilePic: seller.profilePic,
            tier: seller.tier,
            isVerified: seller.isVerified,
            bio: seller.bio,
            rating: seller.rating,
            reviewCount: seller.reviewCount
          } : null
        };
      })
    );
    
    res.json({
      success: true,
      data: enrichedFavorites.filter(f => f.seller !== null),
      meta: {
        total: enrichedFavorites.length
      }
    });
  } catch (error) {
    console.error('[Favorites] Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to get favorites'
      }
    });
  }
});

// GET /api/favorites/check/:sellerId - Check if seller is favorited
router.get('/check/:sellerId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sellerId } = req.params;
    
    const isFavorited = await Favorite.isFavorited(userId, sellerId);
    
    res.json({
      success: true,
      data: { isFavorited }
    });
  } catch (error) {
    console.error('[Favorites] Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to check favorite status'
      }
    });
  }
});

// POST /api/favorites - Add to favorites
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sellerId, sellerUsername, profilePicture, tier, isVerified } = req.body;
    
    // Validate required fields
    if (!sellerId || !sellerUsername) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Seller ID and username are required'
        }
      });
    }
    
    // Check if user is buyer
    const user = await User.findById(userId);
    if (user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Only buyers can add favorites'
        }
      });
    }
    
    // Check if already favorited
    const existing = await Favorite.findOne({ userId, sellerId });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ALREADY_EXISTS,
          message: 'Seller already in favorites'
        }
      });
    }
    
    // Create favorite
    const favorite = new Favorite({
      userId,
      sellerId,
      sellerUsername,
      metadata: {
        profilePicture,
        tier,
        isVerified
      }
    });
    
    await favorite.save();
    
    // Update user's favorite count
    await User.findByIdAndUpdate(userId, { 
      $inc: { favoriteCount: 1 },
      $push: { favorites: favorite._id }
    });
    
    res.json({
      success: true,
      data: {
        sellerId: favorite.sellerId,
        sellerUsername: favorite.sellerUsername,
        addedAt: favorite.addedAt.toISOString(),
        profilePicture: favorite.metadata.profilePicture,
        tier: favorite.metadata.tier,
        isVerified: favorite.metadata.isVerified
      },
      message: 'Added to favorites'
    });
  } catch (error) {
    console.error('[Favorites] Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to add to favorites'
      }
    });
  }
});

// DELETE /api/favorites/:sellerId - Remove from favorites
router.delete('/:sellerId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sellerId } = req.params;
    
    const favorite = await Favorite.findOneAndDelete({ userId, sellerId });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Favorite not found'
        }
      });
    }
    
    // Update user's favorite count
    await User.findByIdAndUpdate(userId, { 
      $inc: { favoriteCount: -1 },
      $pull: { favorites: favorite._id }
    });
    
    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('[Favorites] Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to remove from favorites'
      }
    });
  }
});

// GET /api/favorites/stats - Get favorites statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const totalFavorites = await Favorite.countDocuments({ userId });
    
    // Get favorites by tier
    const byTier = await Favorite.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$metadata.tier',
        count: { $sum: 1 }
      }}
    ]);
    
    // Get recently added
    const recentlyAdded = await Favorite.find({ userId })
      .sort({ addedAt: -1 })
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      data: {
        total: totalFavorites,
        byTier,
        recentlyAdded
      }
    });
  } catch (error) {
    console.error('[Favorites] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to get favorites statistics'
      }
    });
  }
});

module.exports = router;