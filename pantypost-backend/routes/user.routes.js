// pantypost-backend/routes/user.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ban = require('../models/Ban');
const Review = require('../models/Review');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');
const jwt = require('jsonwebtoken');

/* =====================================================================
 * SELLER STATS
 *
 * User.rating and User.reviewCount exist on the schema but nothing ever
 * writes to them — there is no post-save hook on Review — so they are
 * always 0. The real figures have to come from the Review collection.
 *
 * This mirrors the batched helper in listing.routes.js so a seller's
 * rating reads identically on a browse card and on their profile. It is
 * written to take an array even though the profile only ever needs one
 * seller, so the two implementations stay interchangeable.
 * ===================================================================== */
async function getSellerRatings(usernames) {
  const map = new Map();
  if (!usernames || usernames.length === 0) return map;

  try {
    const unique = [...new Set(usernames.filter(Boolean))];

    const results = await Review.aggregate([
      // Only approved reviews count towards a public rating — the same
      // filter GET /api/reviews/:username applies, so the header and the
      // reviews list below it can never disagree.
      { $match: { reviewee: { $in: unique }, status: 'approved' } },
      {
        $group: {
          _id: '$reviewee',
          rating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    for (const r of results) {
      map.set(r._id, {
        rating: Math.round(r.rating * 10) / 10,
        reviewCount: r.reviewCount
      });
    }
  } catch (error) {
    console.error('[User] Error aggregating seller ratings:', error.message);
  }

  return map;
}

/**
 * Completed sales for a seller.
 *
 * Counted from Order rather than read from User.totalSales, which is
 * not reliably maintained. Orders are created with paymentStatus
 * 'completed' at purchase and move to 'refunded' if reversed, so this
 * counts paid, unreversed orders — the honest definition of a sale.
 */
async function getSellerSalesCount(username) {
  try {
    if (!username) return 0;
    return await Order.countDocuments({ seller: username, paymentStatus: 'completed' });
  } catch (error) {
    console.error('[User] Error counting seller sales:', error.message);
    return 0;
  }
}

// ============= USER ROUTES =============

// GET /api/users/stats - Get user statistics (PUBLIC)
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalBuyers, totalSellers, verifiedSellers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'seller', isVerified: true })
    ]);

    // Get users joined in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newUsersToday = await User.countDocuments({ 
      createdAt: { $gte: yesterday } 
    });

    // Get users joined today (from midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newUsersTodayActual = await User.countDocuments({ 
      createdAt: { $gte: todayStart } 
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBuyers,
        totalSellers,
        verifiedSellers,
        newUsersToday: newUsersTodayActual,
        newUsers24Hours: newUsersToday,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// Escape user input before embedding it in a $regex (prevents ReDoS / regex injection)
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/users - List all users with filters
// SECURITY: public endpoint — never include PII (email, phone, verification data) here.
router.get('/', async (req, res) => {
  try {
    const { role, verified, query, page = 1, limit = 50 } = req.query;

    // Build filter
    let filter = {};
    if (role) filter.role = role;
    if (verified !== undefined) filter.isVerified = verified === 'true';

    // Search query (username/bio only — searching by email would leak account existence)
    if (query) {
      const safeQuery = escapeRegex(String(query).slice(0, 100));
      filter.$or = [
        { username: { $regex: safeQuery, $options: 'i' } },
        { bio: { $regex: safeQuery, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .select('-password -verificationData -pendingProfilePic -pendingGalleryImages -email -phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(parseInt(limit) || 50, 100));
    
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
        // Owner view: shows their pending image if one is in the queue.
        profilePic:
          user.getOwnProfilePic() ||
          user?.settings?.profilePic ||
          user?.settings?.profilePicture ||
          null,
        profilePicPendingReview: Boolean(
          user.pendingProfilePic?.url && user.pendingProfilePic.status === 'pending'
        ),
        // Owner view: their pending banner if one is in the queue.
        coverPhoto: user.getOwnCoverPhoto() || null,
        coverPhotoPendingReview: Boolean(
          user.pendingCoverPhoto?.url && user.pendingCoverPhoto.status === 'pending'
        ),
        pendingGalleryCount: Array.isArray(user.pendingGalleryImages)
          ? user.pendingGalleryImages.filter(i => i.status === 'pending').length
          : 0,
        // Approved gallery, plus what is still in the queue.
        //
        // The seller settings page used to read the gallery from the
        // PUBLIC profile endpoint, which by design returns approved
        // images only. A seller therefore uploaded images, reloaded,
        // and found them gone. Nothing was lost — the images were in
        // pendingGalleryImages the whole time, just invisible to the
        // one person entitled to see them.
        galleryImages: Array.isArray(user.galleryImages) ? user.galleryImages : [],
        pendingGalleryImages: Array.isArray(user.pendingGalleryImages)
          ? user.pendingGalleryImages
              .filter(i => i.status === 'pending' && i.url)
              .map(i => ({ id: String(i._id), url: i.url, submittedAt: i.submittedAt }))
          : [],
        country: user.country || user?.settings?.country,
        isLocationPublic: typeof user.isLocationPublic === 'boolean' ? user.isLocationPublic : true
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

    const { bio, profilePic, country, isLocationPublic } = req.body || {};

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
        // PRE-PUBLICATION REVIEW
        // Clearing the picture takes effect immediately (removing an
        // image cannot introduce prohibited content). Setting a new one
        // is queued for admin review.
        if (pic === null || pic === '' || String(pic).includes('placeholder')) {
          user.profilePic = pic;
          user.settings = user.settings || {};
          user.settings.profilePic = pic;
          user.settings.profilePicture = pic;
          user.pendingProfilePic = undefined;
        } else {
          user.submitProfilePicForReview(pic);
        }
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

    if (typeof isLocationPublic !== 'undefined') {
      if (typeof isLocationPublic !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid location privacy value' }
        });
      }
      user.isLocationPublic = isLocationPublic;
    }

    await user.save();

    const profilePicPendingReview =
      user.pendingProfilePic?.url && user.pendingProfilePic.status === 'pending';

    res.json({
      success: true,
      message: profilePicPendingReview
        ? 'Profile updated. Your new picture is awaiting review and is not yet visible to others.'
        : 'Profile updated',
      data: {
        username: user.username,
        role: user.role,
        bio: user.bio || '',
        // Owners see their own pending image so the change is visible
        // to them immediately, even though others still see the
        // approved one.
        profilePic:
          user.getOwnProfilePic() ||
          user?.settings?.profilePic ||
          user?.settings?.profilePicture ||
          null,
        profilePicPendingReview: Boolean(profilePicPendingReview),
        coverPhoto: user.getOwnCoverPhoto() || null,
        coverPhotoPendingReview: Boolean(
          user.pendingCoverPhoto?.url && user.pendingCoverPhoto.status === 'pending'
        ),
        country: user.country || user?.settings?.country,
        isLocationPublic: typeof user.isLocationPublic === 'boolean' ? user.isLocationPublic : true
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
    // Pending media is excluded here: this endpoint is public, and
    // unreviewed images must never be exposed to other users.
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -phoneNumber -verificationData -pendingProfilePic -pendingCoverPhoto -pendingGalleryImages'); // keep settings to read country

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
            isLocationPublic: typeof user.isLocationPublic === 'boolean' ? user.isLocationPublic : true,
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
    const isSeller = user.role === 'seller';

    // Aggregated from Review/Order rather than read off the User
    // document, because the stored counters are never written to.
    const [ratingsMap, salesCount] = await Promise.all([
      getSellerRatings([user.username]),
      isSeller ? getSellerSalesCount(user.username) : Promise.resolve(0)
    ]);
    const aggregate = ratingsMap.get(user.username);

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
        // Approved banner only. The pending field was excluded from the
        // query above, so there is nothing unreviewed to leak here.
        coverPhoto: isSeller ? (user.coverPhoto || null) : null,
        country: user.country || user?.settings?.country,
        isLocationPublic: typeof user.isLocationPublic === 'boolean' ? user.isLocationPublic : true,
        isVerified: user.isVerified,
        tier: user.tier,
        subscriptionPrice: user.subscriptionPrice,
        // null rather than 0 when a seller has no reviews, so the UI can
        // say "No reviews yet" instead of showing a zero-star rating.
        rating: aggregate?.rating ?? null,
        reviewCount: aggregate?.reviewCount ?? 0,
        subscriberCount: user.subscriberCount,
        totalSales: salesCount,
        joinedDate: user.joinedDate,
        // Drives "X years on Panty Post" in the profile header.
        createdAt: user.createdAt,
        role: user.role,
        galleryImages: isSeller ? user.galleryImages : undefined
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
    
    const isSeller = targetUser.role === 'seller';

    const [ratingsMap, salesCount] = await Promise.all([
      getSellerRatings([targetUser.username]),
      isSeller ? getSellerSalesCount(targetUser.username) : Promise.resolve(0)
    ]);
    const aggregate = ratingsMap.get(targetUser.username);

    const isOwner = req.user.username === targetUser.username;
    const isAdmin = req.user.role === 'admin';

    // =====================================================
    // The buyer check above only stops one authenticated user reading
    // another BUYER's record. Seller profiles fall straight through, and
    // toSafeObject() strips password, verification data and pending
    // media but NOT email, phone number, age-assurance detail, referral
    // history or ban reasons. Any logged-in account viewing a seller
    // profile was therefore receiving all of it.
    //
    // Privileged viewers (the account owner, or an admin) still get the
    // full record — the owner's own settings page depends on it.
    // Everyone else gets the same curated payload the public endpoint
    // returns, with the gallery added.
    // =====================================================
    if (!isOwner && !isAdmin) {
      return res.json({
        success: true,
        data: {
          username: targetUser.username,
          role: targetUser.role,
          bio: targetUser.bio,
          profilePic:
            targetUser.profilePic ||
            targetUser?.settings?.profilePic ||
            targetUser?.settings?.profilePicture ||
            null,
          coverPhoto: isSeller ? (targetUser.coverPhoto || null) : null,
          country: targetUser.country || targetUser?.settings?.country,
          isLocationPublic:
            typeof targetUser.isLocationPublic === 'boolean' ? targetUser.isLocationPublic : true,
          isVerified: targetUser.isVerified,
          tier: targetUser.tier,
          subscriptionPrice: targetUser.subscriptionPrice,
          rating: aggregate?.rating ?? null,
          reviewCount: aggregate?.reviewCount ?? 0,
          subscriberCount: targetUser.subscriberCount,
          totalSales: salesCount,
          joinedDate: targetUser.joinedDate,
          createdAt: targetUser.createdAt,
          galleryImages: isSeller ? targetUser.galleryImages : undefined
        }
      });
    }

    // Owner or admin: pending media is included here — the owner needs
    // to see what is sitting in the queue.
    const payload = targetUser.toSafeObject ? targetUser.toSafeObject() : targetUser.toObject();

    payload.profilePicPendingReview = Boolean(
      targetUser.pendingProfilePic?.url && targetUser.pendingProfilePic.status === 'pending'
    );
    payload.coverPhotoPendingReview = Boolean(
      targetUser.pendingCoverPhoto?.url && targetUser.pendingCoverPhoto.status === 'pending'
    );
    // Owners see their own queued banner so the change is visible to
    // them immediately, even though others still see the approved one.
    payload.coverPhoto = targetUser.getOwnCoverPhoto() || null;
    // profilePic was missing from the owner view: toSafeObject()
    // returns the APPROVED picture, so a seller who uploaded a new one
    // reloaded this page and watched their old avatar come back. The
    // upload had worked; it was queued and simply never shown to them.
    payload.profilePic =
      targetUser.getOwnProfilePic() ||
      targetUser?.settings?.profilePic ||
      targetUser?.settings?.profilePicture ||
      null;
    payload.pendingGalleryImages = Array.isArray(targetUser.pendingGalleryImages)
      ? targetUser.pendingGalleryImages
          .filter(i => i.status === 'pending' && i.url)
          .map(i => ({ id: String(i._id), url: i.url, submittedAt: i.submittedAt }))
      : [];
    payload.pendingGalleryCount = Array.isArray(targetUser.pendingGalleryImages)
      ? targetUser.pendingGalleryImages.filter(i => i.status === 'pending').length
      : 0;

    // Live figures, not the stale counters on the document.
    payload.rating = aggregate?.rating ?? null;
    payload.reviewCount = aggregate?.reviewCount ?? 0;
    payload.totalSales = salesCount;

    res.json({
      success: true,
      data: payload
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
      'settings',
      'country',
      'isLocationPublic'
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
            // PRE-PUBLICATION REVIEW
            // Removing a picture applies immediately; setting a new one
            // is queued. Admins editing another user's profile bypass
            // the queue, since an admin action is itself the review.
            if (pic === null || pic === '' || String(pic).includes('placeholder')) {
              user[field] = pic;
              user.pendingProfilePic = undefined;
            } else if (req.user.role === 'admin' && req.user.username !== req.params.username) {
              user[field] = pic;
              user.pendingProfilePic = undefined;
            } else {
              user.submitProfilePicForReview(pic);
            }
          }
        } else if (field === 'galleryImages') {
          // Handled separately below, after validation, so that invalid
          // input cannot partially mutate the gallery.
        } else if (field === 'isLocationPublic') {
          if (typeof req.body[field] === 'boolean') {
            user[field] = req.body[field];
          }
        } else {
          user[field] = req.body[field];
          if (field === 'country') {
            user.settings = user.settings || {};
            user.settings.country = req.body[field];
          }
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

      // =====================================================
      // PRE-PUBLICATION REVIEW FOR GALLERY CHANGES
      //
      // Two distinct operations are possible here:
      //   - Removing images already approved: applies immediately,
      //     since removal cannot introduce prohibited content.
      //   - Adding images not previously approved: queued for review.
      //
      // An admin editing someone else's profile bypasses the queue,
      // as the admin action is itself the review.
      // =====================================================
      const submitted = req.body.galleryImages;
      const approved = Array.isArray(user.galleryImages) ? user.galleryImages : [];
      const approvedSet = new Set(approved);

      const keptApproved = submitted.filter(url => approvedSet.has(url));
      const newlyAdded = submitted.filter(url => !approvedSet.has(url));

      const isAdminEditingOther =
        req.user.role === 'admin' && req.user.username !== req.params.username;

      if (isAdminEditingOther) {
        user.galleryImages = submitted;
      } else {
        // Retain only the approved images the user chose to keep.
        user.galleryImages = keptApproved;

        if (newlyAdded.length > 0) {
          const pending = Array.isArray(user.pendingGalleryImages)
            ? user.pendingGalleryImages
            : [];
          const alreadyPending = new Set(pending.map(entry => entry.url));
          const toQueue = newlyAdded.filter(url => !alreadyPending.has(url));

          const remainingSlots = Math.max(
            0,
            20 - user.galleryImages.length - pending.length
          );

          if (toQueue.length > remainingSlots) {
            return res.status(400).json({
              success: false,
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Gallery limit reached (20 images including any awaiting review)'
              }
            });
          }

          user.submitGalleryImagesForReview(toQueue);
        }
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
