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

  // ===== Utility helpers =====================================================

  // Emit to all of a user's sockets
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

  // Broadcast to all connected clients
  broadcast(event, data) {
    if (!this.io) {
      console.error('[WebSocket] Socket.IO not initialized');
      return;
    }
    console.log(`[WebSocket] Broadcasting ${event} to all clients`);
    this.io.emit(event, data);
  }

  // Small helper to safely emit a generic notification
  emitNotification(username, payload) {
    // Defensive: ensure minimal fields
    const now = new Date();
    const pkg = {
      id: payload?.id || `notif_${now.getTime()}_${Math.random().toString(36).slice(2)}`,
      type: payload?.type || 'system',
      title: payload?.title || 'Notification',
      message: payload?.message || '',
      data: payload?.data || {},
      priority: payload?.priority || 'normal',
      createdAt: payload?.createdAt || now
    };
    this.emitToUser(username, 'notification:new', pkg);
  }

  // ===== Connection & presence ==============================================

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
    
    // Update DB presence
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

    // Broadcast presence + online list
    this.broadcastUserStatus(socket.username, true);
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
      console.error(`[WebSocket] Error updating user online status:`, error);
    }
  }

  async updateAllUserActivityStatus() {
    for (const [username, lastActivity] of this.userActivity.entries()) {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity > 5 * 60 * 1000) {
        const isConnected = this.userSockets.has(username);
        if (!isConnected) {
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

  // ===== Thread focus & typing ==============================================

  handleThreadFocus(socket, data) {
    const { threadId, otherUser } = data;
    if (!threadId || !otherUser) return;

    console.log(`[WebSocket] ${socket.username} focused on thread with ${otherUser}`);
    
    const userThreads = this.userThreads.get(socket.username) || new Set();
    userThreads.add(threadId);
    this.userThreads.set(socket.username, userThreads);

    socket.join(`conversation:${threadId}`);

    this.emitToUser(otherUser, 'thread:user_viewing', {
      username: socket.username,
      threadId,
      viewing: true
    });
    
    this.handleUserActivity(socket);
  }

  handleThreadBlur(socket, data) {
    const { threadId, otherUser } = data;
    if (!threadId || !otherUser) return;

    console.log(`[WebSocket] ${socket.username} left thread with ${otherUser}`);
    
    const userThreads = this.userThreads.get(socket.username) || new Set();
    userThreads.delete(threadId);
    this.userThreads.set(socket.username, userThreads);

    socket.leave(`conversation:${threadId}`);

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
    const statusData = {
      username,
      isOnline,
      lastActive: new Date(),
      timestamp: new Date()
    };
    
    this.io.emit('user:status', statusData);
    
    if (isOnline) {
      this.io.emit('user:online', statusData);
      console.log(`[WebSocket] Broadcasted ${username} is ONLINE to all clients`);
    } else {
      this.io.emit('user:offline', statusData);
      console.log(`[WebSocket] Broadcasted ${username} is OFFLINE to all clients`);
    }
  }

  // ===== User updates (tier etc.) ===========================================

  emitUserUpdate(username, updateData) {
    this.emitToUser(username, 'user:updated', {
      username,
      ...updateData,
      timestamp: new Date()
    });
    
    if (updateData.tier) {
      this.io.emit('seller:tier_updated', {
        username,
        tier: updateData.tier,
        timestamp: new Date()
      });
    }
  }

  // ===== Messages ============================================================

  // Message events with better logging and auto-read
  emitNewMessage(message) {
    console.log('[WebSocket] emitNewMessage called with:', {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      threadId: message.threadId
    });

    const senderSockets = this.userSockets.get(message.sender) || [];
    console.log(`[WebSocket] Emitting to sender ${message.sender} (${senderSockets.length} sockets)`);
    if (senderSockets.length > 0) {
      this.emitToUser(message.sender, 'message:new', message);
      console.log(`[WebSocket] Successfully emitted to sender ${message.sender}`);
    } else {
      console.log(`[WebSocket] Sender ${message.sender} not connected`);
    }
    
    const receiverSockets = this.userSockets.get(message.receiver) || [];
    console.log(`[WebSocket] Emitting to receiver ${message.receiver} (${receiverSockets.length} sockets)`);
    if (receiverSockets.length > 0) {
      this.emitToUser(message.receiver, 'message:new', message);
      console.log(`[WebSocket] Successfully emitted to receiver ${message.receiver}`);

      // Auto-read if viewing
      if (this.isUserViewingThread(message.receiver, message.threadId)) {
        console.log(`[WebSocket] Receiver ${message.receiver} is viewing thread, auto-marking as read`);
        setTimeout(() => {
          this.emitMessageRead([message.id], message.threadId, message.receiver);
          this.emitToUser(message.sender, 'message:read', {
            messageIds: [message.id],
            threadId: message.threadId,
            readBy: message.receiver,
            readAt: new Date()
          });
        }, 100);
      }
    } else {
      console.log(`[WebSocket] Receiver ${message.receiver} not connected`);
    }
    
    // Also emit to the conversation room (symmetric key)
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

    this.emitToRoom('conversation', threadId, 'message:read', readData);
    
    const [user1, user2] = threadId.split('-');
    this.emitToUser(user1, 'message:read', readData);
    this.emitToUser(user2, 'message:read', readData);
    
    console.log(`[WebSocket] Emitted message:read to thread ${threadId} and users ${user1}, ${user2}`);
  }

  // ===== Orders =============================================================

  /**
   * CRITICAL FIX: Properly emit order created event for auction orders
   * This ensures the buyer's my-orders page updates when they win an auction
   */
  emitOrderCreated(order) {
    console.log('[WebSocket] emitOrderCreated called for order:', {
      id: order._id || order.id,
      buyer: order.buyer,
      seller: order.seller,
      wasAuction: order.wasAuction,
      title: order.title
    });

    // Format order data consistently for frontend
    const orderData = {
      _id: order._id?.toString() || order.id,
      id: order._id?.toString() || order.id,
      title: order.title,
      description: order.description,
      price: order.price,
      markedUpPrice: order.markedUpPrice || order.price,
      imageUrl: order.imageUrl,
      seller: order.seller,
      buyer: order.buyer,
      date: order.date || order.createdAt || new Date().toISOString(),
      tags: order.tags || [],
      listingId: order.listingId,
      wasAuction: order.wasAuction || false,
      finalBid: order.finalBid,
      shippingStatus: order.shippingStatus || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      deliveryAddress: order.deliveryAddress,
      platformFee: order.platformFee,
      sellerEarnings: order.sellerEarnings,
      isCustomRequest: order.isCustomRequest || false
    };

    // CRITICAL: Wrap order data in expected format
    const eventPayload = {
      order: orderData,
      buyer: order.buyer,
      seller: order.seller
    };

    // Emit to seller
    this.emitToUser(order.seller, 'order:created', eventPayload);
    console.log(`[WebSocket] Emitted order:created to seller ${order.seller}`);
    
    // Emit to buyer
    this.emitToUser(order.buyer, 'order:created', eventPayload);
    console.log(`[WebSocket] Emitted order:created to buyer ${order.buyer}`);
    
    // Also broadcast for any listening components
    this.broadcast('order:created', eventPayload);

    // Send notifications
    this.emitNotification(order.buyer, {
      type: 'order',
      title: order.wasAuction ? 'Auction Won!' : 'Order Placed!',
      message: order.wasAuction 
        ? `You won the auction for "${order.title}" at $${order.price}. Please provide your delivery address.`
        : `Your order for ${order.title} has been placed`,
      data: { orderId: order._id || order.id }
    });

    // Notify seller
    this.emitNotification(order.seller, {
      type: 'sale',
      title: order.wasAuction ? 'Auction Sold!' : 'New Order!',
      message: order.wasAuction
        ? `Your auction "${order.title}" sold for $${order.price}`
        : `You have a new order for "${order.title}"`,
      data: { orderId: order._id || order.id }
    });
  }

  emitNewOrder(order) {
    this.emitOrderCreated(order);
  }

  emitOrderUpdated(order) {
    const orderData = {
      _id: order._id?.toString() || order.id,
      id: order._id?.toString() || order.id,
      shippingStatus: order.shippingStatus,
      trackingNumber: order.trackingNumber,
      deliveryAddress: order.deliveryAddress
    };

    const eventPayload = {
      order: orderData,
      buyer: order.buyer,
      seller: order.seller
    };

    this.emitToUser(order.buyer, 'order:updated', eventPayload);
    this.emitToUser(order.seller, 'order:updated', eventPayload);
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

  // ===== Auctions ===========================================================

  emitNewBid(listing, bid) {
    this.io.emit('auction:bid', {
      listingId: listing._id,
      bidder: bid.bidder,
      amount: bid.amount,
      previousBid: listing.auction.bids[listing.auction.bids.length - 2]?.amount || listing.auction.startingPrice,
      bidCount: listing.auction.bids.length,
      timestamp: new Date()
    });

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

  // Include seller earnings in auction ended event
  emitAuctionEnded(listing, winner, finalBid) {
    console.log('[WebSocket] emitAuctionEnded called:', {
      listingId: listing._id,
      winner,
      finalBid
    });

    let sellerEarnings = null;
    let platformFee = null;
    
    if (winner && finalBid) {
      const AUCTION_PLATFORM_FEE = 0.20;
      platformFee = Math.round(finalBid * AUCTION_PLATFORM_FEE * 100) / 100;
      sellerEarnings = Math.round((finalBid - platformFee) * 100) / 100;
    }
    
    this.io.emit('auction:ended', {
      listingId: listing._id,
      winner,
      finalBid,
      sellerEarnings,
      platformFee,
      reserveMet: finalBid >= (listing.auction.reservePrice || 0),
      endedAt: new Date()
    });

    // Special notification to winner - they should refresh their orders
    if (winner) {
      this.emitToUser(winner, 'auction:won', {
        listingId: listing._id?.toString(),
        title: listing.title,
        amount: finalBid,
        needsAddress: true
      });
      console.log(`[WebSocket] Emitted auction:won to winner ${winner}`);
    }
  }

  // ===== Wallet =============================================================

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

  // ===== Subscriptions ======================================================

  emitNewSubscription(subscription) {
    this.emitToUser(subscription.creator, 'subscription:new', subscription);
    this.emitNotification(subscription.subscriber, {
      type: 'subscription',
      title: 'Subscription Activated!',
      message: `You are now subscribed to ${subscription.creator}`,
      data: { subscriptionId: subscription._id }
    });
  }

  emitSubscriptionCancelled(subscription, reason) {
    // Legacy event
    this.emitToUser(subscription.creator, 'subscription:cancelled', {
      ...subscription,
      cancelledAt: new Date(),
      reason
    });

    // Generic notification for UI storage
    try {
      this.emitNotification(subscription.creator, {
        type: 'subscription',
        title: 'Subscription Cancelled',
        message: `${subscription.subscriber} cancelled their subscription`,
        data: { subscriptionId: subscription.id || subscription._id, reason }
      });
    } catch (err) {
      console.error('[WebSocket] Failed to emit unsubscribe notification:', err);
    }
  }

  // ===== Listings ===========================================================

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

  /**
   * Accepts either:
   *  - emitListingSold(listingObject, buyerUsername)
   *  - emitListingSold({ _id/id, title, seller, buyer/soldTo, price, ... })
   */
  emitListingSold(listingOrPayload, buyerMaybe) {
    let id, title, seller, buyer, price;

    if (buyerMaybe === undefined && listingOrPayload && typeof listingOrPayload === 'object') {
      // Single payload form
      id = listingOrPayload._id || listingOrPayload.id;
      title = listingOrPayload.title;
      seller = listingOrPayload.seller;
      buyer = listingOrPayload.buyer || listingOrPayload.soldTo;
      price = listingOrPayload.price;
    } else {
      // (listing, buyer) form
      const listing = listingOrPayload || {};
      id = listing._id || listing.id;
      title = listing.title;
      seller = listing.seller;
      buyer = buyerMaybe;
      price = listing.price;
    }

    const payload = {
      id: id,
      listingId: id,
      title,
      seller,
      buyer,
      soldTo: buyer,
      price,
      soldAt: new Date()
    };

    // Normalize to one consistent event shape
    this.io.emit('listing:sold', payload);

    // Notifications
    try {
      if (seller) {
        this.emitNotification(seller, {
          type: 'listing',
          title: 'Your listing sold!',
          message: `${title} sold to ${buyer} for $${Number(price || 0).toFixed(2)}`,
          data: { listingId: id, buyer }
        });
      }
      if (buyer) {
        this.emitNotification(buyer, {
          type: 'order',
          title: 'Purchase successful',
          message: `You bought ${title} for $${Number(price || 0).toFixed(2)}`,
          data: { listingId: id, seller }
        });
      }
    } catch (err) {
      console.error('[WebSocket] Failed to emit listing sold notifications:', err);
    }
  }

  // ===== Diagnostics ========================================================

  isUserViewingThread(username, threadId) {
    const userThreads = this.userThreads.get(username);
    return userThreads ? userThreads.has(threadId) : false;
  }

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
