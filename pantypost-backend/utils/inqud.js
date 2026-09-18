// pantypost-backend/utils/inqud.js

/* Client for the Inqud API.
 *
 * Crypto acquiring: the buyer is given a blockchain address, sends to
 * it, and the funds land on our Inqud balance. Critically, Inqud does
 * NOT forward each payment on-chain as it arrives -- balances
 * accumulate and we withdraw in batches, so the network fee is paid
 * once per withdrawal rather than once per deposit. The previous
 * provider forwarded per payment, which at a $20-50 ticket took
 * 25-60% of every deposit.
 *
 * Two design rules here, both from that experience:
 *
 * 1. HMAC auth, so the secret never travels on the wire.
 * 2. Nothing trusts a webhook payload. A callback is only a nudge to
 *    ask the API what actually happened. Crediting from webhook
 *    contents is what let a signature-format mismatch silently
 *    swallow every deposit last time.
 */

const crypto = require('crypto');

const API_BASE = process.env.INQUD_API_BASE || 'https://api.inqud.com';
const TOKEN_ID = process.env.INQUD_TOKEN_ID || '';
const TOKEN_SECRET = process.env.INQUD_TOKEN_SECRET || '';

/* The crypto-acquiring widget/project id (CAP-...). Distinct from the
   on-ramp id (ORP-...), which covers card payments and is paused. */
const PROJECT_ID = process.env.INQUD_PROJECT_ID || '';

function isConfigured() {
  return Boolean(TOKEN_ID && TOKEN_SECRET && PROJECT_ID);
}

/** Signature = HMAC-SHA256(body + salt), keyed by the token secret. */
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

/* What a buyer can pay with. Deliberately short: every extra network
   is another way to send on the wrong chain and lose the money. Tron
   and Solana first because the fee is cents rather than dollars. */
const CURRENCIES = [
  { code: 'TRON_USDT',    label: 'USDT', network: 'Tron (TRC20)', note: 'Lowest fees. Recommended.' },
  { code: 'SOLANA_USDT',  label: 'USDT', network: 'Solana',       note: 'Fast, very low fees.' },
  { code: 'SOLANA_USDC',  label: 'USDC', network: 'Solana',       note: 'Fast, very low fees.' },
  { code: 'BITCOIN_BTC',  label: 'Bitcoin', network: 'Bitcoin',   note: 'Slower, higher network fee.' },
];

/**
 * Creates a deposit request and returns the address to pay to.
 *
 * amountIn is USD and cryptoCurrency is the chain/asset, so Inqud
 * quotes the crypto amount at the current rate. The platform is USD
 * throughout, which avoids asking for "$20" and then quoting 14.27 of
 * something else -- that reads like a mistake to a buyer.
 */
async function createDepositRequest({ amountUsd, cryptoCurrency, clientOrderId }) {
  return request(`/v1/user/crypto-acquiring/${PROJECT_ID}/requests`, {
    method: 'POST',
    body: {
      amount: amountUsd,
      amountIn: 'USD',
      cryptoCurrency,
      clientOrderId,
      methodKey: 'CRYPTOCOIN'
    }
  });
}

/** The authoritative state of a request. This is what we credit on. */
async function getDepositRequest(requestId) {
  return request(`/v1/user/crypto-acquiring/requests/${requestId}`);
}

/** Account balances, for the admin view. */
async function getBalances() {
  return request('/v1/user/wallet/balances');
}

/**
 * Best-effort webhook check.
 *
 * Not what protects the wallet -- the API lookup in the route is. This
 * only filters obvious noise, so a header format we have not seen
 * before falls through to verification rather than dropping a real
 * payment on the floor.
 */
function looksAuthentic(headers) {
  const expected = process.env.INQUD_WEBHOOK_SECRET;
  if (!expected) return true;

  const provided =
    headers['x-webhook-secret'] ||
    headers['x-inqud-secret'] ||
    headers['authorization'];

  if (!provided) return true;
  return String(provided).replace(/^Bearer\s+/i, '').trim() === expected;
}

module.exports = {
  isConfigured,
  CURRENCIES,
  createDepositRequest,
  getDepositRequest,
  getBalances,
  looksAuthentic
};
