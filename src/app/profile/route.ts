// src/app/users/[username]/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin proxy for: GET /users/:username/profile
 * This keeps the browser request on the frontend origin (no CORS),
 * while the server forwards to the real API.
 */
function getApiBase(): string {
  // Accept both styles:
  // - NEXT_PUBLIC_API_URL: usually "https://api.pantypost.com/api"
  // - NEXT_PUBLIC_API_BASE_URL: "https://api.pantypost.com" (we'll append /api)
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:5000';

  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export async function GET(
  req: NextRequest,
  ctx: { params: { username: string } }
) {
  const username = ctx.params?.username || '';
  const apiBase = getApiBase();

  const upstreamUrl = `${apiBase}/users/${encodeURIComponent(username)}/profile`;

  // Forward Authorization (if any) so private profiles still work for the owner
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  let upstreamResp: Response;
  try {
    upstreamResp = await fetch(upstreamUrl, {
      method: 'GET',
      headers,
      // We are server-side; no cookies needed here, just forward the auth header
      // Keep redirects default; let backend decide
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: 'Upstream request failed' } },
      { status: 502 }
    );
  }

  // Try to pass through JSON safely
  const text = await upstreamResp.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Not JSON; normalize into our envelope to prevent HTML leaking to the client
    if (upstreamResp.ok) {
      body = { success: true, data: null };
    } else {
      body = { success: false, error: { message: upstreamResp.statusText || 'Request failed' } };
    }
  }

  // Mirror status code
  return NextResponse.json(body, { status: upstreamResp.status });
}
