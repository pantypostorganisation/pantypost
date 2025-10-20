/* public/sw.js */

/* ---------- SW version (BUMP THIS to force update) ---------- */
const SW_VERSION = 'pp-sw-v8'; // ← BUMPED for favicon change

/* ---------- Cache names ---------- */
const STATIC_CACHE = `${SW_VERSION}-static`;
const HTML_CACHE   = `${SW_VERSION}-html`;

/* ---------- What to cache ---------- */
const STATIC_ASSET_PATTERNS = [
  /^\/_next\/static\//,
  /^\/icons?\//,
  /^\/images?\//,
  /^\/manifest\.json$/,
  /^\/favicon\.(ico|png)$/,  // Updated to match both .ico and .png
];

/* Utility: check if request is same-origin */
function isSameOrigin(url) {
  return new URL(url, self.location.href).origin === self.location.origin;
}

/* Utility: should we cache this request as a static asset? */
function isStaticAsset(req) {
  const url = new URL(req.url);
  return STATIC_ASSET_PATTERNS.some((rx) => rx.test(url.pathname));
}

/* Utility: skip caching/responding for API & cross-origin */
function isApiOrCrossOrigin(req) {
  const url = new URL(req.url);
  // Skip any cross-origin request (e.g., https://api.pantypost.com/*)
  if (!isSameOrigin(url.href)) return true;
  // Skip any same-origin API route (proxied or native)
  if (url.pathname.startsWith('/api/')) return true;
  return false;
}

/* ---------- Install: pre-cache nothing heavy ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // Pre-cache essential files including new favicon
    await cache.addAll(['/manifest.json', '/favicon.png'].filter(Boolean));
    self.skipWaiting();
  })());
});

/* ---------- Activate: clean old caches ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => !k.startsWith(SW_VERSION))
        .map((k) => caches.delete(k))
    );
    // Take control immediately
    await self.clients.claim();
  })());
});

/* ---------- Fetch strategy ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Never intercept API or cross-origin requests
  if (isApiOrCrossOrigin(req)) return;

  // 2) For navigation requests (HTML): network-first, fallback to cache
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  // 3) For static assets: cache-first
  if (isStaticAsset(req)) {
    event.respondWith(cacheFirstStatic(req));
    return;
  }

  // 4) Default: pass-through
  // (You can choose a strategy here if needed; we simply let it go to network)
});

/* ---------- Strategies ---------- */
async function networkFirstHtml(req) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const fresh = await fetch(req);
    // Cache only successful responses
    if (fresh && fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    // As a last resort, try to serve the app shell (root)
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

async function cacheFirstStatic(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}
