// pantypost-backend/routes/referral.routes.js
const express = require('express');
const router = express.Router();
const { Referral, ReferralCommission } = require('../models/Referral');
const ReferralCode = require('../models/ReferralCode');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

// ============= HELPER FUNCTIONS =============

function sanitizeCode(code) {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

// ============= REFERRAL ROUTES =============

// GET /api/referral/code - Get user's referral code
router.get('/code', authMiddleware, async (req, res) => {
  try {
    // Only sellers can have referral codes
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only sellers can have referral codes' }
      });
    }

    // Find existing referral code for user
    const referralCode = await ReferralCode.findOne({ username: req.user.username });

    if (!referralCode || !referralCode.code) {
      // User has no code yet - return empty state
      return res.json({
        success: true,
        data: {
          code: null,
          referralUrl: null,
          usageCount: 0,
          clickCount: 0,
          conversionRate: 0,
          status: 'not_created'
        }
      });
    }

    res.json({
      success: true,
      data: {
        code: referralCode.code,
        referralUrl: referralCode.referralUrl,
        usageCount: referralCode.usageCount,
        clickCount: referralCode.clickCount,
        conversionRate: referralCode.conversionRate,
        status: referralCode.status
      }
    });
  } catch (error) {
    console.error('[Referral] Error getting code:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to get referral code' }
    });
  }
});

// POST /api/referral/code - Create or update custom referral code
router.post('/code', authMiddleware, async (req, res) => {
  try {
    // Only sellers can create referral codes
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only sellers can create referral codes' }
      });
    }

    const { code } = req.body;
    const sanitizedCode = sanitizeCode(code);

    // Validate code format
    if (!ReferralCode.isValidCodeFormat(sanitizedCode)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid code format. Must be 3-20 characters, alphanumeric, underscore, or hyphen only.'
        }
      });
    }

    // Check if code is already taken by someone else (case-insensitive)
    const existingCode = await ReferralCode.findOne({ code: sanitizedCode })
      .collation({ locale: 'en', strength: 2 });
    if (existingCode && existingCode.username !== req.user.username) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'This referral code is already taken. Please try another.'
        }
      });
    }

    // Find or create referral code entry for this user
    let referralCode = await ReferralCode.findOne({ username: req.user.username });
    const isNewCode = !referralCode || !referralCode.code;

    if (referralCode) {
      // Update existing entry
      referralCode.code = sanitizedCode;
      referralCode.status = 'active';
      referralCode.updatedAt = new Date();
      await referralCode.save();
    } else {
      // Create new entry
      referralCode = new ReferralCode({
        username: req.user.username,
        code: sanitizedCode,
        status: 'active'
      });
      await referralCode.save();
    }

    // Update user's referralCode field
    await User.findOneAndUpdate(
      { username: req.user.username },
      { referralCode: sanitizedCode }
    );

    console.log(`[Referral] Code created/updated for ${req.user.username}: ${sanitizedCode}`);

    res.json({
      success: true,
      data: {
        code: referralCode.code,
        referralUrl: referralCode.referralUrl,
        message: isNewCode
          ? 'Referral code created successfully'
          : 'Referral code updated successfully'
      }
    });
  } catch (error) {
    console.error('[Referral] Error updating code:', error);
    let status = 500;
    let message = error && error.message ? error.message : 'Failed to create referral code';

    // Handle duplicate key errors explicitly
    if (error && (error.code === 11000 || error.code === 'E11000')) {
      status = 400;
      message = 'This referral code is already taken. Please choose a different one.';
    }

    res.status(status).json({
      success: false,
      error: { message }
    });
  }
});

