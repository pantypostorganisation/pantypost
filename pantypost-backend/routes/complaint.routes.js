// pantypost-backend/routes/complaint.routes.js
//
// Public complaints and content removal.
//
// The submission endpoint is deliberately UNAUTHENTICATED. Someone who
// believes they have been depicted without consent will usually have no
// account, and requiring one would make the process unusable for the
// people it most needs to serve.
//
// Two categories — non-consensual and suspected underage content — are
// removed from public view on receipt and reviewed afterwards, rather
// than remaining live during the review window.

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const Complaint = require('../models/Complaint');
const { COMPLAINT_TYPES, URGENT_TYPES } = require('../models/Complaint');
const Listing = require('../models/Listing');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const { sendEmail } = require('../config/email');

// Published commitment, surfaced by the API so the public page and the
// backend can never drift apart.
const RESOLUTION_BUSINESS_DAYS = 5;

/**
 * Rate limit for anonymous submissions.
 * Set high enough not to obstruct legitimate complainants (someone may
 * report several items in one sitting) but low enough to deter floods.
 */
const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many complaints submitted from this address. Please try again later, or email support@pantypost.com if this is urgent.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function sanitize(input, maxLength = 5000) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .slice(0, maxLength);
}

function isPlausibleEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  return next();
}

/**
 * Pull content out of public view immediately.
 *
 * Used for urgent complaint categories. The content is returned to the
 * moderation queue rather than deleted, so it can be restored if the
 * complaint proves unfounded, and preserved if it must be referred to
 * authorities.
 */
async function removeContentPendingReview(contentType, contentId, referenceCode) {
  if (!contentId) return false;

  const note = `Removed from public view pending complaint ${referenceCode}`;

  try {
    if (contentType === 'listing') {
      const listing = await Listing.findById(contentId);
      if (!listing) return false;
      listing.approvalStatus = 'pending';
      listing.requiresApproval = true;
      listing.approvedAt = undefined;
      listing.approvedBy = undefined;
      listing.moderationNote = note;
      await listing.save();
      return true;
    }

    if (contentType === 'post') {
      const post = await Post.findById(contentId);
      if (!post) return false;
      post.approvalStatus = 'pending';
      post.requiresApproval = true;
      post.approvedAt = undefined;
      post.approvedBy = undefined;
      post.moderationNote = note;
      await post.save();
      return true;
    }
  } catch (error) {
    console.error('[Complaints] Failed to remove content pending review:', error.message);
  }

  return false;
}

/**
 * Email the compliance inbox.
 *
 * In-app notifications alone are not enough: a five business day
 * commitment cannot depend on someone happening to open the dashboard.
 * Failures are logged and swallowed — a complaint must never be lost
 * because the mail server was unreachable.
 */
