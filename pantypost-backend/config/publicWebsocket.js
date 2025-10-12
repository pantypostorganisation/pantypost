// pantypost-backend/config/publicWebsocket.js
const socketIO = require('socket.io');

class PublicWebSocketService {
  constructor() {
    this.io = null;
    this.statsRoom = 'public:stats';
  }

  initialize(server, mainWebSocketService) {
    // Create a separate namespace for public stats
    this.io = socketIO(server, {
      path: '/public-ws',
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: false // No credentials needed for public
      }
    });

    // No authentication required for public namespace
    this.io.on('connection', (socket) => {
      console.log('[PublicWS] Guest connected:', socket.id);
      
      // Auto-join stats room
      socket.join(this.statsRoom);
      
      // Send current stats immediately
      this.sendCurrentStats(socket);
      
      socket.on('disconnect', () => {
        console.log('[PublicWS] Guest disconnected:', socket.id);
      });
    });
  }

  async sendCurrentStats(socket) {
    try {
      const User = require('../models/User');
      const [totalUsers, totalBuyers, totalSellers, verifiedSellers] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'buyer' }),
        User.countDocuments({ role: 'seller' }),
        User.countDocuments({ role: 'seller', isVerified: true })
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const newUsersToday = await User.countDocuments({ 
        createdAt: { $gte: todayStart } 
      });

      const stats = {
        totalUsers,
        totalBuyers,
        totalSellers,
        verifiedSellers,
        newUsersToday,
        timestamp: new Date().toISOString()
      };

      socket.emit('stats:users', stats);
    } catch (error) {
      console.error('[PublicWS] Error sending stats:', error);
    }
  }

  // Broadcast stats to all connected clients (guests and authenticated)
  broadcastStats(stats) {
    if (!this.io) return;
    
    console.log('[PublicWS] Broadcasting stats to all guests:', {
      totalUsers: stats.totalUsers,
      newUsersToday: stats.newUsersToday
    });
    
    this.io.to(this.statsRoom).emit('stats:users', stats);
  }

  broadcastUserRegistered(userData) {
    if (!this.io) return;
    
    console.log('[PublicWS] Broadcasting new user registration to guests');
    this.io.to(this.statsRoom).emit('user:registered', userData);
  }
}

module.exports = new PublicWebSocketService();