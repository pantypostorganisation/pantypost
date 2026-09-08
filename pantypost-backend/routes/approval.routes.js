// pantypost-backend/routes/approval.routes.js
//
// Unified pre-publication moderation queue.
//
// Previously this handled listings only, which left social/Explore
// posts publishing with no review at all. It now covers every moderated
// content type behind a single admin interface, so there is one queue
// and one audit trail rather than several.

const express = require('express');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth.middleware');
const { markApproved, markDenied } = require('../utils/moderation');

const router = express.Router();

const PAGE_SIZE = 10;

// Registry of everything subject to review. Adding a new moderated
// content type means adding one entry here rather than a new endpoint.
const CONTENT_TYPES = {
  listing: {
    model: Listing,
    ownerField: 'seller',
    label: 'Listing',
    titleOf: (doc) => doc.title,
  },
  post: {
    model: Post,
    ownerField: 'author',
    label: 'Post',
    // Posts have no title, so use a short excerpt for the queue.
    titleOf: (doc) => {
      const text = (doc.content || '').trim();
      if (!text) return '(media only)';
      return text.length > 80 ? `${text.slice(0, 80)}…` : text;
    },
  },
};

/* =====================================================================
 * PROFILE MEDIA
 *
 * Profile pictures and gallery images are subdocuments of User rather
 * than records in their own collection, so they need dedicated handling
 * instead of the generic model lookup used for listings and posts.
 *
 * Approval MOVES the image into the live field (profilePic /
 * galleryImages); denial records a reason and leaves it out of view.
 * ===================================================================== */

/** Collect every profile picture currently awaiting review. */
async function fetchPendingProfilePics() {
  const users = await User.find({ 'pendingProfilePic.status': 'pending' })
    .select('username role pendingProfilePic profilePic')
    .lean();

  return users
    .filter((u) => u.pendingProfilePic?.url)
    .map((u) => ({
      _id: String(u._id),
      id: String(u._id),
      contentType: 'profile_pic',
      contentLabel: 'Profile picture',
      displayTitle: `Profile picture — ${u.username}`,
      owner: u.username,
      imageUrls: [u.pendingProfilePic.url],
      createdAt: u.pendingProfilePic.submittedAt,
      approvalStatus: 'pending',
      // Lets the reviewer compare against the currently live image.
      previousImage: u.profilePic,
    }));
}

/** Collect every cover photo currently awaiting review. */
async function fetchPendingCoverPhotos() {
  const users = await User.find({ 'pendingCoverPhoto.status': 'pending' })
    .select('username role pendingCoverPhoto coverPhoto')
    .lean();

  return users
    .filter((u) => u.pendingCoverPhoto?.url)
    .map((u) => ({
      _id: String(u._id),
      id: String(u._id),
      contentType: 'cover_photo',
      contentLabel: 'Cover photo',
      displayTitle: `Cover photo — ${u.username}`,
      owner: u.username,
      imageUrls: [u.pendingCoverPhoto.url],
      createdAt: u.pendingCoverPhoto.submittedAt,
      approvalStatus: 'pending',
      // Lets the reviewer compare against the currently live banner.
      previousImage: u.coverPhoto,
    }));
}

/** Collect every gallery image currently awaiting review. */
async function fetchPendingGalleryImages() {
  const users = await User.find({ 'pendingGalleryImages.status': 'pending' })
    .select('username pendingGalleryImages')
    .lean();

  const items = [];
  for (const u of users) {
    for (const entry of u.pendingGalleryImages || []) {
      if (entry.status !== 'pending' || !entry.url) continue;
      items.push({
        _id: String(entry._id),
        id: String(entry._id),
        contentType: 'gallery_image',
        contentLabel: 'Gallery image',
        displayTitle: `Gallery image — ${u.username}`,
        owner: u.username,
        imageUrls: [entry.url],
        createdAt: entry.submittedAt,
        approvalStatus: 'pending',
      });
    }
  }
  return items;
}

/**
 * Approve or deny a profile picture.
 * @param {string} userId   The User document id.
 * @param {boolean} approve
 */
async function decideProfilePic(userId, approve, adminUsername, reason) {
  const user = await User.findById(userId);
  if (!user || !user.pendingProfilePic?.url) return null;

  const url = user.pendingProfilePic.url;

  if (approve) {
    // Promote the reviewed image to the live field.
    user.profilePic = url;
    user.settings = user.settings || {};
    user.settings.profilePic = url;
    user.settings.profilePicture = url;
    user.pendingProfilePic = undefined;
  } else {
    user.pendingProfilePic.status = 'denied';
    user.pendingProfilePic.deniedAt = new Date();
    user.pendingProfilePic.deniedBy = adminUsername;
    user.pendingProfilePic.denialReason = reason;
  }

  await user.save();
  return { owner: user.username, url };
}

