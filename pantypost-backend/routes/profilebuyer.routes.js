// pantypost-backend/routes/profilebuyer.routes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const User = require('../models/User');

/**
 * GET /api/profilebuyer
 * Return the authenticated user's profile.
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const data = {
      username: user.username,
      role: user.role || 'buyer',
      bio: user.bio || '',
      profilePic: user.profilePic || '',
      country: user.country || '',
    };

    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /api/profilebuyer error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

/**
 * PATCH /api/profilebuyer
 * Update { bio, profilePic, country } for the authenticated user.
 */
router.patch('/', authMiddleware, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { bio, profilePic, country } = req.body || {};
    const update = {
      ...(typeof bio === 'string' ? { bio: bio.slice(0, 500) } : {}),
      ...(typeof country === 'string' ? { country: country.slice(0, 56) } : {}),
      ...(typeof profilePic === 'string' || profilePic === null
        ? { profilePic: profilePic || '' }
        : {}),
    };

    const user = await User.findOneAndUpdate(
      { username },
      { $set: update },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const data = {
      username: user.username,
      role: user.role || 'buyer',
      bio: user.bio || '',
      profilePic: user.profilePic || '',
      country: user.country || '',
    };

    return res.json({ success: true, data });
  } catch (err) {
    console.error('PATCH /api/profilebuyer error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