// DELETE /api/referral/code - Remove referral code
router.delete('/code', authMiddleware, async (req, res) => {
  try {
    // Only sellers can delete their referral codes
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only sellers can manage referral codes' }
      });
    }

    // Find the referral code
    const referralCode = await ReferralCode.findOne({ username: req.user.username });
    
    if (!referralCode || !referralCode.code) {
      return res.json({
        success: true,
        message: 'No referral code to remove'
      });
    }

    // Clear the code but keep the record for statistics
    referralCode.code = null;
    referralCode.status = 'inactive';
    referralCode.updatedAt = new Date();
    await referralCode.save();

    // Update user's referralCode field
    await User.findOneAndUpdate(
      { username: req.user.username },
      { referralCode: null }
    );

    console.log(`[Referral] Code removed for ${req.user.username}`);

    res.json({
      success: true,
      message: 'Referral code removed successfully'
    });
  } catch (error) {
    console.error('[Referral] Error removing code:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to remove referral code' }
    });
  }
});

// GET /api/referral/validate/:code - Validate a referral code (PUBLIC)
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const sanitizedCode = sanitizeCode(code);

    if (!sanitizedCode) {
      return res.status(400).json({
        success: false,
        error: 'Invalid code'
      });
    }

    const referralCode = await ReferralCode.findByCode(sanitizedCode);
    
    if (!referralCode) {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    // Track the click
    await referralCode.trackClick({
      timestamp: new Date(),
      source: req.headers.referer || 'direct'
    });

    // Get referrer info (limited data for privacy)
    const referrer = await User.findOne({ username: referralCode.username })
      .select('username profilePic');

    res.json({
      success: true,
      data: {
        valid: true,
        code: referralCode.code,
        referrer: {
          username: referrer.username,
          profilePic: referrer.profilePic
        }
      }
    });
  } catch (error) {
    console.error('[Referral] Error validating code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate referral code'
    });
  }
});

// GET /api/referral/stats - Get referral statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Only sellers can view their referral stats
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can view referral statistics'
      });
    }

    // Get referral stats
    const stats = await Referral.getReferrerStats(req.user.username);

    // Get referral code info
    const referralCode = await ReferralCode.findOne({ username: req.user.username });

    // Get recent commissions
    const recentCommissions = await ReferralCommission.find({
      referrer: req.user.username
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats,
        code: referralCode && referralCode.code ? {
          code: referralCode.code,
          referralUrl: referralCode.referralUrl,
          clickCount: referralCode.clickCount,
          conversionRate: referralCode.conversionRate,
          usageCount: referralCode.usageCount,
          status: referralCode.status
        } : null,
        recentCommissions: recentCommissions.map(c => ({
          id: c._id,
          amount: c.commissionAmount,
          orderId: c.orderId,
          seller: c.referredSeller,
          date: c.createdAt,
          status: c.status
        }))
      }
    });
  } catch (error) {
    console.error('[Referral] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get referral statistics'
    });
  }
});

