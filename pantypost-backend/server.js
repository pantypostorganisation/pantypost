const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./database');

// Import models
const User = require('./models/User');
const Listing = require('./models/Listing');
const Order = require('./models/Order');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Allow all origins for testing
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from current directory

// Simple auth middleware for protected routes
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ============= AUTH ROUTES =============

// Signup - Create new account
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password, // Will be hashed automatically
      role: role || 'buyer'
    });
    
    await newUser.save();
    
    // Create token
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser._id,
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

// Login - Sign in to existing account
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Check password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ============= USER ROUTES =============

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

// ============= LISTING ROUTES =============

// Get all listings
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await Listing.find({});
    res.json({
      success: true,
      count: listings.length,
      listings: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a listing (protected route)
app.post('/api/listings', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, tags } = req.body;
    
    // Only sellers can create listings
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can create listings'
      });
    }
    
    const newListing = new Listing({
      title,
      description,
      price,
      seller: req.user.username,
      tags,
      status: 'active'
    });
    
    await newListing.save();
    
    res.json({
      success: true,
      message: 'Listing created!',
      listing: newListing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get listings by seller
app.get('/api/listings/seller/:username', async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.params.username });
    res.json({
      success: true,
      count: listings.length,
      listings: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= ORDER ROUTES =============

// Get all orders (protected)
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { buyer, seller } = req.query;
    let filter = {};
    
    // Filter based on user role and query params
    if (req.user.role === 'buyer') {
      filter.buyer = req.user.username;
    } else if (req.user.role === 'seller') {
      filter.seller = req.user.username;
    } else if (buyer || seller) {
      if (buyer) filter.buyer = buyer;
      if (seller) filter.seller = seller;
    }
    
    const orders = await Order.find(filter).sort({ date: -1 });
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create an order (protected)
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orderData = req.body;
    
    // Only buyers can create orders
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only buyers can create orders'
      });
    }
    
    // Find and update the listing to sold
    if (orderData.listingId) {
      const listing = await Listing.findById(orderData.listingId);
      if (listing) {
        listing.status = 'sold';
        await listing.save();
      }
    }
    
    const newOrder = new Order({
      ...orderData,
      buyer: orderData.buyer || req.user.username,
      shippingStatus: 'pending',
      date: new Date()
    });
    
    await newOrder.save();
    
    res.json({
      success: true,
      data: newOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update order status (protected)
app.post('/api/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { shippingStatus, trackingNumber } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Only seller or admin can update order status
    if (order.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can update order status'
      });
    }
    
    order.shippingStatus = shippingStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingStatus === 'shipped') order.shippedDate = new Date();
    
    await order.save();
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// ============= MESSAGING ROUTES =============

// Get message threads for a user (protected)
app.get('/api/messages/threads', authMiddleware, async (req, res) => {
  try {
    const username = req.query.username || req.user.username;
    const threads = await Message.getThreads(username);
    
    // Get user info for each thread
    for (let thread of threads) {
      const otherUser = await User.findOne({ username: thread.otherUser })
        .select('username profilePic isVerified role');
      thread.userProfile = otherUser;
    }
    
    res.json({
      success: true,
      data: threads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages in a thread (protected)
app.get('/api/messages/threads/:threadId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ 
      threadId: req.params.threadId 
    }).sort({ createdAt: 1 });
    
    // Verify user is part of this conversation
    const participants = req.params.threadId.split('-');
    if (!participants.includes(req.user.username) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this conversation'
      });
    }
    
    // Get other user info
    const otherUsername = participants.find(p => p !== req.user.username);
    const otherUser = await User.findOne({ username: otherUsername })
      .select('username profilePic isVerified role');
    
    res.json({
      success: true,
      data: {
        messages,
        otherUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send a message (protected)
app.post('/api/messages/send', authMiddleware, async (req, res) => {
  try {
    const { receiver, content, type, meta } = req.body;
    const sender = req.user.username;
    
    // Check if receiver exists
    const receiverUser = await User.findOne({ username: receiver });
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }
    
    // Generate thread ID
    const threadId = Message.getThreadId(sender, receiver);
    
    const newMessage = new Message({
      sender,
      receiver,
      content,
      type: type || 'normal',
      meta,
      threadId
    });
    
    await newMessage.save();
    
    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Mark messages as read (protected)
app.post('/api/messages/mark-read', authMiddleware, async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        receiver: req.user.username 
      },
      { isRead: true }
    );
    
    res.json({
      success: true
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get unread message count (protected)
app.get('/api/messages/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user.username);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});