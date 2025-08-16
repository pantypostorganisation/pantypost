const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');
const { sendEmail, emailTemplates } = require('../config/email');
const webSocketService = require('../config/websocket');

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ===== Helpers: sanitization & validation (lightweight, no external deps) =====

const ALLOWED_ROLES = ['buyer', 'seller', 'admin'];

// Strict username allowlist: a–z, 0–9, dot, underscore, dash; 3–20 chars
function isValidUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9._-]{3,20}$/.test(u.trim());
}
function cleanUsername(u) {
  return String(u || '').trim();
}

function isValidEmail(e) {
  if (typeof e !== 'string') return false;
  const v = e.trim().toLowerCase();
  // Simple email check (keep it permissive; detailed checks are handled by providers)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function cleanEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function isValidPassword(p) {
  return typeof p === 'string' && p.length >= 6;
}

function normalizeRole(r) {
  const v = typeof r === 'string' ? r.trim().toLowerCase() : '';
  if (v === 'seller') return 'seller';
  // Default everyone else to buyer on signup; never allow admin from client
  return 'buyer';
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ============= AUTH ROUTES =============

// POST /api/auth/signup - Create new account (never allow admin here)
router.post('/signup', async (req, res) => {
  try {
    const raw = req.body || {};
    const username = cleanUsername(raw.username);
    const email = cleanEmail(raw.email);
    const password = raw.password;
    const role = normalizeRole(raw.role);

    // Validate basic inputs
    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid username format' }
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid email format' }
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Password must be at least 6 characters' }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.ALREADY_EXISTS, message: 'Username or email already exists' }
      });
    }

    // Create user; default seller tier to Tease
    const newUser = new User({
      username,
      email,
      password, // hashed by model
      role,     // 'buyer' or 'seller' only
      tier: role === 'seller' ? 'Tease' : undefined,
      isOnline: true,
      lastActive: new Date()
    });

    await newUser.save();

    // Broadcast online status for new user
    if (webSocketService && webSocketService.io) {
      webSocketService.broadcastUserStatus(newUser.username, true);
      console.log(`[Auth] Broadcasted online status for new user ${newUser.username}`);
    }

    // Token
    const token = signToken(newUser);

    res.json({
      success: true,
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          tier: newUser.tier
        },
        token,
        refreshToken: token
      }
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    res.status(400).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// POST /api/auth/login - Sign in to existing account
router.post('/login', async (req, res) => {
  try {
    const raw = req.body || {};
    const username = cleanUsername(raw.username);
    const password = raw.password;
    const role = typeof raw.role === 'string' ? raw.role.trim().toLowerCase() : undefined;

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid username format' }
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid credentials' }
      });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, message: 'Invalid username or password' }
      });
    }

    // Check password  (RENAMED to avoid shadowing helper)
    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: { code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, message: 'Invalid username or password' }
      });
    }

    // Role selector check:
    // - If a role was provided AND user is not admin AND provided role doesn't match stored role => reject
    if (role && user.role !== 'admin' && user.role !== role) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          message: `This account is registered as a ${user.role}, not a ${role}`
        }
      });
    }

    // Update online status & last active
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    // Emit status update via WebSocket
    if (webSocketService && webSocketService.io) {
      webSocketService.broadcastUserStatus(user.username, true);
      console.log(`[Auth] Broadcasted online status for ${user.username}`);
    }

    // Token
    const token = signToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified || false,
          tier: user.tier || 'Tease'
        },
        token,
        refreshToken: token
      }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(400).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: error.message }
    });
  }
});

