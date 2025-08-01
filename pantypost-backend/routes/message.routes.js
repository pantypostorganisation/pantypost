// pantypost-backend/routes/message.routes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth.middleware');

// Get all threads for a user
router.get('/threads', authMiddleware, async (req, res) => {
  try {
    const username = req.query.username || req.user.username;
    const threads = await Message.getThreads(username);
    
    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages for a specific thread
router.get('/threads/:threadId', authMiddleware, async (req, res) => {
  try {
    const { threadId } = req.params;
    const username = req.user.username;
    
    // Verify user is part of this thread
    const [user1, user2] = threadId.split('-');
    if (username !== user1 && username !== user2) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this thread'
      });
    }
    
    const messages = await Message.find({ threadId })
      .sort({ createdAt: 1 })
      .limit(100);
    
    res.json({
      success: true,
      data: {
        threadId,
        messages
      }
    });
  } catch (error) {
    console.error('Get thread messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiver, content, type = 'normal', meta } = req.body;
    const sender = req.user.username; // Get sender from auth token
    
    // Validate input
    if (!receiver || !content) {
      return res.status(400).json({
        success: false,
        error: 'Receiver and content are required'
      });
    }
    
    // Generate threadId
    const threadId = Message.getThreadId(sender, receiver);
    
    // Create new message
    const message = new Message({
      sender,
      receiver,
      content,
      type,
      meta,
      threadId
    });
    
    await message.save();
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark messages as read
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const username = req.user.username;
    
    if (!Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        error: 'messageIds must be an array'
      });
    }
    
    // Update only messages where current user is receiver
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: username,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    res.json({
      success: true,
      data: {
        updated: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const count = await Message.getUnreadCount(username);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;