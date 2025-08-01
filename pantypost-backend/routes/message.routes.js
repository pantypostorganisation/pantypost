// message.routes.js
// This file contains all messaging-related routes

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES, MESSAGE_TYPES } = require('../utils/constants');

// ============= MESSAGING ROUTES =============

// GET /api/messages/threads - Get message threads for a user (protected)
router.get('/threads', authMiddleware, async (req, res) => {
  try {
    const username = req.query.username || req.user.username;
    const threads = await Message.getThreads(username);
    
    // Get user info for each thread
    for (let thread of threads) {
      const otherUser = await User.findOne({ username: thread.otherUser })
        .select('username profilePic isVerified role');
      thread.userProfile = otherUser;
    }
    
    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/messages/threads/:threadId - Get messages in a thread (protected)
router.get('/threads/:threadId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ 
      threadId: req.params.threadId 
    }).sort({ createdAt: 1 });
    
    // Verify user is part of this conversation
    const participants = req.params.threadId.split('-');
    if (!participants.includes(req.user.username) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this conversation'
      });
    }
    
    // Get other user info
    const otherUsername = participants.find(p => p !== req.user.username);
    const otherUser = await User.findOne({ username: otherUsername })
      .select('username profilePic isVerified role');
    
    res.json({
      success: true,
      data: {
        messages,
        otherUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/messages/send - Send a message (protected)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiver, content, type, meta } = req.body;
    const sender = req.user.username;
    
    // Check if receiver exists
    const receiverUser = await User.findOne({ username: receiver });
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }
    
    // Generate thread ID
    const threadId = Message.getThreadId(sender, receiver);
    
    const newMessage = new Message({
      sender,
      receiver,
      content,
      type: type || 'normal',
      meta,
      threadId
    });
    
    await newMessage.save();
    
    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/messages/mark-read - Mark messages as read (protected)
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        receiver: req.user.username 
      },
      { isRead: true }
    );
    
    res.json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/messages/unread-count - Get unread message count (protected)
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.username);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export the router
module.exports = router;