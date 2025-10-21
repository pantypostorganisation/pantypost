// pantypost-backend/models/Message.js
const mongoose = require('mongoose');

// Create message schema - FIXED to handle UUID as _id
const messageSchema = new mongoose.Schema({
  _id: {
    type: String, // Use String instead of ObjectId to support UUIDs
    required: true
  },
  sender: {
    type: String,
    required: true,
    ref: 'User'
  },
  receiver: {
    type: String,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    maxlength: 1000,
    default: '',
    required: function() {
      return !(this.type === 'image' && this.meta && this.meta.imageUrl);
    }
  },
  type: {
    type: String,
    enum: ['normal', 'customRequest', 'image', 'tip'],
    default: 'normal'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // For custom requests and tips
  meta: {
    // Custom request details
    title: String,
    price: Number,
    tags: [String],
    message: String,
    
    // Tip details
    tipAmount: Number,
    
    // Image details
    imageUrl: String,
    
    // Request ID for custom requests
    id: String
  },
  // Thread/conversation tracking
  threadId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  _id: false // Disable automatic _id generation since we provide our own
});

// Indexes for better performance
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Generate threadId from participants
messageSchema.statics.getThreadId = function(user1, user2) {
  // Sort usernames to ensure consistent threadId
  const participants = [user1, user2].sort();
  return `${participants[0]}-${participants[1]}`;
};

// Get unread count for a user
messageSchema.statics.getUnreadCount = async function(username) {
  return await this.countDocuments({
    receiver: username,
    isRead: false
  });
};

// Get conversation threads for a user
messageSchema.statics.getThreads = async function(username) {
  const messages = await this.aggregate([
    {
      $match: {
        $or: [{ sender: username }, { receiver: username }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$threadId',
        lastMessage: { $first: '$$ROOT' },
        participants: { 
          $first: {
            $cond: [
              { $eq: ['$sender', username] },
              ['$sender', '$receiver'],
              ['$receiver', '$sender']
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);

  // Get unread counts for each thread
  for (let thread of messages) {
    const unreadCount = await this.countDocuments({
      threadId: thread._id,
      receiver: username,
      isRead: false
    });
    thread.unreadCount = unreadCount;
    
    // Get the other user's username
    thread.otherUser = thread.participants.find(p => p !== username);
  }

  return messages;
};

// Override the default toJSON to ensure _id is always returned as a string
messageSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    return ret;
  }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;