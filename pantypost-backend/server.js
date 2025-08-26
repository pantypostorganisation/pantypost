// pantypost-backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import WebSocket service
const webSocketService = require('./config/websocket');

// Import models
const User = require('./models/User');
const Notification = require('./models/Notification');
const Verification = require('./models/Verification');
const Ban = require('./models/Ban');

// Import middleware
const authMiddleware = require('./middleware/auth.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const listingRoutes = require('./routes/listing.routes');
const orderRoutes = require('./routes/order.routes');
const messageRoutes = require('./routes/message.routes');
const walletRoutes = require('./routes/wallet.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const reviewRoutes = require('./routes/review.routes');
const uploadRoutes = require('./routes/upload.routes');
const tierRoutes = require('./routes/tier.routes');
const tipRoutes = require('./routes/tip.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const notificationRoutes = require('./routes/notification.routes');
const verificationRoutes = require('./routes/verification.routes');
const adminRoutes = require('./routes/admin.routes');
const reportRoutes = require('./routes/report.routes');
const banRoutes = require('./routes/ban.routes'); // NEW

// Import tier service for initialization
const tierService = require('./services/tierService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
webSocketService.initialize(server);

// Make webSocketService globally available for routes
global.webSocketService = webSocketService;

// Connect to MongoDB
connectDB();

// CORS Configuration
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://192.168.0.21:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Client-Version',
      'X-App-Name',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'X-Request-ID',
    ],
  })
);

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    features: {
      tiers: true,
      websocket: true,
      favorites: true,
      notifications: true,
      verification: true,
      reports: true,
      bans: true
    },
  });
});

// ---------------------- API Routes ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', banRoutes); // NEW - Add ban routes
app.use('/api/reports', reportRoutes);

// --- Compatibility mounts (support old clients that forget '/api') ---
app.use('/subscriptions', subscriptionRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/subscription', subscriptionRoutes);
// --------------------------------------------------------

// WebSocket status endpoint
app.get('/api/ws/status', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  res.json({ success: true, data: webSocketService.getConnectionStats() });
});

// Add WebSocket methods for admin notifications
webSocketService.emitToAdmins = function(event, data) {
  User.find({ role: 'admin' }).select('username').then(admins => {
    admins.forEach(admin => {
      this.emitToUser(admin.username, event, data);
    });
  });
};