async function emailComplianceInbox(complaint) {
  const to =
    process.env.COMPLAINTS_EMAIL ||
    process.env.EMAIL_USER ||
    'support@pantypost.com';

  const isUrgent = URGENT_TYPES.includes(complaint.complaintType);
  const dueDate = new Date(complaint.dueBy).toLocaleDateString('en-AU');

  try {
    await sendEmail({
      to,
      subject: `${isUrgent ? '[URGENT] ' : ''}Complaint ${complaint.referenceCode} — ${complaint.complaintType}`,
      text: [
        `Reference: ${complaint.referenceCode}`,
        `Category: ${complaint.complaintType}`,
        `Priority: ${complaint.priority}`,
        `Received: ${new Date(complaint.receivedAt).toLocaleString('en-AU')}`,
        `Due by: ${dueDate}`,
        '',
        `From: ${complaint.complainantEmail}`,
        complaint.complainantName ? `Name: ${complaint.complainantName}` : '',
        complaint.reportedUser ? `About user: ${complaint.reportedUser}` : '',
        complaint.contentUrl ? `Content: ${complaint.contentUrl}` : '',
        complaint.declaresDepicted ? 'The complainant states they are the person depicted.' : '',
        complaint.contentRemovedOnReceipt
          ? 'The content was withdrawn from public view automatically on receipt.'
          : '',
        '',
        'Description:',
        complaint.description,
        '',
        `Review at: ${process.env.FRONTEND_URL || 'https://pantypost.com'}/admin/complaints`,
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px">
          ${isUrgent ? '<p style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px;color:#991b1b"><strong>Urgent category.</strong> This requires immediate review.</p>' : ''}
          <h2 style="margin:0 0 4px">Complaint ${complaint.referenceCode}</h2>
          <p style="color:#666;margin:0 0 16px">Due by <strong>${dueDate}</strong></p>
          <table style="border-collapse:collapse;width:100%;font-size:14px">
            <tr><td style="padding:6px 0;color:#666">Category</td><td>${complaint.complaintType}</td></tr>
            <tr><td style="padding:6px 0;color:#666">Priority</td><td>${complaint.priority}</td></tr>
            <tr><td style="padding:6px 0;color:#666">From</td><td>${complaint.complainantEmail}</td></tr>
            ${complaint.reportedUser ? `<tr><td style="padding:6px 0;color:#666">About</td><td>${complaint.reportedUser}</td></tr>` : ''}
            ${complaint.contentUrl ? `<tr><td style="padding:6px 0;color:#666">Content</td><td><a href="${complaint.contentUrl}">${complaint.contentUrl}</a></td></tr>` : ''}
          </table>
          ${complaint.declaresDepicted ? '<p style="color:#991b1b"><strong>The complainant states they are the person depicted.</strong></p>' : ''}
          ${complaint.contentRemovedOnReceipt ? '<p style="color:#065f46">The content was withdrawn from public view automatically on receipt.</p>' : ''}
          <h3 style="margin:20px 0 6px">Description</h3>
          <p style="white-space:pre-wrap;background:#f9fafb;padding:12px;border-radius:6px">${String(complaint.description).replace(/</g, '&lt;')}</p>
          <p style="margin-top:20px"><a href="${process.env.FRONTEND_URL || 'https://pantypost.com'}/admin/complaints" style="background:#ff950e;color:#000;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Review complaint</a></p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Complaints] Failed to email compliance inbox:', error.message);
  }
}

/**
 * Acknowledge receipt to the complainant, with their reference code and
 * the date by which they will hear back.
 */
async function emailAcknowledgement(complaint) {
  const dueDate = new Date(complaint.dueBy).toLocaleDateString('en-AU');

  try {
    await sendEmail({
      to: complaint.complainantEmail,
      subject: `We have received your complaint (${complaint.referenceCode})`,
      text: [
        'Thank you for contacting PantyPost.',
        '',
        `Your reference is ${complaint.referenceCode}. Please keep it — you can use it to check progress at any time, without needing an account.`,
        '',
        complaint.contentRemovedOnReceipt
          ? 'The content you reported has already been withdrawn from public view while we investigate.'
          : '',
        `We will investigate and respond by ${dueDate} (within five business days).`,
        '',
        `Check progress: ${process.env.FRONTEND_URL || 'https://pantypost.com'}/complaints`,
        '',
        'PantyPost',
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px">
          <h2 style="margin:0 0 12px">We have received your complaint</h2>
          <p>Thank you for contacting PantyPost.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0;color:#666;font-size:13px">Your reference</p>
            <p style="margin:4px 0 0;font-family:monospace;font-size:20px;font-weight:700">${complaint.referenceCode}</p>
          </div>
          ${complaint.contentRemovedOnReceipt ? '<p style="background:#ecfdf5;border-left:4px solid #059669;padding:12px;color:#065f46">The content you reported has already been withdrawn from public view while we investigate.</p>' : ''}
          <p>We will investigate and respond by <strong>${dueDate}</strong>, within five business days.</p>
          <p>You can check progress at any time using your reference — no account needed.</p>
          <p><a href="${process.env.FRONTEND_URL || 'https://pantypost.com'}/complaints">Check the status of your complaint</a></p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Complaints] Failed to send acknowledgement:', error.message);
  }
}

/** Alert every admin. Urgent categories should not wait to be noticed. */
async function alertAdmins(complaint) {
  try {
    const admins = await User.find({ role: 'admin' }).select('username').lean();
    const isUrgent = URGENT_TYPES.includes(complaint.complaintType);

    for (const admin of admins) {
      await Notification.createNotification({
        recipient: admin.username,
        type: 'admin_alert',
        title: isUrgent ? 'URGENT complaint received' : 'New complaint received',
        message: isUrgent
          ? `Urgent complaint ${complaint.referenceCode} requires immediate review.`
          : `Complaint ${complaint.referenceCode} received. Due by ${new Date(complaint.dueBy).toLocaleDateString()}.`,
        data: {
          complaintId: String(complaint._id),
          referenceCode: complaint.referenceCode,
          complaintType: complaint.complaintType,
          priority: complaint.priority,
        },
        priority: 'high',
      });
    }
  } catch (error) {
    console.error('[Complaints] Failed to alert admins:', error.message);
  }
}

/* =====================================================================
 * GET /api/complaints/info
 *
 * Public. Lets the complaints page render its categories and stated
 * turnaround from a single source of truth.
 * ===================================================================== */
router.get('/info', (req, res) => {
  return res.json({
    success: true,
    data: {
      resolutionBusinessDays: RESOLUTION_BUSINESS_DAYS,
      complaintTypes: COMPLAINT_TYPES,
      urgentTypes: URGENT_TYPES,
      contactEmail: 'support@pantypost.com',
    },
  });
});

/* =====================================================================
 * POST /api/complaints/submit
 *
 * PUBLIC — no authentication required, by design.
 * ===================================================================== */
router.post('/submit', complaintLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    const complaintType = COMPLAINT_TYPES.includes(body.complaintType)
      ? body.complaintType
      : null;

    if (!complaintType) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid complaint category.',
      });
    }

    if (!isPlausibleEmail(body.complainantEmail)) {
      return res.status(400).json({
        success: false,
        error: 'A valid email address is required so we can send you our response.',
      });
    }

    const description = sanitize(body.description, 5000);
    if (description.length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Please describe the issue in at least 20 characters so we can investigate properly.',
      });
    }

    // If the submitter happens to be logged in, record who they are.
    // Never required.
    let complainantUsername = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        complainantUsername = decoded.username;
      } catch (error) {
        // Anonymous submission — entirely acceptable.
      }
    }

    const validContentTypes = ['listing', 'post', 'profile', 'gallery_image', 'message', 'other'];
    const contentType = validContentTypes.includes(body.contentType) ? body.contentType : 'other';

    const complaint = new Complaint({
      complaintType,
      complainantName: sanitize(body.complainantName, 200),
      complainantEmail: String(body.complainantEmail).toLowerCase().trim(),
      complainantUsername,
      contentUrl: sanitize(body.contentUrl, 2000),
      contentType,
      contentId: body.contentId ? sanitize(String(body.contentId), 100) : null,
      reportedUser: body.reportedUser ? sanitize(String(body.reportedUser), 50) : null,
      description,
      declaresDepicted: body.declaresDepicted === true,
      submitterIp: req.ip,
    });

    complaint.addAudit(
      complainantUsername || 'anonymous',
      'complaint_received',
      `Submitted via public form (${complaintType})`
    );

    // Immediate removal for urgent categories, before saving the
    // outcome, so the audit trail records what actually happened.
    if (URGENT_TYPES.includes(complaintType)) {
      const removed = await removeContentPendingReview(
        contentType,
        complaint.contentId,
        complaint.referenceCode
      );
      complaint.contentRemovedOnReceipt = removed;
      complaint.status = 'escalated';
      complaint.addAudit(
        'system',
        removed ? 'content_removed_pending_review' : 'urgent_flagged',
        removed
          ? 'Content withdrawn from public view automatically on receipt.'
          : 'Urgent category flagged. No content id supplied, so manual location is required.'
      );
    }

    await complaint.save();

    // All non-blocking: a delivery failure must not cost us a complaint.
    alertAdmins(complaint).catch(() => {});
    emailComplianceInbox(complaint).catch(() => {});
    emailAcknowledgement(complaint).catch(() => {});

    console.log(
      `[Complaints] ${complaint.referenceCode} received (${complaintType}, ${complaint.priority})`
    );

    return res.status(201).json({
      success: true,
      data: {
        referenceCode: complaint.referenceCode,
        resolutionBusinessDays: RESOLUTION_BUSINESS_DAYS,
        dueBy: complaint.dueBy,
        contentRemoved: complaint.contentRemovedOnReceipt,
      },
      message: complaint.contentRemovedOnReceipt
        ? 'Your complaint has been received and the content has been withdrawn from public view while we investigate.'
        : `Your complaint has been received. We will investigate and respond within ${RESOLUTION_BUSINESS_DAYS} business days.`,
    });
  } catch (error) {
    console.error('[Complaints] Error submitting complaint:', error);
    return res.status(500).json({
      success: false,
      error: 'We could not record your complaint. Please email support@pantypost.com so it is not lost.',
    });
  }
});

