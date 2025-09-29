// src/app/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin proxy for "GET /profile".
 * Forwards to: {API_BASE}/users/me/profile
 * - Avoids CORS and SW redirect issues when client code calls fetch('/profile').
 * - Requires Authorization: Bearer <token> header (we forward it as-is).
 */
export async function GET(request: NextRequest) {
  try {
    // Grab Authorization header from the incoming request
    const auth = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!auth) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized: missing Authorization header' } },
        { status: 401 }
      );
    }

    // Resolve API base (env must be absolute URL, e.g. https://api.pantypost.com/api)
    const rawBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_BASE_URL ||
      'https://api.pantypost.com/api';

    const apiBase = rawBase.replace(/\/+$/, ''); // strip trailing slashes
    const target = `${apiBase}/users/me/profile`;

    // Forward the request to backend
    const upstream = await fetch(target, {
      method: 'GET',
      // Forward only necessary headers
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        // You can forward more headers if needed
      },
      // Let upstream follow redirects itself
      redirect: 'follow',
      // Do not send credentials/cookies cross-origin
    });

    // Try to read JSON; if empty, return a minimal shape
    let data: any = null;
    try {
      data = await upstream.json();
    } catch {
      // some backends can 204; normalize to minimal success=false on errors
      data = null;
    }

    // Pass through status & JSON (if any)
    if (data != null) {
      return NextResponse.json(data, { status: upstream.status });
    }
    // If no JSON, still mirror status
    return new NextResponse(null, { status: upstream.status });
  } catch (err) {
    console.error('[route:/profile] Proxy error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Proxy failed' } },
      { status: 502 }
    );
  }
}
