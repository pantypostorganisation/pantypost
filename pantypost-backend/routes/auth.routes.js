// pantypost-backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const EmailVerification = require('../models/EmailVerification');
const authMiddleware = require('../middleware/auth.middleware');
const { ERROR_CODES } = require('../utils/constants');
const { sendEmail, emailTemplates } = require('../config/email');
const webSocketService = require('../config/websocket');
const publicWebSocketService = require('../config/publicWebsocket');

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ===== Helpers: sanitization & validation =====

function isValidUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9._-]{3,20}$/.test(u.trim());
}
function cleanUsername(u) {
  return String(u || '').trim();
}
function isValidEmail(e) {
  if (typeof e !== 'string') return false;
  const v = e.trim().toLowerCase();
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
  return 'buyer'; // never accept admin on signup from client
}
function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ============= AUTH ROUTES =============

// POST /api/auth/signup - FIXED REFERRAL CODE HANDLING
router.post('/signup', async (req, res) => {
  try {
    const raw = req.body || {};
    const username = cleanUsername(raw.username);
    const email = cleanEmail(raw.email);
    const password = raw.password;
    const role = normalizeRole(raw.role);

    if (!isValidUsername(username)) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.VALIDATION_ERROR, 
          message: 'Username must be 3-20 characters and can only contain letters, numbers, periods, underscores, and hyphens.' 
        }
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.VALIDATION_ERROR, 
          message: 'Please enter a valid email address (e.g., user@example.com).' 
        }
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.VALIDATION_ERROR, 
          message: 'Your password needs to be at least 6 characters long for security.' 
        }
      });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false, 
          error: { 
            code: ERROR_CODES.ALREADY_EXISTS, 
            message: 'This username is already taken. Try adding numbers or underscores to make it unique!' 
          }
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: { 
            code: ERROR_CODES.ALREADY_EXISTS, 
            message: 'An account with this email already exists. Try logging in instead!' 
          }
        });
      }
    }

    const newUser = new User({
      username,
      email,
      password,
      role,
      tier: role === 'seller' ? 'Tease' : undefined,
      isOnline: false,
      lastActive: new Date(),
      emailVerified: false,
      emailVerifiedAt: null
    });

    // ============= REFERRAL TRACKING - FIXED =============
    let referrerUsername = null;
    let referralCodeUsed = null;
    
    // CRITICAL FIX: Check for referralCode in request body
    const referralCode = raw.referralCode || raw.referral_code || raw.code;
    
    console.log('[Auth] Signup request:', {
      username,
      role,
      hasReferralCode: !!referralCode,
      referralCode: referralCode ? referralCode : 'none'
    });
    
    if (referralCode && role === 'seller') {
      try {
        const ReferralCode = require('../models/ReferralCode');
        const { Referral } = require('../models/Referral');
        
        // CRITICAL FIX: Sanitize and uppercase the code before lookup
        const sanitizedCode = String(referralCode).trim().toUpperCase();
        
        console.log('[Auth] Looking up referral code:', sanitizedCode);
        
        // Find the referral code - FIXED to use uppercase comparison
        const codeDoc = await ReferralCode.findOne({
          code: sanitizedCode,
          status: 'active'
        });
        
        console.log('[Auth] Referral code lookup result:', {
          found: !!codeDoc,
          owner: codeDoc ? codeDoc.username : 'none',
          status: codeDoc ? codeDoc.status : 'none'
        });
        
        if (codeDoc && codeDoc.status === 'active') {
          // Check for self-referral
          if (codeDoc.username === username) {
            console.log('[Auth] Self-referral attempt blocked:', username);
          } else {
            // Valid referral code found
            referrerUsername = codeDoc.username;
            referralCodeUsed = codeDoc.code;
            
            // Add referral info to user
            newUser.referredBy = referrerUsername;
            newUser.referralCode = referralCodeUsed;
            newUser.referredAt = new Date();
            
            console.log('[Auth] ✅ Referral code accepted:', {
              code: referralCodeUsed,
              referrer: referrerUsername,
              newUser: username
            });
          }
        } else {
          console.log('[Auth] ❌ Invalid or inactive referral code:', sanitizedCode);
        }
      } catch (referralError) {
        console.error('[Auth] ⚠️ Referral code processing error:', referralError);
        // Don't fail signup if referral processing fails
      }
    } else if (referralCode && role !== 'seller') {
      console.log('[Auth] ⚠️ Referral code ignored - user is not a seller');
    }
    
    // Save the new user
    await newUser.save();
    console.log('[Auth] ✅ User created:', username);
    
    // Create referral relationship AFTER user is saved
    if (referrerUsername && referralCodeUsed && role === 'seller') {
      try {
        const ReferralCode = require('../models/ReferralCode');
        const { Referral } = require('../models/Referral');
        
        // Create referral relationship
        const referral = new Referral({
          referrer: referrerUsername,
          referredSeller: username,
          referralCode: referralCodeUsed,
          referredEmail: email,
          signupIp: req.ip,
          metadata: {
            signupSource: req.body.signupSource || 'direct',
            userAgent: req.headers['user-agent']
          }
        });
        await referral.save();
        
        console.log('[Auth] ✅ Referral relationship created:', {
          referrer: referrerUsername,
          referred: username
        });
        
        // Track the signup in referral code
        const codeDoc = await ReferralCode.findOne({ code: referralCodeUsed });
        if (codeDoc) {
          await codeDoc.trackSignup(username);
          console.log('[Auth] ✅ Referral code usage tracked');
        }
        
        // Update referrer's stats
        await User.findOneAndUpdate(
          { username: referrerUsername },
          { $inc: { referralCount: 1 } }
        );
        
        console.log('[Auth] ✅ Referrer stats updated');
        
        // Create notification for referrer
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: referrerUsername,
          type: 'referral_signup',
          title: '🎉 New Referral Signup!',
          message: `${username} has joined using your referral code!`,
          link: '/sellers/profile',
          priority: 'normal',
          metadata: {
            referredUser: username,
            referralCode: referralCodeUsed
          }
        });
        
        console.log('[Auth] ✅ Referrer notification created');
      } catch (referralError) {
        console.error('[Auth] ❌ Failed to create referral relationship:', referralError);
        // Don't fail signup if referral creation fails
      }
    }
    // ============= END REFERRAL TRACKING =============

    // Create email verification record
    const verificationToken = EmailVerification.generateToken();
    const verificationCode = EmailVerification.generateVerificationCode();
    
    const emailVerification = new EmailVerification({
      userId: newUser._id,
      email: newUser.email,
      username: newUser.username,
      token: EmailVerification.hashToken(verificationToken),
      verificationCode,
      verificationType: 'signup',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    await emailVerification.save();

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    try {
      await sendEmail({
        to: newUser.email,
        ...emailTemplates.emailVerification(newUser.username, verificationLink, verificationCode)
      });
      console.log(`✅ Verification email sent to ${newUser.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    // ========== WEBSOCKET INTEGRATION FOR USER STATS ==========
    if (webSocketService && webSocketService.io) {
      webSocketService.io.emit('user:registered', {
        userId: newUser._id.toString(),
        username: newUser.username,
        role: newUser.role,
        timestamp: new Date().toISOString()
      });

      try {
        const [totalUsers, newUsersToday] = await Promise.all([
          User.countDocuments(),
          User.countDocuments({ 
            createdAt: { 
              $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
            } 
          })
        ]);

        const [totalBuyers, totalSellers, verifiedSellers] = await Promise.all([
          User.countDocuments({ role: 'buyer' }),
          User.countDocuments({ role: 'seller' }),
          User.countDocuments({ role: 'seller', isVerified: true })
        ]);

        const statsData = {
          totalUsers,
          totalBuyers,
          totalSellers,
          verifiedSellers,
          newUsersToday,
          timestamp: new Date().toISOString()
        };

        webSocketService.io.emit('stats:users', statsData);
        console.log(`📊 Broadcasted user stats - Total: ${totalUsers}`);
      } catch (statsError) {
        console.error('Failed to broadcast user stats:', statsError);
      }
    }

    if (publicWebSocketService) {
      publicWebSocketService.broadcastUserRegistered({
        userId: newUser._id.toString(),
        username: newUser.username,
        role: newUser.role,
        timestamp: new Date().toISOString()
      });
      
      try {
        const [totalUsers, newUsersToday] = await Promise.all([
          User.countDocuments(),
          User.countDocuments({ 
            createdAt: { 
              $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
            } 
          })
        ]);

        const [totalBuyers, totalSellers, verifiedSellers] = await Promise.all([
          User.countDocuments({ role: 'buyer' }),
          User.countDocuments({ role: 'seller' }),
          User.countDocuments({ role: 'seller', isVerified: true })
        ]);

        publicWebSocketService.broadcastStats({
          totalUsers,
          totalBuyers,
          totalSellers,
          verifiedSellers,
          newUsersToday,
          timestamp: new Date().toISOString()
        });
      } catch (statsError) {
        console.error('Failed to broadcast stats to public:', statsError);
      }
    }
    // ========== END WEBSOCKET INTEGRATION ==========

    // Build response with referral info if applicable
    const responseData = {
      message: 'Account created successfully! Please check your email to verify your account.',
      email: newUser.email,
      username: newUser.username,
      requiresVerification: true
    };

    // Add referral success info if referral was used
    if (referrerUsername && referralCodeUsed) {
      responseData.referralApplied = true;
      responseData.referrerUsername = referrerUsername;
      responseData.referralCode = referralCodeUsed;
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    res.status(400).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'Something went wrong while creating your account. Please try again in a moment.' 
      }
    });
  }
});

// POST /api/auth/verify-email - UPDATED WITH STATS BROADCAST
router.post('/verify-email', async (req, res) => {
  try {
    const { token, code } = req.body;
    
    if (!token && !code) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Please provide either a verification token or code.'
        }
      });
    }
    
    let verification;
    
    if (token) {
      const hashedToken = EmailVerification.hashToken(token);
      verification = await EmailVerification.findOne({ 
        token: hashedToken,
        verified: false
      });
    }
    
    if (!verification && code) {
      verification = await EmailVerification.findOne({
        verificationCode: code.trim(),
        verified: false
      }).sort({ createdAt: -1 });
    }
    
    if (!verification) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: 'Invalid or expired verification link. Please request a new one.'
        }
      });
    }
    
    if (!verification.isValid()) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_TOKEN_INVALID,
          message: verification.isExpired() 
            ? 'This verification link has expired. Please request a new one.'
            : 'This verification link is no longer valid.'
        }
      });
    }
    
    await verification.markAsVerified();
    
    const user = await User.findById(verification.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'User account not found.'
        }
      });
    }
    
    await user.markEmailAsVerified();
    await EmailVerification.cleanupOldVerifications(user._id);
    
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.emailVerificationSuccess(user.username)
      });
    } catch (emailError) {
      console.error('Failed to send verification success email:', emailError);
    }
    
    if (webSocketService && webSocketService.io) {
      try {
        const verifiedSellers = await User.countDocuments({ role: 'seller', isVerified: true });
        webSocketService.io.emit('stats:verified_sellers', {
          verifiedSellers,
          timestamp: new Date().toISOString()
        });
      } catch (statsError) {
        console.error('Failed to broadcast verified seller stats:', statsError);
      }
    }
    
    if (publicWebSocketService) {
      try {
        const verifiedSellers = await User.countDocuments({ role: 'seller', isVerified: true });
        publicWebSocketService.broadcastStats({
          verifiedSellers,
          timestamp: new Date().toISOString()
        });
      } catch (statsError) {
        console.error('Failed to broadcast verified seller stats to public:', statsError);
      }
    }
    
    const authToken = signToken(user);
    
    res.json({
      success: true,
      data: {
        message: 'Email verified successfully! Your account is now active.',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          emailVerified: true
        },
        token: authToken,
        refreshToken: authToken
      }
    });
  } catch (error) {
    console.error('[Auth] Email verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to verify email. Please try again.'
      }
    });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email, username } = req.body;
    
    if (!email && !username) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Please provide either email or username.'
        }
      });
    }
    
    let user;
    if (email) {
      user = await User.findOne({ email: cleanEmail(email) });
    } else {
      user = await User.findOne({ username: cleanUsername(username) });
    }
    
    if (!user) {
      return res.json({
        success: true,
        message: 'If that account exists and is unverified, we\'ve sent a new verification email.'
      });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ACTION_NOT_ALLOWED,
          message: 'This email is already verified.'
        }
      });
    }
    
    await EmailVerification.deleteMany({ userId: user._id });
    
    const verificationToken = EmailVerification.generateToken();
    const verificationCode = EmailVerification.generateVerificationCode();
    
    const emailVerification = new EmailVerification({
      userId: user._id,
      email: user.email,
      username: user.username,
      token: EmailVerification.hashToken(verificationToken),
      verificationCode,
      verificationType: 'signup',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await emailVerification.save();
    
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.emailVerification(user.username, verificationLink, verificationCode)
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }
    
    res.json({
      success: true,
      message: 'If that account exists and is unverified, we\'ve sent a new verification email.'
    });
  } catch (error) {
    console.error('[Auth] Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to resend verification email. Please try again.'
      }
    });
  }
});

// POST /api/auth/login - UPDATED WITH IMPROVED ERROR MESSAGES
router.post('/login', async (req, res) => {
  try {
    const raw = req.body || {};
    const username = cleanUsername(raw.username);
    const password = raw.password;
    const role = typeof raw.role === 'string' ? raw.role.trim().toLowerCase() : undefined;

    if (!isValidUsername(username)) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.VALIDATION_ERROR, 
          message: 'Invalid username format.' 
        }
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.VALIDATION_ERROR, 
          message: 'Incorrect password. Try again.' 
        }
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, 
          message: `No account found with username "${username}".` 
        }
      });
    }

    const pendingReset = await PasswordReset.findOne({
      email: user.email,
      used: false,
      expiresAt: { $gt: Date.now() }
    }).sort({ createdAt: -1 });
    
    if (pendingReset) {
      console.log(`[Auth] Pending password reset detected for ${username}`);
      
      try {
        await PasswordReset.deleteMany({ email: user.email });
        
        const resetToken = PasswordReset.generateToken();
        const hashedToken = PasswordReset.hashToken(resetToken);
        const verificationCode = PasswordReset.generateVerificationCode();
        
        const passwordReset = new PasswordReset({ 
          email: user.email, 
          username: user.username, 
          token: hashedToken, 
          verificationCode,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        await passwordReset.save();
        
        await sendEmail({ 
          to: user.email, 
          ...emailTemplates.passwordResetCode(user.username, verificationCode, user.email) 
        });
        
        console.log(`✅ Auto-sent new password reset code to ${user.email} on login attempt`);
      } catch (resetError) {
        console.error('Failed to auto-send password reset email:', resetError);
      }
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_PENDING',
          message: 'Password reset in progress. Check your email for the verification code.',
          pendingPasswordReset: true,
          email: user.email,
          username: user.username
        }
      });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      return res.status(401).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, 
          message: 'Incorrect password. Try again.' 
        }
      });
    }

    if (user.role !== 'admin' && !user.emailVerified) {
      try {
        await EmailVerification.deleteMany({ userId: user._id });
        
        const verificationToken = EmailVerification.generateToken();
        const verificationCode = EmailVerification.generateVerificationCode();
        
        const emailVerification = new EmailVerification({
          userId: user._id,
          email: user.email,
          username: user.username,
          token: EmailVerification.hashToken(verificationToken),
          verificationCode,
          verificationType: 'signup',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        await emailVerification.save();
        
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        await sendEmail({
          to: user.email,
          ...emailTemplates.emailVerification(user.username, verificationLink, verificationCode)
        });
        
        console.log(`✅ Auto-sent verification email to ${user.email} on login attempt`);
      } catch (emailError) {
        console.error('Failed to auto-send verification email:', emailError);
      }
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: '',
          requiresVerification: true,
          email: user.email,
          username: user.username
        }
      });
    }

    if (role) {
      if (user.role === 'admin' && role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'This is an admin account. Select "Administrator" to login.'
          }
        });
      }
      if (user.role !== 'admin' && role === 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'This account is not an administrator.'
          }
        });
      }
      if (user.role !== 'admin' && role !== user.role) {
        const correctRole = user.role === 'seller' ? 'Seller' : 'Buyer';
        const wrongRole = role === 'seller' ? 'Seller' : 'Buyer';
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
            message: `This is a ${correctRole} account, not ${wrongRole}.`
          }
        });
      }
    }

    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    if (webSocketService && webSocketService.io) {
      webSocketService.broadcastUserStatus(user.username, true);
    }

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
          emailVerified: user.emailVerified || false,
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
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'Login failed. Please try again.' 
      }
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    if (req.user && req.user.username) {
      const updatedUser = await User.findOneAndUpdate(
        { username: req.user.username },
        { isOnline: false, lastActive: new Date() },
        { new: true }
      );
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
      }
    }
    res.json({ success: true, message: 'You\'ve been successfully logged out. See you soon!' });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.json({ success: true, message: 'Logged out' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.NOT_FOUND, 
          message: 'We couldn\'t find your account information. Please try logging in again.' 
        }
      });
    }

    user.lastActive = new Date();
    user.isOnline = true;
    await user.save();

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
        stats: { totalSales: stats.totalSales, totalRevenue: stats.totalRevenue },
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
        emailVerified: user.emailVerified || false,
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
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'We\'re having trouble loading your account data. Please refresh the page or try again.' 
      }
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.MISSING_REQUIRED_FIELD, 
          message: 'Your session has expired. Please log in again to continue.' 
        }
      });
    }
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    await User.findByIdAndUpdate(decoded.id, { lastActive: new Date(), isOnline: true });
    const newToken = jwt.sign({ id: decoded.id, username: decoded.username, role: decoded.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token: newToken, refreshToken: newToken }});
  } catch {
    res.status(401).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.AUTH_TOKEN_INVALID, 
        message: 'Your session has expired. Please log in again to continue.' 
      }
    });
  }
});

// GET /api/auth/verify-username
router.get('/verify-username', async (req, res) => {
  try {
    const username = cleanUsername(req.query.username);
    if (!isValidUsername(username)) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.VALIDATION_ERROR, 
          message: 'Usernames must be 3-20 characters and can only contain letters, numbers, periods, underscores, and hyphens.' 
        }
      });
    }
    const exists = await User.findOne({ username });
    res.json({ 
      success: true, 
      data: { 
        available: !exists, 
        message: exists ? 'This username is already taken. Try adding numbers or underscores!' : 'Great! This username is available.' 
      }
    });
  } catch {
    res.status(500).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'We couldn\'t check that username right now. Please try again.' 
      }
    });
  }
});

// POST /api/auth/admin/bootstrap
router.post('/admin/bootstrap', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body || {};
    const configuredCode = process.env.ADMIN_BOOTSTRAP_CODE;
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.MISSING_REQUIRED_FIELD, 
          message: 'Please enter the admin bootstrap code to continue.' 
        }
      });
    }
    if (!configuredCode) {
      return res.status(500).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.INTERNAL_ERROR, 
          message: 'Admin setup hasn\'t been configured yet. Please contact system support.' 
        }
      });
    }

    const dbUser = await User.findById(req.user.id);
    if (!dbUser) {
      return res.status(404).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.NOT_FOUND, 
          message: 'We couldn\'t find your account. Please try logging in again.' 
        }
      });
    }

    if (dbUser.role === 'admin') {
      const token = signToken(dbUser);
      return res.json({
        success: true,
        message: 'You already have administrator privileges!',
        data: {
          user: { id: dbUser._id, username: dbUser.username, email: dbUser.email, role: dbUser.role, tier: dbUser.tier || 'Tease' },
          token,
          refreshToken: token
        }
      });
    }

    const adminExists = await User.exists({ role: 'admin' });
    if (adminExists) {
      return res.status(409).json({
        success: false,
        error: { 
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS, 
          message: 'An administrator account already exists. The bootstrap code can only be used once.' 
        }
      });
    }

    if (code !== configuredCode) {
      return res.status(403).json({
        success: false,
        error: { 
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, 
          message: 'That bootstrap code isn\'t correct. Please check it and try again.' 
        }
      });
    }

    dbUser.role = 'admin';
    dbUser.emailVerified = true;
    dbUser.emailVerifiedAt = new Date();
    await dbUser.save();

    const token = signToken(dbUser);
    res.json({
      success: true,
      message: 'Congratulations! Your account now has administrator privileges.',
      data: {
        user: { id: dbUser._id, username: dbUser.username, email: dbUser.email, role: dbUser.role, tier: dbUser.tier || 'Tease' },
        token,
        refreshToken: token
      }
    });
  } catch (error) {
    console.error('[Auth] Admin bootstrap error:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'We couldn\'t complete the admin setup right now. Please try again later.' 
      }
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrUsername } = req.body || {};
    
    if (!emailOrUsername || typeof emailOrUsername !== 'string' || !emailOrUsername.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.MISSING_REQUIRED_FIELD, 
          message: 'Please enter your email address or username to reset your password.' 
        }
      });
    }
    
    const input = emailOrUsername.trim();
    let user = null;
    
    if (input.includes('@')) {
      if (isValidEmail(input)) {
        user = await User.findOne({ email: cleanEmail(input) });
      }
    } else {
      user = await User.findOne({ username: input });
    }
    
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If that account exists, we\'ve sent you a verification code. Check your inbox!',
        data: { email: input.includes('@') ? input : null }
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
      verificationCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });
    await passwordReset.save();
    
    try {
      await sendEmail({ 
        to: user.email, 
        ...emailTemplates.passwordResetCode(user.username, verificationCode, user.email) 
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }
    
    res.json({ 
      success: true, 
      message: 'If that account exists, we\'ve sent you a verification code. Check your inbox!',
      data: { 
        email: user.email,
        expiresIn: 900 
      }
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'We\'re having trouble processing your request. Please try again in a moment.' 
      }
    });
  }
});

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.MISSING_REQUIRED_FIELD, 
          message: 'Please enter both your email and the verification code we sent you.' 
        }
      });
    }
    
    const resetRequest = await PasswordReset.findOne({ 
      email: cleanEmail(email), 
      verificationCode: code.trim() 
    });
    
    if (!resetRequest) {
      const anyRequest = await PasswordReset.findOne({ email: cleanEmail(email) });
      if (anyRequest && anyRequest.isValid()) {
        const maxAttempts = await anyRequest.incrementAttempts();
        if (maxAttempts) {
          return res.status(400).json({ 
            success: false, 
            error: { 
              code: ERROR_CODES.AUTH_TOKEN_INVALID, 
              message: 'You\'ve tried too many times. Please request a new verification code.' 
            }
          });
        }
      }
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.AUTH_TOKEN_INVALID, 
          message: 'That verification code doesn\'t match. Please check it and try again.' 
        }
      });
    }
    
    if (!resetRequest.isValid()) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.AUTH_TOKEN_INVALID, 
          message: resetRequest.isExpired() 
            ? 'Your verification code has expired. Please request a new one.' 
            : 'That verification code isn\'t valid. Please check it and try again.' 
        }
      });
    }
    
    res.json({ 
      success: true, 
      data: { 
        valid: true, 
        message: 'Perfect! Your code is verified. You can now set a new password.',
        token: resetRequest.token
      }
    });
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'We couldn\'t verify your code right now. Please try again.' 
      }
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.MISSING_REQUIRED_FIELD, 
          message: 'Please provide your email, verification code, and new password.' 
        }
      });
    }
    
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.VALIDATION_ERROR, 
          message: 'Your new password needs to be at least 6 characters long for security.' 
        }
      });
    }
    
    const resetRequest = await PasswordReset.findOne({ 
      email: cleanEmail(email), 
      verificationCode: code.trim() 
    });
    
    if (!resetRequest || !resetRequest.isValid()) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.AUTH_TOKEN_INVALID, 
          message: 'Your verification code has expired or isn\'t valid. Please request a new one.' 
        }
      });
    }
    
    const user = await User.findOne({ email: resetRequest.email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.NOT_FOUND, 
          message: 'We couldn\'t find an account with that email. Please check and try again.' 
        }
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
    
    res.json({ 
      success: true, 
      message: 'Success! Your password has been reset. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: 'We couldn\'t reset your password right now. Please try again later.' 
      }
    });
  }
});

module.exports = router;
