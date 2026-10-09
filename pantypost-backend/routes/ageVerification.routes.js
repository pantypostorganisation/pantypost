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
const { isHardBlocked, isSignupBlocked } = require('../config/blockedCountries');

/* =====================================================================
 * Issuing-country extraction
 *
 * The first version of this check read a single field that the
 * normaliser was supposed to populate. It never fired once in
 * production -- not one log line -- because the key it guessed at
 * does not exist in Didit's payload. Rather than guess again, this
 * version walks the raw webhook body, collects EVERY field that
 * looks like a country, and logs what it found. Whatever Didit calls
 * the field, it gets caught, and the log tells us the real name.
 * ===================================================================== */

/* Didit reports ISO-3166 alpha-3; the block list is alpha-2.
   Only the countries actually on the list need mapping -- an unknown
   code returns null and the verification proceeds, which is the right
   default for a check that exists to catch a known set. */
const ALPHA3_TO_ALPHA2 = {
  CUB: 'CU', IRN: 'IR', PRK: 'KP', SYR: 'SY', RUS: 'RU', BLR: 'BY',
  SAU: 'SA', ARE: 'AE', QAT: 'QA', KWT: 'KW', OMN: 'OM', BHR: 'BH',
  YEM: 'YE', IRQ: 'IQ', AFG: 'AF', PAK: 'PK', SDN: 'SD', BRN: 'BN',
  DZA: 'DZ', EGY: 'EG', LBY: 'LY', MAR: 'MA', TUN: 'TN', JOR: 'JO',
  LBN: 'LB', TUR: 'TR', CHN: 'CN', TKM: 'TM', UZB: 'UZ', TJK: 'TJ',
  IDN: 'ID', MYS: 'MY', IND: 'IN', BGD: 'BD', PHL: 'PH', VNM: 'VN',
  MMR: 'MM', THA: 'TH', KHM: 'KH', LKA: 'LK', NGA: 'NG', UGA: 'UG',
};

/* Some providers send the country spelled out rather than coded.
   Keys are letters only, uppercased -- see normaliseWord(). */
const NAME_TO_ALPHA2 = {
  CUBA: 'CU',
  IRAN: 'IR', IRANISLAMICREPUBLICOF: 'IR',
  NORTHKOREA: 'KP', KOREADEMOCRATICPEOPLESREPUBLICOF: 'KP', DPRK: 'KP',
  SYRIA: 'SY', SYRIANARABREPUBLIC: 'SY',
  RUSSIA: 'RU', RUSSIANFEDERATION: 'RU',
  BELARUS: 'BY',
  SAUDIARABIA: 'SA',
  UNITEDARABEMIRATES: 'AE', UAE: 'AE',
  QATAR: 'QA', KUWAIT: 'KW', OMAN: 'OM', BAHRAIN: 'BH',
  YEMEN: 'YE', IRAQ: 'IQ', AFGHANISTAN: 'AF', PAKISTAN: 'PK',
  SUDAN: 'SD', BRUNEI: 'BN', BRUNEIDARUSSALAM: 'BN',
  ALGERIA: 'DZ', EGYPT: 'EG', LIBYA: 'LY', MOROCCO: 'MA',
  TUNISIA: 'TN', JORDAN: 'JO', LEBANON: 'LB',
  TURKEY: 'TR', TURKIYE: 'TR',
  CHINA: 'CN', TURKMENISTAN: 'TM', UZBEKISTAN: 'UZ', TAJIKISTAN: 'TJ',
  INDONESIA: 'ID', MALAYSIA: 'MY', INDIA: 'IN', BANGLADESH: 'BD',
  PHILIPPINES: 'PH', VIETNAM: 'VN', VIETNAM_: 'VN',
  MYANMAR: 'MM', BURMA: 'MM', THAILAND: 'TH', CAMBODIA: 'KH',
  SRILANKA: 'LK', NIGERIA: 'NG', UGANDA: 'UG',
};

function normaliseWord(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z]/g, '');
}

/* Any key that might name a country of issue. Deliberately broad --
   a false match that does not resolve to a known country is harmless,
   because resolveCountry() returns null and we carry on. */
const COUNTRY_KEY = /country|nationality|citizenship|issuing|issuer/i;

/* ...except anything derived from the network. This check exists to
   read the DOCUMENT, and an IP-based block already runs at signup.
   Blocking a verified user because their VPN exits in Lagos is a
   different policy, and not this one. */
