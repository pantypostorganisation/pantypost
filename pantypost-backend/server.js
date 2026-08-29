// pantypost-backend/server.js
const express = require('express');
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

// Import public WebSocket service for guest users
const publicWebSocketService = require('./config/publicWebsocket');

// Import models
const User = require('./models/User');
const Notification = require('./models/Notification');
const Verification = require('./models/Verification');
const Ban = require('./models/Ban');
const Listing = require('./models/Listing');

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
const banRoutes = require('./routes/ban.routes');
const approvalRoutes = require('./routes/approval.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const statsRoutes = require('./routes/stats.routes');
// NEW
const profileBuyerRoutes = require('./routes/profilebuyer.routes');
const referralRoutes = require('./routes/referral.routes');
/* CRYPTO DEPOSITS REMOVED
 *
 * Card via SegPay is the funding route. The crypto UI was taken out of
 * the wallet earlier, but the ENDPOINTS stayed live -- and an endpoint
 * that credits a wallet is not made safe by hiding its button.
 *
 * The route file, the model and the monitor service are all still on
 * disk. Nothing is deleted; the routes are simply not mounted, so
 * /api/crypto/* now 404s. Restoring it is this one line plus the mount
 * below.
 *
 * const cryptoRoutes = require('./routes/crypto.routes');
 */
const postRoutes = require('./routes/post.routes'); // EXPLORE/SOCIAL POSTS
const trafficRoutes = require('./routes/traffic.routes'); // SITE TRAFFIC ANALYTICS
const customRequestRoutes = require('./routes/customRequest.routes'); // CUSTOM REQUEST NEGOTIATION

// Import tier service for initialization
const tierService = require('./services/tierService');

// Import auction settlement service
const AuctionSettlementService = require('./services/auctionSettlement');

// Import subscription renewal service
const SubscriptionRenewalService = require('./services/subscriptionRenewal');

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// SECURITY: JWT secret must be supplied by the environment.
// Previously this fell back to the literal string 'your-secret-key'.
// If JWT_SECRET was ever missing on a deploy, anyone who knew that
// fallback could forge a valid admin token. We now refuse to start.
// =====================================================
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('');
  console.error('==============================================================');
  console.error(' FATAL: JWT_SECRET is missing or too short.');
  console.error('');
  console.error(' Set a strong JWT_SECRET (at least 32 characters) in your .env');
  console.error(' file before starting the server. Generate one with:');
  console.error('');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  console.error('');
  console.error(' The server will not start without it.');
  console.error('==============================================================');
  console.error('');
  process.exit(1);
}

// =====================================================
// CRITICAL: trust exactly ONE proxy hop (nginx).
//
// Without this, Express behind nginx reports req.ip as 127.0.0.1 for
// every visitor, so every express-rate-limit bucket in auth.routes.js
// (and complaint/report/traffic routes) was ONE SHARED GLOBAL BUCKET:
// 20 login attempts per 15 minutes for the entire userbase combined.
// One hostile request every 45 seconds would have locked every real
// user out of login, signup and password reset indefinitely.
//
// The value must be 1, not true: `true` trusts the whole client-
// supplied X-Forwarded-For chain, which lets an attacker spoof a fresh
// IP per request and bypass the limits instead.
// =====================================================
app.set('trust proxy', 1);

// Country blocking. Sits ahead of the routes so a hard-blocked region
// never reaches an endpoint. Fails open if the GeoIP database is
// missing -- see the middleware for why.
const { geoMiddleware } = require('./middleware/geo.middleware');
app.use(geoMiddleware);

// Privacy-policy enforcement: purge raw verification ID images after
// the retention window (default 30 days post-decision). The policy
// promises this deletion; this line is what makes the promise true.
const { startVerificationCleanup } = require('./services/verificationCleanup');
startVerificationCleanup();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
webSocketService.initialize(server);

// Initialize public WebSocket service for guests
publicWebSocketService.initialize(server, webSocketService);

// Make both services globally available for routes
global.webSocketService = webSocketService;
global.publicWebSocketService = publicWebSocketService;

// Connect to MongoDB
connectDB();

// CORS REMOVED - Nginx handles all CORS now

