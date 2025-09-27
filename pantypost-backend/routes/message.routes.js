// pantypost-backend/routes/message.routes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const webSocketService = require('../config/websocket');
const { v4: uuidv4 } = require('uuid');

// Get user status endpoint
router.get('/user-status/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user from database
    const user = await User.findOne({ username }).select('isOnline lastActive');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        username,
        isOnline: user.isOnline || false,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all threads for a user - ENHANCED WITH PROFILE DATA
router.get('/threads', authMiddleware, async (req, res) => {
  try {
    const username = req.query.username || req.user.username;
    
    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: username },
        { receiver: username }
      ]
    }).sort({ createdAt: 1 });
    
    // Group messages by thread
    const threadsMap = {};
    const participantSet = new Set();
    
    messages.forEach(msg => {
      const threadId = msg.threadId;
      
      if (!threadsMap[threadId]) {
        const participants = threadId.split('-');
        threadsMap[threadId] = {
          id: threadId,
          participants: participants,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          updatedAt: msg.createdAt
        };
        
        // Track all participants to fetch their profiles
        participants.forEach(p => {
          if (p !== username) participantSet.add(p);
        });
      }
      
      // Add message to thread
      threadsMap[threadId].messages.push({
        id: msg._id.toString(),
        sender: msg.sender,
        receiver: msg.receiver,
        content: msg.content,
        date: msg.createdAt,
        isRead: msg.isRead,
        read: msg.isRead,
        type: msg.type,
        meta: msg.meta,
        threadId: msg.threadId
      });
      
      // Update last message
      threadsMap[threadId].lastMessage = {
        id: msg._id.toString(),
        sender: msg.sender,
        receiver: msg.receiver,
        content: msg.content,
        date: msg.createdAt,
        isRead: msg.isRead,
        read: msg.isRead,
        type: msg.type,
        meta: msg.meta,
        threadId: msg.threadId
      };
      
      // Update timestamp
      threadsMap[threadId].updatedAt = msg.createdAt;
      
      // Count unread messages
      if (msg.receiver === username && !msg.isRead) {
        threadsMap[threadId].unreadCount++;
      }
    });
    
    // FETCH PROFILES FOR ALL PARTICIPANTS
    const participantProfiles = {};
    if (participantSet.size > 0) {
      const users = await User.find(
        { username: { $in: Array.from(participantSet) } },
        'username profilePic isVerified verificationStatus bio tier subscriberCount'
      );
      
      users.forEach(user => {
        participantProfiles[user.username] = {
          username: user.username,
          profilePic: user.profilePic || null,
          isVerified: user.isVerified || user.verificationStatus === 'verified' || false,
          bio: user.bio || '',
          tier: user.tier || 'Tease',
          subscriberCount: user.subscriberCount || 0
        };
      });
    }
    
    // Convert to array and sort by last message date
    const threads = Object.values(threadsMap).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    // Include participant profiles in response
    res.json({
      success: true,
      data: threads,
      profiles: participantProfiles
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages for a specific thread - ENHANCED WITH PROFILES
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
    
    // Format messages properly
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      sender: msg.sender,
      receiver: msg.receiver,
      content: msg.content,
      date: msg.createdAt,
      isRead: msg.isRead,
      read: msg.isRead,
      type: msg.type,
      meta: msg.meta,
      threadId: msg.threadId
    }));
    
    // Get profiles for the other participant
    const otherUsername = user1 === username ? user2 : user1;
    const otherUser = await User.findOne(
      { username: otherUsername },
      'username profilePic isVerified verificationStatus bio tier subscriberCount'
    );
    
    const profiles = {};
    if (otherUser) {
      profiles[otherUser.username] = {
        username: otherUser.username,
        profilePic: otherUser.profilePic || null,
        isVerified: otherUser.isVerified || otherUser.verificationStatus === 'verified' || false,
        bio: otherUser.bio || '',
        tier: otherUser.tier || 'Tease',
        subscriberCount: otherUser.subscriberCount || 0
      };
    }
    
    res.json({
      success: true,
      data: formattedMessages,
      profiles
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
    
    // Create new message with a UUID
    const messageId = uuidv4();
    const message = new Message({
      _id: messageId,
      sender,
      receiver,
      content,
      type,
      meta,
      threadId,
      isRead: false
    });
    
    await message.save();
    
    // Update sender's last active time
    await User.findOneAndUpdate(
      { username: sender },
      { lastActive: new Date(), isOnline: true }
    );
    
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
    
    // Check if receiver is viewing the thread and auto-mark as read
    if (webSocketService.isUserViewingThread(receiver, threadId)) {
      console.log('WEBSOCKET: Receiver is viewing thread, auto-marking as read');
      
      // Update the message in database
      message.isRead = true;
      await message.save();
      
      // Update the messageData
      messageData.isRead = true;
      messageData.read = true;
      
      // Emit read event
      setTimeout(() => {
        webSocketService.emitMessageRead([messageData.id], threadId, receiver);
      }, 100);
    }
    
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

// Mark messages as read
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
    let messageSender = null;
    
    if (messageIds.length > 0) {
      const firstMessage = await Message.findOne({
        $or: [
          { _id: messageIds[0] },
          { _id: { $in: messageIds } }
        ]
      }).catch(() => null);
      
      if (firstMessage) {
        threadId = firstMessage.threadId;
        messageSender = firstMessage.sender;
      }
    }
    
    // Update only messages where current user is receiver
    const result = await Message.updateMany(
      {
        $or: messageIds.map(id => ({ _id: id })),
        receiver: currentUser,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    console.log('Mark read result:', result);
    
    // Emit message read event to BOTH users if we have a threadId
    if (threadId && result.modifiedCount > 0) {
      console.log('WEBSOCKET: Emitting message:read event to both users');
      
      const readEventData = {
        messageIds,
        threadId,
        readBy: currentUser,
        readAt: new Date().toISOString()
      };
      
      // Emit to the current user (reader)
      webSocketService.emitMessageRead(messageIds, threadId, currentUser);
      
      // Also emit to the sender so they get the read receipt update
      if (messageSender && messageSender !== currentUser) {
        console.log('WEBSOCKET: Also emitting to sender:', messageSender);
        webSocketService.emitToUser(messageSender, 'message:read', readEventData);
      }
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

// Get blocked users for current user
router.get('/blocked-users', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    
    // Get blocked users from User model
    const user = await User.findOne({ username }).select('blockedUsers');
    
    const blockedData = {};
    if (user && user.blockedUsers) {
      blockedData[username] = user.blockedUsers;
    } else {
      blockedData[username] = [];
    }
    
    res.json({
      success: true,
      data: blockedData
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
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
    
    // Add to User's blockedUsers array
    await User.findOneAndUpdate(
      { username: blocker },
      { $addToSet: { blockedUsers: blocked } }
    );
    
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
    
    // Remove from User's blockedUsers array
    await User.findOneAndUpdate(
      { username: blocker },
      { $pull: { blockedUsers: blocked } }
    );
    
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

// Get message notifications for current user
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const username = req.query.username || req.user.username;
    
    // Get unread message counts grouped by sender
    const unreadMessages = await Message.aggregate([
      {
        $match: {
          receiver: username,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 },
          lastMessage: { $last: '$content' },
          lastDate: { $last: '$createdAt' }
        }
      },
      {
        $project: {
          buyer: '$_id',
          messageCount: '$count',
          lastMessage: '$lastMessage',
          timestamp: '$lastDate',
          _id: 0
        }
      }
    ]);
    
    res.json({
      success: true,
      data: unreadMessages
    });
  } catch (error) {
    console.error('Get message notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear message notifications
router.post('/notifications/clear', authMiddleware, async (req, res) => {
  try {
    const { seller, buyer } = req.body;
    
    if (!seller || !buyer) {
      return res.status(400).json({
        success: false,
        error: 'Seller and buyer are required'
      });
    }
    
    // Mark messages as read
    const threadId = Message.getThreadId(seller, buyer);
    await Message.updateMany(
      {
        threadId,
        receiver: seller,
        sender: buyer,
        isRead: false
      },
      {
        isRead: true
      }
    );
    
    res.json({
      success: true
    });
  } catch (error) {
    console.error('Clear notifications error:', error);
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
    
    // Create report in Report model
    const Report = require('../models/Report');
    const report = new Report({
      reporter,
      reportedUser: reportee,
      reason: reason || '',
      category: category || 'other',
      messages: messages || [],
      status: 'pending',
      processed: false
    });
    
    await report.save();
    
    res.json({
      success: true,
      data: {
        reporter,
        reportee,
        reportId: report._id
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

// Get unread reports count (for admins)
router.get('/reports/unread-count', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Count unread reports from Report model
    const Report = require('../models/Report');
    const count = await Report.countDocuments({ 
      status: 'pending',
      processed: false 
    });
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread reports error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;