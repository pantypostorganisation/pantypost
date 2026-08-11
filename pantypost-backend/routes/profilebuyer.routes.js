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
      // Saved shipping address, so checkout and the post-bid prompt can
      // prefill instead of asking again.
      deliveryAddress:
        user.deliveryAddress && user.deliveryAddress.addressLine1
          ? {
              fullName: user.deliveryAddress.fullName || '',
              addressLine1: user.deliveryAddress.addressLine1 || '',
              addressLine2: user.deliveryAddress.addressLine2 || '',
              city: user.deliveryAddress.city || '',
              state: user.deliveryAddress.state || '',
              postalCode: user.deliveryAddress.postalCode || '',
              country: user.deliveryAddress.country || '',
            }
          : null,
      hasDeliveryAddress:
        typeof user.hasDeliveryAddress === 'function' ? user.hasDeliveryAddress() : false,
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
      // Saved shipping address, so checkout and the post-bid prompt can
      // prefill instead of asking again.
      deliveryAddress:
        user.deliveryAddress && user.deliveryAddress.addressLine1
          ? {
              fullName: user.deliveryAddress.fullName || '',
              addressLine1: user.deliveryAddress.addressLine1 || '',
              addressLine2: user.deliveryAddress.addressLine2 || '',
              city: user.deliveryAddress.city || '',
              state: user.deliveryAddress.state || '',
              postalCode: user.deliveryAddress.postalCode || '',
              country: user.deliveryAddress.country || '',
            }
          : null,
      hasDeliveryAddress:
        typeof user.hasDeliveryAddress === 'function' ? user.hasDeliveryAddress() : false,
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

/**
 * PUT /api/profilebuyer/delivery-address
 *
 * Save the buyer's shipping address. Called after their first bid and
 * from checkout; both prefill from GET / above, so a returning buyer
 * confirms rather than retypes.
 *
 * Its own endpoint rather than part of PATCH /: an address is a
 * different kind of change from a bio, it has its own validation, and
 * mixing them means a bio edit could wipe a shipping address.
 */
router.put('/delivery-address', authMiddleware, async (req, res) => {
  try {
    const username = req.user?.username;
    if (!username) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { fullName, addressLine1, addressLine2, city, state, postalCode, country } =
      req.body || {};

    const clean = (value, max) =>
      typeof value === 'string' ? value.trim().slice(0, max) : '';

    const address = {
      fullName: clean(fullName, 100),
      addressLine1: clean(addressLine1, 200),
      addressLine2: clean(addressLine2, 200),
      city: clean(city, 100),
      state: clean(state, 100),
      postalCode: clean(postalCode, 20),
      country: clean(country, 56),
    };

    /* Required set matches the rest of the platform, deliberately.
       AddressConfirmationModal validates state/province as required, the
       DeliveryAddress type in @/types/order has it required, and
       PUT /api/orders/:id/address rejects an address without it.
       Accepting a looser address here would let a buyer save something
       that later fails order-level validation -- an inconsistency that
       only shows up at the worst moment. Line 2 stays optional. */
    const required = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    const missing = required.filter((field) => !address[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required address fields: ${missing.join(', ')}`,
      });
    }

    address.updatedAt = new Date();

    const user = await User.findOneAndUpdate(
      { username },
      { $set: { deliveryAddress: address } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({ success: true, data: { deliveryAddress: address } });
  } catch (err) {
    console.error('PUT /api/profilebuyer/delivery-address error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;