/**
 * Approve or deny a cover photo.
 * @param {string} userId   The User document id.
 * @param {boolean} approve
 */
async function decideCoverPhoto(userId, approve, adminUsername, reason) {
  const user = await User.findById(userId);
  if (!user || !user.pendingCoverPhoto?.url) return null;

  const url = user.pendingCoverPhoto.url;

  if (approve) {
    // Promote the reviewed banner to the live field.
    user.coverPhoto = url;
    user.pendingCoverPhoto = undefined;
  } else {
    user.pendingCoverPhoto.status = 'denied';
    user.pendingCoverPhoto.deniedAt = new Date();
    user.pendingCoverPhoto.deniedBy = adminUsername;
    user.pendingCoverPhoto.denialReason = reason;
  }

  await user.save();
  return { owner: user.username, url };
}

/**
 * Approve or deny a single gallery image, identified by its
 * subdocument id.
 */
async function decideGalleryImage(entryId, approve, adminUsername, reason) {
  const user = await User.findOne({ 'pendingGalleryImages._id': entryId });
  if (!user) return null;

  const entry = user.pendingGalleryImages.id(entryId);
  if (!entry) return null;

  const url = entry.url;

  if (approve) {
    if (!Array.isArray(user.galleryImages)) user.galleryImages = [];
    if (!user.galleryImages.includes(url)) {
      user.galleryImages.push(url);
    }
    entry.deleteOne(); // approved images leave the pending array
  } else {
    entry.status = 'denied';
    entry.deniedAt = new Date();
    entry.deniedBy = adminUsername;
    entry.denialReason = reason;
  }

  await user.save();
  return { owner: user.username, url };
}

/**
 * Profile media types, keyed by the contentType the admin UI sends.
 *
 * These are subdocuments of User rather than records in their own
 * collection, so they cannot go through CONTENT_TYPES above. Registering
 * them here means adding a further moderated media type is one entry,
 * not another pair of branches in /approve and /deny.
 */
const MEDIA_TYPES = {
  profile_pic: { label: 'Profile picture', decide: decideProfilePic },
  cover_photo: { label: 'Cover photo', decide: decideCoverPhoto },
  gallery_image: { label: 'Gallery image', decide: decideGalleryImage },
};

/* Moderators exist to work this queue, so they pass the same gate as
   admins here -- and ONLY here. Every other admin surface (wallets,
   bans, withdrawals, analytics) keeps its own role check and stays
   admin-only. */
function ensureAdmin(req, res, next) {
  const role = req.user && req.user.role;
  if (role !== 'admin' && role !== 'moderator') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  return next();
}

function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Resolve the content type from a request, defaulting to 'listing' so
 * that older clients calling this API without a contentType field keep
 * working exactly as before.
 */
function resolveContentType(value) {
  if (!value) return CONTENT_TYPES.listing;
  return CONTENT_TYPES[value] || null;
}

/**
 * Shape a document into the common structure the admin queue renders,
 * while preserving all original fields for backward compatibility.
 */
function decorate(doc, typeKey) {
  const config = CONTENT_TYPES[typeKey];
  return {
    ...doc,
    contentType: typeKey,
    contentLabel: config.label,
    displayTitle: config.titleOf(doc),
    owner: doc[config.ownerField],
  };
}

/**
 * Notify a content owner about a moderation decision.
 * Best-effort: a notification failure must never roll back the decision.
 */
async function notifyOwner(username, { type, title, message, data, relatedId, relatedType }) {
  try {
    if (!username) return;

    // Uses the createNotification static rather than Notification.create()
    // because the static also emits the WebSocket event, so the bell
    // updates live instead of only on next page load.
    await Notification.createNotification({
      recipient: username,
      type,
      title,
      message,
      data: data || {},
      priority: 'high',
      relatedId: relatedId || null,
      relatedType: relatedType || null,
    });
  } catch (error) {
    console.error('[Approval] Failed to notify owner:', error.message);
  }
}

/**
 * On approving a post, notify the author's subscribers.
 * This was deliberately moved out of post creation: notifying at
 * creation time would announce content before anyone had reviewed it.
 */
async function notifySubscribersOfPost(post) {
  try {
    const subscriptions = await Subscription.find({
      sellerUsername: post.author,
      status: 'active',
    }).populate('subscriberId', 'username');

    for (const sub of subscriptions) {
      const subscriberUsername = sub.subscriberId?.username;
      if (!subscriberUsername) continue;

      await Notification.createNotification({
        recipient: subscriberUsername,
        type: 'post',
        title: 'New Post',
        message: `${post.author} shared a new post`,
        data: { postId: post._id, author: post.author },
        priority: 'low',
        relatedId: String(post._id),
        relatedType: 'post',
      });
    }
  } catch (error) {
    console.error('[Approval] Failed to notify subscribers:', error.message);
  }
}

