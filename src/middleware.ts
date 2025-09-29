// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware runs before routing. We use it to:
 * 1) Normalize common typo URLs for buyer profiles:
 *    - /buyers[username]      -> /buyers/username
 *    - /buyers<username>      -> /buyers/username
 *    - /buyersusername        -> /buyers/username
 * 2) Redirect accidental API-like calls hitting frontend-origin:
 *    - /profile (frontend)    -> {API_BASE}/users/me/profile (backend)
 * 3) Preserve no-cache hint header.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname, search } = url;

  // --- 1) Normalize /buyers[...] to /buyers/... ---
  // Example: /buyers[gerome] -> /buyers/gerome
  const bracketMatch = pathname.match(/^\/buyers\[([^\]/?#]+)\]\/?$/);
  if (bracketMatch) {
    const uname = bracketMatch[1];
    url.pathname = `/buyers/${uname}`;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // --- 1b) Normalize missing-slash form: /buyersgerome -> /buyers/gerome
  const noSlashMatch = pathname.match(/^\/buyers(?!\/)([^/?#]+)(\/.*)?$/);
  if (noSlashMatch) {
    const uname = noSlashMatch[1];
    const tail = noSlashMatch[2] || '';
    url.pathname = `/buyers/${uname}${tail}`;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // --- 2) Redirect accidental frontend-origin API call: /profile -> {API_BASE}/users/me/profile ---
  // We only touch EXACT /profile (optionally with trailing slash) so real pages like /buyers/profile remain intact.
  if (/^\/profile\/?$/.test(pathname)) {
    // Prefer NEXT_PUBLIC_API_BASE_URL; fall back to a sensible prod default.
    const configured = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    // Ensure absolute base (middleware cannot safely proxy to a relative target).
    const absoluteApiBase = configured && /^https?:\/\//i.test(configured)
      ? configured.replace(/\/+$/, '')
      : 'https://api.pantypost.com/api';

    const target = `${absoluteApiBase}/users/me/profile${search || ''}`;
    return NextResponse.redirect(target, 308);
  }

  // --- 3) Default: continue request and hint no-cache for edge/middleware path ---
  const response = NextResponse.next();
  response.headers.set('x-middleware-cache', 'no-cache');
  return response;
}

export const config = {
  matcher: '/:path*',
};
