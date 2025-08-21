// pantypost-backend/routes/verification.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');
const Verification = require('../models/Verification');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/verification/';
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.username}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
});

// POST /api/verification/submit - Submit verification request
router.post('/submit', authMiddleware, upload.fields([
  { name: 'codePhoto', maxCount: 1 },
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'passport', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check if user is a seller
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Only sellers can request verification'
        }
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ACTION_NOT_ALLOWED,
          message: 'User is already verified'
        }
      });
    }

    // Check for existing pending verification
    const existingVerification = await Verification.findOne({
      userId: user._id,
      status: 'pending'
    });

    if (existingVerification) {
      // Check rate limiting - max 3 attempts per day
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (existingVerification.attempts >= 3 && existingVerification.lastAttemptAt > dayAgo) {
        return res.status(429).json({
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many verification attempts. Please try again tomorrow.'
          }
        });
      }
    }

    const { code } = req.body;
    
    // Validate required fields
    if (!code || !req.files.codePhoto) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Verification code and code photo are required'
        }
      });
    }

    // Validate that either ID or passport is provided
    if (!req.files.idFront && !req.files.passport) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Either ID front or passport is required'
        }
      });
    }

    // Build documents object with file URLs
    const documents = {};
    if (req.files.codePhoto) {
      documents.codePhoto = {
        url: `/uploads/verification/${req.files.codePhoto[0].filename}`,
        uploadedAt: new Date()
      };
    }
    if (req.files.idFront) {
      documents.idFront = {
        url: `/uploads/verification/${req.files.idFront[0].filename}`,
        uploadedAt: new Date()
      };
    }
    if (req.files.idBack) {
      documents.idBack = {
        url: `/uploads/verification/${req.files.idBack[0].filename}`,
        uploadedAt: new Date()
      };
    }
    if (req.files.passport) {
      documents.passport = {
        url: `/uploads/verification/${req.files.passport[0].filename}`,
        uploadedAt: new Date()
      };
    }

    // Create or update verification request
    const verificationData = {
      userId: user._id,
      username: user.username,
      status: 'pending',
      documents,
      verificationCode: code,
      submittedAt: new Date(),
      attempts: existingVerification ? existingVerification.attempts + 1 : 1,
      lastAttemptAt: new Date()
    };

    let verification;
    if (existingVerification) {
      // Update existing verification
      Object.assign(existingVerification, verificationData);
      verification = await existingVerification.save();
    } else {
      // Create new verification
      verification = new Verification(verificationData);
      await verification.save();
    }

    // Update user's verification status
    user.verificationStatus = 'pending';
    user.verificationData = {
      code,
      submittedAt: new Date()
    };
    await user.save();

    res.json({
      success: true,
      message: 'Verification request submitted successfully',
      data: {
        verificationId: verification._id,
        status: 'pending',
        submittedAt: verification.submittedAt
      }
    });

  } catch (error) {
    console.error('[Verification] Submit error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const field in req.files) {
        for (const file of req.files[field]) {
          try {
            await fs.unlink(file.path);
          } catch (unlinkError) {
            console.error('Failed to delete file:', unlinkError);
          }
        }
      }
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to submit verification request'
      }
    });
  }
});

// GET /api/verification/status - Get verification status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const verification = await Verification.findOne({ userId: req.user.id })
      .sort({ submittedAt: -1 });
    
    if (!verification) {
      return res.json({
        success: true,
        data: {
          status: 'unverified',
          message: 'No verification request found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        status: verification.status,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        rejectionReason: verification.rejectionReason,
        attempts: verification.attempts
      }
    });

  } catch (error) {
    console.error('[Verification] Get status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to get verification status'
      }
    });
  }
});

// GET /api/verification/pending - Get pending verifications (admin only)
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const { page = 1, limit = 20, sort = 'oldest' } = req.query;
    
    const sortOrder = sort === 'newest' ? -1 : 1;
    const skip = (page - 1) * limit;
    
    const verifications = await Verification.find({ status: 'pending' })
      .populate('userId', 'username email role')
      .sort({ submittedAt: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Verification.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      data: verifications,
      meta: {
        page: parseInt(page),
        pageSize: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[Verification] Get pending error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to get pending verifications'
      }
    });
  }
});

