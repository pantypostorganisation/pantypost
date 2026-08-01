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

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const data = {
      username: user.username,
      role: user.role || 'buyer',
      bio: user.bio || '',
      // This is the owner's own profile, so show their pending picture
      // if one is awaiting review.
      profilePic: user.getOwnProfilePic() || '',
      profilePicPendingReview: Boolean(
        user.pendingProfilePic?.url && user.pendingProfilePic.status === 'pending'
      ),
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
    };

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    Object.assign(user, update);

    // PRE-PUBLICATION REVIEW
    // Buyer profile pictures are publicly visible (on reviews, messages
    // and profiles), so they go through the same review queue as any
    // other user-uploaded image. Clearing a picture applies at once.
    let pendingReview = false;
    if (typeof profilePic === 'string' || profilePic === null) {
      const pic = profilePic || '';
      if (pic === '' || pic.includes('placeholder')) {
        user.profilePic = pic;
        user.pendingProfilePic = undefined;
      } else {
        user.submitProfilePicForReview(pic);
        pendingReview = true;
      }
    }

    await user.save();

    const data = {
      username: user.username,
      role: user.role || 'buyer',
      bio: user.bio || '',
      // Owner sees their own pending image immediately.
      profilePic: user.getOwnProfilePic() || '',
      profilePicPendingReview: pendingReview,
      country: user.country || '',
    };

    return res.json({
      success: true,
      data,
      ...(pendingReview
        ? { message: 'Your new profile picture is awaiting review and is not yet visible to others.' }
        : {}),
    });
  } catch (err) {
    console.error('PATCH /api/profilebuyer error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