/* =====================================================================
 * GET /api/admin/approval/pending
 *
 * Returns everything awaiting review. Accepts ?contentType=listing|post
 * to narrow the queue; with no parameter it returns all types, oldest
 * first, so nothing waits indefinitely behind newer submissions.
 * ===================================================================== */
router.get('/pending', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const requested = req.query.contentType;

    // Which types to include in this response.
    const isMediaType = Boolean(requested && MEDIA_TYPES[requested]);

    if (requested && !CONTENT_TYPES[requested] && !isMediaType) {
      return res.status(400).json({ success: false, error: 'Unknown contentType' });
    }

    // Document-backed types only; media types are handled below.
    const typeKeys = requested
      ? (CONTENT_TYPES[requested] ? [requested] : [])
      : Object.keys(CONTENT_TYPES);

    const results = await Promise.all(
      typeKeys.map(async (key) => {
        const { model } = CONTENT_TYPES[key];
        const docs = await model
          .find({ approvalStatus: 'pending' })
          .sort({ createdAt: 1 }) // oldest first — fairest for creators
          .lean();
        return docs.map((doc) => decorate(doc, key));
      })
    );

    // Profile media lives on User rather than in its own collection,
    // so it is gathered separately and merged into the same queue.
    const mediaResults = [];
    if (!requested || requested === 'profile_pic') {
      mediaResults.push(await fetchPendingProfilePics());
    }
    if (!requested || requested === 'cover_photo') {
      mediaResults.push(await fetchPendingCoverPhotos());
    }
    if (!requested || requested === 'gallery_image') {
      mediaResults.push(await fetchPendingGalleryImages());
    }

    // Interleave types by age rather than grouping them, so a post
    // submitted first is reviewed before a listing submitted later.
    const combined = [...results.flat(), ...mediaResults.flat()]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.json({ success: true, data: combined });
  } catch (error) {
    console.error('[Approval] Error fetching pending content:', error);
    return res.status(500).json({ success: false, error: 'Failed to load pending content' });
  }
});

/* =====================================================================
 * GET /api/admin/approval/counts
 * Lightweight badge counts for the admin dashboard.
 * ===================================================================== */
router.get('/counts', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const entries = await Promise.all(
      Object.keys(CONTENT_TYPES).map(async (key) => {
        const count = await CONTENT_TYPES[key].model.countDocuments({ approvalStatus: 'pending' });
        return [key, count];
      })
    );

    const counts = Object.fromEntries(entries);

    // Profile media counts come from User rather than a dedicated model.
    const [pics, covers, galleries] = await Promise.all([
      fetchPendingProfilePics(),
      fetchPendingCoverPhotos(),
      fetchPendingGalleryImages(),
    ]);
    counts.profile_pic = pics.length;
    counts.cover_photo = covers.length;
    counts.gallery_image = galleries.length;

    counts.total =
      entries.reduce((sum, [, count]) => sum + count, 0) +
      pics.length +
      covers.length +
      galleries.length;

    return res.json({ success: true, data: counts });
  } catch (error) {
    console.error('[Approval] Error fetching counts:', error);
    return res.status(500).json({ success: false, error: 'Failed to load counts' });
  }
});

/* =====================================================================
 * POST /api/admin/approval/approve
 * Body: { listingId | contentId, contentType? }
 * ===================================================================== */
router.post('/approve', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    // 'listingId' is accepted for backward compatibility with the
    // existing admin UI, which predates multi-type moderation.
    const contentId = body.contentId || body.listingId;

    if (!isValidObjectId(contentId)) {
      return res.status(400).json({ success: false, error: 'Invalid contentId' });
    }

    // Profile media is stored on User, so it takes a different path.
    const mediaConfig = MEDIA_TYPES[body.contentType];
    if (mediaConfig) {
      const result = await mediaConfig.decide(contentId, true, req.user.username);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Pending image not found' });
      }

      const label = mediaConfig.label;
      await notifyOwner(result.owner, {
        type: 'content_approved',
        title: `${label} approved`,
        message: `Your ${label.toLowerCase()} has been reviewed and is now visible on your profile.`,
        data: { contentType: body.contentType, url: result.url },
        relatedType: 'user',
        relatedId: result.owner,
      });

      console.log(`[Approval] ${label} for ${result.owner} approved by ${req.user.username}`);
      return res.json({ success: true, data: { owner: result.owner, url: result.url } });
    }

    const config = resolveContentType(body.contentType);
    if (!config) {
      return res.status(400).json({ success: false, error: 'Unknown contentType' });
    }

    const doc = await config.model.findById(contentId);
    if (!doc) {
      return res.status(404).json({ success: false, error: `${config.label} not found` });
    }

    markApproved(doc, req.user.username);
    await doc.save();

    const owner = doc[config.ownerField];
    const typeKey = body.contentType || 'listing';

    await notifyOwner(owner, {
      type: 'content_approved',
      title: `${config.label} approved`,
      message: `Your ${config.label.toLowerCase()} has been reviewed and is now live.`,
      data: { contentType: typeKey, contentId: String(doc._id) },
      relatedId: String(doc._id),
      relatedType: typeKey,
    });

    // Subscriber announcements happen here rather than at creation,
    // so nothing is broadcast before review.
    if (typeKey === 'post') {
      await notifySubscribersOfPost(doc);
    }

    console.log(`[Approval] ${config.label} ${contentId} approved by ${req.user.username}`);

    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('[Approval] Error approving content:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve content' });
  }
});

