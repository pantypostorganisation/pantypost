// pantypost-backend/config/blockedCountries.js
//
// Two tiers, for two different reasons.
//
// HARD_BLOCKED: the site does not load at all. Half of these are legal
// obligations rather than choices -- Australian sanctions law binds
// PantyPost regardless of what the adult-content rules say. The rest
// are places where a user reaching an adult marketplace risks prison
// or corporal punishment, so serving them the site at all is a danger
// to THEM, not a growth opportunity for us.
//
// SIGNUP_BLOCKED: the site loads, but no account, purchase or sale.
// National porn blocks, adult-commerce illegality, or customs regimes
// that seize worn garments -- where a parcel arriving would put the
// recipient in real trouble. Browsing stays open so travellers and
// expats are not hard-locked out of their own account country choice.
//
// Codes are ISO 3166-1 alpha-2, uppercase. Reviewed 28 Aug 2026 --
// sanctions lists change; re-check DFAT before assuming this is current.

const HARD_BLOCKED = [
  // Sanctions (mandatory, not discretionary)
  'CU', 'IR', 'KP', 'SY', 'RU', 'BY',
  // Severe user-prosecution risk
  'SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'YE', 'IQ', 'AF', 'PK', 'SD', 'BN'
];

const SIGNUP_BLOCKED = [
  'DZ', 'EG', 'LY', 'MA', 'TN', 'JO', 'LB', 'TR',
  'CN', 'TM', 'UZ', 'TJ',
  'ID', 'MY', 'IN', 'BD', 'PH', 'VN', 'MM', 'TH', 'KH', 'LK',
  'NG', 'UG'
];

// Allowed to hold an account, but a worn-garment parcel may be seized
// by customs (used-clothing import bans). Warn, never block.
const SHIPPING_WARNING = ['RW', 'KE', 'TZ', 'ZW', 'ZA', 'ET'];

const hardSet = new Set(HARD_BLOCKED);
const signupSet = new Set(SIGNUP_BLOCKED);
const shippingSet = new Set(SHIPPING_WARNING);

function isHardBlocked(code) {
  return !!code && hardSet.has(String(code).toUpperCase());
}

function isSignupBlocked(code) {
  const upper = String(code || '').toUpperCase();
  return hardSet.has(upper) || signupSet.has(upper);
}

function hasShippingWarning(code) {
  return !!code && shippingSet.has(String(code).toUpperCase());
}

module.exports = {
  HARD_BLOCKED,
  SIGNUP_BLOCKED,
  SHIPPING_WARNING,
  isHardBlocked,
  isSignupBlocked,
  hasShippingWarning
};