const NETWORK_KEY = /(^|[^a-z])ip([^a-z]|$)|geoip|geo_?location|browser|user_?agent/i;

/* Turn one field value into an alpha-2 country, or null.
 *
 * The two-letter case is the trap. A US driver's licence carries
 * `issuing_state: "IN"` for Indiana, which is also India's country
 * code -- and SD, MA, TN and ID collide the same way. So a bare
 * two-letter value is only read as a country when the key itself
 * says "country", "nationality" or "citizenship". Didit sends
 * alpha-3 ("NGA") for passports, which is unambiguous. */
function resolveCountry(rawValue, keyPath) {
  const word = normaliseWord(rawValue);
  if (!word) return null;

  if (word.length === 3 && ALPHA3_TO_ALPHA2[word]) return ALPHA3_TO_ALPHA2[word];
  if (word.length > 3 && NAME_TO_ALPHA2[word]) return NAME_TO_ALPHA2[word];

  if (word.length === 2 && /country|nationality|citizenship|iso/i.test(keyPath)) {
    return word;
  }

  return null;
}

/* Walk the whole payload and return every country-looking field,
   deepest-first order of discovery, with its path for the log. */
function findCountryFields(payload) {
  const found = [];
  const seen = new WeakSet();

  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    if (found.length > 60) return;

    for (const [key, value] of Object.entries(node)) {
      const keyPath = path ? `${path}.${key}` : key;

      if (value && typeof value === 'object') {
        walk(value, keyPath);
        continue;
      }

      if (typeof value !== 'string' && typeof value !== 'number') continue;
      if (NETWORK_KEY.test(keyPath)) continue;
      if (!COUNTRY_KEY.test(key)) continue;

      found.push({ keyPath, value: String(value) });
    }
  };

  try {
    walk(payload, '');
  } catch (error) {
    console.error('[AgeVerification] Country scan failed:', error.message);
  }

  return found;
}

/* Prefer an explicitly document-issuing field when several match, so
   the log and the block reason point at the passport rather than at a
   home-address country that happens to appear alongside it. */
function rankCountryFields(fields) {
  const weight = (keyPath) => {
    if (/issuing/i.test(keyPath)) return 0;
    if (/issuer|nationality|citizenship/i.test(keyPath)) return 1;
    if (/document|doc_/i.test(keyPath)) return 2;
    return 3;
  };
  return [...fields].sort((a, b) => weight(a.keyPath) - weight(b.keyPath));
}

const authMiddleware = require('../middleware/auth.middleware');
const { getProvider, isEnabled, AGE_STATUS, providerName } = require('../services/ageAssurance');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://pantypost.com';

const JURISDICTION_WARNING = 'JURISDICTION_BLOCKED';

function hasJurisdictionBlock(user) {
  const warnings = user?.ageVerification?.warnings || [];
  return warnings.some((w) => String(w).startsWith(JURISDICTION_WARNING));
}

/* =====================================================================
 * GET /api/age-verification/status
 * Where the current user stands. Used by the gate on page load.
 * ===================================================================== */

/* Didit is now the ONLY verification path. A Didit approval proves the
   person is a real, live adult holding a real document -- which is
   exactly what the seller badge used to assert after a human squinted
   at uploaded ID photos. So an approval grants the badge directly, and
   PantyPost never stores an identity document at all. Keeping these
   two fields in step is what lets the rest of the app (listing limits,
   badges, browse filters) keep reading isVerified as it always has. */