/* =====================================================================
 * POST /api/admin/approval/deny
 * Body: { listingId | contentId, contentType?, reason? }
 * ===================================================================== */
router.post('/deny', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const contentId = body.contentId || body.listingId;
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : undefined;

    if (!isValidObjectId(contentId)) {
      return res.status(400).json({ success: false, error: 'Invalid contentId' });
    }

    const mediaConfig = MEDIA_TYPES[body.contentType];
    if (mediaConfig) {
      const result = await mediaConfig.decide(contentId, false, req.user.username, reason);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Pending image not found' });
      }

      const label = mediaConfig.label;
      await notifyOwner(result.owner, {
        type: 'content_denied',
        title: `${label} not approved`,
        message: reason
          ? `Your ${label.toLowerCase()} was not approved: ${reason}`
          : `Your ${label.toLowerCase()} was not approved. Please review our content guidelines.`,
        data: { contentType: body.contentType, reason },
        relatedType: 'user',
        relatedId: result.owner,
      });

      console.log(`[Approval] ${label} for ${result.owner} denied by ${req.user.username}`);
      return res.json({ success: true, data: { owner: result.owner, url: result.url } });
    }

    const config = resolveContentType(body.contentType);
    if (!config) {
      return res.status(400).json({ success: false, error: 'Unknown contentType' });
    }

    const doc = await config.model.findById(contentId);
    if (!doc) {
      return res.status(404).json({ success: false, error: `${config.label} not found` });
    }

    markDenied(doc, req.user.username, reason);
    await doc.save();

    await notifyOwner(doc[config.ownerField], {
      type: 'content_denied',
      title: `${config.label} not approved`,
      message: reason
        ? `Your ${config.label.toLowerCase()} was not approved: ${reason}`
        : `Your ${config.label.toLowerCase()} was not approved. Please review our content guidelines.`,
      data: { contentType: body.contentType || 'listing', contentId: String(doc._id), reason },
      relatedId: String(doc._id),
      relatedType: body.contentType || 'listing',
    });

    console.log(`[Approval] ${config.label} ${contentId} denied by ${req.user.username}`);

    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('[Approval] Error denying content:', error);
    return res.status(500).json({ success: false, error: 'Failed to deny content' });
  }
});

/* =====================================================================
 * GET /api/admin/approval/history
 *
 * Audit trail of past decisions. SegPay's compliance requirements
 * include being able to evidence that review actually takes place, so
 * this records who decided what and when.
 * ===================================================================== */
router.get('/history', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const type = ['approved', 'denied'].includes(req.query.type) ? req.query.type : 'all';
    const requested = req.query.contentType;

    const typeKeys = requested
      ? (CONTENT_TYPES[requested] ? [requested] : [])
      : Object.keys(CONTENT_TYPES);

    if (typeKeys.length === 0) {
      return res.status(400).json({ success: false, error: 'Unknown contentType' });
    }

    const statusFilter = {
      approvalStatus: type === 'all' ? { $in: ['approved', 'denied'] } : type,
    };

    // Gather from each collection, then paginate the merged result.
    const perType = await Promise.all(
      typeKeys.map(async (key) => {
        const docs = await CONTENT_TYPES[key].model
          .find(statusFilter)
          .sort({ approvedAt: -1, deniedAt: -1, createdAt: -1 })
          .limit(PAGE_SIZE * 10) // bounded to keep the merge cheap
          .lean();
        return docs.map((doc) => decorate(doc, key));
      })
    );

    const combined = perType.flat().sort((a, b) => {
      const aDate = a.approvedAt || a.deniedAt || a.createdAt;
      const bDate = b.approvedAt || b.deniedAt || b.createdAt;
      return new Date(bDate) - new Date(aDate);
    });

    const total = combined.length;
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const pageItems = combined.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return res.json({
      success: true,
      data: {
        listings: pageItems, // key retained for backward compatibility
        items: pageItems,
        page,
        totalPages,
        total,
      },
    });
  } catch (error) {
    console.error('[Approval] Error fetching approval history:', error);
    return res.status(500).json({ success: false, error: 'Failed to load approval history' });
  }
});

module.exports = router;


