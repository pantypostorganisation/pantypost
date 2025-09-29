// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware runs before routing. We use it to:
 * 1) Normalize common typo URLs for buyer profiles:
 *    - /buyers[username]      -> /buyers/username
 *    - /buyersusername        -> /buyers/username
 * 2) Preserve no-cache hint header.
 *
 * NOTE: We intentionally DO NOT touch /profile anymore.
 *       /profile is now handled by a route handler (server proxy).
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname, search } = url;

  // --- Normalize /buyers[...] -> /buyers/<username> ---
  const bracketMatch = pathname.match(/^\/buyers\[([^\]/?#]+)\]\/?$/);
  if (bracketMatch) {
    const uname = bracketMatch[1];
    url.pathname = `/buyers/${uname}`;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // --- Normalize /buyers<username> (no slash) -> /buyers/<username> ---
  const noSlashMatch = pathname.match(/^\/buyers(?!\/)([^/?#]+)(\/.*)?$/);
  if (noSlashMatch) {
    const uname = noSlashMatch[1];
    const tail = noSlashMatch[2] || '';
    url.pathname = `/buyers/${uname}${tail}`;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  // Default: continue
  const response = NextResponse.next();
  response.headers.set('x-middleware-cache', 'no-cache');
  return response;
}

export const config = {
  matcher: '/:path*',
};
