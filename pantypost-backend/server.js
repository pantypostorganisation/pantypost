const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./database');

// Import models
const User = require('./models/User');
const Listing = require('./models/Listing');

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

// Simple test to see all users
app.get('/api/test/users', async (req, res) => {
  try {
    const users = await User.find({});
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

// Test endpoint to create a user
app.post('/api/test/create-user', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Create a test user
    const newUser = new User({
      username: username || 'testuser',
      email: email || 'test@example.com',
      password: 'testpassword',
      role: 'buyer'
    });
    
    // Save to database
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

// Create a listing
app.post('/api/listings', async (req, res) => {
  try {
    const { title, description, price, seller, tags } = req.body;
    
    const newListing = new Listing({
      title,
      description,
      price,
      seller,
      tags
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});