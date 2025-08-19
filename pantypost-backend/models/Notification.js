// pantypost-backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['sale', 'bid', 'subscription', 'tip', 'order', 'auction_end', 'message', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  cleared: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  relatedId: {
    type: String,
    default: null
  },
  relatedType: {
    type: String,
    enum: ['listing', 'order', 'user', 'auction', 'message', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, cleared: 1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.updatedAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsCleared = function() {
  this.cleared = true;
  this.updatedAt = new Date();
  return this.save();
};

notificationSchema.methods.restore = function() {
  this.cleared = false;
  this.updatedAt = new Date();
  return this.save();
};

notificationSchema.methods.softDelete = function() {
  this.deleted = true;
  this.updatedAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Emit WebSocket event if available
  if (global.webSocketService) {
    global.webSocketService.emitToUser(data.recipient, 'notification:new', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      createdAt: notification.createdAt
    });
  }
  
  return notification;
};

notificationSchema.statics.getUnreadCount = async function(recipient) {
  return this.countDocuments({
    recipient,
    read: false,
    cleared: false,
    deleted: false
  });
};

notificationSchema.statics.getActiveNotifications = async function(recipient, limit = 50) {
  return this.find({
    recipient,
    cleared: false,
    deleted: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
};

notificationSchema.statics.getClearedNotifications = async function(recipient, limit = 50) {
  return this.find({
    recipient,
    cleared: true,
    deleted: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .lean();
};

notificationSchema.statics.markAllAsRead = async function(recipient) {
  return this.updateMany(
    { recipient, read: false, deleted: false },
    { $set: { read: true, updatedAt: new Date() } }
  );
};

notificationSchema.statics.clearAll = async function(recipient) {
  return this.updateMany(
    { recipient, cleared: false, deleted: false },
    { $set: { cleared: true, updatedAt: new Date() } }
  );
};

notificationSchema.statics.deleteAllCleared = async function(recipient) {
  return this.updateMany(
    { recipient, cleared: true },
    { $set: { deleted: true, updatedAt: new Date() } }
  );
};

// Helper to create different types of notifications
notificationSchema.statics.createSaleNotification = async function(seller, buyer, listing, amount) {
  return this.createNotification({
    recipient: seller,
    type: 'sale',
    title: 'New Sale!',
    message: `💰🛍️ New sale: ${buyer} purchased "${listing.title}" for $${amount.toFixed(2)}`,
    data: {
      buyer,
      listingId: listing._id || listing.id,
      listingTitle: listing.title,
      amount
    },
    priority: 'high',
    relatedId: listing._id || listing.id,
    relatedType: 'listing'
  });
};

notificationSchema.statics.createBidNotification = async function(seller, bidder, listing, bidAmount) {
  return this.createNotification({
    recipient: seller,
    type: 'bid',
    title: 'New Bid!',
    message: `💰 New bid! ${bidder} bid $${bidAmount.toFixed(2)} on "${listing.title}"`,
    data: {
      bidder,
      listingId: listing._id || listing.id,
      listingTitle: listing.title,
      bidAmount
    },
    priority: 'high',
    relatedId: listing._id || listing.id,
    relatedType: 'auction'
  });
};

notificationSchema.statics.createSubscriptionNotification = async function(seller, subscriber) {
  return this.createNotification({
    recipient: seller,
    type: 'subscription',
    title: 'New Subscriber!',
    message: `🎉 ${subscriber} subscribed to you!`,
    data: {
      subscriber
    },
    priority: 'normal',
    relatedId: subscriber,
    relatedType: 'user'
  });
};

notificationSchema.statics.createTipNotification = async function(seller, tipper, amount) {
  return this.createNotification({
    recipient: seller,
    type: 'tip',
    title: 'Tip Received!',
    message: `💸 Tip received from ${tipper}: $${amount.toFixed(2)}`,
    data: {
      tipper,
      amount
    },
    priority: 'normal',
    relatedId: tipper,
    relatedType: 'user'
  });
};

notificationSchema.statics.createAuctionEndNotification = async function(seller, listing, winner, finalBid) {
  if (winner && finalBid) {
    const sellerEarnings = finalBid * 0.8; // 80% to seller after 20% platform fee
    return this.createNotification({
      recipient: seller,
      type: 'auction_end',
      title: 'Auction Ended!',
      message: `🏆 Auction ended: "${listing.title}" sold to ${winner} for $${finalBid.toFixed(2)}. You'll receive $${sellerEarnings.toFixed(2)} (after 20% platform fee)`,
      data: {
        listingId: listing._id || listing.id,
        listingTitle: listing.title,
        winner,
        finalBid,
        sellerEarnings
      },
      priority: 'high',
      relatedId: listing._id || listing.id,
      relatedType: 'auction'
    });
  } else {
    return this.createNotification({
      recipient: seller,
      type: 'auction_end',
      title: 'Auction Ended',
      message: `🔨 Auction ended: No valid bids for "${listing.title}"`,
      data: {
        listingId: listing._id || listing.id,
        listingTitle: listing.title
      },
      priority: 'normal',
      relatedId: listing._id || listing.id,
      relatedType: 'auction'
    });
  }
};

notificationSchema.statics.createOrderNotification = async function(seller, order) {
  return this.createNotification({
    recipient: seller,
    type: 'order',
    title: 'New Order!',
    message: `🛒 New custom order from ${order.buyer}`,
    data: {
      orderId: order._id,
      buyer: order.buyer,
      title: order.title
    },
    priority: 'high',
    relatedId: order._id,
    relatedType: 'order'
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;