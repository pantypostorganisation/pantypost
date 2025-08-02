const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

// Import database connection - CORRECT PATH
const connectDB = require('./config/database');

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

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Allow all origins for testing
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from current directory

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});