// Notification system status endpoint (admin only)
app.get('/api/notifications/system-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  try {
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ read: false });
    const clearedNotifications = await Notification.countDocuments({ cleared: true });
    const deletedNotifications = await Notification.countDocuments({ deleted: true });

    const typeDistribution = await Notification.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const topRecipients = await Notification.aggregate([{ $group: { _id: '$recipient', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);

    res.json({
      success: true,
      data: {
        statistics: { total: totalNotifications, unread: unreadNotifications, cleared: clearedNotifications, deleted: deletedNotifications },
        typeDistribution,
        topRecipients,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verification system status endpoint (admin only)
app.get('/api/verification/system-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const totalVerifications = await Verification.countDocuments();
    const pendingVerifications = await Verification.countDocuments({ status: 'pending' });
    const approvedVerifications = await Verification.countDocuments({ status: 'approved' });
    const rejectedVerifications = await Verification.countDocuments({ status: 'rejected' });

    const statusDistribution = await Verification.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const processingTimes = await Verification.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'rejected'] },
          reviewedAt: { $exists: true },
        },
      },
      {
        $project: {
          processingTime: { $divide: [{ $subtract: ['$reviewedAt', '$submittedAt'] }, 1000 * 60 * 60] }, // hours
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$processingTime' },
          minTime: { $min: '$processingTime' },
          maxTime: { $max: '$processingTime' },
        },
      },
    ]);

    const recentVerifications = await Verification.find().sort({ submittedAt: -1 }).limit(10).populate('userId', 'username').select('username status submittedAt reviewedAt');

    res.json({
      success: true,
      data: {
        statistics: { total: totalVerifications, pending: pendingVerifications, approved: approvedVerifications, rejected: rejectedVerifications },
        statusDistribution,
        processingTimes: processingTimes[0] || { avgTime: 0, minTime: 0, maxTime: 0 },
        recentVerifications,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tier system status endpoint (admin only)
app.get('/api/tiers/system-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const TIER_CONFIG = require('./config/tierConfig');

    const tierDistribution = await User.aggregate([{ $match: { role: 'seller' } }, { $group: { _id: '$tier', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);

    res.json({
      success: true,
      data: {
        config: TIER_CONFIG.getPublicConfig(),
        distribution: tierDistribution,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ban system scheduled task - check and expire bans
setInterval(async () => {
  try {
    const expiredCount = await Ban.checkAndExpireBans();
    if (expiredCount > 0) {
      console.log(`[Ban System] Expired ${expiredCount} bans`);
    }
  } catch (error) {
    console.error('[Ban System] Error checking expired bans:', error);
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// --------------------- Test Routes (unchanged) ---------------------
app.get('/api/test/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/test/create-user', async (req, res) => {
  try {
    const { username, email, role } = req.body;

    const newUser = new User({
      username: username || 'testuser',
      email: email || 'test@example.com',
      password: 'testpassword',
      role: role || 'buyer',
      tier: role === 'seller' ? 'Tease' : undefined,
    });

    await newUser.save();

    res.json({
      success: true,
      message: 'User created!',
      user: { username: newUser.username, email: newUser.email, role: newUser.role, tier: newUser.tier },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/test/check-tier/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.role !== 'seller') return res.status(400).json({ success: false, error: 'User is not a seller' });

    const stats = await tierService.calculateSellerStats(username);
    const TIER_CONFIG = require('./config/tierConfig');
    const currentTier = user.tier || 'Tease';
    const nextTier = TIER_CONFIG.getNextTier(currentTier);

    res.json({ success: true, data: { username: user.username, currentTier, nextTier, stats, tierInfo: TIER_CONFIG.getTierByName(currentTier) } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/test/check-verification/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const verification = await Verification.findOne({ userId: user._id }).sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: {
        username: user.username,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        latestVerification: verification,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/recalculate-all-tiers', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const sellers = await User.find({ role: 'seller' });
    const results = [];

    for (const seller of sellers) {
      const result = await tierService.updateSellerTier(seller.username);
      results.push({ username: seller.username, ...result });
    }

    res.json({
      success: true,
      data: { totalSellers: sellers.length, updated: results.filter((r) => r.changed).length, results },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/fix-tier-names', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const updated = await tierService.fixAllSellerTiers();
    res.json({ success: true, data: { message: `Fixed ${updated} seller tiers`, updated } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/cleanup-notifications', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const { daysOld = 30 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({ createdAt: { $lt: cutoffDate }, deleted: true });

    res.json({ success: true, data: { message: `Cleaned up ${result.deletedCount} old notifications`, deletedCount: result.deletedCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/cleanup-verification-docs', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const { daysOld = 90 } = req.body;
    const fs = require('fs').promises;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldVerifications = await Verification.find({ status: 'rejected', reviewedAt: { $lt: cutoffDate } });

    let deletedFiles = 0;

    for (const verification of oldVerifications) {
      for (const docType of ['codePhoto', 'idFront', 'idBack', 'passport']) {
        if (verification.documents[docType]?.url) {
          const filePath = path.join(__dirname, verification.documents[docType].url);
          try {
            await fs.unlink(filePath);
            deletedFiles++;
          } catch (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
          }
        }
      }
      verification.documents = {};
      await verification.save();
    }

    res.json({
      success: true,
      data: {
        message: `Cleaned up ${deletedFiles} old verification documents from ${oldVerifications.length} verifications`,
        verifications: oldVerifications.length,
        deletedFiles,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: { message: err.message || 'Internal server error', ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) },
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Initialize tier system on startup
async function initializeTierSystem() {
  try {
    const TIER_CONFIG = require('./config/tierConfig');
    console.log('✅ Tier system initialized with levels:', Object.keys(TIER_CONFIG.tiers));
    console.log('📊 Fixing all seller tiers...');
    const fixedCount = await tierService.fixAllSellerTiers();
    console.log(`✅ Fixed ${fixedCount} seller tiers`);
  } catch (error) {
    console.error('⚠️ Error initializing tier system:', error);
  }
}

// Initialize notification system on startup
async function initializeNotificationSystem() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const result = await Notification.deleteMany({ createdAt: { $lt: cutoffDate }, deleted: true });
    console.log(`✅ Notification system initialized, cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('⚠️ Error initializing notification system:', error);
  }
}

// Initialize verification system on startup
async function initializeVerificationSystem() {
  try {
    const fs = require('fs').promises;
    const verificationDir = path.join(__dirname, 'uploads', 'verification');
    await fs.mkdir(verificationDir, { recursive: true });

    const pendingCount = await Verification.countDocuments({ status: 'pending' });
    const verifiedUsers = await User.countDocuments({ isVerified: true, role: 'seller' });

    console.log(`✅ Verification system initialized`);
    console.log(`   - ${pendingCount} pending verifications`);
    console.log(`   - ${verifiedUsers} verified sellers`);

    if (pendingCount > 0 && global.webSocketService) {
      const admins = await User.find({ role: 'admin' }).select('username');
      for (const admin of admins) {
        const notification = new Notification({
          recipient: admin.username,
          type: 'admin_alert',
          title: 'Pending Verifications',
          message: `There are ${pendingCount} verification requests waiting for review`,
          link: '/admin/verification-requests',
          priority: 'high',
        });
        await notification.save();

        global.webSocketService.sendToUser(admin.username, {
          type: 'notification',
          data: {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            priority: notification.priority,
            createdAt: notification.createdAt,
          },
        });
      }
    }
  } catch (error) {
    console.error('⚠️ Error initializing verification system:', error);
  }
}

// Initialize report & ban system on startup
async function initializeReportSystem() {
  try {
    const Report = require('./models/Report');
    const Ban = require('./models/Ban');
    
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const activeBans = await Ban.countDocuments({ active: true });
    
    console.log(`✅ Report & Ban system initialized`);
    console.log(`   - ${pendingReports} pending reports`);
    console.log(`   - ${activeBans} active bans`);
    
    // Check and expire old bans
    const expiredCount = await Ban.checkAndExpireBans();
    if (expiredCount > 0) {
      console.log(`   - Expired ${expiredCount} bans`);
    }
  } catch (error) {
    console.error('⚠️ Error initializing report system:', error);
  }
}

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for connections`);

  await initializeTierSystem();
  console.log(`🏆 Tier system ready`);

  await initializeNotificationSystem();
  console.log(`🔔 Notification system ready`);

  await initializeVerificationSystem();
  console.log(`✔️  Verification system ready`);
  
  await initializeReportSystem();
  console.log(`🛡️ Report & Ban system ready`);

  console.log('\n📍 Available endpoints:');
  console.log('  - Auth:          /api/auth/*');
  console.log('  - Users:         /api/users/*');
  console.log('  - Listings:      /api/listings/*');
  console.log('  - Orders:        /api/orders/*');
  console.log('  - Messages:      /api/messages/*');
  console.log('  - Wallet:        /api/wallet/*');
  console.log('  - Subscriptions: /api/subscriptions/*');
  console.log('  - Reviews:       /api/reviews/*');
  console.log('  - Upload:        /api/upload/*');
  console.log('  - Tiers:         /api/tiers/*');
  console.log('  - Tips:          /api/tips/*');
  console.log('  - Favorites:     /api/favorites/*');
  console.log('  - Notifications: /api/notifications/*');
  console.log('  - Verification:  /api/verification/*');
  console.log('  - Admin:         /api/admin/*');
  console.log('  - Reports:       /api/reports/*');
  console.log('  - Bans:          /api/admin/bans/*'); // NEW
  console.log('\n✨ Server initialization complete!\n');
});
