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

export function flagFromIso2(code?: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  const base = 0x1f1e6;
  const A = 'A'.charCodeAt(0);
  const characters = code.toUpperCase().split('');
  const cps = characters.map((c) => base + (c.charCodeAt(0) - A));
  return String.fromCodePoint(...cps);
}

export function flagFromCountryName(name?: string | null): string {
  if (!name) return '🌐';
  const normalized = name.trim();
  if (!normalized) return '🌐';

  const direct = COUNTRY_TO_CODE[normalized];
  if (direct) {
    return flagFromIso2(direct);
  }

  // Allow users to type ISO codes directly.
  const isoCandidate = normalized.toUpperCase();
  if (/^[A-Z]{2}$/.test(isoCandidate)) {
    return flagFromIso2(isoCandidate);
  }

  return '🌐';
}