// POST /api/auth/logout - Logout (requires authentication)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    console.log('[Auth] Logout request from:', req.user?.username);

    // Update user's offline status
    if (req.user && req.user.username) {
      const updatedUser = await User.findOneAndUpdate(
        { username: req.user.username },
        { isOnline: false, lastActive: new Date() },
        { new: true }
      );

      console.log(`[Auth] Database updated for ${req.user.username}: isOnline=${updatedUser?.isOnline}, lastActive=${updatedUser?.lastActive}`);

      if (webSocketService && webSocketService.io) {
        const offlineData = {
          username: req.user.username,
          userId: req.user.id,
          isOnline: false,
          lastActive: updatedUser?.lastActive || new Date(),
          timestamp: new Date()
        };

        webSocketService.io.emit('user:offline', offlineData);
        webSocketService.io.emit('user:status', offlineData);
        webSocketService.broadcastUserStatus(req.user.username, false);

        console.log(`[Auth] Emitted offline status for ${req.user.username} to all clients`);
        const stats = webSocketService.getConnectionStats();
        console.log(`[Auth] Current WebSocket state: ${stats.totalConnections} connections, ${stats.uniqueUsers} users`);
      } else {
        console.error('[Auth] ERROR: WebSocket service not available for logout broadcast');
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.json({ success: true, message: 'Logged out' });
  }
});

// GET /api/auth/me - Get current user with TIER INFORMATION
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }

    user.lastActive = new Date();
    user.isOnline = true;
    await user.save();

    // Seller tier info
    let tierInfo = null;
    if (user.role === 'seller') {
      const TIER_CONFIG = require('../config/tierConfig');
      const tierService = require('../services/tierService');

      const currentTier = user.tier || 'Tease';
      const tierConfig = TIER_CONFIG.getTierByName(currentTier);
      const stats = await tierService.calculateSellerStats(user.username);

      tierInfo = {
        tier: currentTier,
        level: tierConfig.level,
        bonusPercentage: tierConfig.bonusPercentage,
        color: tierConfig.color,
        benefits: tierConfig.benefits,
        stats: {
          totalSales: stats.totalSales,
          totalRevenue: stats.totalRevenue
        },
        nextTier: TIER_CONFIG.getNextTier(currentTier)
      };
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
        tierInfo,
        subscriberCount: user.subscriberCount || 0,
        totalSales: user.totalSales || 0,
        rating: user.rating || 0,
        reviewCount: user.reviewCount || 0,
        profilePic: user.profilePic,
        bio: user.bio,
        subscriptionPrice: user.subscriptionPrice,
        galleryImages: user.galleryImages || [],
        settings: user.settings,
        joinedDate: user.joinedDate,
        lastActive: user.lastActive,
        isOnline: user.isOnline
      }
    });
  } catch (error) {
    console.error('[Auth] Error fetching user data:', error);
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to get user data' }
    });
  }
});

// POST /api/auth/refresh - Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.MISSING_REQUIRED_FIELD, message: 'Refresh token required' }
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    await User.findByIdAndUpdate(decoded.id, { lastActive: new Date(), isOnline: true });

    const newToken = jwt.sign(
      { id: decoded.id, username: decoded.username, role: decoded.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, data: { token: newToken, refreshToken: newToken } });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: ERROR_CODES.AUTH_TOKEN_INVALID, message: 'Invalid refresh token' }
    });
  }
});

// GET /api/auth/verify-username - Check if username is available
router.get('/verify-username', async (req, res) => {
  try {
    const username = cleanUsername(req.query.username);

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Invalid username format' }
      });
    }

    const exists = await User.findOne({ username });
    res.json({
      success: true,
      data: { available: !exists, message: exists ? 'Username is taken' : 'Username is available' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to check username' }
    });
  }
});

// ============= ADMIN BOOTSTRAP ROUTE =============

