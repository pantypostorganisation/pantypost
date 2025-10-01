// pantypost-backend/routes/user.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ban = require('../models/Ban');
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

//
// ⭐ IMPORTANT: "ME" ROUTES MUST COME BEFORE ANY "/:username" ROUTES
//

// GET /api/users/me/profile (auth) — self profile (safe fields only)
router.get('/me/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username }).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    res.json({
      success: true,
      data: {
        username: user.username,
        role: user.role,
        bio: user.bio || '',
        profilePic:
          user.profilePic ||
          user?.settings?.profilePic ||
          user?.settings?.profilePicture ||
          null,
        country: user.country || user?.settings?.country
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// PATCH /api/users/me/profile (auth) — update bio, profilePic, country only
router.patch('/me/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }

    const { bio, profilePic, country } = req.body || {};

    // Validate bio
    if (typeof bio !== 'undefined') {
      if (typeof bio !== 'string' || bio.length > 500) {
        return res.status(400).json({
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Bio must be <= 500 characters' }
        });
      }
      user.bio = bio;
    }

    // Validate profilePic (allow empty, http(s), or /uploads, or placeholder)
    if (typeof profilePic !== 'undefined') {
      const pic = profilePic;
      if (
        pic === null ||
        pic === '' ||
        (typeof pic === 'string' &&
          (pic.startsWith('http://') ||
           pic.startsWith('https://') ||
           pic.startsWith('/uploads/') ||
           pic.includes('placeholder')))
      ) {
        user.profilePic = pic;
        user.settings = user.settings || {};
        user.settings.profilePic = pic;
        user.settings.profilePicture = pic;
      } else {
        return res.status(400).json({
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid profile picture URL' }
        });
      }
    }

    // Validate country
    if (typeof country !== 'undefined') {
      if (typeof country !== 'string' || country.length > 56) {
        return res.status(400).json({
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid country value' }
        });
      }
      user.country = country;
      // Keep legacy settings.country in sync for older clients that still read from it
      user.settings = user.settings || {};
      user.settings.country = country;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated',
      data: {
        username: user.username,
        role: user.role,
        bio: user.bio || '',
        profilePic:
          user.profilePic ||
          user?.settings?.profilePic ||
          user?.settings?.profilePicture ||
          null,
        country: user.country || user?.settings?.country
      }
    });
  } catch (error) {
    console.error('Profile (me) update error:', error);
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

//
// ROUTES WITH "/:username" COME AFTER THE "/me" ROUTES
//

// GET /api/users/:username/ban-status - Check user ban status (PUBLIC)
router.get('/:username/ban-status', async (req, res) => {
  try {
    const { username } = req.params;
    const ban = await Ban.findOne({ username, active: true });
    
    if (ban) {
      if (!ban.isPermanent && ban.expiresAt && new Date(ban.expiresAt) < new Date()) {
        ban.active = false;
        await ban.save();
        return res.json({ success: true, data: { isBanned: false } });
      }
      return res.json({
        success: true,
        data: {
          isBanned: true,
          reason: ban.reason,
          customReason: ban.customReason,
          bannedBy: ban.bannedBy,
          createdAt: ban.createdAt,
          expiresAt: ban.expiresAt,
          isPermanent: ban.isPermanent,
          duration: ban.duration
        }
      });
    }
    
    return res.json({ success: true, data: { isBanned: false } });
  } catch (error) {
    console.error('Error checking ban status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to check ban status' }
    });
  }
});

// GET /api/users/:username/profile - Public/limited profile
// Sellers => public
// Buyers  => PUBLIC LIMITED if no token; full public fields if authenticated; 403 if bad token
router.get('/:username/profile', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -phoneNumber -verificationData'); // keep settings to read country
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    
    if (user.role === 'buyer') {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

      // ⬇️ CHANGE: If no token, return a limited public buyer profile (200)
      if (!token) {
        return res.json({
          success: true,
          data: {
            username: user.username,
            bio: user.bio,
            profilePic:
              user.profilePic ||
              user?.settings?.profilePic ||
              user?.settings?.profilePicture ||
              null,
            country: user.country || user?.settings?.country,
            isVerified: user.isVerified,
            role: user.role,
            joinedDate: user.joinedDate
          }
        });
      }

      // If token exists but is invalid/expired → 403 (unchanged)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
      } catch (err) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'Invalid or expired token'
          }
        });
      }
    }
    
    // For sellers OR authenticated requests, return the fuller public payload
    res.json({
      success: true,
      data: {
        username: user.username,
        bio: user.bio,
        profilePic:
          user.profilePic ||
          user?.settings?.profilePic ||
          user?.settings?.profilePicture ||
          null,
        country: user.country || user?.settings?.country,
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
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// GET /api/users/:username/profile/full - Get full profile (auth required; buyers self/admin)
router.get('/:username/profile/full', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username })
      .select('-password');
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    
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
    
    res.json({
      success: true,
      data: targetUser.toSafeObject ? targetUser.toSafeObject() : targetUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// PATCH /api/users/:username/profile - Update profile (self or admin)
router.patch('/:username/profile', authMiddleware, async (req, res) => {
  try {
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
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    
    const allowedFields = [
      'bio', 
      'profilePic', 
      'phoneNumber',
      'subscriptionPrice',
      'galleryImages',
      'settings'
    ];
    
    if (user.role !== 'seller') {
      ['subscriptionPrice', 'galleryImages'].forEach(field => {
        if (req.body[field] !== undefined) {
          delete req.body[field];
        }
      });
    }
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'subscriptionPrice') {
          const price = parseFloat(req.body[field]);
          if (!isNaN(price) && price >= 0.01 && price <= 999.99) {
            user[field] = price;
          }
        } else if (field === 'profilePic') {
          const pic = req.body[field];
          if (pic === null || pic === '' || 
              pic.startsWith('http://') || 
              pic.startsWith('https://') || 
              pic.startsWith('/uploads/') ||
              pic.includes('placeholder')) {
            user[field] = pic;
          }
        } else {
          user[field] = req.body[field];
        }
      }
    });
    
    if (req.body.bio && req.body.bio.length > 500) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Bio must be 500 characters or less'
        }
      });
    }
    
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
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// POST /api/users/:username/verification - Submit verification request (auth)
router.post('/:username/verification', authMiddleware, async (req, res) => {
  try {
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
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    
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
        data: { verificationStatus: user.verificationStatus }
      });
    } else if (isAdmin) {
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
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// POST /api/users/:username/ban - Ban a user (admin only)
router.post('/:username/ban', authMiddleware, async (req, res) => {
  try {
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
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    
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
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// POST /api/users/:username/unban - Unban a user (admin only)
router.post('/:username/unban', authMiddleware, async (req, res) => {
  try {
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
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    
    if (!user.isBanned) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.ACTION_NOT_ALLOWED, message: 'User is not banned' }
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
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// POST /api/users/activity - Track user activity
router.post('/activity', authMiddleware, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const username = req.user.username;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }
    
    user.lastActive = new Date();
    if (!user.activityLog) user.activityLog = [];
    
    user.activityLog.push({
      action: action || 'page_view',
      metadata: metadata || {},
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    if (user.activityLog.length > 100) {
      user.activityLog = user.activityLog.slice(-100);
    }
    
    await user.save();
    
    res.json({ success: true, message: 'Activity tracked successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// GET /api/users/:username/activity - Get user activity log (auth; self/admin)
router.get('/:username/activity', authMiddleware, async (req, res) => {
  try {
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
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
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
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

module.exports = router;
