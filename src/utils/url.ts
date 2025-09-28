// src/utils/url.ts

/**
 * Resolve API URLs for images and resources
 */
export const resolveApiUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  // If it's already a full URL, force HTTPS for api.pantypost.com
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Force HTTPS for api.pantypost.com URLs to avoid mixed content errors
    if (url.includes('api.pantypost.com')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }
  
  // If it's a placeholder URL, return it as is
  if (url.startsWith('https://via.placeholder.com')) {
    return url;
  }
  
  // If it starts with /uploads/, prepend the API base URL
  if (url.startsWith('/uploads/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pantypost.com';
    return `${apiBase}${url}`;
  }
  
  // For any other relative path, prepend the API base
  if (url.startsWith('/')) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pantypost.com';
    return `${apiBase}${url}`;
  }
  
  // Return as is for other cases
  return url;
};

/**
 * Resolve relative file paths (e.g., "/uploads/xyz.jpg") to an absolute backend URL.
 * This assumes NEXT_PUBLIC_API_BASE_URL looks like "http://localhost:5000/api" in dev
 * and strips the trailing "/api" for static files.
 */
export function resolveApiUrlLegacy(path?: string | null): string | null {
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

  // Already http(s) — accept but force HTTPS for api.pantypost.com
  if (/^https?:\/\//i.test(input)) {
    if (input.includes('api.pantypost.com')) {
      return input.replace('http://', 'https://');
    }
    return input;
  }

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
