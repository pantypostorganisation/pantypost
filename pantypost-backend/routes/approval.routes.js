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

function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
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
async function notifyOwner(username, { title, message, link }) {
  try {
    if (!username) return;
    const user = await User.findOne({ username });
    if (!user) return;

    // NOTE: field shape follows the usage in server.js
    // (recipient / type / title / message / link / priority).
    // post.routes.js uses a different shape (userId / data), so the
    // Notification model needs checking to confirm which is canonical.
    await Notification.create({
      recipient: username,
      type: 'admin_alert',
      title,
      message,
      link,
      priority: 'high',
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

      await Notification.create({
        recipient: subscriberUsername,
        type: 'post',
        title: 'New Post',
        message: `${post.author} shared a new post`,
        link: `/explore/post/${post._id}`,
        priority: 'low',
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
    const typeKeys = requested
      ? (CONTENT_TYPES[requested] ? [requested] : [])
      : Object.keys(CONTENT_TYPES);

    if (typeKeys.length === 0) {
      return res.status(400).json({ success: false, error: 'Unknown contentType' });
    }

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

    // Interleave types by age rather than grouping them, so a post
    // submitted first is reviewed before a listing submitted later.
    const combined = results
      .flat()
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
    counts.total = entries.reduce((sum, [, count]) => sum + count, 0);

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
    const config = resolveContentType(body.contentType);

    if (!config) {
      return res.status(400).json({ success: false, error: 'Unknown contentType' });
    }
    if (!isValidObjectId(contentId)) {
      return res.status(400).json({ success: false, error: 'Invalid contentId' });
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
      title: `${config.label} approved`,
      message: `Your ${config.label.toLowerCase()} has been reviewed and is now live.`,
      link: typeKey === 'post' ? `/explore/post/${doc._id}` : `/browse/${doc._id}`,
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
    const config = resolveContentType(body.contentType);
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : undefined;

    if (!config) {
      return res.status(400).json({ success: false, error: 'Unknown contentType' });
    }
    if (!isValidObjectId(contentId)) {
      return res.status(400).json({ success: false, error: 'Invalid contentId' });
    }

    const doc = await config.model.findById(contentId);
    if (!doc) {
      return res.status(404).json({ success: false, error: `${config.label} not found` });
    }

    markDenied(doc, req.user.username, reason);
    await doc.save();

    await notifyOwner(doc[config.ownerField], {
      title: `${config.label} not approved`,
      message: reason
        ? `Your ${config.label.toLowerCase()} was not approved: ${reason}`
        : `Your ${config.label.toLowerCase()} was not approved. Please review our content guidelines.`,
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
