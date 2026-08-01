// pantypost-backend/routes/ageVerification.routes.js
//
// Age verification endpoints.
//
// Flow:
//   1. User asks to verify        -> POST /start   -> hosted provider URL
//   2. User completes on provider's page (we never see the documents)
//   3. Provider posts the verdict -> POST /webhook -> we store the result
//   4. User returns to our site   -> GET  /status  -> gate opens or not

const express = require('express');
const router = express.Router();

const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const { getProvider, isEnabled, AGE_STATUS, providerName } = require('../services/ageAssurance');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://pantypost.com';

/* =====================================================================
 * GET /api/age-verification/status
 * Where the current user stands. Used by the gate on page load.
 * ===================================================================== */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .select('ageVerification')
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const av = user.ageVerification || {};

    return res.json({
      success: true,
      data: {
        status: av.status || AGE_STATUS.NOT_STARTED,
        verifiedAt: av.verifiedAt || null,
        method: av.method || null,
        // Whether the gate should let them through.
        isVerified: av.status === AGE_STATUS.APPROVED,
        // Lets the frontend show a sensible message when the provider
        // is not configured, rather than a broken button.
        providerAvailable: isEnabled(),
      },
    });
  } catch (error) {
    console.error('[AgeVerification] Status error:', error);
    return res.status(500).json({ success: false, error: 'Could not load verification status' });
  }
});

/* =====================================================================
 * POST /api/age-verification/start
 * Opens a session and returns the hosted URL to redirect the user to.
 * ===================================================================== */
router.post('/start', authMiddleware, async (req, res) => {
  try {
    if (!isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Age verification is temporarily unavailable. Please try again shortly.',
      });
    }

    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Already through — no reason to pay for another check.
    if (user.ageVerification?.status === AGE_STATUS.APPROVED) {
      return res.json({
        success: true,
        data: { alreadyVerified: true },
        message: 'You are already verified.',
      });
    }

    // A previous decline is not a permanent bar — someone may have been
    // misjudged by estimation, or completed on a poor camera. But it is
    // rate limited so the check cannot be brute forced.
    const lastAttempt = user.ageVerification?.lastAttemptAt;
    if (lastAttempt && Date.now() - new Date(lastAttempt).getTime() < 60 * 1000) {
      return res.status(429).json({
        success: false,
        error: 'Please wait a minute before trying again.',
      });
    }

    const provider = getProvider();
    const session = await provider.createSession({
      username: user.username,
      callbackUrl: `${FRONTEND_URL}/age-verification/complete`,
    });

    user.ageVerification = {
      ...(user.ageVerification || {}),
      status: AGE_STATUS.PENDING,
      sessionId: session.sessionId,
      provider: providerName(),
      startedAt: new Date(),
      lastAttemptAt: new Date(),
      attempts: (user.ageVerification?.attempts || 0) + 1,
    };
    await user.save();

    console.log(`[AgeVerification] Session opened for ${user.username}`);

    return res.json({
      success: true,
      data: {
        sessionUrl: session.sessionUrl,
        sessionId: session.sessionId,
      },
    });
  } catch (error) {
    console.error('[AgeVerification] Start error:', error);
    return res.status(500).json({
      success: false,
      error: 'Could not start age verification. Please try again.',
    });
  }
});

/* =====================================================================
 * POST /api/age-verification/webhook
 *
 * Called by the provider, NOT by a logged-in user, so there is no auth
 * middleware here — the HMAC signature is the credential.
 *
 * Requires the raw request body. See the note in server.js about
 * capturing it, since re-serialising parsed JSON changes the bytes and
 * breaks the signature.
 * ===================================================================== */
router.post('/webhook', async (req, res) => {
  try {
    const provider = getProvider();

    const signature =
      req.headers['x-signature-v2'] ||
      req.headers['X-Signature-V2'];

    // rawBody is populated by the verify hook on express.json().
    const rawBody = req.rawBody;

    if (!rawBody) {
      console.error('[AgeVerification] Webhook received without rawBody — check the express.json verify hook in server.js');
      return res.status(400).json({ success: false, error: 'Bad request' });
    }

    if (!provider.verifySignature(rawBody, signature)) {
      console.warn('[AgeVerification] Rejected webhook with invalid signature');
      // Deliberately vague: do not help an attacker calibrate.
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const result = provider.normaliseResult(req.body || {});

    if (!result.username) {
      console.warn('[AgeVerification] Webhook had no vendor_data, cannot attribute');
      // 200 so the provider does not retry something we can never process.
      return res.json({ success: true });
    }

    const user = await User.findOne({ username: result.username });
    if (!user) {
      console.warn('[AgeVerification] Webhook for unknown user:', result.username);
      return res.json({ success: true });
    }

    const previous = user.ageVerification?.status;

    user.ageVerification = {
      ...(user.ageVerification || {}),
      status: result.status,
      sessionId: result.sessionId || user.ageVerification?.sessionId,
      provider: providerName(),
      method: result.method,
      // Coarse age only. Never the date of birth, name or document.
      estimatedAge: result.estimatedAge ?? undefined,
      verifiedAge: result.verifiedAge ?? undefined,
      warnings: result.warnings || [],
      updatedAt: new Date(),
    };

    if (result.status === AGE_STATUS.APPROVED) {
      user.ageVerification.verifiedAt = new Date();
    }

    await user.save();

    console.log(
      `[AgeVerification] ${result.username}: ${previous || 'none'} -> ${result.status} (${result.method})`
    );

    // Nudge the user's open tab if they are still waiting.
    try {
      if (global.webSocketService) {
        global.webSocketService.emitToUser(result.username, 'age_verification:updated', {
          status: result.status,
          isVerified: result.status === AGE_STATUS.APPROVED,
        });
      }
    } catch (wsError) {
      console.error('[AgeVerification] WebSocket notify failed:', wsError.message);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[AgeVerification] Webhook error:', error);
    // 500 so the provider retries — better than silently losing a verdict.
    return res.status(500).json({ success: false, error: 'Processing error' });
  }
});

/* =====================================================================
 * POST /api/age-verification/refresh
 *
 * Fallback for when a webhook is missed. Asks the provider directly
 * rather than waiting. Safe to call from the return page.
 * ===================================================================== */
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const sessionId = user.ageVerification?.sessionId;
    if (!sessionId) {
      return res.json({
        success: true,
        data: { status: user.ageVerification?.status || AGE_STATUS.NOT_STARTED },
      });
    }

    const provider = getProvider();
    const result = await provider.getDecision(sessionId);

    user.ageVerification = {
      ...(user.ageVerification || {}),
      status: result.status,
      method: result.method,
      estimatedAge: result.estimatedAge ?? undefined,
      verifiedAge: result.verifiedAge ?? undefined,
      warnings: result.warnings || [],
      updatedAt: new Date(),
    };

    if (result.status === AGE_STATUS.APPROVED && !user.ageVerification.verifiedAt) {
      user.ageVerification.verifiedAt = new Date();
    }

    await user.save();

    return res.json({
      success: true,
      data: {
        status: result.status,
        isVerified: result.status === AGE_STATUS.APPROVED,
      },
    });
  } catch (error) {
    console.error('[AgeVerification] Refresh error:', error);
    return res.status(500).json({ success: false, error: 'Could not refresh status' });
  }
});

module.exports = router;