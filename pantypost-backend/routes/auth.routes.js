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

// POST /api/auth/signup - UPDATED WITH EMAIL VERIFICATION, WEBSOCKET EVENTS, AND REFERRAL TRACKING
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
      isOnline: false, // Don't mark as online until email is verified
      lastActive: new Date(),
      emailVerified: false, // NEW: Start with unverified email
      emailVerifiedAt: null
    });

    // ============= REFERRAL TRACKING =============
    // Check if user was referred
    const { referralCode } = req.body;
    let referrerUsername = null;
    
    if (referralCode && role === 'seller') {
      try {
        const ReferralCode = require('../models/ReferralCode');
        const { Referral } = require('../models/Referral');
        
        // Find the referral code
        const codeDoc = await ReferralCode.findByCode(referralCode);
        
        if (codeDoc && codeDoc.status === 'active') {
          // Don't allow self-referral
          if (codeDoc.username !== username) {
            referrerUsername = codeDoc.username;
            
            // Add referral info to user
            newUser.referredBy = referrerUsername;
            newUser.referralCode = codeDoc.code;
            newUser.referredAt = new Date();
            
            console.log(`[Auth] User ${username} referred by ${referrerUsername} with code ${codeDoc.code}`);
          }
        }
      } catch (referralError) {
        console.error('[Auth] Referral code processing error:', referralError);
        // Don't fail signup if referral processing fails
      }
    }
    
    await newUser.save();
    
    // Create referral relationship after user is saved
    if (referrerUsername && role === 'seller') {
      try {
        const ReferralCode = require('../models/ReferralCode');
        const { Referral } = require('../models/Referral');
        
        const codeDoc = await ReferralCode.findByCode(referralCode);
        if (codeDoc) {
          // Create referral relationship
          const referral = new Referral({
            referrer: referrerUsername,
            referredSeller: username,
            referralCode: codeDoc.code,
            referredEmail: email,
            signupIp: req.ip,
            metadata: {
              signupSource: req.body.signupSource || 'direct',
              userAgent: req.headers['user-agent']
            }
          });
          await referral.save();
          
          // Track the signup
          await codeDoc.trackSignup(username);
          
          // Update referrer's stats
          await User.findOneAndUpdate(
            { username: referrerUsername },
            { $inc: { referralCount: 1 } }
          );
          
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
              referralCode: codeDoc.code
            }
          });
          
          console.log(`[Auth] Referral relationship created: ${referrerUsername} -> ${username}`);
        }
      } catch (referralError) {
        console.error('[Auth] Failed to create referral relationship:', referralError);
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
      // Continue even if email fails in development
    }

    // ========== WEBSOCKET INTEGRATION FOR USER STATS ==========
    // Emit new user registration event to authenticated users
    if (webSocketService && webSocketService.io) {
      // Emit to all connected authenticated clients about new user
      webSocketService.io.emit('user:registered', {
        userId: newUser._id.toString(),
        username: newUser.username,
        role: newUser.role,
        timestamp: new Date().toISOString()
      });

      // Calculate and broadcast updated user statistics
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
        
        console.log(`📊 Broadcasted user stats to authenticated users - Total: ${totalUsers}, New today: ${newUsersToday}`);
      } catch (statsError) {
        console.error('Failed to broadcast user stats:', statsError);
      }
    }

    // ========== PUBLIC WEBSOCKET INTEGRATION FOR GUESTS ==========
    // Also broadcast to public WebSocket for guest users
    if (publicWebSocketService) {
      // Emit to all guest users
      publicWebSocketService.broadcastUserRegistered({
        userId: newUser._id.toString(),
        username: newUser.username,
        role: newUser.role,
        timestamp: new Date().toISOString()
      });
      
      // Send updated stats to guests
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
        
        console.log(`📡 Broadcasted user stats to guest users - Total: ${totalUsers}, New today: ${newUsersToday}`);
      } catch (statsError) {
        console.error('Failed to broadcast stats to public:', statsError);
      }
    }
    // ========== END WEBSOCKET INTEGRATION ==========

    // Don't create a session token yet - user needs to verify email first
    res.json({
      success: true,
      data: {
        message: 'Account created successfully! Please check your email to verify your account.',
        email: newUser.email,
        username: newUser.username,
        requiresVerification: true
      }
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
    
    // Try to find by token first
    if (token) {
      const hashedToken = EmailVerification.hashToken(token);
      verification = await EmailVerification.findOne({ 
        token: hashedToken,
        verified: false
      });
    }
    
    // If not found by token, try by code
    if (!verification && code) {
      verification = await EmailVerification.findOne({
        verificationCode: code.trim(),
        verified: false
      }).sort({ createdAt: -1 }); // Get most recent
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
    
    // Check if expired
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
    
    // Mark as verified
    await verification.markAsVerified();
    
    // Update user
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
    
    // Clean up old verifications for this user
    await EmailVerification.cleanupOldVerifications(user._id);
    
    // Send success email
    try {
      await sendEmail({
        to: user.email,
        ...emailTemplates.emailVerificationSuccess(user.username)
      });
    } catch (emailError) {
      console.error('Failed to send verification success email:', emailError);
    }
    
    // ========== OPTIONAL: Broadcast updated verified user count ==========
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
    
    // Also broadcast to public WebSocket
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
    // ========== END OPTIONAL BROADCAST ==========
    
    // Now create a session token since email is verified
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

// POST /api/auth/resend-verification - NEW ENDPOINT
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
    
    // Find user
    let user;
    if (email) {
      user = await User.findOne({ email: cleanEmail(email) });
    } else {
      user = await User.findOne({ username: cleanUsername(username) });
    }
    
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If that account exists and is unverified, we\'ve sent a new verification email.'
      });
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.ACTION_NOT_ALLOWED,
          message: 'This email is already verified.'
        }
      });
    }
    
    // Delete old verification records
    await EmailVerification.deleteMany({ userId: user._id });
    
    // Create new verification
    const verificationToken = EmailVerification.generateToken();
    const verificationCode = EmailVerification.generateVerificationCode();
    
    const emailVerification = new EmailVerification({
      userId: user._id,
      email: user.email,
      username: user.username,
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

// POST /api/auth/login - UPDATED WITH PASSWORD RESET CHECK
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
          message: 'Please enter a valid username (3-20 characters, letters and numbers only).' 
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
      // Be helpful but secure
      return res.status(401).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, 
          message: `We couldn't find an account with the username "${username}". Double-check the spelling or sign up for a new account.` 
        }
      });
    }

    // NEW: Check for pending password reset - UPDATED
    const pendingReset = await PasswordReset.findOne({
      email: user.email,
      used: false,
      expiresAt: { $gt: Date.now() }
    }).sort({ createdAt: -1 });
    
    if (pendingReset) {
      console.log(`[Auth] Pending password reset detected for ${username}`);
      
      // Auto-resend the password reset email
      try {
        // Delete old reset request
        await PasswordReset.deleteMany({ email: user.email });
        
        // Generate new reset token and code
        const resetToken = PasswordReset.generateToken();
        const hashedToken = PasswordReset.hashToken(resetToken);
        const verificationCode = PasswordReset.generateVerificationCode();
        
        // Save new reset request
        const passwordReset = new PasswordReset({ 
          email: user.email, 
          username: user.username, 
          token: hashedToken, 
          verificationCode,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });
        await passwordReset.save();
        
        // Send email - UPDATED to pass email as third parameter
        await sendEmail({ 
          to: user.email, 
          ...emailTemplates.passwordResetCode(user.username, verificationCode, user.email) 
        });
        
        console.log(`✅ Auto-sent new password reset code to ${user.email} on login attempt`);
      } catch (resetError) {
        console.error('Failed to auto-send password reset email:', resetError);
      }
      
      // Return special error to trigger redirect to password reset flow
      return res.status(403).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_PENDING',
          message: 'A password reset is pending for this account. We\'ve sent a new verification code to your email.',
          pendingPasswordReset: true,
          email: user.email,
          username: user.username
        }
      });
    }

    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      // Be specific and helpful
      return res.status(401).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, 
          message: 'That password doesn\'t match. Please try again or use "Forgot password" if you need help.' 
        }
      });
    }

    // Check email verification status (except for admins)
    // SILENT REDIRECT: Return special response with user data but no error message
    if (user.role !== 'admin' && !user.emailVerified) {
      // AUTO-RESEND verification email when user tries to login
      try {
        // Delete old verification records
        await EmailVerification.deleteMany({ userId: user._id });
        
        // Create new verification
        const verificationToken = EmailVerification.generateToken();
        const verificationCode = EmailVerification.generateVerificationCode();
        
        const emailVerification = new EmailVerification({
          userId: user._id,
          email: user.email,
          username: user.username,
          token: EmailVerification.hashToken(verificationToken),
          verificationCode,
          verificationType: 'signup',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        await emailVerification.save();
        
        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        
        await sendEmail({
          to: user.email,
          ...emailTemplates.emailVerification(user.username, verificationLink, verificationCode)
        });
        
        console.log(`✅ Auto-sent verification email to ${user.email} on login attempt`);
      } catch (emailError) {
        console.error('Failed to auto-send verification email:', emailError);
      }
      
      // MODIFIED: Return success=false but with special flag for silent redirect
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: '', // EMPTY MESSAGE - frontend will handle redirect silently
          requiresVerification: true,
          email: user.email,
          username: user.username
        }
      });
    }

    // ===== ROLE ENFORCEMENT WITH FRIENDLY MESSAGES =====
    if (role) {
      if (user.role === 'admin' && role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'Your account has admin privileges. Please select "Administrator" to access the admin dashboard.'
          }
        });
      }
      if (user.role !== 'admin' && role === 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
            message: 'This account doesn\'t have administrator access. Please select the correct account type to continue.'
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
            message: `This account is registered as a ${correctRole}, not a ${wrongRole}. Please select "${correctRole}" to sign in.`
          }
        });
      }
    }
    // =======================================

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
        message: 'We\'re having trouble signing you in right now. Please try again in a moment.' 
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

