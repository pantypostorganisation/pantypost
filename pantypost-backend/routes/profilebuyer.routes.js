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

    const resolvedProfilePic =
      user.profilePic ||
      user?.settings?.profilePic ||
      user?.settings?.profilePicture ||
      '';

    const resolvedCountry = user.country || user?.settings?.country || '';

    const data = {
      username: user.username,
      role: user.role || 'buyer',
      bio: user.bio || '',
      profilePic: resolvedProfilePic,
      country: resolvedCountry,
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

    const update = {};

    if (typeof bio === 'string') {
      update.bio = bio.slice(0, 500);
    }

    if (typeof country === 'string') {
      const sanitizedCountry = country.slice(0, 56);
      update.country = sanitizedCountry;
      update['settings.country'] = sanitizedCountry;
    }

    if (typeof profilePic !== 'undefined') {
      let sanitizedPic = profilePic;
      if (typeof sanitizedPic === 'string') {
        sanitizedPic = sanitizedPic.trim();
      }

      if (
        sanitizedPic === null ||
        sanitizedPic === '' ||
        (typeof sanitizedPic === 'string' &&
          (sanitizedPic.startsWith('http://') ||
            sanitizedPic.startsWith('https://') ||
            sanitizedPic.startsWith('/uploads/') ||
            sanitizedPic.includes('placeholder')))
      ) {
        const storedPic = sanitizedPic ? sanitizedPic : '';
        update.profilePic = storedPic;
        update['settings.profilePic'] = storedPic;
        update['settings.profilePicture'] = storedPic;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid profile picture URL',
        });
      }
    }

    const user = await User.findOneAndUpdate(
      { username },
      { $set: update },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const resolvedProfilePic =
      user.profilePic ||
      user?.settings?.profilePic ||
      user?.settings?.profilePicture ||
      '';

    const resolvedCountry = user.country || user?.settings?.country || '';

    const data = {
      username: user.username,
      role: user.role || 'buyer',
      bio: user.bio || '',
      profilePic: resolvedProfilePic,
      country: resolvedCountry,
    };

    return res.json({ success: true, data });
  } catch (err) {
    console.error('PATCH /api/profilebuyer error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
