// src/utils/blockedCountries.ts
//
// Mirror of pantypost-backend/config/blockedCountries.js. Kept as a
// separate file rather than fetched, so the country pickers can filter
// instantly without a round trip.
//
// This list is a CONVENIENCE, not a security control: the server
// rejects blocked countries independently. Anyone editing this file
// must edit the backend copy too, or the two will drift.

export const HARD_BLOCKED: string[] = [
  'CU', 'IR', 'KP', 'SY', 'RU', 'BY',
  'SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'YE', 'IQ', 'AF', 'PK', 'SD', 'BN',
];

export const SIGNUP_BLOCKED: string[] = [
  'DZ', 'EG', 'LY', 'MA', 'TN', 'JO', 'LB', 'TR',
  'CN', 'TM', 'UZ', 'TJ',
  'ID', 'MY', 'IN', 'BD', 'PH', 'VN', 'MM', 'TH', 'KH', 'LK',
  'NG', 'UG',
];

// Allowed, but worn-garment parcels may be seized by customs.
export const SHIPPING_WARNING: string[] = ['RW', 'KE', 'TZ', 'ZW', 'ZA', 'ET'];

const blockedSet = new Set([...HARD_BLOCKED, ...SIGNUP_BLOCKED]);
const shippingSet = new Set(SHIPPING_WARNING);

export function isCountryBlocked(code?: string | null): boolean {
  return !!code && blockedSet.has(code.toUpperCase());
}

export function hasShippingWarning(code?: string | null): boolean {
  return !!code && shippingSet.has(code.toUpperCase());
}

/** Drop blocked countries from any list of { code } options. */
export function filterAllowedCountries<T extends { code: string }>(options: T[]): T[] {
  return options.filter((option) => !isCountryBlocked(option.code));
}