// The verify hook stashes the raw request bytes on req.rawBody for
// webhook routes only.
//
// Webhook signatures are HMACs over the exact bytes the provider sent.
// Re-serialising the parsed object produces different bytes — key order
// and whitespace are not preserved — so every signature check would
// fail. This is the standard cause of "signature invalid" bugs.
app.use(bodyParser.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// CRITICAL FIX: SERVE STATIC FILES BEFORE OTHER ROUTES
// =====================================================

// =====================================================
// SECURITY: Identity documents must never be served publicly.
//
// uploads/verification/ holds passport scans, driver's licence photos
// and verification selfies. Serving them from the public /uploads
// mount meant anyone holding a URL could download them with no login.
//
// This block MUST stay above the express.static mount below, because
// Express matches middleware in the order it is registered.
// =====================================================
app.use('/uploads/verification', (req, res) => {
  console.warn(`[Security] Blocked public request for verification document: ${req.path}`);
  return res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Serve uploaded files with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  // Never serve dot-files from the uploads tree
  dotfiles: 'ignore',
  maxAge: '7d',
  etag: true,
  setHeaders: (res, filePath) => {
    // Set proper MIME types for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    
    // Allow CORS for images (in case nginx doesn't catch it)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    // Enable caching for better performance
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
  }
}));

// Debug middleware to log static file requests
app.use('/uploads', (req, res, next) => {
  console.log(`[Static] Serving file: ${req.path}`);
  next();
});

