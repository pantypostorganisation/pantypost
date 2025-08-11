// pantypost-backend/routes/tier.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const TIER_CONFIG = require('../config/tierConfig');
const tierService = require('../services/tierService');
const { ERROR_CODES } = require('../utils/constants');

// GET /api/tiers/config - Get public tier configuration
router.get('/config', (req, res) => {
  try {
    const publicConfig = TIER_CONFIG.getPublicConfig();
    
    res.json({
      success: true,
      data: publicConfig
    });
  } catch (error) {
    console.error('[Tiers] Error fetching config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch tier configuration'
      }
    });
  }
});

// GET /api/tiers/progress - Get current user's tier progress
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    // Only sellers can check their tier progress
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Only sellers can view tier progress'
        }
      });
    }
    
    const progress = await tierService.getTierProgress(req.user.username);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('[Tiers] Error fetching progress:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch tier progress'
      }
    });
  }
});

// POST /api/tiers/recalculate/:username - Manually recalculate tier (admin only)
router.post('/recalculate/:username', authMiddleware, async (req, res) => {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }
    
    const { username } = req.params;
    const result = await tierService.updateSellerTier(username);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Tiers] Error recalculating tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to recalculate tier'
      }
    });
  }
});

// GET /api/tiers/stats/:username - Get seller stats (public)
router.get('/stats/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const stats = await tierService.calculateSellerStats(username);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Tiers] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch seller stats'
      }
    });
  }
});

// GET /api/tiers/leaderboard - Get top sellers by tier (public)
router.get('/leaderboard', async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get top sellers by tier
    const topSellers = await User.find({ 
      role: 'seller',
      tier: { $exists: true }
    })
    .select('username tier totalSales profilePic isVerified')
    .sort({ totalSales: -1 })
    .limit(10);
    
    const leaderboard = topSellers.map((seller, index) => ({
      rank: index + 1,
      username: seller.username,
      tier: seller.tier || 'Tease',
      totalSales: seller.totalSales || 0,
      profilePic: seller.profilePic,
      isVerified: seller.isVerified
    }));
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('[Tiers] Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch leaderboard'
      }
    });
  }
});

// GET /api/tiers/my-tier - Get current user's tier info
router.get('/my-tier', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    const tier = user.tier || 'Tease';
    const tierInfo = TIER_CONFIG.getTierByName(tier);
    const stats = await tierService.calculateSellerStats(req.user.username);
    
    res.json({
      success: true,
      data: {
        tier,
        tierInfo: {
          name: tierInfo.name,
          level: tierInfo.level,
          bonusPercentage: tierInfo.bonusPercentage,
          color: tierInfo.color,
          benefits: tierInfo.benefits
        },
        stats,
        nextTier: TIER_CONFIG.getNextTier(tier)
      }
    });
  } catch (error) {
    console.error('[Tiers] Error fetching user tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch tier information'
      }
    });
  }
});

module.exports = router;