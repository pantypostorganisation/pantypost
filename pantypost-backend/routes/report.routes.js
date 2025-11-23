// pantypost-backend/routes/report.routes.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const Ban = require('../models/Ban');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth.middleware');
const webSocketService = require('../config/websocket');
const { ERROR_CODES } = require('../utils/constants');

// Rate limiting setup
const rateLimit = require('express-rate-limit');

const reportSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 reports per hour - increased for testing
  message: 'Too many reports submitted, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to sanitize input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .substring(0, 2000);
};

// Helper function to validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// POST /api/reports/submit - Submit a new report
router.post('/submit', authMiddleware, reportSubmissionLimiter, async (req, res) => {
  try {
    const {
      reportedUser,
      reportType,
      description,
      evidence = [],
      severity = 'medium',
      relatedMessageId
    } = req.body;

    const reportedBy = req.user.username;

    // Validate required fields
    if (!reportedUser || !reportType || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Missing required fields'
        }
      });
    }

    // Prevent self-reporting
    if (reportedBy === reportedUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_REQUEST,
          message: 'Cannot report yourself'
        }
      });
    }

    // Check if reported user exists
    const userExists = await User.findOne({ username: reportedUser });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'Reported user not found'
        }
      });
    }

    // Sanitize inputs
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedEvidence = evidence
      .filter(url => isValidUrl(url))
      .slice(0, 5) // Max 5 evidence URLs
      .map(url => sanitizeInput(url));

    // Create report
    const report = await Report.submitReport({
      reportedUser,
      reportedBy,
      reportType,
      severity,
      description: sanitizedDescription,
      evidence: sanitizedEvidence,
      relatedMessageId,
      status: 'pending'
    });

    // Update user report count
    await User.findOneAndUpdate(
      { username: reportedUser },
      { 
        $inc: { reportCount: 1 },
        $set: { lastReportedAt: new Date() }
      }
    );

    // Emit WebSocket event to admins
    webSocketService.emitToAdmins('report:new', {
      reportId: report._id,
      reportedUser,
      reportedBy,
      reportType,
      severity,
      timestamp: new Date()
    });

    // Create notification for admins if high/critical severity
    if (severity === 'high' || severity === 'critical') {
      const admins = await User.find({ role: 'admin' }).select('username');
      
      for (const admin of admins) {
        await Notification.createNotification({
          recipient: admin.username,
          type: 'system',
          title: `${severity.toUpperCase()} Severity Report`,
          message: `New ${severity} severity report about ${reportedUser}`,
          data: {
            reportId: report._id,
            reportedUser,
            severity
          },
          priority: 'high'
        });
      }

      // Emit high severity alert
      webSocketService.emitToAdmins('report:high_severity', {
        reportId: report._id,
        reportedUser,
        severity,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        reportId: report._id,
        message: 'Report submitted successfully'
      }
    });

  } catch (error) {
    console.error('[Reports] Error submitting report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to submit report'
      }
    });
  }
});

// GET /api/reports - Get all reports (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

  const {
    page = 0,
    limit = 20,
    status,
    severity,
    reportType,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

    // Build query
  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  } else {
    query.status = 'pending';
  }
  if (severity) query.severity = severity;
  if (reportType) query.reportType = reportType;

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get reports with pagination
    const reports = await Report.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(page) * parseInt(limit))
      .lean();

    // Get total count
    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[Reports] Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch reports'
      }
    });
  }
});

// GET /api/reports/resolved - Get resolved reports (admin only)
router.get('/resolved', authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const {
      page = 0,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const reports = await Report.find({ status: 'resolved' })
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(page) * parseInt(limit))
      .lean();

    const total = await Report.countDocuments({ status: 'resolved' });

    res.json({
      success: true,
      data: {
        reports,
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Reports] Error fetching resolved reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch resolved reports'
      }
    });
  }
});

// GET /api/reports/:id - Get specific report details (admin only)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const report = await Report.findById(req.params.id).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'Report not found'
        }
      });
    }

    // Get additional user info
    const [reportedUser, reporter] = await Promise.all([
      User.findOne({ username: report.reportedUser }).select('username email role isVerified subscriberCount totalSales'),
      User.findOne({ username: report.reportedBy }).select('username email role')
    ]);

    // Get ban info if exists
    const banInfo = await Ban.findOne({ 
      username: report.reportedUser,
      active: true 
    });

    res.json({
      success: true,
      data: {
        report,
        reportedUser,
        reporter,
        banInfo
      }
    });

  } catch (error) {
    console.error('[Reports] Error fetching report details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch report details'
      }
    });
  }
});