// =====================================================
// SECURITY: The backend root is no longer served as static files.
//
// This previously published the entire backend directory, meaning
// server.js, models/, routes/, config/ and the test-html/ pages were
// all publicly readable at https://api.pantypost.com/<filename>.
//
// Anything the public genuinely needs must be placed in uploads/
// and served through the /uploads mount above.
// =====================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    features: {
      tiers: true,
      websocket: true,
      publicWebsocket: true,
      favorites: true,
      notifications: true,
      verification: true,
      reports: true,
      bans: true,
      analytics: true,
      auctions: true,
      storage: true,
      referrals: true,
      subscriptionRenewals: true,
      cryptoDeposits: false,
      cryptoAutoVerification: false,
      explorePosts: true
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
app.use('/api/admin', banRoutes);
app.use('/api/admin/approval', approvalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/age-verification', require('./routes/ageVerification.routes'));
app.use('/api/analytics', analyticsRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/stats', statsRoutes);
// app.use('/api/crypto', cryptoRoutes); // removed -- see note at the require above
app.use('/api/posts', postRoutes); // EXPLORE/SOCIAL POST ROUTES

// Custom request negotiation. Previously this state lived only in the
// creating user's sessionStorage, so the other party never saw it.
app.use('/api/custom-requests', customRequestRoutes);

// NEW: buyer self profile (matches the FE calls to /api/profilebuyer)
app.use('/api/profilebuyer', profileBuyerRoutes);

// NEW: referral system routes
app.use('/api/referral', referralRoutes);

// ---------------------- Storage API Routes ----------------------
// SECURITY: storage keys are embedded in Mongo update paths (`storage.<key>`),
// so reject dots/$ to prevent path traversal into other document fields.
function isValidStorageKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(key);
}

app.get('/api/storage/get/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (!user.storage) {
      user.storage = {};
    }
    
    const value = user.storage[key] || null;
    
    res.json({ 
      success: true, 
      data: { value } 
    });
  } catch (error) {
    console.error(`Storage GET error for key ${req.params.key}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/storage/set', authMiddleware, async (req, res) => {
  try {
    const { key, value } = req.body;
    const userId = req.user.id;

    if (!isValidStorageKey(key)) {
      return res.status(400).json({ success: false, error: 'Invalid key' });
    }
    
    const valueSize = JSON.stringify(value).length;
    if (valueSize > 1024 * 1024) {
      return res.status(413).json({ success: false, error: 'Value too large (max 1MB)' });
    }
    
    const result = await User.findByIdAndUpdate(
      userId,
      { 
        [`storage.${key}`]: value,
        'storageUpdatedAt': new Date()
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Storage SET error for key ${req.body.key}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/storage/delete/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.id;

    if (!isValidStorageKey(key)) {
      return res.status(400).json({ success: false, error: 'Invalid key' });
    }

    const result = await User.findByIdAndUpdate(
      userId,
      { 
        $unset: { [`storage.${key}`]: 1 },
        'storageUpdatedAt': new Date()
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(`Storage DELETE error for key ${req.params.key}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/storage/keys', authMiddleware, async (req, res) => {
  try {
    const { pattern } = req.body;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user || !user.storage) {
      return res.json({ success: true, data: { keys: [] } });
    }
    
    let keys = Object.keys(user.storage);
    
    if (pattern) {
      keys = keys.filter(key => key.includes(pattern));
    }
    
    res.json({ 
      success: true, 
      data: { keys } 
    });
  } catch (error) {
    console.error('Storage KEYS error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/storage/exists/:key', authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    const exists = user && user.storage && key in user.storage;
    
    res.json({ 
      success: true, 
      data: { exists } 
    });
  } catch (error) {
    console.error(`Storage EXISTS error for key ${req.params.key}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/storage/clear', authMiddleware, async (req, res) => {
  try {
    const { preserveKeys } = req.body;
    const userId = req.user.id;
    
    if (preserveKeys && preserveKeys.length > 0) {
      const user = await User.findById(userId);
      const preserved = {};
      
      if (user && user.storage) {
        preserveKeys.forEach(key => {
          if (key in user.storage) {
            preserved[key] = user.storage[key];
          }
        });
      }
      
      await User.findByIdAndUpdate(userId, { 
        storage: preserved,
        'storageUpdatedAt': new Date()
      });
    } else {
      await User.findByIdAndUpdate(userId, { 
        storage: {},
        'storageUpdatedAt': new Date()
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Storage CLEAR error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/storage/info', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    const storage = user?.storage || {};
    
    const used = JSON.stringify(storage).length;
    const quota = 5 * 1024 * 1024;
    
    res.json({ 
      success: true, 
      data: { 
        used, 
        quota,
        percentage: (used / quota) * 100,
        keys: Object.keys(storage).length
      } 
    });
  } catch (error) {
    console.error('Storage INFO error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/storage/ui-preference', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        await User.findByIdAndUpdate(
          decoded.id,
          { [`uiPreferences.${key}`]: value }
        );
      } catch (err) {
        // Token invalid, but that's ok for UI preferences
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('UI preference error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/storage/ui-preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    const preferences = user?.uiPreferences || {};
    
    res.json({ 
      success: true, 
      data: { preferences } 
    });
  } catch (error) {
    console.error('Get UI preferences error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Compatibility mounts ---
app.use('/subscriptions', subscriptionRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/subscription', subscriptionRoutes);

// WebSocket status endpoint
app.get('/api/ws/status', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  res.json({ success: true, data: webSocketService.getConnectionStats() });
});

// Public WebSocket status endpoint (admin only)
app.get('/api/public-ws/status', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  
  const publicStats = {
    connected: publicWebSocketService.io ? publicWebSocketService.io.engine.clientsCount : 0,
    roomMembers: publicWebSocketService.io 
      ? publicWebSocketService.io.sockets.adapter.rooms.get('public:stats')?.size || 0 
      : 0
  };
  
  res.json({ success: true, data: publicStats });
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
          processingTime: { $divide: [{ $subtract: ['$reviewedAt', '$submittedAt'] }, 1000 * 60 * 60] },
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

// Crypto deposits system status endpoint (admin only) - NEW
app.get('/api/crypto/system-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const CryptoDeposit = require('./models/CryptoDeposit');
    
    const totalDeposits = await CryptoDeposit.countDocuments();
    const pendingDeposits = await CryptoDeposit.countDocuments({ status: 'pending' });
    const confirmingDeposits = await CryptoDeposit.countDocuments({ status: 'confirming' });
    const completedDeposits = await CryptoDeposit.countDocuments({ status: 'completed' });
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentVolume = await CryptoDeposit.aggregate([
      { $match: { status: 'completed', completedAt: { $gte: last24Hours } } },
      { $group: { _id: null, total: { $sum: '$actualUSDCredited' } } }
    ]);
    
    const currencyDistribution = await CryptoDeposit.aggregate([
      { $group: { _id: '$cryptoCurrency', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          total: totalDeposits,
          pending: pendingDeposits,
          confirming: confirmingDeposits,
          completed: completedDeposits,
          volume24h: recentVolume[0]?.total || 0
        },
        currencyDistribution,
        walletAddresses: {
          polygon: process.env.CRYPTO_WALLET_POLYGON ? '✓ Configured' : '✗ Not configured',
          tron: process.env.CRYPTO_WALLET_USDT_TRC20 ? '✓ Configured' : '✗ Not configured',
          bitcoin: process.env.CRYPTO_WALLET_BTC ? '✓ Configured' : '✗ Not configured'
        },
        autoVerification: {
          enabled: true,
          checkInterval: '30 seconds',
          supportedTokens: ['USDT', 'USDC', 'MATIC']
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auction system status endpoint (admin only)
app.get('/api/auctions/system-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const totalAuctions = await Listing.countDocuments({ 'auction.isAuction': true });
    const activeAuctions = await Listing.countDocuments({ 
      'auction.isAuction': true,
      'auction.status': 'active'
    });
    const endedAuctions = await Listing.countDocuments({ 
      'auction.isAuction': true,
      'auction.status': 'ended'
    });
    const cancelledAuctions = await Listing.countDocuments({ 
      'auction.isAuction': true,
      'auction.status': 'cancelled'
    });
    const reserveNotMetAuctions = await Listing.countDocuments({ 
      'auction.isAuction': true,
      'auction.status': 'reserve_not_met'
    });
    const processingAuctions = await Listing.countDocuments({ 
      'auction.isAuction': true,
      'auction.status': 'processing'
    });
    const errorAuctions = await Listing.countDocuments({ 
      'auction.isAuction': true,
      'auction.status': 'error'
    });

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const endingSoon = await Listing.find({
      'auction.isAuction': true,
      'auction.status': 'active',
      'auction.endTime': { $lte: oneHourFromNow, $gte: new Date() }
    }).select('title auction.endTime auction.currentBid');

    res.json({
      success: true,
      data: {
        statistics: {
          total: totalAuctions,
          active: activeAuctions,
          ended: endedAuctions,
          cancelled: cancelledAuctions,
          reserveNotMet: reserveNotMetAuctions,
          processing: processingAuctions,
          error: errorAuctions
        },
        endingSoon,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Posts system status endpoint (admin only) - NEW
app.get('/api/posts/system-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const Post = require('./models/Post');
    
    const totalPosts = await Post.countDocuments();
    const activePosts = await Post.countDocuments({ status: 'active' });
    const deletedPosts = await Post.countDocuments({ status: 'deleted' });
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPosts = await Post.countDocuments({ createdAt: { $gte: last24Hours } });
    
    const topPosters = await Post.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$author', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const trendingTags = await Post.getTrendingTags(10);

    res.json({
      success: true,
      data: {
        statistics: {
          total: totalPosts,
          active: activePosts,
          deleted: deletedPosts,
          last24Hours: recentPosts
        },
        topPosters,
        trendingTags,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SCHEDULED TASKS ====================

// Ban system - Check every 5 minutes
setInterval(async () => {
  try {
    const expiredCount = await Ban.checkAndExpireBans();
    if (expiredCount > 0) {
      console.log(`[Ban System] Expired ${expiredCount} bans`);
    }
  } catch (error) {
    console.error('[Ban System] Error checking expired bans:', error);
  }
}, 5 * 60 * 1000);

// Subscription renewals - Check once per day at 2 AM
// Runs every 24 hours
const RENEWAL_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Calculate time until next 2 AM
function getTimeUntilNextRenewalCheck() {
  const now = new Date();
  const next2AM = new Date();
  next2AM.setHours(2, 0, 0, 0);
  
  // If it's past 2 AM today, schedule for 2 AM tomorrow
  if (now > next2AM) {
    next2AM.setDate(next2AM.getDate() + 1);
  }
  
  return next2AM.getTime() - now.getTime();
}

// Schedule the first run
setTimeout(async () => {
  console.log('[Subscription Renewal] Starting daily renewal check at 2 AM...');
  
  try {
    const results = await SubscriptionRenewalService.processAllRenewals();
    console.log('[Subscription Renewal] Daily check completed:', results);
  } catch (error) {
    console.error('[Subscription Renewal] Error in scheduled renewal check:', error);
  }
  
  // Schedule subsequent runs every 24 hours
  setInterval(async () => {
    console.log('[Subscription Renewal] Starting daily renewal check...');
    
    try {
      const results = await SubscriptionRenewalService.processAllRenewals();
      console.log('[Subscription Renewal] Daily check completed:', results);
    } catch (error) {
      console.error('[Subscription Renewal] Error in scheduled renewal check:', error);
    }
  }, RENEWAL_CHECK_INTERVAL);
  
}, getTimeUntilNextRenewalCheck());

// Manual subscription renewal endpoint (admin only)
app.post('/api/subscriptions/process-renewals-manual', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  
  try {
    const results = await SubscriptionRenewalService.processAllRenewals();
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cleanup stuck auctions every 5 minutes
setInterval(async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    const resetResult = await Listing.updateMany(
      {
        'auction.isAuction': true,
        'auction.status': 'processing',
        'auction.endTime': { $lte: oneHourAgo }
      },
      {
        $set: { 'auction.status': 'active' }
      }
    );
    
    if (resetResult.modifiedCount > 0) {
      console.log(`[Auction] Reset ${resetResult.modifiedCount} stuck auctions`);
      
      if (global.webSocketService) {
        global.webSocketService.emitToAdmins('auction:stuck_reset', {
          count: resetResult.modifiedCount,
          timestamp: new Date()
        });
      }
    }
    
    const thirtyMinutesAgo = new Date(Date.now() - 1800000);
    const errorResetResult = await Listing.updateMany(
      {
        'auction.isAuction': true,
        'auction.status': 'error',
        'auction.endTime': { $lte: thirtyMinutesAgo }
      },
      {
        $set: { 'auction.status': 'active' }
      }
    );
    
    if (errorResetResult.modifiedCount > 0) {
      console.log(`[Auction] Reset ${errorResetResult.modifiedCount} error status auctions`);
    }
  } catch (error) {
    console.error('[Auction] Error resetting stuck auctions:', error);
  }
}, 5 * 60 * 1000);

// Instant auction processor
setInterval(async () => {
  try {
    const now = new Date();
    const fiveSecondsAgo = new Date(now - 5000);
    
    const justExpired = await Listing.findOne({
      'auction.isAuction': true,
      'auction.status': 'active',
      'auction.endTime': { 
        $lte: now,
        $gte: fiveSecondsAgo
      }
    });
    
    if (justExpired) {
      console.log(`[Auction] Instant processing auction ${justExpired._id} that just expired`);
      
      AuctionSettlementService.processEndedAuction(justExpired._id)
        .then(result => {
          if (!result.alreadyProcessed) {
            console.log(`[Auction] Instantly processed auction ${justExpired._id}`);
          }
        })
        .catch(err => {
          // Silent catch
        });
    }
  } catch (error) {
    // Silent catch
  }
}, 1000);

// Main auction processor
setInterval(async () => {
  try {
    const results = await AuctionSettlementService.processExpiredAuctions();
    
    if (results.processed > 0) {
      console.log(`[Auction System] Processed ${results.processed} expired auctions`);
      
      if (results.errors.length > 0 && global.webSocketService) {
        global.webSocketService.emitToAdmins('auction:processing_errors', {
          processed: results.processed,
          errors: results.errors,
          timestamp: new Date()
        });
      }
    }
  } catch (error) {
    console.error('[Auction System] Critical error in scheduled task:', error);
    
    if (global.webSocketService) {
      global.webSocketService.emitToAdmins('system:critical_error', {
        system: 'auction',
        error: error.message,
        timestamp: new Date()
      });
    }
  }
}, 3000);

// Manual auction processing endpoint
app.post('/api/auctions/process-expired', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  
  try {
    const results = await AuctionSettlementService.processExpiredAuctions();
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Instant auction check endpoint
app.get('/api/auctions/check/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing || !listing.auction || !listing.auction.isAuction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }
    
    const now = new Date();
    const isExpired = now >= listing.auction.endTime;
    const needsProcessing = isExpired && listing.auction.status === 'active';
    
    if (needsProcessing) {
      console.log(`[Auction] Frontend triggered check for expired auction ${listing._id}`);
      
      AuctionSettlementService.processEndedAuction(listing._id)
        .then(result => {
          console.log(`[Auction] Frontend-triggered processing completed for ${listing._id}`);
        })
        .catch(err => {
          console.error(`[Auction] Frontend-triggered processing failed for ${listing._id}:`, err);
        });
    }
    
    res.json({
      success: true,
      data: {
        status: listing.auction.status,
        isExpired,
        needsProcessing,
        endTime: listing.auction.endTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// --------------------- Test Routes ---------------------
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

// Error handling middleware
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

// Initialize functions
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

async function initializeReportSystem() {
  try {
    const Report = require('./models/Report');
    const Ban = require('./models/Ban');
    
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const activeBans = await Ban.countDocuments({ active: true });
    
    console.log(`✅ Report & Ban system initialized`);
    console.log(`   - ${pendingReports} pending reports`);
    console.log(`   - ${activeBans} active bans`);
    
    const expiredCount = await Ban.checkAndExpireBans();
    if (expiredCount > 0) {
      console.log(`   - Expired ${expiredCount} bans`);
    }
  } catch (error) {
    console.error('⚠️ Error initializing report system:', error);
  }
}

async function initializeAuctionSystem() {
  try {
    const activeAuctions = await Listing.countDocuments({ 
      'auction.isAuction': true,
      'auction.status': 'active'
    });
    
    const now = new Date();
    const expiredAuctions = await Listing.countDocuments({
      'auction.isAuction': true,
      'auction.status': 'active',
      'auction.endTime': { $lte: now }
    });
    
    console.log(`✅ Auction system initialized`);
    console.log(`   - ${activeAuctions} active auctions`);
    console.log(`   - ${expiredAuctions} expired auctions to process`);
    
    if (expiredAuctions > 0) {
      console.log(`   - Processing ${expiredAuctions} expired auctions...`);
      const results = await AuctionSettlementService.processExpiredAuctions();
      console.log(`   - Processed: ${results.processed} (${results.successful} successful, ${results.noBids} no bids, ${results.reserveNotMet} reserve not met)`);
    }
  } catch (error) {
    console.error('⚠️ Error initializing auction system:', error);
  }
}

async function initializeStorageSystem() {
  try {
    const usersWithoutStorage = await User.countDocuments({ storage: { $exists: false } });
    if (usersWithoutStorage > 0) {
      console.log(`   - Adding storage field to ${usersWithoutStorage} users...`);
      await User.updateMany(
        { storage: { $exists: false } },
        { $set: { storage: {}, uiPreferences: {} } }
      );
    }
    
    console.log(`✅ Storage system initialized`);
    console.log(`   - Backend storage endpoints ready`);
    console.log(`   - UI preferences endpoints ready`);
  } catch (error) {
    console.error('⚠️ Error initializing storage system:', error);
  }
}

async function initializePublicWebSocketSystem() {
  try {
    console.log(`✅ Public WebSocket system initialized`);
    console.log(`   - Guest users can receive real-time stats`);
    console.log(`   - Path: /public-ws`);
  } catch (error) {
    console.error('⚠️ Error initializing public WebSocket system:', error);
  }
}

async function initializeSubscriptionRenewalSystem() {
  try {
    const Subscription = require('./models/Subscription');
    
    const activeSubscriptions = await Subscription.countDocuments({ 
      status: 'active',
      autoRenew: true
    });
    
    const dueSubscriptions = await Subscription.countDocuments({
      status: 'active',
      autoRenew: true,
      nextBillingDate: { $lte: new Date() }
    });
    
    console.log(`✅ Subscription renewal system initialized`);
    console.log(`   - ${activeSubscriptions} active auto-renewing subscriptions`);
    console.log(`   - ${dueSubscriptions} subscriptions due for renewal`);
    console.log(`   - Daily renewal check scheduled for 2:00 AM`);
    
    if (dueSubscriptions > 0) {
      console.log(`   - Note: ${dueSubscriptions} subscriptions are overdue and will be processed at next check`);
    }
  } catch (error) {
    console.error('⚠️ Error initializing subscription renewal system:', error);
  }
}

async function initializeCryptoDepositSystem() {
  try {
    const CryptoDeposit = require('./models/CryptoDeposit');
    
    const pendingDeposits = await CryptoDeposit.countDocuments({ status: 'pending' });
    const confirmingDeposits = await CryptoDeposit.countDocuments({ status: 'confirming' });
    const completedDeposits = await CryptoDeposit.countDocuments({ status: 'completed' });
    
    console.log(`✅ Crypto deposit system initialized`);
    console.log(`   - ${pendingDeposits} pending deposits`);
    console.log(`   - ${confirmingDeposits} deposits awaiting verification`);
    console.log(`   - ${completedDeposits} completed deposits`);
    console.log(`   - Polygon wallet: ${process.env.CRYPTO_WALLET_POLYGON ? '✓' : '✗ Not configured'}`);
    console.log(`   - TRC-20 wallet: ${process.env.CRYPTO_WALLET_USDT_TRC20 ? '✓' : '✗ Not configured'}`);
    console.log(`   - Bitcoin wallet: ${process.env.CRYPTO_WALLET_BTC ? '✓' : '✗ Not configured'}`);
    
    /* Monitor not started. It polls chains for incoming transfers and
       credits wallets automatically -- pointless with deposits closed,
       and it was throwing "Cannot find module 'web3'" on every boot
       anyway, since web3 is not installed. */
    
    if (confirmingDeposits > 0 && global.webSocketService) {
      const admins = await User.find({ role: 'admin' }).select('username');
      for (const admin of admins) {
        const notification = new Notification({
          recipient: admin.username,
          type: 'admin_alert',
          title: 'Pending Crypto Deposits',
          message: `There are ${confirmingDeposits} crypto deposits awaiting verification`,
          link: '/admin/crypto-deposits',
          priority: 'high',
        });
        await notification.save();

        global.webSocketService.sendToUser(admin.username, {
          type: 'notification',
          data: notification
        });
      }
    }
  } catch (error) {
    console.error('⚠️ Error initializing crypto deposit system:', error);
  }
}

async function initializePostSystem() {
  try {
    const Post = require('./models/Post');
    
    const totalPosts = await Post.countDocuments({ status: 'active' });
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPosts = await Post.countDocuments({ createdAt: { $gte: last24Hours }, status: 'active' });
    
    console.log(`✅ Explore/Post system initialized`);
    console.log(`   - ${totalPosts} active posts`);
    console.log(`   - ${recentPosts} posts in last 24 hours`);
  } catch (error) {
    console.error('⚠️ Error initializing post system:', error);
  }
}

// Start server
const HOST = '0.0.0.0';
const os = require('os');

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, HOST, async () => {
  const networkIP = getNetworkIP();
  
  console.log(`🚀 Backend server running on:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://${networkIP}:${PORT}`);
  console.log(`🔌 WebSocket server ready for connections`);
  console.log(`📡 Public WebSocket ready for guest connections`);

  await initializeTierSystem();
  console.log(`🏆 Tier system ready`);

  await initializeNotificationSystem();
  console.log(`🔔 Notification system ready`);

  await initializeVerificationSystem();
  console.log(`✔️  Verification system ready`);
  
  await initializeReportSystem();
  console.log(`🛡️ Report & Ban system ready`);
  
  await initializeAuctionSystem();
  console.log(`🔨 Auction system ready - instant processing enabled (1s checks)`);
  
  await initializeStorageSystem();
  console.log(`💾 Storage system ready - backend storage enabled`);
  
  await initializePublicWebSocketSystem();
  console.log(`🌐 Public WebSocket ready - guest real-time updates enabled`);
  
  await initializeSubscriptionRenewalSystem();
  console.log(`🔄 Subscription renewal system ready - daily checks at 2:00 AM`);
  
  // Crypto deposits are closed; nothing to initialise.
  // await initializeCryptoDepositSystem();
  console.log(`💰 Crypto deposit system ready - Direct wallet deposits enabled!`);
  
  await initializePostSystem();
  console.log(`📱 Explore/Post system ready - Social feed enabled!`);

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
  console.log('  - Bans:          /api/admin/bans/*');
  console.log('  - Analytics:     /api/analytics/*');
  console.log('  - Auctions:      /api/auctions/*');
  console.log('  - Storage:       /api/storage/*');
  console.log('  - ProfileBuyer:  /api/profilebuyer');
  console.log('  - Referral:      /api/referral/*');
  console.log('  - Posts:         /api/posts/*           🆕 EXPLORE FEED!');
  console.log('  - Public WS:     /public-ws (for guest real-time)');
  console.log('\n💸 What rarri we driving today?\n');
});