function applySellerVerification(user, status) {
  if (status === AGE_STATUS.APPROVED) {
    user.isVerified = true;
    user.verificationStatus = 'verified';
    if (!user.verificationData) user.verificationData = {};
    user.verificationData.provider = providerName();
    user.verificationData.verifiedAt = new Date();
  } else if (status === AGE_STATUS.DECLINED) {
    user.isVerified = false;
    user.verificationStatus = 'rejected';
  }
}

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

    /* A document from a blocked jurisdiction is not a camera problem,
       so there is nothing to retry. Refusing here also stops them
       burning a paid Didit session every sixty seconds. */
    if (hasJurisdictionBlock(user)) {
      return res.status(403).json({
        success: false,
        error: 'We are unable to verify accounts from your region. Contact support if you believe this is a mistake.',
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

    /* Block on the DOCUMENT's country, not the IP.
     *
     * Nigeria has been on SIGNUP_BLOCKED since August, and accounts
     * kept arriving anyway -- because that list is enforced against
     * the IP address, and a VPN costs three dollars a month. Every
     * fraudulent account we have traced since has carried a document
     * from a country already on that list.
     *
     * A passport is harder to change than an exit node. Checking the
     * issuing state closes the gap the IP check cannot.
     *
     * The scan is logged on every webhook, approved or not. That log
     * is the whole reason this version works: the previous one read a
     * single guessed key, found nothing, and failed silently for
     * weeks. If Didit renames a field, the log says so on the next
     * verification instead of after the next scam report. */
    const countryFields = rankCountryFields(findCountryFields(req.body || {}));

    if (result.issuingCountry) {
      countryFields.unshift({
        keyPath: 'normalised.issuingCountry',
        value: String(result.issuingCountry),
      });
    }

    if (countryFields.length) {
      console.log(
        `[AgeVerification] ${result.username}: country fields -> ` +
        countryFields.map((f) => `${f.keyPath}=${f.value}`).join(', ')
      );
    } else {
      console.log(`[AgeVerification] ${result.username}: no country fields in payload`);
    }

    let blockedCode = null;
    let blockedField = null;

    for (const field of countryFields) {
      const alpha2 = resolveCountry(field.value, field.keyPath);
      if (alpha2 && (isHardBlocked(alpha2) || isSignupBlocked(alpha2))) {
        blockedCode = alpha2;
        blockedField = field;
        break;
      }
    }

    if (blockedCode) {
      user.ageVerification = {
        ...(user.ageVerification || {}),
        status: AGE_STATUS.DECLINED,
        sessionId: result.sessionId || user.ageVerification?.sessionId,
        provider: providerName(),
        method: result.method,
        warnings: [
          ...(result.warnings || []),
          `${JURISDICTION_WARNING}:${blockedCode}`,
        ],
        updatedAt: new Date(),
      };

      applySellerVerification(user, AGE_STATUS.DECLINED);
      await user.save();

      console.warn(
        `[AgeVerification] ${result.username}: document from blocked jurisdiction ` +
        `${blockedCode} (${blockedField.keyPath}=${blockedField.value}) — rejected`
      );

      // Let their open tab stop spinning.
      try {
        if (global.webSocketService) {
          global.webSocketService.emitToUser(result.username, 'age_verification:updated', {
            status: AGE_STATUS.DECLINED,
            isVerified: false,
          });
        }
      } catch (wsError) {
        console.error('[AgeVerification] WebSocket notify failed:', wsError.message);
      }

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

    applySellerVerification(user, result.status);

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

    /* Refresh asks Didit for the raw verdict, which knows nothing about
       our jurisdiction policy -- so without this guard it would happily
       overwrite a jurisdiction rejection with Didit's own APPROVED and
       hand back the badge. The block has to be sticky. */
    if (hasJurisdictionBlock(user)) {
      return res.json({
        success: true,
        data: { status: AGE_STATUS.DECLINED, isVerified: false },
      });
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

    /* Same document check as the webhook. getDecision returns the
       normalised shape, so scan whatever it hands back -- if it carries
       the raw payload we catch the issuing state here too, and if it
       does not, the webhook remains the primary gate. */
    const countryFields = rankCountryFields(findCountryFields(result || {}));
    if (result.issuingCountry) {
      countryFields.unshift({
        keyPath: 'normalised.issuingCountry',
        value: String(result.issuingCountry),
      });
    }

    let blockedCode = null;
    for (const field of countryFields) {
      const alpha2 = resolveCountry(field.value, field.keyPath);
      if (alpha2 && (isHardBlocked(alpha2) || isSignupBlocked(alpha2))) {
        blockedCode = alpha2;
        break;
      }
    }

    if (blockedCode) {
      user.ageVerification = {
        ...(user.ageVerification || {}),
        status: AGE_STATUS.DECLINED,
        method: result.method,
        warnings: [
          ...(result.warnings || []),
          `${JURISDICTION_WARNING}:${blockedCode}`,
        ],
        updatedAt: new Date(),
      };

      applySellerVerification(user, AGE_STATUS.DECLINED);
      await user.save();

      console.warn(
        `[AgeVerification] ${user.username}: refresh found blocked jurisdiction ${blockedCode} — rejected`
      );

      return res.json({
        success: true,
        data: { status: AGE_STATUS.DECLINED, isVerified: false },
      });
    }

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

    applySellerVerification(user, result.status);

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
