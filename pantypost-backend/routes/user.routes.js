// pantypost-backend/routes/user.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');
const jwt = require('jsonwebtoken');

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

// GET /api/users/:username/profile - Get public profile (PUBLIC for sellers, optional auth)
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
    
    // IMPORTANT FIX: Sellers' profiles are public to everyone
    // Buyers' profiles remain private (only viewable by themselves or admins if authenticated)
    if (user.role === 'buyer') {
      // Check if user is authenticated
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          req.user = decoded;
          
          // Buyer profiles are private
          if (req.user.username !== req.params.username && req.user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              error: {
                code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
                message: 'You can only view your own buyer profile'
              }
            });
          }
        } catch (err) {
          // Invalid token for buyer profile
          return res.status(403).json({
            success: false,
            error: {
              code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
              message: 'Authentication required to view buyer profiles'
            }
          });
        }
      } else {
        // No auth for buyer profile
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'Authentication required to view buyer profiles'
          }
        });
      }
    }
    // If user is a seller, allow anyone to view (no auth check needed)
    
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

// GET /api/users/:username/profile/full - Get full profile (auth required, but public for sellers)
router.get('/:username/profile/full', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username })
      .select('-password');
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    // For sellers, allow any authenticated user to view their full profile
    // For buyers, only they themselves or admin can view
    if (targetUser.role === 'buyer') {
      if (req.user.username !== req.params.username && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'You can only view your own full profile'
          }
        });
      }
    }
    // If target is a seller, continue to show full profile to any authenticated user
    
    res.json({
      success: true,
      data: targetUser.toSafeObject ? targetUser.toSafeObject() : targetUser
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

// GET /api/users/:username/settings/preferences - Get user preferences (auth required, seller profiles public)
router.get('/:username/settings/preferences', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    // For sellers, allow any authenticated user to view preferences
    // For buyers, only they themselves or admin can view
    if (targetUser.role === 'buyer') {
      if (req.user.username !== req.params.username && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'You can only view your own preferences'
          }
        });
      }
    }
    
    // Return user preferences/settings
    res.json({
      success: true,
      data: {
        preferences: targetUser.settings || {},
        notifications: targetUser.notificationSettings || {
          email: true,
          push: true,
          orders: true,
          messages: true,
          marketing: false
        }
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
        // Special handling for subscriptionPrice - convert string to number
        if (field === 'subscriptionPrice') {
          const price = parseFloat(req.body[field]);
          if (!isNaN(price) && price >= 0.01 && price <= 999.99) {
            user[field] = price;
          }
        } else if (field === 'profilePic') {
          // Allow both URLs and placeholder images
          const pic = req.body[field];
          if (pic === null || pic === '' || 
              pic.startsWith('http://') || 
              pic.startsWith('https://') || 
              pic.startsWith('/uploads/') ||
              pic.includes('placeholder')) {  // More flexible placeholder handling
            user[field] = pic;
          }
        } else {
          user[field] = req.body[field];
        }
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
    if (req.body.galleryImages) {
      if (!Array.isArray(req.body.galleryImages)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Gallery images must be an array'
          }
        });
      }
      
      if (req.body.galleryImages.length > 20) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Maximum 20 gallery images allowed'
          }
        });
      }
      
      // Validate each image URL
      const validUrls = req.body.galleryImages.every(url => {
        return typeof url === 'string' && (
          url.startsWith('http://') || 
          url.startsWith('https://') || 
          url.startsWith('/uploads/')
        );
      });
      
      if (!validUrls) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid gallery image URLs'
          }
        });
      }
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: user.toSafeObject ? user.toSafeObject() : user
    });
  } catch (error) {
    console.error('Profile update error:', error);
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

// POST /api/users/activity - Track user activity
router.post('/activity', authMiddleware, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const username = req.user.username;
    
    // Find the user
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    // Update last active timestamp
    user.lastActive = new Date();
    
    // Store activity log if the user has an activity array
    if (!user.activityLog) {
      user.activityLog = [];
    }
    
    // Add the new activity
    user.activityLog.push({
      action: action || 'page_view',
      metadata: metadata || {},
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Keep only last 100 activities to prevent unbounded growth
    if (user.activityLog.length > 100) {
      user.activityLog = user.activityLog.slice(-100);
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Activity tracked successfully'
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

// GET /api/users/:username/activity - Get user activity log (admin only)
router.get('/:username/activity', authMiddleware, async (req, res) => {
  try {
    // Only admin or the user themselves can view activity
    if (req.user.username !== req.params.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'You can only view your own activity log'
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
    
    res.json({
      success: true,
      data: {
        lastActive: user.lastActive,
        activityLog: user.activityLog || []
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