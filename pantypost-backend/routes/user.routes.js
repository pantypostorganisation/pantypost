// user.routes.js
// This file contains all user-related routes

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');

// ============= USER ROUTES =============

// GET /api/users - List all users with filters
router.get('/', async (req, res) => {
  try {
    const { role, verified, query, page = 1, limit = 50 } = req.query;
    
    // Build filter
    let filter = {};
    if (role) filter.role = role;
    if (verified !== undefined) filter.isVerified = verified === 'true';
    
    // Search query
    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password -verificationData')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: users,
      meta: {
        page: parseInt(page),
        pageSize: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// GET /api/users/:username/profile - Get public profile
router.get('/:username/profile', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -phoneNumber -settings -verificationData');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        username: user.username,
        bio: user.bio,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
        tier: user.tier,
        subscriptionPrice: user.subscriptionPrice,
        rating: user.rating,
        reviewCount: user.reviewCount,
        subscriberCount: user.subscriberCount,
        totalSales: user.totalSales,
        joinedDate: user.joinedDate,
        role: user.role,
        galleryImages: user.role === 'seller' ? user.galleryImages : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// GET /api/users/:username/profile/full - Get full profile (auth required)
router.get('/:username/profile/full', authMiddleware, async (req, res) => {
  try {
    // Only user themselves or admin can view full profile
    if (req.user.username !== req.params.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'You can only view your own full profile'
        }
      });
    }
    
    const user = await User.findOne({ username: req.params.username })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// PATCH /api/users/:username/profile - Update profile
router.patch('/:username/profile', authMiddleware, async (req, res) => {
  try {
    // Only user themselves or admin can update profile
    if (req.user.username !== req.params.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'You can only update your own profile'
        }
      });
    }
    
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    // Fields that can be updated
    const allowedFields = [
      'bio', 
      'profilePic', 
      'phoneNumber',
      'subscriptionPrice',
      'galleryImages',
      'settings'
    ];
    
    // Only sellers can update subscription price and gallery
    if (user.role !== 'seller') {
      const sellerOnlyFields = ['subscriptionPrice', 'galleryImages'];
      sellerOnlyFields.forEach(field => {
        if (req.body[field] !== undefined) {
          delete req.body[field];
        }
      });
    }
    
    // Update allowed fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });
    
    // Validate bio length
    if (req.body.bio && req.body.bio.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Bio must be 500 characters or less'
        }
      });
    }
    
    // Validate gallery images
    if (req.body.galleryImages && req.body.galleryImages.length > 20) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Maximum 20 gallery images allowed'
        }
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// POST /api/users/:username/verification - Submit verification request
router.post('/:username/verification', authMiddleware, async (req, res) => {
  try {
    // Check if user is updating their own verification
    const isOwnProfile = req.user.username === req.params.username;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'You can only update your own verification'
        }
      });
    }
    
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    // Seller submitting verification
    if (isOwnProfile && !isAdmin) {
      const { codePhoto, idFront, idBack, code } = req.body;
      
      if (!codePhoto || !idFront || !idBack || !code) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.MISSING_REQUIRED_FIELD,
            message: 'All verification fields are required'
          }
        });
      }
      
      user.verificationData = {
        codePhoto,
        idFront,
        idBack,
        code,
        submittedAt: new Date()
      };
      user.verificationStatus = 'pending';
      
      await user.save();
      
      res.json({
        success: true,
        message: 'Verification submitted successfully',
        data: {
          verificationStatus: user.verificationStatus
        }
      });
    } 
    // Admin reviewing verification
    else if (isAdmin) {
      const { status, rejectionReason, adminUsername } = req.body;
      
      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Status must be verified or rejected'
          }
        });
      }
      
      if (status === 'rejected' && !rejectionReason) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.MISSING_REQUIRED_FIELD,
            message: 'Rejection reason is required'
          }
        });
      }
      
      user.verificationStatus = status;
      user.isVerified = status === 'verified';
      user.verificationData.reviewedAt = new Date();
      user.verificationData.reviewedBy = adminUsername;
      
      if (status === 'rejected') {
        user.verificationData.rejectionReason = rejectionReason;
      }
      
      await user.save();
      
      res.json({
        success: true,
        message: `User ${status} successfully`,
        data: {
          username: user.username,
          verificationStatus: user.verificationStatus,
          isVerified: user.isVerified
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// POST /api/users/:username/ban - Ban a user (admin only)
router.post('/:username/ban', authMiddleware, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Only admins can ban users'
        }
      });
    }
    
    const { reason, duration, adminUsername } = req.body;
    
    if (!reason || reason.length < 10 || reason.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Ban reason must be between 10 and 500 characters'
        }
      });
    }
    
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    // Can't ban admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ACTION_NOT_ALLOWED,
          message: 'Cannot ban admin users'
        }
      });
    }
    
    user.isBanned = true;
    user.banReason = reason;
    user.bannedBy = adminUsername || req.user.username;
    
    if (duration && duration >= 1 && duration <= 365) {
      const banExpiry = new Date();
      banExpiry.setDate(banExpiry.getDate() + duration);
      user.banExpiry = banExpiry;
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.username} has been banned`,
      data: {
        username: user.username,
        isBanned: user.isBanned,
        banReason: user.banReason,
        banExpiry: user.banExpiry
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// POST /api/users/:username/unban - Unban a user (admin only)
router.post('/:username/unban', authMiddleware, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Only admins can unban users'
        }
      });
    }
    
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    if (!user.isBanned) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ACTION_NOT_ALLOWED,
          message: 'User is not banned'
        }
      });
    }
    
    user.isBanned = false;
    user.banReason = undefined;
    user.banExpiry = undefined;
    user.bannedBy = undefined;
    
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.username} has been unbanned`,
      data: {
        username: user.username,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// Export the router
module.exports = router;