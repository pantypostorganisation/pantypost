// src/utils/url.ts

/**
 * Resolve relative file paths (e.g., "/uploads/xyz.jpg") to an absolute backend URL.
 * This assumes NEXT_PUBLIC_API_BASE_URL looks like "http://localhost:5000/api" in dev
 * and strips the trailing "/api" for static files.
 */
export function resolveApiUrl(path?: string | null): string | null {
  if (!path) return null;

  // Already absolute http(s)
  if (/^https?:\/\//i.test(path)) return path;

  // Reject dangerous schemes outright (javascript:, data:, vbscript:, etc.)
  if (!/^(\/|https?:)/i.test(path)) return null;
  if (/^(javascript|vbscript|data):/i.test(path)) return null;

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const baseHost = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, ''); // strip trailing /api and trailing slash
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${baseHost}${normalized}`;
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

  // Already http(s) — accept
  if (/^https?:\/\//i.test(input)) return input;

  // Unsafe schemes
  if (/^(javascript|vbscript|data):/i.test(input)) return placeholder;

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
