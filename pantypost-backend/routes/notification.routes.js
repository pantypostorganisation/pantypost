// pantypost-backend/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const Notification = require('../models/Notification');

// Get active notifications for current user
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const notifications = await Notification.getActiveNotifications(
      req.user.username,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching active notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Get cleared notifications for current user
router.get('/cleared', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const notifications = await Notification.getClearedNotifications(
      req.user.username,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching cleared notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cleared notifications'
    });
  }
});

// Get all notifications (both active and cleared)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find({
      recipient: req.user.username,
      deleted: false
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();
    
    const total = await Notification.countDocuments({
      recipient: req.user.username,
      deleted: false
    });
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.username);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.username
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    await notification.markAsRead();
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.username);
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// Clear notification (mark as cleared)
router.patch('/:id/clear', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.username
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    await notification.markAsCleared();
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitToUser(req.user.username, 'notification:cleared', {
        notificationId: notification._id
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error clearing notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear notification'
    });
  }
});

// Clear all active notifications
router.patch('/clear-all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.clearAll(req.user.username);
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitToUser(req.user.username, 'notification:all_cleared', {
        count: result.modifiedCount
      });
    }
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear all notifications'
    });
  }
});

// Restore cleared notification
router.patch('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.username
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    await notification.restore();
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitToUser(req.user.username, 'notification:restored', {
        notificationId: notification._id
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error restoring notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore notification'
    });
  }
});

// Delete notification (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.username
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    await notification.softDelete();
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitToUser(req.user.username, 'notification:deleted', {
        notificationId: notification._id
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// Delete all cleared notifications
router.delete('/cleared/all', authMiddleware, async (req, res) => {
  try {
    const result = await Notification.deleteAllCleared(req.user.username);
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitToUser(req.user.username, 'notification:cleared_deleted', {
        count: result.modifiedCount
      });
    }
    
    res.json({
      success: true,
      data: {
        deletedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error deleting cleared notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cleared notifications'
    });
  }
});

// Create test notification (for development/testing)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', authMiddleware, async (req, res) => {
    try {
      const { type = 'system', title = 'Test Notification', message = 'This is a test notification' } = req.body;
      
      const notification = await Notification.createNotification({
        recipient: req.user.username,
        type,
        title,
        message,
        data: { test: true },
        priority: 'normal'
      });
      
      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create test notification'
      });
    }
  });
}

// Get notifications by type
router.get('/type/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50 } = req.query;
    
    const validTypes = ['sale', 'bid', 'subscription', 'tip', 'order', 'auction_end', 'message', 'system'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification type'
      });
    }
    
    const notifications = await Notification.find({
      recipient: req.user.username,
      type,
      deleted: false
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Search notifications
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q, startDate, endDate, type, limit = 50 } = req.query;
    
    const query = {
      recipient: req.user.username,
      deleted: false
    };
    
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { message: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error searching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search notifications'
    });
  }
});

module.exports = router;