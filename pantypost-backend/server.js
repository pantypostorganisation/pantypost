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
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.0.21:3000',
    'http://127.0.0.1:3000'
  ],
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
    'X-Request-ID'
  ]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
      favorites: true
    }
  });
});

// API Routes
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

// WebSocket status endpoint
app.get('/api/ws/status', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  res.json({
    success: true,
    data: webSocketService.getConnectionStats()
  });
});

// Tier system status endpoint (admin only)
app.get('/api/tiers/system-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  try {
    const TIER_CONFIG = require('./config/tierConfig');
    
    // Get tier distribution
    const tierDistribution = await User.aggregate([
      { $match: { role: 'seller' } },
      { $group: { 
        _id: '$tier',
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        config: TIER_CONFIG.getPublicConfig(),
        distribution: tierDistribution,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Routes
app.get('/api/test/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
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
      tier: role === 'seller' ? 'Tease' : undefined
    });
    
    await newUser.save();
    
    res.json({
      success: true,
      message: 'User created!',
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        tier: newUser.tier
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to check tier for a seller
app.get('/api/test/check-tier/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (user.role !== 'seller') {
      return res.status(400).json({
        success: false,
        error: 'User is not a seller'
      });
    }
    
    const stats = await tierService.calculateSellerStats(username);
    const TIER_CONFIG = require('./config/tierConfig');
    const currentTier = user.tier || 'Tease';
    const nextTier = TIER_CONFIG.getNextTier(currentTier);
    
    res.json({
      success: true,
      data: {
        username: user.username,
        currentTier,
        nextTier,
        stats,
        tierInfo: TIER_CONFIG.getTierByName(currentTier)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint to manually update all seller tiers
app.post('/api/admin/recalculate-all-tiers', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  try {
    const sellers = await User.find({ role: 'seller' });
    const results = [];
    
    for (const seller of sellers) {
      const result = await tierService.updateSellerTier(seller.username);
      results.push({
        username: seller.username,
        ...result
      });
    }
    
    res.json({
      success: true,
      data: {
        totalSellers: sellers.length,
        updated: results.filter(r => r.changed).length,
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin endpoint to fix all tier names
app.post('/api/admin/fix-tier-names', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  try {
    const updated = await tierService.fixAllSellerTiers();
    
    res.json({
      success: true,
      data: {
        message: `Fixed ${updated} seller tiers`,
        updated
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize tier system on startup
async function initializeTierSystem() {
  try {
    const TIER_CONFIG = require('./config/tierConfig');
    console.log('✅ Tier system initialized with levels:', Object.keys(TIER_CONFIG.tiers));
    
    // Fix all seller tiers on startup
    console.log('📊 Fixing all seller tiers...');
    const fixedCount = await tierService.fixAllSellerTiers();
    console.log(`✅ Fixed ${fixedCount} seller tiers`);
    
  } catch (error) {
    console.error('⚠️ Error initializing tier system:', error);
  }
}

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for connections`);
  
  // Initialize tier system
  await initializeTierSystem();
  console.log(`🏆 Tier system ready`);
  
  // Log available endpoints
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
  console.log('\n✨ Server initialization complete!\n');
});