// pantypost-backend/services/ageAssurance.js
//
// Age assurance, behind a provider-agnostic interface.
//
// Regulators do not accept self-declaration, so age must be established
// by an independent provider. This module wraps that provider so the
// rest of the codebase never talks to a vendor API directly — swapping
// Didit for Yoti, VerifyMy or anything else is then a change to this
// file plus environment variables, not a rewrite.
//
// A deliberate design constraint: identity documents and selfies never
// touch our servers. The user completes verification on the provider's
// hosted page and we receive only the verdict. There is no biometric
// data here to leak, and nothing to delete.

const crypto = require('crypto');

const PROVIDER = process.env.AGE_ASSURANCE_PROVIDER || 'didit';

/** Outcomes the rest of the application understands. */
const AGE_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  IN_REVIEW: 'in_review',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
};

/* =====================================================================
 * DIDIT PROVIDER
 * ===================================================================== */

const DIDIT_BASE = process.env.DIDIT_API_BASE || 'https://verification.didit.me';

function diditConfigured() {
  return Boolean(
    process.env.DIDIT_API_KEY &&
    process.env.DIDIT_WORKFLOW_ID &&
    process.env.DIDIT_WEBHOOK_SECRET
  );
}

/**
 * Map Didit's session statuses onto our internal ones.
 * Their values are Title Case With Spaces and are matched exactly.
 */
function mapDiditStatus(status) {
  switch (status) {
    case 'Approved':
      return AGE_STATUS.APPROVED;
    case 'Declined':
      return AGE_STATUS.DECLINED;
    case 'In Review':
      return AGE_STATUS.IN_REVIEW;
    case 'Abandoned':
      return AGE_STATUS.ABANDONED;
    case 'Expired':
    case 'Kyc Expired':
      return AGE_STATUS.EXPIRED;
    case 'Not Finished':
    case 'Resubmitted':
    case 'In Progress':
    case 'Not Started':
      return AGE_STATUS.PENDING;
    default:
      // Unknown status fails closed — never treat it as approved.
      console.warn('[AgeAssurance] Unrecognised Didit status:', status);
      return AGE_STATUS.PENDING;
  }
}

/**
 * Open a verification session and return the hosted URL to redirect to.
 *
 * @param {object} options
 * @param {string} options.username   Our internal user reference.
 * @param {string} options.callbackUrl Where the user returns afterwards.
 */
async function diditCreateSession({ username, callbackUrl }) {
  const response = await fetch(`${DIDIT_BASE}/v3/session/`, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.DIDIT_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_id: process.env.DIDIT_WORKFLOW_ID,
      // Echoed back on the webhook so we know whose session finished.
      vendor_data: username,
      callback: callbackUrl,
      metadata: {
        purpose: 'age_gate',
        platform: 'pantypost',
      },
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[AgeAssurance] Didit session creation failed:', response.status, body);
    throw new Error(body?.detail || body?.message || 'Could not start age verification');
  }

  const url = body.session_url || body.url;
  if (!url) {
    console.error('[AgeAssurance] Didit response had no session_url:', body);
    throw new Error('Age verification provider returned an unexpected response');
  }

  return {
    sessionId: body.session_id || body.id,
    sessionUrl: url,
  };
}

/** Fetch the current verdict for a session, for polling or reconciliation. */
async function diditGetDecision(sessionId) {
  const response = await fetch(`${DIDIT_BASE}/v3/session/${sessionId}/decision/`, {
    headers: { 'x-api-key': process.env.DIDIT_API_KEY },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[AgeAssurance] Didit decision lookup failed:', response.status, body);
    throw new Error('Could not retrieve verification result');
  }

  return normaliseDiditResult(body);
}

/**
 * Reduce a Didit payload to the minimum we are willing to store.
 *
 * Deliberately excluded: name, document number, document images, and
 * the raw date of birth. We keep whether the person met the threshold,
 * not who they are.
 */
function normaliseDiditResult(payload) {
  const status = mapDiditStatus(payload.status);

  // Present when the selfie path completed.
  const estimatedAge = payload.liveness?.age_estimation ?? null;

  // Present only when the document fallback fired.
  const documentAge = payload.id_verification?.age ?? null;

  const warnings = [
    ...(payload.liveness?.warnings || []),
    ...(payload.id_verification?.warnings || []),
  ]
    .map((w) => w?.code)
    .filter(Boolean);

  return {
    status,
    rawStatus: payload.status,
    sessionId: payload.session_id,
    username: payload.vendor_data,
    // Rounded: we have no need for a precise estimate, and a coarse
    // value is less identifying if these records are ever exported.
    estimatedAge: estimatedAge !== null ? Math.round(estimatedAge) : null,
    verifiedAge: documentAge !== null ? Number(documentAge) : null,
    method: documentAge !== null ? 'document' : 'age_estimation',
    warnings,
  };
}

/**
 * Verify a Didit webhook signature.
 *
 * Must run against the RAW request body before any JSON parsing —
 * re-serialising the object changes the bytes and the signature fails.
 * Uses a timing-safe comparison so the check cannot be probed.
 */
function diditVerifySignature(rawBody, signatureHeader) {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const provided = String(signatureHeader).trim();

    // Length mismatch means it cannot match; comparing buffers of
    // different lengths would throw.
    if (provided.length !== expected.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(provided, 'utf8')
    );
  } catch (error) {
    console.error('[AgeAssurance] Signature verification error:', error.message);
    return false;
  }
}

/* =====================================================================
 * PROVIDER REGISTRY
 * ===================================================================== */

const providers = {
  didit: {
    name: 'Didit',
    isConfigured: diditConfigured,
    createSession: diditCreateSession,
    getDecision: diditGetDecision,
    verifySignature: diditVerifySignature,
    normaliseResult: normaliseDiditResult,
  },
};

function getProvider() {
  const provider = providers[PROVIDER];
  if (!provider) {
    throw new Error(`Unknown age assurance provider: ${PROVIDER}`);
  }
  return provider;
}

/** Whether age assurance is live. Lets routes degrade gracefully. */
function isEnabled() {
  try {
    return getProvider().isConfigured();
  } catch {
    return false;
  }
}

module.exports = {
  AGE_STATUS,
  getProvider,
  isEnabled,
  providerName: () => {
    try {
      return getProvider().name;
    } catch {
      return 'none';
    }
  },
};