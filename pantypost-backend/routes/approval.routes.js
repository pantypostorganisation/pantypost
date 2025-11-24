// pantypost-backend/routes/approval.routes.js
const express = require('express');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

const PAGE_SIZE = 10;

function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  return next();
}

function validateListingId(listingId) {
  return typeof listingId === 'string' && mongoose.Types.ObjectId.isValid(listingId);
}

// GET /api/admin/approval/pending
router.get('/pending', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const pendingListings = await Listing.find({
      requiresApproval: true,
      approvalStatus: 'pending'
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: pendingListings });
  } catch (error) {
    console.error('[Approval] Error fetching pending listings:', error);
    return res.status(500).json({ success: false, error: 'Failed to load pending listings' });
  }
});

// POST /api/admin/approval/approve
router.post('/approve', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const { listingId } = req.body || {};

    if (!validateListingId(listingId)) {
      return res.status(400).json({ success: false, error: 'Invalid listingId' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    listing.approvalStatus = 'approved';
    listing.requiresApproval = false;
    listing.approvedAt = new Date();
    listing.approvedBy = req.user.username;
    listing.deniedAt = undefined;
    listing.deniedBy = undefined;

    await listing.save();

    return res.json({ success: true, data: listing });
  } catch (error) {
    console.error('[Approval] Error approving listing:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve listing' });
  }
});

// POST /api/admin/approval/deny
router.post('/deny', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const { listingId } = req.body || {};

    if (!validateListingId(listingId)) {
      return res.status(400).json({ success: false, error: 'Invalid listingId' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    listing.approvalStatus = 'denied';
    listing.requiresApproval = true;
    listing.deniedAt = new Date();
    listing.deniedBy = req.user.username;
    listing.approvedAt = undefined;
    listing.approvedBy = undefined;

    await listing.save();

    return res.json({ success: true, data: listing });
  } catch (error) {
    console.error('[Approval] Error denying listing:', error);
    return res.status(500).json({ success: false, error: 'Failed to deny listing' });
  }
});

// GET /api/admin/approval/history
router.get('/history', authMiddleware, ensureAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const type = ['approved', 'denied'].includes(req.query.type) ? req.query.type : 'all';

    const filter = {
      approvalStatus: type === 'all' ? { $in: ['approved', 'denied'] } : type,
    };

    const total = await Listing.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    const historyListings = await Listing.find(filter)
      .sort({ approvedAt: -1, deniedAt: -1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    return res.json({
      success: true,
      data: {
        listings: historyListings,
        page,
        totalPages,
      },
    });
  } catch (error) {
    console.error('[Approval] Error fetching approval history:', error);
    return res.status(500).json({ success: false, error: 'Failed to load approval history' });
  }
});

module.exports = router;