// GET /api/auth/me - UPDATED TO INCLUDE EMAIL VERIFICATION STATUS
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
        emailVerified: user.emailVerified || false, // Include email verification status
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
    // Admin accounts are automatically email verified
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

// ===== Password reset routes - FIXED =====

// POST /api/auth/forgot-password - Now accepts username OR email - UPDATED
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
    
    // Check if input looks like an email
    if (input.includes('@')) {
      // Try to find by email
      if (isValidEmail(input)) {
        user = await User.findOne({ email: cleanEmail(input) });
      }
    } else {
      // Try to find by username
      user = await User.findOne({ username: input });
    }
    
    // Always return success to avoid revealing if account exists
    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If that account exists, we\'ve sent you a verification code. Check your inbox!',
        data: { email: input.includes('@') ? input : null }
      });
    }
    
    // Delete any existing reset requests for this user
    await PasswordReset.deleteMany({ email: user.email });
    
    // Generate new reset token and code
    const resetToken = PasswordReset.generateToken();
    const hashedToken = PasswordReset.hashToken(resetToken);
    const verificationCode = PasswordReset.generateVerificationCode();
    
    // Save reset request
    const passwordReset = new PasswordReset({ 
      email: user.email, 
      username: user.username, 
      token: hashedToken, 
      verificationCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });
    await passwordReset.save();
    
    // Send email - UPDATED to pass email as third parameter
    try {
      await sendEmail({ 
        to: user.email, 
        ...emailTemplates.passwordResetCode(user.username, verificationCode, user.email) 
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't reveal email errors to user
    }
    
    res.json({ 
      success: true, 
      message: 'If that account exists, we\'ve sent you a verification code. Check your inbox!',
      data: { 
        email: user.email, // Return the actual email for the frontend to store
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

// POST /api/auth/verify-reset-code - Verify the 6-digit code
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
    
    // Find the reset request
    const resetRequest = await PasswordReset.findOne({ 
      email: cleanEmail(email), 
      verificationCode: code.trim() 
    });
    
    if (!resetRequest) {
      // Check if there's any request for this email to handle attempts
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
    
    // Check if the request is valid
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
    
    // Code is valid!
    res.json({ 
      success: true, 
      data: { 
        valid: true, 
        message: 'Perfect! Your code is verified. You can now set a new password.',
        token: resetRequest.token // Send token for the final step
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

// POST /api/auth/reset-password - Final step to reset password
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
    
    // Find and validate the reset request
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
    
    // Find the user
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
    
    // Update the password
    user.password = newPassword;
    await user.save();
    
    // Mark the reset request as used
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
      // Don't fail the request if email fails
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
