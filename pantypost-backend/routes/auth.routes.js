// pantypost-backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');
const { sendEmail, emailTemplates } = require('../config/email');

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

// ============= PASSWORD RESET ROUTES =============

// POST /api/auth/forgot-password - Request password reset with code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Email is required'
        }
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.'
      });
    }
    
    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ email: user.email });
    
    // Generate token and verification code
    const resetToken = PasswordReset.generateToken();
    const hashedToken = PasswordReset.hashToken(resetToken);
    const verificationCode = PasswordReset.generateVerificationCode();
    
    // Save to database
    const passwordReset = new PasswordReset({
      email: user.email,
      username: user.username,
      token: hashedToken,
      verificationCode: verificationCode
    });
    await passwordReset.save();
    
    // Send email with verification code
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.passwordResetCode(user.username, verificationCode)
      });
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔑 Password Reset Code for ${user.email}: ${verificationCode}`);
        console.log(`📧 Reset Link: ${process.env.FRONTEND_URL}/verify-reset-code`);
        console.log(`   (Go to this link and enter the code above)\n`);
      }
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'If an account exists with this email, a verification code has been sent.',
      data: {
        // Include token in response for frontend to use
        resetToken: resetToken,
        expiresIn: 900 // 15 minutes
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to process password reset request'
      }
    });
  }
});

// POST /api/auth/verify-reset-code - Verify the 6-digit code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Email and verification code are required'
        }
      });
    }
    
    // Find the reset request
    const resetRequest = await PasswordReset.findOne({ 
      email: email.toLowerCase(),
      verificationCode: code
    });
    
    if (!resetRequest) {
      // Find if there's a reset request for this email to increment attempts
      const anyRequest = await PasswordReset.findOne({ email: email.toLowerCase() });
      if (anyRequest && anyRequest.isValid()) {
        const maxAttempts = await anyRequest.incrementAttempts();
        if (maxAttempts) {
          return res.status(400).json({
            success: false,
            error: {
              code: ERROR_CODES.AUTH_TOKEN_INVALID,
              message: 'Too many failed attempts. Please request a new code.'
            }
          });
        }
      }
      
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: 'Invalid verification code'
        }
      });
    }
    
    if (!resetRequest.isValid()) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: resetRequest.isExpired() ? 'Verification code has expired' : 'Invalid verification code'
        }
      });
    }
    
    // Code is valid - return success with the original token
    res.json({
      success: true,
      data: {
        valid: true,
        message: 'Code verified successfully'
      }
    });
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to verify code'
      }
    });
  }
});

// POST /api/auth/reset-password - Reset password with email and code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    // Validate input
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Email, verification code, and new password are required'
        }
      });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Password must be at least 6 characters long'
        }
      });
    }
    
    // Find the reset request
    const resetRequest = await PasswordReset.findOne({ 
      email: email.toLowerCase(),
      verificationCode: code
    });
    
    if (!resetRequest || !resetRequest.isValid()) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: 'Invalid or expired verification code'
        }
      });
    }
    
    // Find the user
    const user = await User.findOne({ email: resetRequest.email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Mark reset request as used
    resetRequest.used = true;
    await resetRequest.save();
    
    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.passwordResetSuccess(user.username)
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to reset password'
      }
    });
  }
});

// Export the router
module.exports = router;