// GET /api/referral/referrals - Get list of referred sellers
router.get('/referrals', authMiddleware, async (req, res) => {
  try {
    // Only sellers can view their referrals
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can view referrals'
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get referrals
    const referrals = await Referral.find({
      referrer: req.user.username,
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Referral.countDocuments({
      referrer: req.user.username,
      status: 'active'
    });

    // Get user details for referred sellers
    const referredUsernames = referrals.map(r => r.referredSeller);
    const users = await User.find({
      username: { $in: referredUsernames }
    }).select('username profilePic isVerified totalSales createdAt');

    // Create user map
    const userMap = {};
    users.forEach(user => {
      userMap[user.username] = user;
    });

    // Format response
    const formattedReferrals = referrals.map(referral => ({
      id: referral._id,
      username: referral.referredSeller,
      profilePic: userMap[referral.referredSeller]?.profilePic,
      isVerified: userMap[referral.referredSeller]?.isVerified || false,
      totalSales: userMap[referral.referredSeller]?.totalSales || 0,
      joinedDate: referral.createdAt,
      totalEarnings: referral.totalEarnings,
      totalCommissions: referral.totalSales,
      lastEarningDate: referral.lastEarningDate,
      status: referral.status
    }));

    res.json({
      success: true,
      data: {
        referrals: formattedReferrals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[Referral] Error getting referrals:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get referrals'
    });
  }
});

// GET /api/referral/commissions - Get commission history
router.get('/commissions', authMiddleware, async (req, res) => {
  try {
    // Only sellers can view their commissions
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can view commissions'
      });
    }

    const { page = 1, limit = 50, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { referrer: req.user.username };
    if (status) {
      query.status = status;
    }

    // Get commissions
    const commissions = await ReferralCommission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await ReferralCommission.countDocuments(query);

    // Calculate totals
    const totals = await ReferralCommission.aggregate([
      { $match: { referrer: req.user.username } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalsByStatus = {};
    totals.forEach(t => {
      totalsByStatus[t._id] = {
        amount: t.total,
        count: t.count
      };
    });

    res.json({
      success: true,
      data: {
        commissions: commissions.map(c => ({
          id: c._id,
          amount: c.commissionAmount,
          orderId: c.orderId,
          seller: c.referredSeller,
          date: c.createdAt,
          status: c.status,
          rate: c.commissionRate
        })),
        totals: {
          earned: totalsByStatus.earned || { amount: 0, count: 0 },
          paid: totalsByStatus.paid || { amount: 0, count: 0 },
          pending: totalsByStatus.pending || { amount: 0, count: 0 },
          total: {
            amount: Object.values(totalsByStatus).reduce((sum, s) => sum + s.amount, 0),
            count: Object.values(totalsByStatus).reduce((sum, s) => sum + s.count, 0)
          }
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[Referral] Error getting commissions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get commissions'
    });
  }
});

// POST /api/referral/track-signup - Track a referral signup (INTERNAL)
router.post('/track-signup', async (req, res) => {
  try {
    const { referralCode, newUsername, email, ipAddress, metadata } = req.body;

    if (!referralCode || !newUsername) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Find the referral code
    const codeDoc = await ReferralCode.findByCode(referralCode);
    if (!codeDoc) {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    // Check if user was already referred
    const existingReferral = await Referral.findOne({
      referredSeller: newUsername
    });

    if (existingReferral) {
      return res.status(400).json({
        success: false,
        error: 'User was already referred'
      });
    }

    // Create referral relationship
    const referral = new Referral({
      referrer: codeDoc.username,
      referredSeller: newUsername,
      referralCode: codeDoc.code,
      referredEmail: email,
      signupIp: ipAddress,
      metadata: metadata || {}
    });

    await referral.save();

    // Track the signup in referral code
    await codeDoc.trackSignup(newUsername);

    // Update the new user to mark them as referred
    await User.findOneAndUpdate(
      { username: newUsername },
      {
        referredBy: codeDoc.username,
        referralCode: codeDoc.code,
        referredAt: new Date()
      }
    );

    console.log(`[Referral] Tracked signup: ${codeDoc.username} -> ${newUsername}`);

    res.json({
      success: true,
      data: {
        referralId: referral._id,
        referrer: codeDoc.username
      }
    });
  } catch (error) {
    console.error('[Referral] Error tracking signup:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track referral signup'
    });
  }
});

// Admin routes

// GET /api/referral/admin/all - Get all referrals (admin only)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const referrals = await Referral.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Referral.countDocuments();

    res.json({
      success: true,
      data: {
        referrals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[Referral] Admin error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get referrals'
    });
  }
});

// POST /api/referral/admin/suspend - Suspend a referral relationship (admin only)
router.post('/admin/suspend', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { referralId, reason } = req.body;

    const referral = await Referral.findById(referralId);
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'Referral not found'
      });
    }

    referral.status = 'suspended';
    await referral.save();

    console.log(`[Referral] Admin suspended referral ${referralId}: ${reason}`);

    res.json({
      success: true,
      data: {
        message: 'Referral suspended successfully'
      }
    });
  } catch (error) {
    console.error('[Referral] Admin suspend error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to suspend referral'
    });
  }
});

module.exports = router;