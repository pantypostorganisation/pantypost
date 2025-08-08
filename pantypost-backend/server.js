// pantypost-backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http'); // ADD THIS - needed for WebSocket
require('dotenv').config();

// Import database connection - CORRECT PATH
const connectDB = require('./config/database');

// Import WebSocket service - ADD THIS
const webSocketService = require('./config/websocket');

// Import models (we'll keep these imports for the test routes)
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

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create HTTP server - ADD THIS
const server = http.createServer(app);

// Initialize WebSocket service - ADD THIS
webSocketService.initialize(server);

// Connect to MongoDB
connectDB();

// Middleware - UPDATED CORS CONFIGURATION
app.use(cors({
  origin: [
    'http://localhost:3000',           // Your local frontend
    'http://192.168.0.21:3000',       // Your IP-based frontend
    'http://127.0.0.1:3000'           // Alternative localhost
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For form data
app.use(express.static(__dirname)); // Serve static files from current directory

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ============= USE ROUTE FILES =============
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);  // Add user routes
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes); // Add upload routes

// ============= WEBSOCKET STATUS ENDPOINT (optional but helpful) =============
app.get('/api/ws/status', authMiddleware, (req, res) => {
  // Only admins can check WebSocket status
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

// ============= TEST ROUTES (keeping these for now) =============

// Get all users (for testing)
app.get('/api/test/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password'); // Exclude passwords
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

// Test endpoint to create a user (for testing only)
app.post('/api/test/create-user', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    const newUser = new User({
      username: username || 'testuser',
      email: email || 'test@example.com',
      password: 'testpassword',
      role: 'buyer'
    });
    
    await newUser.save();
    
    res.json({
      success: true,
      message: 'User created!',
      user: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Start server - UPDATED THIS
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for connections`);
});