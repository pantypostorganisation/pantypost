// pantypost-backend/utils/inqud.js

/* Client for the Inqud API.
 *
 * Two deliberate choices here, both learned the hard way from the
 * previous provider:
 *
 * 1. HMAC auth rather than sending the raw secret on every request.
 *    Inqud accepts both; signing means the secret never travels.
 *
 * 2. NOTHING trusts a webhook payload. A callback is treated purely as
 *    a nudge to go and ask the API what actually happened. The last
 *    integration credited from webhook contents and a signature-format
 *    mismatch meant deposits silently never landed -- with this shape,
 *    a malformed or unsigned callback costs nothing, because the
 *    balance only moves on what the API itself reports.
 */

const crypto = require('crypto');

const API_BASE = process.env.INQUD_API_BASE || 'https://api.inqud.com';
const TOKEN_ID = process.env.INQUD_TOKEN_ID || '';
const TOKEN_SECRET = process.env.INQUD_TOKEN_SECRET || '';
const ONRAMP_ID = process.env.INQUD_ONRAMP_ID || '';

function isConfigured() {
  return Boolean(TOKEN_ID && TOKEN_SECRET && ONRAMP_ID);
}

/**
 * Signed request headers.
 * Signature = HMAC-SHA256(body + salt) keyed by the token secret, hex.
 * GET requests sign an empty body.
 */
function authHeaders(bodyString = '') {
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(bodyString + salt)
    .digest('hex');

  return {
    'X-Token-API-Id': TOKEN_ID,
    'X-HMAC-SHA256-Signature': signature,
    'X-Salt': salt,
    'Content-Type': 'application/json'
  };
}

async function request(path, { method = 'GET', body } = {}) {
  if (!isConfigured()) throw new Error('Inqud credentials are not set');

  const bodyString = body ? JSON.stringify(body) : '';
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(bodyString),
    ...(body ? { body: bodyString } : {})
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Inqud returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(parsed.message || parsed.code || `Inqud error ${res.status}`);
  }
  return parsed;
}

/**
 * Creates a card checkout for a fixed amount.
 *
 * Returns an object whose onRampUrl is Inqud's hosted payment page --
 * the buyer is sent there, pays by card, and the funds arrive as USDC
 * in our Inqud balance. We never touch card details.
 */
async function createCheckout({ amountUsd, clientOrderId, returnUrl, cardBrand = 'MC', name }) {
  return request(`/v1/user/on-ramp/${ONRAMP_ID}/checkouts`, {
    method: 'POST',
    body: {
      type: 'FIXED_PRICE',
      methodSubKey: cardBrand,
      clientOrderId,
      returnUrl,
      name: (name || 'Wallet top-up').slice(0, 32),
      fixedAmount: {
        amount: amountUsd,
        currency: 'USD'
      }
    }
  });
}

/** The authoritative status of a checkout. This is what we credit on. */
async function getCheckout(checkoutId) {
  return request(`/v1/user/on-ramp/${ONRAMP_ID}/checkouts/${checkoutId}`);
}

/** Account balances, for the admin view. */
async function getBalances() {
  return request('/v1/user/wallet/balances');
}

/**
 * Best-effort webhook check.
 *
 * Inqud's spec does not document the callback signature format, so a
 * shared secret is compared if one is sent and otherwise skipped. This
 * is NOT what protects the wallet -- the API lookup in the route is.
 * Treat this as noise reduction, not authentication.
 */
function looksAuthentic(headers) {
  const expected = process.env.INQUD_WEBHOOK_SECRET;
  if (!expected) return true;

  const provided =
    headers['x-webhook-secret'] ||
    headers['x-inqud-secret'] ||
    headers['authorization'];

  if (!provided) return true; // fall through to the API check
  return String(provided).replace(/^Bearer\s+/i, '').trim() === expected;
}

module.exports = {
  isConfigured,
  createCheckout,
  getCheckout,
  getBalances,
  looksAuthentic
};
