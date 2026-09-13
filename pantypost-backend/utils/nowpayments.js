// pantypost-backend/utils/nowpayments.js

/* Thin client for the NOWPayments API.
 *
 * Two things worth knowing about this integration:
 *
 * 1. It runs NON-CUSTODIAL. Funds go straight to our own wallet
 *    address; NOWPayments watches the chain and tells us when money
 *    lands. They never hold the balance, so if they disappeared we
 *    would lose the integration, not the money.
 *
 * 2. The webhook signature is HMAC-SHA512 over the payload with its
 *    keys SORTED. An unsorted stringify produces a different digest
 *    and every callback silently fails verification -- which looks
 *    exactly like "payments not crediting" and is miserable to debug.
 */

const crypto = require('crypto');

const API_BASE = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';

function isConfigured() {
  return Boolean(API_KEY);
}

async function request(path, options = {}) {
  if (!API_KEY) throw new Error('NOWPAYMENTS_API_KEY is not set');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`NOWPayments returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(body.message || `NOWPayments error ${res.status}`);
  }
  return body;
}

/** Live estimate of how much crypto a fiat amount costs. */
async function estimate(amount, currencyFrom, currencyTo) {
  const qs = new URLSearchParams({
    amount: String(amount),
    currency_from: currencyFrom,
    currency_to: currencyTo
  });
  return request(`/estimate?${qs.toString()}`);
}

/** Creates a payment and returns the address the buyer sends to. */
async function createPayment({ amountAud, payCurrency, orderId, orderDescription, callbackUrl }) {
  return request('/payment', {
    method: 'POST',
    body: JSON.stringify({
      price_amount: amountAud,
      price_currency: 'aud',
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: orderDescription,
      ipn_callback_url: callbackUrl
    })
  });
}

async function getPayment(paymentId) {
  return request(`/payment/${paymentId}`);
}

/**
 * Verifies an IPN callback.
 *
 * Keys must be sorted before hashing -- NOWPayments sorts them their
 * end, and an unsorted stringify gives a different digest.
 */
function verifyWebhook(payload, signature) {
  if (!IPN_SECRET || !signature) return false;

  const sorted = JSON.stringify(payload, Object.keys(payload).sort());
  const expected = crypto.createHmac('sha512', IPN_SECRET).update(sorted).digest('hex');

  // Constant-time compare; lengths must match or timingSafeEqual throws.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  isConfigured,
  estimate,
  createPayment,
  getPayment,
  verifyWebhook
};
