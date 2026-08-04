// pantypost-backend/routes/customRequest.routes.js
//
// Server-side home for custom requests. See models/CustomRequest.js for
// why this exists at all — in short, the whole negotiation used to live
// in the creating user's sessionStorage, so the other party could never
// see or act on it.
//
// The rule that matters here: **turn-taking is enforced on the server.**
// Every state change goes through `canRespond()`, which checks the caller
// against `pendingWith`. A buyer cannot accept their own request, a seller
// cannot accept on the buyer's behalf, and neither can act on a request
// that is already settled — regardless of what the client sends.

const express = require('express');
const router = express.Router();
const CustomRequest = require('../models/CustomRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');
const { ERROR_CODES } = require('../utils/constants');

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const fail = (res, status, code, message) =>
  res.status(status).json({ success: false, error: { code, message } });

const isParty = (request, username) =>
  request.buyer === username || request.seller === username;

/** Strip anything tag-like. Titles and descriptions are rendered as text. */
const clean = (value, max) =>
  typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim().slice(0, max) : '';

const cleanTags = (tags) =>
  Array.isArray(tags)
    ? tags
        .map((t) => clean(t, 30))
        .filter(Boolean)
        .slice(0, 10)
    : [];

/**
 * Fire-and-forget: a failed notification must not fail the request.
 *
 * Note the field is `recipient`, not `username`, and `type` must be a
 * member of the enum in models/Notification.js. Get either wrong and
 * Mongoose validation rejects the document — silently, because this is
 * caught. That has bitten this codebase before; the model carries a
 * comment listing the types that were failing this way.
 */
async function notify(recipient, type, title, message, data) {
  try {
    await Notification.create({
      recipient,
      type,
      title,
      message,
      data: data || {},
      relatedType: 'message',
      relatedId: (data && data.requestId) || null,
      read: false
    });
  } catch (error) {
    console.error('[CustomRequest] Notification failed:', error.message);
  }
}

const validateCreate = [
  body('id').notEmpty().isString().isLength({ max: 64 }).withMessage('Invalid request id'),
  body('seller')
    .notEmpty()
    .isString()
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid seller username'),
  body('title').notEmpty().isString().isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 characters)'),
  body('description').optional().isString().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('price').isFloat({ min: 0.01, max: 10000 }).withMessage('Price must be between $0.01 and $10,000'),
  body('tags').optional().isArray({ max: 10 }).withMessage('At most 10 tags')
];

const validateRespond = [
  body('status').isIn(['accepted', 'rejected', 'edited']).withMessage('Status must be accepted, rejected or edited'),
  body('response').optional().isString().isLength({ max: 500 }),
  body('title').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('price').optional().isFloat({ min: 0.01, max: 10000 }),
  body('tags').optional().isArray({ max: 10 })
];

/* ------------------------------------------------------------------ */
/* GET /api/custom-requests                                            */
/* Every request the caller is party to. Admins may read any thread.    */
/* ------------------------------------------------------------------ */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { username, role } = req.user;
    const { threadId, withUser, status } = req.query;

    const filter = {};

    if (role === 'admin' && (threadId || withUser)) {
      // Admin inspecting a specific conversation.
      if (threadId) filter.threadId = threadId;
      if (withUser) filter.$or = [{ buyer: withUser }, { seller: withUser }];
    } else {
      // Everyone else sees only their own, always.
      filter.$or = [{ buyer: username }, { seller: username }];

      if (threadId) filter.threadId = threadId;
      if (withUser) {
        filter.threadId = CustomRequest.getThreadId(username, withUser);
      }
    }

    if (status) filter.status = status;

    const requests = await CustomRequest.find(filter).sort({ date: -1 }).limit(500);

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('[CustomRequest] List failed:', error);
    return fail(res, 500, ERROR_CODES.INTERNAL_ERROR, error.message);
  }
});

/* ------------------------------------------------------------------ */
/* POST /api/custom-requests                                           */
/* Buyers create requests. Sellers do not.                             */
/* ------------------------------------------------------------------ */
router.post('/', authMiddleware, validateCreate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.array()[0].msg);
    }

    const buyer = req.user.username;
    const { id, seller, title, description, price, tags, originalMessageId } = req.body;

    if (seller === buyer) {
      return fail(res, 400, ERROR_CODES.ACTION_NOT_ALLOWED, 'You cannot send a request to yourself');
    }

    // Only buyers initiate. A seller quoting a price at someone would be a
    // different feature with different payment implications.
    if (req.user.role !== 'buyer') {
      return fail(res, 403, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, 'Only buyers can create custom requests');
    }

    const sellerUser = await User.findOne({ username: seller });
    if (!sellerUser || sellerUser.role !== 'seller') {
      return fail(res, 404, ERROR_CODES.NOT_FOUND, 'Seller not found');
    }

    const existing = await CustomRequest.findById(id);
    if (existing) {
      // The client generates the id, so a retry can legitimately arrive
      // twice. Treat it as idempotent rather than erroring.
      return res.json({ success: true, data: existing });
    }

    const request = await CustomRequest.create({
      _id: id,
      buyer,
      seller,
      title: clean(title, 100),
      description: clean(description, 1000),
      price: Number(price),
      tags: cleanTags(tags),
      status: 'pending',
      pendingWith: seller, // the seller owes the first response
      lastModifiedBy: buyer,
      lastEditedBy: null,
      threadId: CustomRequest.getThreadId(buyer, seller),
      originalMessageId: originalMessageId || id,
      date: new Date()
    });

    await notify(
      seller,
      'custom_request',
      'New custom request',
      `${buyer} sent you a custom request: ${request.title}`,
      { requestId: request._id, threadId: request.threadId }
    );

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('[CustomRequest] Create failed:', error);
    return fail(res, 500, ERROR_CODES.INTERNAL_ERROR, error.message);
  }
});

