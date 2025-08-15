// pantypost-backend/config/websocket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.io = null;
    this.activeConnections = new Map();
    this.userSockets = new Map(); // username -> [socketIds]
    this.userThreads = new Map(); // username -> Set of active thread IDs
    this.userActivity = new Map(); // username -> last activity timestamp
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        socket.username = user.username;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.username} (${socket.userId}) connected`);
      this.handleConnection(socket);

      // Event handlers
      socket.on('disconnect', () => this.handleDisconnect(socket));
      socket.on('message:typing', (data) => this.handleTyping(socket, data));
      socket.on('room:join', (data) => this.handleJoinRoom(socket, data));
      socket.on('room:leave', (data) => this.handleLeaveRoom(socket, data));
      socket.on('user:online', () => this.handleUserOnline(socket));
      socket.on('user:activity', () => this.handleUserActivity(socket));
      
      // Handle thread focus for auto-read functionality
      socket.on('thread:focus', (data) => this.handleThreadFocus(socket, data));
      socket.on('thread:blur', (data) => this.handleThreadBlur(socket, data));
    });

    // Periodically update user activity status
    setInterval(() => {
      this.updateAllUserActivityStatus();
    }, 30000); // Every 30 seconds
  }

  async handleConnection(socket) {
    // Track connection
    this.activeConnections.set(socket.id, {
      userId: socket.userId,
      username: socket.username,
      connectedAt: new Date()
    });

    // Track user sockets
    if (!this.userSockets.has(socket.username)) {
      this.userSockets.set(socket.username, []);
    }
    this.userSockets.get(socket.username).push(socket.id);

    // Initialize user threads tracking
    if (!this.userThreads.has(socket.username)) {
      this.userThreads.set(socket.username, new Set());
    }

    // Update user activity
    this.userActivity.set(socket.username, Date.now());
    
    // CRITICAL FIX: Always update user's online status when WebSocket connects
    try {
      const user = await User.findOne({ username: socket.username });
      if (user) {
        user.isOnline = true;
        user.lastActive = new Date();
        await user.save();
        console.log(`[WebSocket] Updated ${socket.username} to online status (DB: isOnline=${user.isOnline})`);
      }
    } catch (error) {
      console.error(`[WebSocket] Error updating user status for ${socket.username}:`, error);
    }

    // Send connection confirmation
    socket.emit('connected', {
      connected: true,
      sessionId: socket.id
    });

    // IMPORTANT: Broadcast user is online to ALL connected clients with fresh data
    this.broadcastUserStatus(socket.username, true);
    
    // Send list of online users to the newly connected user
    const onlineUsers = await this.getOnlineUsers();
    socket.emit('users:online_list', onlineUsers);
    
    console.log(`[WebSocket] User ${socket.username} connected and marked online`);
  }

  async handleDisconnect(socket) {
    console.log(`User ${socket.username} disconnected`);
    
    // Remove from active connections
    this.activeConnections.delete(socket.id);

    // Remove from user sockets
    const userSocketIds = this.userSockets.get(socket.username) || [];
    const filtered = userSocketIds.filter(id => id !== socket.id);
    
    if (filtered.length === 0) {
      // User has no more active connections
      this.userSockets.delete(socket.username);
      this.userThreads.delete(socket.username);
      this.userActivity.delete(socket.username);
      
      // Update database - user is now offline
      await this.updateUserOnlineStatus(socket.username, false);
      
      // Broadcast user is offline
      this.broadcastUserStatus(socket.username, false);
    } else {
      this.userSockets.set(socket.username, filtered);
    }
  }

  async handleUserActivity(socket) {
    // Update last activity timestamp
    this.userActivity.set(socket.username, Date.now());
    
    // Update database
    try {
      await User.findOneAndUpdate(
        { username: socket.username },
        { lastActive: new Date(), isOnline: true }
      );
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }

  async updateUserOnlineStatus(username, isOnline) {
    try {
      const user = await User.findOne({ username });
      if (user) {
        if (isOnline) {
          await user.updateLastActive();
        } else {
          await user.setOffline();
        }
        console.log(`[WebSocket] Database updated: ${username} is now ${isOnline ? 'online' : 'offline'}`);
      }
    } catch (error) {
      console.error('Error updating user online status:', error);
    }
  }

  async updateAllUserActivityStatus() {
    // Check all tracked users and update their activity status
    for (const [username, lastActivity] of this.userActivity.entries()) {
      const timeSinceActivity = Date.now() - lastActivity;
      
      // If no activity for 5 minutes, consider them inactive
      if (timeSinceActivity > 5 * 60 * 1000) {
        // Check if they're still connected
        const isConnected = this.userSockets.has(username);
        
        if (!isConnected) {
          // Remove from activity tracking
          this.userActivity.delete(username);
        }
      }
    }
  }

  async getOnlineUsers() {
    try {
      const onlineUsers = await User.find({ isOnline: true })
        .select('username lastActive')
        .lean();
      
      return onlineUsers.map(user => ({
        username: user.username,
        lastActive: user.lastActive,
        isOnline: true
      }));
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  async getUserActivityStatus(username) {
    try {
      const user = await User.findOne({ username })
        .select('isOnline lastActive')
        .lean();
      
      if (!user) return null;
      
      return {
        username,
        isOnline: user.isOnline,
        lastActive: user.lastActive
      };
    } catch (error) {
      console.error('Error getting user activity status:', error);
      return null;
    }
  }

  // Handle when user focuses on a thread
  handleThreadFocus(socket, data) {
    const { threadId, otherUser } = data;
    if (!threadId || !otherUser) return;

    console.log(`[WebSocket] ${socket.username} focused on thread with ${otherUser}`);
    
    // Track which thread the user is viewing
    const userThreads = this.userThreads.get(socket.username) || new Set();
    userThreads.add(threadId);
    this.userThreads.set(socket.username, userThreads);

    // Join the conversation room
    socket.join(`conversation:${threadId}`);

    // Notify the other user that this user is viewing the thread
    this.emitToUser(otherUser, 'thread:user_viewing', {
      username: socket.username,
      threadId,
      viewing: true
    });
    
    // Update user activity
    this.handleUserActivity(socket);
  }

  // Handle when user leaves a thread
  handleThreadBlur(socket, data) {
    const { threadId, otherUser } = data;
    if (!threadId || !otherUser) return;

    console.log(`[WebSocket] ${socket.username} left thread with ${otherUser}`);
    
    // Remove from tracked threads
    const userThreads = this.userThreads.get(socket.username) || new Set();
    userThreads.delete(threadId);
    this.userThreads.set(socket.username, userThreads);

    // Leave the conversation room
    socket.leave(`conversation:${threadId}`);

    // Notify the other user that this user left the thread
    this.emitToUser(otherUser, 'thread:user_viewing', {
      username: socket.username,
      threadId,
      viewing: false
    });
  }

  handleTyping(socket, data) {
    const { conversationId, isTyping } = data;
    
    socket.to(`conversation:${conversationId}`).emit('message:typing', {
      userId: socket.userId,
      username: socket.username,
      conversationId,
      isTyping
    });
    
    // Update user activity when typing
    this.handleUserActivity(socket);
  }

  handleJoinRoom(socket, data) {
    const { roomId, roomType } = data;
    socket.join(`${roomType}:${roomId}`);
  }

  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    socket.leave(roomId);
  }

  handleUserOnline(socket) {
    this.broadcastUserStatus(socket.username, true);
    this.handleUserActivity(socket);
  }

  broadcastUserStatus(username, isOnline) {
    // Include last active time when broadcasting
    const statusData = {
      username,
      isOnline,
      lastActive: new Date(),
      timestamp: new Date()
    };
    
    // Broadcast to ALL connected clients
    this.io.emit('user:status', statusData);
    
    // Also emit specific online/offline events for backward compatibility
    if (isOnline) {
      this.io.emit('user:online', statusData);
      console.log(`[WebSocket] Broadcasted ${username} is ONLINE to all clients`);
    } else {
      this.io.emit('user:offline', statusData);
      console.log(`[WebSocket] Broadcasted ${username} is OFFLINE to all clients`);
    }
  }

  // Emit events from other parts of the application
  emitToUser(username, event, data) {
    const socketIds = this.userSockets.get(username) || [];
    console.log(`[WebSocket] Emitting ${event} to ${username} (${socketIds.length} sockets)`);
    
    socketIds.forEach(socketId => {
      this.io.to(socketId).emit(event, data);
    });
  }

  emitToRoom(roomType, roomId, event, data) {
    this.io.to(`${roomType}:${roomId}`).emit(event, data);
  }

  // Check if a user is viewing a specific thread
  isUserViewingThread(username, threadId) {
    const userThreads = this.userThreads.get(username);
    return userThreads ? userThreads.has(threadId) : false;
  }

  // User update event (for tier system)
  emitUserUpdate(username, updateData) {
    // Emit to the user themselves
    this.emitToUser(username, 'user:updated', {
      username,
      ...updateData,
      timestamp: new Date()
    });
    
    // Also broadcast to all connected clients if tier changed
    if (updateData.tier) {
      this.io.emit('seller:tier_updated', {
        username,
        tier: updateData.tier,
        timestamp: new Date()
      });
    }
  }

  // Message events with better logging and auto-read
  emitNewMessage(message) {
    console.log('[WebSocket] emitNewMessage called with:', {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      threadId: message.threadId
    });

    // Emit to sender
    const senderSockets = this.userSockets.get(message.sender) || [];
    console.log(`[WebSocket] Emitting to sender ${message.sender} (${senderSockets.length} sockets)`);
    
    if (senderSockets.length > 0) {
      this.emitToUser(message.sender, 'message:new', message);
      console.log(`[WebSocket] Successfully emitted to sender ${message.sender}`);
    } else {
      console.log(`[WebSocket] Sender ${message.sender} not connected`);
    }
    
    // Emit to receiver
    const receiverSockets = this.userSockets.get(message.receiver) || [];
    console.log(`[WebSocket] Emitting to receiver ${message.receiver} (${receiverSockets.length} sockets)`);
    
    if (receiverSockets.length > 0) {
      this.emitToUser(message.receiver, 'message:new', message);
      console.log(`[WebSocket] Successfully emitted to receiver ${message.receiver}`);
      
      // Check if receiver is viewing this thread and auto-mark as read
      if (this.isUserViewingThread(message.receiver, message.threadId)) {
        console.log(`[WebSocket] Receiver ${message.receiver} is viewing thread, auto-marking as read`);
        
        // Emit read status immediately
        setTimeout(() => {
          this.emitMessageRead([message.id], message.threadId, message.receiver);
          
          // Also emit to sender that message was read
          this.emitToUser(message.sender, 'message:read', {
            messageIds: [message.id],
            threadId: message.threadId,
            readBy: message.receiver,
            readAt: new Date()
          });
        }, 100); // Small delay to ensure message is processed first
      }
    } else {
      console.log(`[WebSocket] Receiver ${message.receiver} not connected`);
    }
    
    // Also emit to the conversation room
    const conversationKey = [message.sender, message.receiver].sort().join('-');
    this.emitToRoom('conversation', conversationKey, 'message:new', message);
    console.log(`[WebSocket] Emitted to conversation room: conversation:${conversationKey}`);
  }

  emitMessageRead(messageIds, threadId, readBy) {
    console.log('[WebSocket] emitMessageRead called:', {
      messageIds,
      threadId,
      readBy
    });

    const readData = {
      messageIds,
      threadId,
      readBy,
      readAt: new Date()
    };

    // Emit to the conversation room
    this.emitToRoom('conversation', threadId, 'message:read', readData);
    
    // Also emit directly to both users in the thread
    const [user1, user2] = threadId.split('-');
    this.emitToUser(user1, 'message:read', readData);
    this.emitToUser(user2, 'message:read', readData);
    
    console.log(`[WebSocket] Emitted message:read to thread ${threadId} and users ${user1}, ${user2}`);
  }

  // Order events
  emitOrderCreated(order) {
    // Emit to seller
    this.emitToUser(order.seller, 'order:created', order);
    
    // Emit to buyer
    this.emitToUser(order.buyer, 'order:created', order);
    
    // Send notification to buyer
    this.emitToUser(order.buyer, 'notification:new', {
      id: `notif_${Date.now()}`,
      type: 'order',
      title: 'Order Placed!',
      body: `Your order for ${order.title} has been placed`,
      data: { orderId: order._id || order.id },
      read: false,
      createdAt: new Date()
    });
  }

  emitNewOrder(order) {
    this.emitOrderCreated(order);
  }

  emitOrderUpdated(order) {
    this.emitToUser(order.buyer, 'order:updated', order);
    this.emitToUser(order.seller, 'order:updated', order);
  }

  emitOrderStatusChange(order, previousStatus) {
    const eventData = {
      id: order._id,
      previousStatus,
      newStatus: order.shippingStatus,
      trackingNumber: order.trackingNumber,
      changedAt: new Date()
    };

    this.emitToUser(order.buyer, 'order:status_change', eventData);
    this.emitToUser(order.seller, 'order:status_change', eventData);
  }

  // Auction events
  emitNewBid(listing, bid) {
    this.io.emit('auction:bid', {
      listingId: listing._id,
      bidder: bid.bidder,
      amount: bid.amount,
      previousBid: listing.auction.bids[listing.auction.bids.length - 2]?.amount || listing.auction.startingPrice,
      bidCount: listing.auction.bids.length,
      timestamp: new Date()
    });

    // Notify previous highest bidder they were outbid
    if (listing.auction.bids.length > 1) {
      const previousBidder = listing.auction.bids[listing.auction.bids.length - 2].bidder;
      this.emitToUser(previousBidder, 'auction:outbid', {
        listingId: listing._id,
        title: listing.title,
        yourBid: listing.auction.bids[listing.auction.bids.length - 2].amount,
        currentBid: bid.amount,
        highestBidder: bid.bidder
      });
    }
  }

  emitAuctionEnding(listing, minutesRemaining) {
    this.io.emit('auction:ending', {
      listingId: listing._id,
      title: listing.title,
      currentBid: listing.auction.currentBid,
      endTime: listing.auction.endTime,
      minutesRemaining
    });
  }

  // UPDATED: Include seller earnings in auction ended event
  emitAuctionEnded(listing, winner, finalBid) {
    // Calculate seller earnings for the event
    let sellerEarnings = null;
    let platformFee = null;
    
    if (winner && finalBid) {
      const AUCTION_PLATFORM_FEE = 0.20; // 20% for auctions
      platformFee = Math.round(finalBid * AUCTION_PLATFORM_FEE * 100) / 100;
      sellerEarnings = Math.round((finalBid - platformFee) * 100) / 100;
    }
    
    this.io.emit('auction:ended', {
      listingId: listing._id,
      winner,
      finalBid,
      sellerEarnings, // Include seller's earnings
      platformFee, // Include platform fee
      reserveMet: finalBid >= (listing.auction.reservePrice || 0),
      endedAt: new Date()
    });
  }

  // Wallet events
  emitBalanceUpdate(username, role, previousBalance, newBalance, reason) {
    this.emitToUser(username, 'wallet:balance_update', {
      username,
      role,
      previousBalance,
      newBalance,
      change: newBalance - previousBalance,
      reason,
      timestamp: new Date()
    });
  }

  emitTransaction(transaction) {
    if (transaction.from) {
      this.emitToUser(transaction.from, 'wallet:transaction', transaction);
    }
    if (transaction.to && transaction.to !== 'platform') {
      this.emitToUser(transaction.to, 'wallet:transaction', transaction);
    }
  }

  // Subscription events
  emitNewSubscription(subscription) {
    this.emitToUser(subscription.creator, 'subscription:new', subscription);
    this.emitToUser(subscription.subscriber, 'notification:new', {
      id: `notif_${Date.now()}`,
      type: 'subscription',
      title: 'Subscription Activated!',
      body: `You are now subscribed to ${subscription.creator}`,
      data: { subscriptionId: subscription._id },
      read: false,
      createdAt: new Date()
    });
  }

  emitSubscriptionCancelled(subscription, reason) {
    this.emitToUser(subscription.creator, 'subscription:cancelled', {
      ...subscription,
      cancelledAt: new Date(),
      reason
    });
  }

  // Listing events
  emitNewListing(listing) {
    this.io.emit('listing:new', {
      id: listing._id,
      title: listing.title,
      price: listing.price,
      seller: listing.seller,
      tags: listing.tags,
      createdAt: listing.createdAt
    });
  }

  emitListingUpdated(listing) {
    this.io.emit('listing:updated', {
      id: listing._id,
      title: listing.title,
      price: listing.price,
      seller: listing.seller,
      tags: listing.tags,
      updatedAt: new Date()
    });
  }

  emitListingDeleted(listingId) {
    this.io.emit('listing:deleted', {
      id: listingId,
      deletedAt: new Date()
    });
  }

  emitListingSold(listing, buyer) {
    // Emit with both formats for compatibility
    this.io.emit('listing:sold', {
      id: listing._id,
      title: listing.title,
      soldTo: buyer,
      price: listing.price,
      soldAt: new Date()
    });
    
    // Also emit with listingId format for consistency
    this.io.emit('listing:sold', {
      listingId: listing._id,
      seller: listing.seller,
      buyer: buyer
    });
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.activeConnections.size,
      uniqueUsers: this.userSockets.size,
      activeThreads: Array.from(this.userThreads.entries()).map(([username, threads]) => ({
        username,
        viewingThreads: Array.from(threads)
      })),
      connections: Array.from(this.activeConnections.entries()).map(([socketId, data]) => ({
        socketId,
        ...data
      })),
      userActivity: Array.from(this.userActivity.entries()).map(([username, lastActivity]) => ({
        username,
        lastActivity: new Date(lastActivity),
        minutesSinceActivity: Math.floor((Date.now() - lastActivity) / 60000)
      }))
    };
  }
}

module.exports = new WebSocketService();