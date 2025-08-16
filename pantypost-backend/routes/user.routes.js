// pantypost-backend/routes/user.routes.js
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
        { email: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users
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
        totalPages: Math.ceil(total / parseInt(limit))
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

// GET /api/users/:username/profile - Public user profile
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
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        username: user.username,
        bio: user.bio,
        profilePic: user.profilePic,
        phoneNumber: user.phoneNumber,
        subscriptionPrice: user.subscriptionPrice,
        galleryImages: user.galleryImages,
        settings: user.settings
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

// POST /api/users/:username/verification - Submit or review verification
router.post('/:username/verification', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    // Only user themselves or admin can submit/review verification
    if (!isAdmin && req.user.username !== req.params.username) {
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
    
    // User submitting verification
    if (!isAdmin) {
      const { codePhoto, idFront, idBack } = req.body || {};
      
      if (!codePhoto || !idFront || !idBack) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.MISSING_REQUIRED_FIELD,
            message: 'All verification documents are required'
          }
        });
      }
      
      user.verificationData = {
        ...user.verificationData,
        codePhoto,
        idFront,
        idBack,
        submittedAt: new Date(),
        code: user.verificationData?.code || undefined
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
      const { action, rejectionReason } = req.body || {};
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid action. Must be approve or reject'
          }
        });
      }
      
      if (action === 'approve') {
        user.isVerified = true;
        user.verificationStatus = 'verified';
        user.verificationData = {
          ...user.verificationData,
          reviewedAt: new Date(),
          reviewedBy: req.user.username,
          rejectionReason: undefined
        };
      } else {
        user.isVerified = false;
        user.verificationStatus = 'rejected';
        user.verificationData = {
          ...user.verificationData,
          reviewedAt: new Date(),
          reviewedBy: req.user.username,
          rejectionReason: rejectionReason || 'Not specified'
        };
      }
      
      await user.save();
      
      res.json({
        success: true,
        message: `Verification ${action}ed successfully`,
        data: {
          username: user.username,
          isVerified: user.isVerified,
          verificationStatus: user.verificationStatus
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

// PATCH /api/users/:username/role - Update a user's role (admin only)
router.patch('/:username/role', authMiddleware, async (req, res) => {
  try {
    // Only admins can change roles
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Only admins can change user roles'
        }
      });
    }
    
    const { role } = req.body || {};
    const allowedRoles = ['buyer', 'seller', 'admin'];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid role. Allowed values: buyer, seller, admin'
        }
      });
    }
    
    // Find the target user
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
    
    // No-op if already the same role
    if (user.role === role) {
      return res.json({
        success: true,
        message: 'Role unchanged',
        data: {
          username: user.username,
          role: user.role
        }
      });
    }
    
    user.role = role;
    await user.save();
    
    return res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update user role'
      }
    });
  }
});

/**
 * POST /api/users/bootstrap-admin
 * One-time bootstrap endpoint to promote a user to admin when no admins exist yet.
 * Requires ADMIN_BOOTSTRAP_TOKEN to match the server environment variable.
 */
router.post('/bootstrap-admin', async (req, res) => {
  try {
    const existingAdmins = await User.countDocuments({ role: 'admin' });
    if (existingAdmins > 0) {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.ACTION_NOT_ALLOWED,
          message: 'Bootstrap disabled: an admin account already exists'
        }
      });
    }
    
    const { username, token } = req.body || {};
    if (!username || !token) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'username and token are required'
        }
      });
    }
    
    const expected = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!expected) {
      return res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.SERVICE_UNAVAILABLE,
          message: 'Server not configured for bootstrap (missing ADMIN_BOOTSTRAP_TOKEN)'
        }
      });
    }
    
    if (token !== expected) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid bootstrap token'
        }
      });
    }
    
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
    
    user.role = 'admin';
    await user.save();
    
    return res.json({
      success: true,
      message: 'Bootstrap complete: user promoted to admin',
      data: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Bootstrap admin error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to bootstrap admin'
      }
    });
  }
});

module.exports = router;
