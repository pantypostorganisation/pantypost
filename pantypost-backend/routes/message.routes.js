// pantypost-backend/routes/message.routes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth.middleware');
const webSocketService = require('../config/websocket');

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
    const sender = req.user.username;
    
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
      threadId,
      isRead: false
    });
    
    await message.save();
    
    // CRITICAL FIX: Add logging and ensure emission happens
    console.log('WEBSOCKET: Emitting new message event for message:', {
      id: message._id.toString(),
      sender: message.sender,
      receiver: message.receiver,
      threadId: message.threadId
    });
    
    // WEBSOCKET: Emit new message event with all required fields
    const messageData = {
      id: message._id.toString(),
      sender: message.sender,
      receiver: message.receiver,
      content: message.content,
      type: message.type,
      date: message.createdAt,
      createdAt: message.createdAt,
      threadId: message.threadId,
      meta: message.meta,
      isRead: false,
      read: false
    };
    
    // Emit to both sender and receiver
    webSocketService.emitNewMessage(messageData);
    
    console.log('WEBSOCKET: Message emission completed');
    
    // Return the complete message object
    res.json({
      success: true,
      data: messageData
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark messages as read - FIXED to handle both formats
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    let { messageIds, username, otherParty } = req.body;
    const currentUser = req.user.username;
    
    console.log('Mark read request:', { messageIds, username, otherParty, currentUser });
    
    // If username and otherParty are provided, get message IDs
    if (!messageIds && username && otherParty) {
      // Get messages between the two users
      const threadId = Message.getThreadId(username, otherParty);
      const messages = await Message.find({
        threadId,
        receiver: currentUser,
        isRead: false
      });
      
      messageIds = messages.map(msg => msg._id.toString());
      console.log('Found message IDs from thread:', messageIds);
    }
    
    // Validate messageIds
    if (!messageIds) {
      messageIds = [];
    }
    
    if (!Array.isArray(messageIds)) {
      // If it's a single ID, convert to array
      if (typeof messageIds === 'string') {
        messageIds = [messageIds];
      } else {
        return res.status(400).json({
          success: false,
          error: 'messageIds must be an array'
        });
      }
    }
    
    if (messageIds.length === 0) {
      console.log('No messages to mark as read');
      return res.json({
        success: true,
        data: { updated: 0 }
      });
    }
    
    // Get the thread ID from the first message to emit the right event
    let threadId = null;
    if (messageIds.length > 0) {
      const firstMessage = await Message.findById(messageIds[0]);
      if (firstMessage) {
        threadId = firstMessage.threadId;
      }
    }
    
    // Update only messages where current user is receiver
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: currentUser,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    console.log('Mark read result:', result);
    
    // WEBSOCKET: Emit message read event if we have a threadId
    if (threadId && result.modifiedCount > 0) {
      console.log('WEBSOCKET: Emitting message:read event');
      webSocketService.emitMessageRead(messageIds, threadId, currentUser);
    }
    
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

// Block a user
router.post('/block', authMiddleware, async (req, res) => {
  try {
    const { blocked } = req.body;
    const blocker = req.user.username;
    
    if (!blocked) {
      return res.status(400).json({
        success: false,
        error: 'Blocked username is required'
      });
    }
    
    // Here you would typically store this in a database
    // For now, we'll just return success
    console.log(`User ${blocker} blocked ${blocked}`);
    
    res.json({
      success: true,
      data: {
        blocker,
        blocked
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unblock a user
router.post('/unblock', authMiddleware, async (req, res) => {
  try {
    const { blocked } = req.body;
    const blocker = req.user.username;
    
    if (!blocked) {
      return res.status(400).json({
        success: false,
        error: 'Blocked username is required'
      });
    }
    
    // Here you would typically remove this from database
    // For now, we'll just return success
    console.log(`User ${blocker} unblocked ${blocked}`);
    
    res.json({
      success: true,
      data: {
        blocker,
        blocked
      }
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Report a user
router.post('/report', authMiddleware, async (req, res) => {
  try {
    const { reportee, reason, messages, category } = req.body;
    const reporter = req.user.username;
    
    if (!reportee) {
      return res.status(400).json({
        success: false,
        error: 'Reportee username is required'
      });
    }
    
    // Here you would typically store this report in database
    // For now, we'll just log and return success
    console.log(`User ${reporter} reported ${reportee}`, {
      reason,
      category,
      messageCount: messages?.length || 0
    });
    
    res.json({
      success: true,
      data: {
        reporter,
        reportee,
        reportId: `report_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;