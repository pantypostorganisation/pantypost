// src/utils/url.ts

const DEFAULT_API_BASE_URL = 'https://api.pantypost.com';
const LEGACY_DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const API_HOST = 'api.pantypost.com';
const PLACEHOLDER_PREFIX = 'https://via.placeholder.com';
const HTTP_PREFIX_REGEX = /^https?:\/\//i;
const UNSAFE_SCHEME_REGEX = /^(javascript|vbscript|data):/i;

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
};

const getLegacyBaseHost = (): string => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || LEGACY_DEFAULT_API_BASE_URL;
  return apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '');
};

const ensureHttpsForApiHost = (value: string): string => {
  return value.includes(API_HOST) ? value.replace('http://', 'https://') : value;
};

const isAbsoluteHttpUrl = (value: string): boolean => HTTP_PREFIX_REGEX.test(value);

const hasUnsafeScheme = (value: string): boolean => UNSAFE_SCHEME_REGEX.test(value);

/**
 * Resolve API URLs for images and resources
 */
export const resolveApiUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  if (isAbsoluteHttpUrl(url)) {
    return ensureHttpsForApiHost(url);
  }

  if (url.startsWith(PLACEHOLDER_PREFIX)) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${getApiBaseUrl()}${url}`;
  }

  return url;
};

/**
 * Resolve relative file paths (e.g., "/uploads/xyz.jpg") to an absolute backend URL.
 * This assumes NEXT_PUBLIC_API_BASE_URL looks like "http://localhost:5000/api" in dev
 * and strips the trailing "/api" for static files.
 */
export function resolveApiUrlLegacy(path?: string | null): string | null {
  if (!path) return null;

  if (isAbsoluteHttpUrl(path)) {
    return path;
  }

  if (hasUnsafeScheme(path)) {
    return null;
  }

  if (!path.startsWith('/')) {
    return null;
  }

  return `${getLegacyBaseHost()}${path}`;
}

/**
 * Return a safe image src string. Falls back to a placeholder if:
 *  - input is empty
 *  - scheme is not allowed
 *  - URL cannot be resolved
 */
export function safeImageSrc(
  input?: string | null,
  options?: { placeholder?: string }
): string {
  const placeholder = options?.placeholder ?? '/placeholder-image.png';
  if (!input) return placeholder;

  // Already http(s) — accept but force HTTPS for api.pantypost.com
  if (isAbsoluteHttpUrl(input)) {
    return ensureHttpsForApiHost(input);
  }

  // Unsafe schemes
  if (hasUnsafeScheme(input)) return placeholder;

  // Relative path — resolve against backend host
  const resolved = resolveApiUrl(input);
  return resolved ?? placeholder;
}

/**
 * Basic currency formatter that won't throw on bad input.
 * Always returns something like "$0.00".
 */
export function formatCurrency(value: unknown): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `$${n.toFixed(2)}`;
}