// POST /api/auth/admin/bootstrap - One-time admin promotion using secret code
router.post('/admin/bootstrap', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body || {};
    const configuredCode = process.env.ADMIN_BOOTSTRAP_CODE;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.MISSING_REQUIRED_FIELD, message: 'Bootstrap code is required' }
      });
    }

    if (!configuredCode) {
      return res.status(500).json({
        success: false,
        error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Server is missing ADMIN_BOOTSTRAP_CODE' }
      });
    }

    const dbUser = await User.findById(req.user.id);
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }

    // If already admin, idempotent success with fresh token
    if (dbUser.role === 'admin') {
      const token = signToken(dbUser);
      return res.json({
        success: true,
        message: 'User is already an admin',
        data: {
          user: {
            id: dbUser._id,
            username: dbUser.username,
            email: dbUser.email,
            role: dbUser.role,
            tier: dbUser.tier || 'Tease'
          },
          token,
          refreshToken: token
        }
      });
    }

    // Only allow bootstrap if no admin exists yet
    const adminExists = await User.exists({ role: 'admin' });
    if (adminExists) {
      return res.status(409).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin already exists. Bootstrap can only be used once.'
        }
      });
    }

    // Validate secret code
    if (code !== configuredCode) {
      return res.status(403).json({
        success: false,
        error: { code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, message: 'Invalid bootstrap code' }
      });
    }

    // Promote current user
    dbUser.role = 'admin';
    await dbUser.save();

    const token = signToken(dbUser);
    return res.json({
      success: true,
      data: {
        user: {
          id: dbUser._id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
          tier: dbUser.tier || 'Tease'
        },
        token,
        refreshToken: token
      }
    });
  } catch (error) {
    console.error('[Auth] Admin bootstrap error:', error);
    return res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to promote user to admin' }
    });
  }
});

// ============= PASSWORD RESET ROUTES =============

// POST /api/auth/forgot-password - Request password reset with code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.MISSING_REQUIRED_FIELD, message: 'Valid email is required' }
      });
    }

    const user = await User.findOne({ email: cleanEmail(email) });

    // Always return success (no enumeration)
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.'
      });
    }

    await PasswordReset.deleteMany({ email: user.email });

    const resetToken = PasswordReset.generateToken();
    const hashedToken = PasswordReset.hashToken(resetToken);
    const verificationCode = PasswordReset.generateVerificationCode();

    const passwordReset = new PasswordReset({
      email: user.email,
      username: user.username,
      token: hashedToken,
      verificationCode
    });
    await passwordReset.save();

    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.passwordResetCode(user.username, verificationCode)
      });

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
      data: { resetToken, expiresIn: 900 }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to process password reset request' }
    });
  }
});

// POST /api/auth/verify-reset-code - Verify the 6-digit code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.MISSING_REQUIRED_FIELD, message: 'Email and verification code are required' }
      });
    }

    const resetRequest = await PasswordReset.findOne({
      email: cleanEmail(email),
      verificationCode: code
    });

    if (!resetRequest) {
      const anyRequest = await PasswordReset.findOne({ email: cleanEmail(email) });
      if (anyRequest && anyRequest.isValid()) {
        const maxAttempts = await anyRequest.incrementAttempts();
        if (maxAttempts) {
          return res.status(400).json({
            success: false,
            error: { code: ERROR_CODES.AUTH_TOKEN_INVALID, message: 'Too many failed attempts. Please request a new code.' }
          });
        }
      }

      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.AUTH_TOKEN_INVALID, message: 'Invalid verification code' }
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

    res.json({ success: true, data: { valid: true, message: 'Code verified successfully' } });
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to verify code' }
    });
  }
});

// POST /api/auth/reset-password - Reset password with email and code
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.MISSING_REQUIRED_FIELD, message: 'Email, verification code, and new password are required' }
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Password must be at least 6 characters long' }
      });
    }

    const resetRequest = await PasswordReset.findOne({
      email: cleanEmail(email),
      verificationCode: code
    });

    if (!resetRequest || !resetRequest.isValid()) {
      return res.status(400).json({
        success: false,
        error: { code: ERROR_CODES.AUTH_TOKEN_INVALID, message: 'Invalid or expired verification code' }
      });
    }

    const user = await User.findOne({ email: resetRequest.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' }
      });
    }

    user.password = newPassword;
    await user.save();

    resetRequest.used = true;
    await resetRequest.save();

    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.passwordResetSuccess(user.username)
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to reset password' }
    });
  }
});

module.exports = router;