/* =====================================================================
 * GET /api/complaints/status/:referenceCode
 *
 * PUBLIC. Lets a complainant with no account check progress. Returns
 * only status information — never the complaint contents or anything
 * about the reported party.
 * ===================================================================== */
router.get('/status/:referenceCode', async (req, res) => {
  try {
    const code = String(req.params.referenceCode || '').toUpperCase().slice(0, 32);
    const complaint = await Complaint.findOne({ referenceCode: code })
      .select('referenceCode status receivedAt dueBy resolvedAt resolutionSummary')
      .lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'No complaint found with that reference.',
      });
    }

    return res.json({
      success: true,
      data: {
        referenceCode: complaint.referenceCode,
        status: complaint.status,
        receivedAt: complaint.receivedAt,
        dueBy: complaint.dueBy,
        resolvedAt: complaint.resolvedAt || null,
        resolutionSummary: complaint.resolutionSummary || null,
      },
    });
  } catch (error) {
    console.error('[Complaints] Error checking status:', error);
    return res.status(500).json({ success: false, error: 'Failed to check complaint status' });
  }
});

/* =====================================================================
 * ADMIN ROUTES
 * ===================================================================== */

/* GET /api/complaints — queue, urgent and oldest first. */
router.get('/', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const filter = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.complaintType) filter.complaintType = req.query.complaintType;
    if (req.query.overdue === 'true') {
      filter.dueBy = { $lt: new Date() };
      filter.status = { $nin: ['action_taken', 'dismissed'] };
    }

    const priorityOrder = { critical: 0, urgent: 1, standard: 2 };

    const complaints = await Complaint.find(filter)
      .sort({ receivedAt: 1 })
      .lean();

    // Sort by priority first, then age, so urgent items surface even if
    // they arrived most recently.
    complaints.sort((a, b) => {
      const p = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (p !== 0) return p;
      return new Date(a.receivedAt) - new Date(b.receivedAt);
    });

    const total = complaints.length;
    const pageItems = complaints.slice((page - 1) * limit, page * limit);

    const now = new Date();
    const decorated = pageItems.map(c => ({
      ...c,
      isOverdue:
        !['action_taken', 'dismissed'].includes(c.status) && c.dueBy && now > new Date(c.dueBy),
    }));

    return res.json({
      success: true,
      data: {
        complaints: decorated,
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error('[Complaints] Error fetching complaints:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch complaints' });
  }
});

