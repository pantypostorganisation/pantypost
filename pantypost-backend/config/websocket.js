// pantypost-backend/config/websocket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.io = null;
    this.activeConnections = new Map();
    this.userSockets = new Map(); // userId -> [socketIds]
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
    });
  }

  handleConnection(socket) {
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

    // Send connection confirmation
    socket.emit('connected', {
      connected: true,
      sessionId: socket.id
    });

    // Notify user is online
    this.broadcastUserStatus(socket.username, true);
  }

  handleDisconnect(socket) {
    console.log(`User ${socket.username} disconnected`);
    
    // Remove from active connections
    this.activeConnections.delete(socket.id);

    // Remove from user sockets
    const userSocketIds = this.userSockets.get(socket.username) || [];
    const filtered = userSocketIds.filter(id => id !== socket.id);
    
    if (filtered.length === 0) {
      this.userSockets.delete(socket.username);
      // User has no more active connections
      this.broadcastUserStatus(socket.username, false);
    } else {
      this.userSockets.set(socket.username, filtered);
    }
  }

  handleTyping(socket, data) {
    const { conversationId, isTyping } = data;
    
    socket.to(`conversation:${conversationId}`).emit('message:typing', {
      userId: socket.userId,
      username: socket.username,
      conversationId,
      isTyping
    });
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
  }

  broadcastUserStatus(username, isOnline) {
    this.io.emit('user:online', {
      username,
      isOnline,
      timestamp: new Date()
    });
  }

  // Emit events from other parts of the application
  emitToUser(username, event, data) {
    const socketIds = this.userSockets.get(username) || [];
    socketIds.forEach(socketId => {
      this.io.to(socketId).emit(event, data);
    });
  }

  emitToRoom(roomType, roomId, event, data) {
    this.io.to(`${roomType}:${roomId}`).emit(event, data);
  }

  // Message events
  emitNewMessage(message) {
    this.emitToUser(message.sender, 'message:new', message);
    this.emitToUser(message.receiver, 'message:new', message);
  }

  emitMessageRead(messageIds, threadId, readBy) {
    this.emitToRoom('conversation', threadId, 'message:read', {
      messageIds,
      threadId,
      readBy,
      readAt: new Date()
    });
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

  emitAuctionEnded(listing, winner, finalBid) {
    this.io.emit('auction:ended', {
      listingId: listing._id,
      winner,
      finalBid,
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
    this.io.emit('listing:sold', {
      id: listing._id,
      title: listing.title,
      soldTo: buyer,
      price: listing.price,
      soldAt: new Date()
    });
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.activeConnections.size,
      uniqueUsers: this.userSockets.size,
      connections: Array.from(this.activeConnections.entries()).map(([socketId, data]) => ({
        socketId,
        ...data
      }))
    };
  }
}

module.exports = new WebSocketService();