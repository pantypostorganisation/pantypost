// src/constants/countries.ts
// Shared utilities for mapping country names to ISO codes and flag emoji.
// Keep this list in sync across any feature that allows buyers to pick a country.

export const COUNTRY_TO_CODE: Record<string, string> = {
  Australia: 'AU',
  Canada: 'CA',
  'United States': 'US',
  'United Kingdom': 'GB',
  Germany: 'DE',
  France: 'FR',
  Italy: 'IT',
  Spain: 'ES',
  Ireland: 'IE',
  Netherlands: 'NL',
  Belgium: 'BE',
  Switzerland: 'CH',
  Austria: 'AT',
  Sweden: 'SE',
  Norway: 'NO',
  Denmark: 'DK',
  Finland: 'FI',
  Poland: 'PL',
  Portugal: 'PT',
  Greece: 'GR',
  Brazil: 'BR',
  Mexico: 'MX',
  Argentina: 'AR',
  Chile: 'CL',
  Colombia: 'CO',
  Peru: 'PE',
  Japan: 'JP',
  'South Korea': 'KR',
  China: 'CN',
  India: 'IN',
  Indonesia: 'ID',
  Philippines: 'PH',
  Thailand: 'TH',
  Vietnam: 'VN',
  Singapore: 'SG',
  Malaysia: 'MY',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  Nigeria: 'NG',
  Egypt: 'EG',
  Turkey: 'TR',
  Israel: 'IL',
  'United Arab Emirates': 'AE',
  'Saudi Arabia': 'SA',
  Ukraine: 'UA',
  Russia: 'RU',
};

/* WHY THIS RETURNS A CODE, NOT AN EMOJI
 *
 * Flag emoji are built from Regional Indicator Symbols -- 'AU' becomes
 * U+1F1E6 U+1F1FA. Rendering that as a flag requires the OS to ship flag
 * glyphs, and WINDOWS DOES NOT. Chrome on Windows therefore falls back to
 * drawing the two indicator letters, so a flag beside a country name
 * renders as "AU" immediately followed by "Australia" -- the
 * "AUAustralia" you saw. macOS, iOS and Android show the flag, so this
 * looks fine on a phone and broken on the desktop most admins use.
 *
 * Rather than depend on the viewer's OS, this now returns the ISO code
 * itself and callers render it as a small chip (see CountryTag below).
 * Consistent everywhere, no font dependency, no network request.
 *
 * If real flag artwork is wanted later, CountrySelect.tsx already uses
 * flagcdn.com PNGs -- but that adds an external image dependency and
 * needs the CSP img-src to allow it.
 */
export function flagFromIso2(code?: string | null): string {
  if (!code || code.length !== 2) return '';
  return code.toUpperCase();
}

export function flagFromCountryName(name?: string | null): string {
  if (!name) return '';
  const normalized = name.trim();
  if (!normalized) return '';

  const direct = COUNTRY_TO_CODE[normalized];
  if (direct) {
    return flagFromIso2(direct);
  }

  // Allow users to type ISO codes directly.
  const isoCandidate = normalized.toUpperCase();
  if (/^[A-Z]{2}$/.test(isoCandidate)) {
    return flagFromIso2(isoCandidate);
  }

  return '';
}