/* GET /api/complaints/report/:year/:month — monthly compliance figures.
 * Declared above '/:id' so the id handler cannot capture it. */
router.get('/report/:year/:month', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Invalid year or month' });
    }

    const report = await Complaint.getMonthlyReport(year, month);
    return res.json({ success: true, data: report });
  } catch (error) {
    console.error('[Complaints] Error generating monthly report:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

/* GET /api/complaints/stats — dashboard counters.
 * Also declared above '/:id'. */
router.get('/stats', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const now = new Date();
    const [open, overdue, urgentOpen, total] = await Promise.all([
      Complaint.countDocuments({ status: { $nin: ['action_taken', 'dismissed'] } }),
      Complaint.countDocuments({
        status: { $nin: ['action_taken', 'dismissed'] },
        dueBy: { $lt: now },
      }),
      Complaint.countDocuments({
        status: { $nin: ['action_taken', 'dismissed'] },
        priority: { $in: ['urgent', 'critical'] },
      }),
      Complaint.countDocuments({}),
    ]);

    return res.json({
      success: true,
      data: { open, overdue, urgentOpen, total },
    });
  } catch (error) {
    console.error('[Complaints] Error fetching stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/* GET /api/complaints/:id */
router.get('/:id', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).lean();
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }
    return res.json({ success: true, data: complaint });
  } catch (error) {
    console.error('[Complaints] Error fetching complaint:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch complaint' });
  }
});

/* PATCH /api/complaints/:id — record progress or resolution. */
router.patch('/:id', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, error: 'Complaint not found' });
    }

    const { status, resolutionSummary, actionTaken, note } = req.body || {};
    const admin = req.user.username;

    const validStatuses = ['received', 'under_review', 'action_taken', 'dismissed', 'escalated'];
    if (status && validStatuses.includes(status)) {
      complaint.addAudit(admin, 'status_changed', `${complaint.status} -> ${status}`);
      complaint.status = status;

      if (['action_taken', 'dismissed'].includes(status) && !complaint.resolvedAt) {
        complaint.resolvedAt = new Date();
      }
    }

    if (typeof resolutionSummary === 'string') {
      complaint.resolutionSummary = sanitize(resolutionSummary, 2000);
    }

    const validActions = [
      'content_removed', 'content_restored', 'account_suspended', 'account_banned',
      'warning_issued', 'no_action_required', 'referred_to_authorities',
    ];
    if (actionTaken && validActions.includes(actionTaken)) {
      complaint.actionTaken = actionTaken;
      complaint.addAudit(admin, 'action_recorded', actionTaken);
    }

    if (note) {
      complaint.addAudit(admin, 'note_added', sanitize(note, 2000));
    }

    complaint.handledBy = admin;
    await complaint.save();

    return res.json({ success: true, data: complaint });
  } catch (error) {
    console.error('[Complaints] Error updating complaint:', error);
    return res.status(500).json({ success: false, error: 'Failed to update complaint' });
  }
});

module.exports = router;