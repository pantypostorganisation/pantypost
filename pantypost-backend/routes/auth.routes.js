// auth.routes.js
// This file contains all authentication-related routes

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ============= AUTH ROUTES =============

// POST /api/auth/signup - Create new account
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ALREADY_EXISTS,
          message: 'Username or email already exists'
        }
      });
    }
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password, // Will be hashed automatically by the model
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
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        },
        token,
        refreshToken: token // For now, same as token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// POST /api/auth/login - Sign in to existing account
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid username or password'
        }
      });
    }
    
    // Check password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid username or password'
        }
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
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified || false
        },
        token,
        refreshToken: token // For now, same as token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message
      }
    });
  }
});

// POST /api/auth/logout - Logout (requires authentication)
router.post('/logout', authMiddleware, async (req, res) => {
  // In a production app, you might blacklist the token here
  res.json({
    success: true
  });
});

// GET /api/auth/me - Get current user (requires authentication)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        isVerified: user.isVerified || false,
        tier: user.tier || 'Tease',
        subscriberCount: user.subscriberCount || 0,
        totalSales: user.totalSales || 0,
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to get user data'
      }
    });
  }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Refresh token required'
        }
      });
    }
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Generate new tokens
    const newToken = jwt.sign(
      { id: decoded.id, username: decoded.username, role: decoded.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newToken // In production, use separate refresh token
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: ERROR_CODES.AUTH_TOKEN_INVALID,
        message: 'Invalid refresh token'
      }
    });
  }
});

// GET /api/auth/verify-username - Check if username is available
router.get('/verify-username', async (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Username must be at least 3 characters'
        }
      });
    }
    
    const exists = await User.findOne({ username });
    
    res.json({
      success: true,
      data: {
        available: !exists,
        message: exists ? 'Username is taken' : 'Username is available'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to check username'
      }
    });
  }
});

// Export the router
module.exports = router;