// PATCH /api/verification/:id/review - Review verification (admin only)
router.patch('/:id/review', authMiddleware, async (req, res) => {
  try {
    console.log('[Verification] Review request:', { 
      id: req.params.id, 
      action: req.body.action,
      admin: req.user.username 
    });

    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const { action, rejectionReason } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_INPUT,
          message: 'Action must be approve or reject'
        }
      });
    }

    if (action === 'reject' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Rejection reason is required'
        }
      });
    }

    const verification = await Verification.findById(req.params.id);
    
    if (!verification) {
      console.error('[Verification] Verification not found:', req.params.id);
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Verification request not found'
        }
      });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ACTION_NOT_ALLOWED,
          message: 'Verification has already been reviewed'
        }
      });
    }

    console.log('[Verification] Found verification for user:', verification.userId);

    // Update verification document
    verification.status = action === 'approve' ? 'approved' : 'rejected';
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user.id;
    
    if (action === 'reject') {
      verification.rejectionReason = rejectionReason;
    }
    
    await verification.save();
    console.log('[Verification] Verification document updated');

    // Update user
    const user = await User.findById(verification.userId);
    if (user) {
      console.log('[Verification] Updating user:', user.username);
      
      if (action === 'approve') {
        // Set user as verified
        user.isVerified = true;
        user.verificationStatus = 'verified';
        
        // Initialize verificationData if it doesn't exist
        if (!user.verificationData) {
          user.verificationData = {};
        }
        
        // Update verification data
        user.verificationData.reviewedAt = new Date();
        user.verificationData.reviewedBy = req.user.username;
        
        console.log('[Verification] User approved - isVerified:', user.isVerified);
      } else {
        // Set user as rejected
        user.isVerified = false; // Ensure they're not verified
        user.verificationStatus = 'rejected';
        
        // Initialize verificationData if it doesn't exist
        if (!user.verificationData) {
          user.verificationData = {};
        }
        
        // Update verification data
        user.verificationData.reviewedAt = new Date();
        user.verificationData.reviewedBy = req.user.username;
        user.verificationData.rejectionReason = rejectionReason;
        
        console.log('[Verification] User rejected');
      }
      
      // Save user with error handling
      try {
        await user.save();
        console.log('[Verification] User saved successfully. Final isVerified status:', user.isVerified);
      } catch (saveError) {
        console.error('[Verification] Error saving user:', saveError);
        throw saveError;
      }
    } else {
      console.error('[Verification] User not found for verification:', verification.userId);
    }

    res.json({
      success: true,
      message: `Verification ${action}d successfully`,
      data: {
        verificationId: verification._id,
        status: verification.status,
        username: verification.username,
        isVerified: user ? user.isVerified : undefined
      }
    });

  } catch (error) {
    console.error('[Verification] Review error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to review verification',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// GET /api/verification/stats - Get verification statistics (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, todayCount, weekCount, avgProcessingTime] = await Promise.all([
      Verification.countDocuments({ status: 'pending' }),
      Verification.countDocuments({ 
        status: 'pending',
        submittedAt: { $gte: today }
      }),
      Verification.countDocuments({ 
        status: 'pending',
        submittedAt: { $gte: weekAgo }
      }),
      Verification.aggregate([
        {
          $match: {
            status: { $in: ['approved', 'rejected'] },
            reviewedAt: { $exists: true }
          }
        },
        {
          $project: {
            processingTime: {
              $divide: [
                { $subtract: ['$reviewedAt', '$submittedAt'] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$processingTime' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total,
        today: todayCount,
        thisWeek: weekCount,
        averageProcessingTime: avgProcessingTime[0]?.avgTime || 0
      }
    });

  } catch (error) {
    console.error('[Verification] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to get verification statistics'
      }
    });
  }
});

module.exports = router;