/* ------------------------------------------------------------------ */
/* POST /api/custom-requests/:id/respond                               */
/* Accept, reject, or counter-offer. Turn enforced here.               */
/* ------------------------------------------------------------------ */
router.post('/:id/respond', authMiddleware, validateRespond, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.array()[0].msg);
    }

    const username = req.user.username;
    const { status, response, title, description, price, tags } = req.body;

    const request = await CustomRequest.findById(req.params.id);
    if (!request) {
      return fail(res, 404, ERROR_CODES.NOT_FOUND, 'Request not found');
    }

    if (!isParty(request, username)) {
      // 404 rather than 403 — don't confirm the request exists to
      // someone who has no business knowing.
      return fail(res, 404, ERROR_CODES.NOT_FOUND, 'Request not found');
    }

    // THE RULE. Everything above is bookkeeping; this is the check that
    // makes the negotiation trustworthy.
    if (!request.canRespond(username)) {
      const settled = ['accepted', 'rejected', 'paid'].includes(request.status);
      return fail(
        res,
        409,
        ERROR_CODES.ACTION_NOT_ALLOWED,
        settled
          ? `This request has already been ${request.status}`
          : 'It is not your turn to respond to this request'
      );
    }

    const other = username === request.buyer ? request.seller : request.buyer;

    if (status === 'edited') {
      // A counter-offer. Terms may change and the turn passes back.
      if (typeof title !== 'undefined') request.title = clean(title, 100);
      if (typeof description !== 'undefined') request.description = clean(description, 1000);
      if (typeof price !== 'undefined') request.price = Number(price);
      if (typeof tags !== 'undefined') request.tags = cleanTags(tags);

      request.status = 'edited';
      request.pendingWith = other;
      request.lastEditedBy = username;
    } else {
      // Accepted or rejected — the negotiation is over either way.
      request.status = status;
      request.pendingWith = null;
    }

    request.lastModifiedBy = username;
    if (typeof response !== 'undefined') request.response = clean(response, 500);

    await request.save();

    const label =
      status === 'edited' ? 'countered' : status === 'accepted' ? 'accepted' : 'declined';

    await notify(
      other,
      'custom_request',
      `Custom request ${label}`,
      `${username} ${label} the request: ${request.title}`,
      { requestId: request._id, threadId: request.threadId }
    );

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('[CustomRequest] Respond failed:', error);
    return fail(res, 500, ERROR_CODES.INTERNAL_ERROR, error.message);
  }
});

/* ------------------------------------------------------------------ */
/* POST /api/custom-requests/:id/paid                                  */
/* Called after the order is created. Buyer only.                      */
/* ------------------------------------------------------------------ */
router.post('/:id/paid', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { orderId } = req.body || {};

    const request = await CustomRequest.findById(req.params.id);
    if (!request) {
      return fail(res, 404, ERROR_CODES.NOT_FOUND, 'Request not found');
    }

    if (request.buyer !== username) {
      return fail(res, 403, ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, 'Only the buyer can pay for a request');
    }

    if (request.paid || request.status === 'paid') {
      // Idempotent: the payment flow can retry this call after the order
      // already exists, and double-charging is not a risk worth taking.
      return res.json({ success: true, data: request });
    }

    if (request.status !== 'accepted') {
      return fail(
        res,
        409,
        ERROR_CODES.ACTION_NOT_ALLOWED,
        'This request has not been accepted yet'
      );
    }

    request.status = 'paid';
    request.paid = true;
    request.pendingWith = null;
    request.lastModifiedBy = username;
    if (orderId) request.orderId = String(orderId).slice(0, 64);

    await request.save();

    await notify(
      request.seller,
      'custom_request_paid',
      'Custom request paid',
      `${username} paid for: ${request.title}`,
      { requestId: request._id, threadId: request.threadId, orderId: request.orderId }
    );

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('[CustomRequest] Mark paid failed:', error);
    return fail(res, 500, ERROR_CODES.INTERNAL_ERROR, error.message);
  }
});

/* ------------------------------------------------------------------ */
/* GET /api/custom-requests/:id                                        */
/* ------------------------------------------------------------------ */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { username, role } = req.user;

    const request = await CustomRequest.findById(req.params.id);
    if (!request) {
      return fail(res, 404, ERROR_CODES.NOT_FOUND, 'Request not found');
    }

    if (role !== 'admin' && !isParty(request, username)) {
      return fail(res, 404, ERROR_CODES.NOT_FOUND, 'Request not found');
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('[CustomRequest] Get failed:', error);
    return fail(res, 500, ERROR_CODES.INTERNAL_ERROR, error.message);
  }
});

module.exports = router;
