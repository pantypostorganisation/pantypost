// pantypost-backend/routes/ban.routes.js
const express = require('express');
const router = express.Router();
const Ban = require('../models/Ban');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/admin/bans - Get all bans
router.get('/bans', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { active, username, page = 0, limit = 20 } = req.query;
    
    const query = {};
    if (active !== undefined) query.active = active === 'true';
    if (username) query.username = username;

    const bans = await Ban.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(page) * parseInt(limit));

    const total = await Ban.countDocuments(query);

    res.json({
      success: true,
      data: {
        bans,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bans'
    });
  }
});

// POST /api/admin/bans - Create a ban
router.post('/bans', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const ban = await Ban.createBan({
      ...req.body,
      bannedBy: req.user.username
    });

    // Update user
    await User.findOneAndUpdate(
      { username: req.body.username },
      { 
        isBanned: true,
        banReason: req.body.reason,
        banExpiry: ban.expiresAt,
        bannedBy: req.user.username
      }
    );

    res.json({
      success: true,
      data: ban
    });
  } catch (error) {
    console.error('Error creating ban:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ban'
    });
  }
});

// POST /api/admin/bans/:username/unban
router.post('/bans/:username/unban', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { username } = req.params;
    const { reason } = req.body;

    // Find and lift active ban
    const ban = await Ban.findOne({ username, active: true });
    if (ban) {
      await ban.lift(req.user.username, reason);
    }

    // Update user
    await User.findOneAndUpdate(
      { username },
      { 
        isBanned: false,
        banReason: null,
        banExpiry: null,
        bannedBy: null
      }
    );

    res.json({
      success: true,
      data: { message: 'User unbanned successfully' }
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unban user'
    });
  }
});

// GET /api/admin/bans/stats
router.get('/bans/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const stats = await Ban.getBanStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching ban stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ban statistics'
    });
  }
});

module.exports = router;