// PATCH /api/reports/:id - Update report status/notes (admin only)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const { status, adminNotes, category, severity } = req.body;
    const adminUsername = req.user.username;

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'Report not found'
        }
      });
    }

    // Update fields
    if (status) {
      await report.updateStatus(status, adminUsername);
    }

    if (adminNotes) {
      await report.addAdminNote(sanitizeInput(adminNotes), adminUsername);
    }

    if (category) {
      report.category = category;
      await report.save();
    }

    if (severity) {
      report.severity = severity;
      await report.save();
    }

    // Emit update event
    webSocketService.broadcast('report:updated', {
      reportId: report._id,
      status: report.status,
      updatedBy: adminUsername,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('[Reports] Error updating report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to update report'
      }
    });
  }
});

// POST /api/reports/:id/process - Process report and optionally ban user (admin only)
router.post('/:id/process', authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const {
      action, // 'ban', 'dismiss', 'resolve'
      banDuration, // hours or 'permanent'
      reason,
      notes
    } = req.body;

    const adminUsername = req.user.username;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'Report not found'
        }
      });
    }

    // Process based on action
    let banApplied = false;
    
    if (action === 'ban') {
      // Check if user is already banned
      const existingBan = await Ban.findOne({
        username: report.reportedUser,
        active: true
      });

      if (!existingBan) {
        // Create ban
        const ban = await Ban.create({
          username: report.reportedUser,
          bannedBy: adminUsername,
          reason: reason || report.reportType,
          duration: banDuration === 'permanent' ? null : parseInt(banDuration),
          isPermanent: banDuration === 'permanent',
          notes: sanitizeInput(notes || ''),
          relatedReportId: report._id,
          active: true,
          expiresAt: banDuration === 'permanent' 
            ? null 
            : new Date(Date.now() + parseInt(banDuration) * 60 * 60 * 1000)
        });

        banApplied = true;

        // Update user
        await User.findOneAndUpdate(
          { username: report.reportedUser },
          { 
            isBanned: true,
            banReason: reason || report.reportType,
            banExpiry: ban.expiresAt,
            bannedBy: adminUsername
          }
        );

        // Notify banned user
        await Notification.createNotification({
          recipient: report.reportedUser,
          type: 'system',
          title: 'Account Restricted',
          message: `Your account has been restricted for ${reason || report.reportType}`,
          priority: 'high'
        });

        // Emit ban event
        webSocketService.emitToUser(report.reportedUser, 'user:banned', {
          reason: reason || report.reportType,
          duration: banDuration,
          timestamp: new Date()
        });
      }
    }

    // Process the report
    await report.process(
      adminUsername,
      action === 'dismiss' ? 'dismiss' : 'resolve',
      banApplied
    );

    // Notify reporter
    await Notification.createNotification({
      recipient: report.reportedBy,
      type: 'system',
      title: 'Report Processed',
      message: `Your report has been ${action === 'dismiss' ? 'reviewed and dismissed' : 'resolved'}`,
      data: { reportId: report._id }
    });

    // Emit processed event
    webSocketService.emitToUser(report.reportedBy, 'report:processed', {
      reportId: report._id,
      action,
      timestamp: new Date()
    });

    // Update stats
    webSocketService.broadcast('stats:reports_updated', {
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        report,
        banApplied,
        message: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`
      }
    });

  } catch (error) {
    console.error('[Reports] Error processing report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to process report'
      }
    });
  }
});

// GET /api/reports/stats - Get reporting statistics (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const stats = await Report.getReportStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Reports] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch statistics'
      }
    });
  }
});

// GET /api/reports/user/:username - Get reports about a specific user (admin only)
router.get('/user/:username', authMiddleware, async (req, res) => {
  try {
    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const { username } = req.params;
    const { includeResolved = false } = req.query;

    // Build query
    const query = { reportedUser: username };
    if (!includeResolved) {
      query.status = { $in: ['pending', 'reviewed'] };
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Get user info
    const user = await User.findOne({ username }).select('-password');

    // Get ban history
    const banHistory = await Ban.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        user,
        reports,
        banHistory,
        totalReports: reports.length,
        pendingReports: reports.filter(r => r.status === 'pending').length
      }
    });

  } catch (error) {
    console.error('[Reports] Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch user reports'
      }
    });
  }
});

module.exports = router;