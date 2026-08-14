// src/app/sitemap.ts
import { MetadataRoute } from 'next';

/* =====================================================================
   THIS FILE HAD NEVER BEEN SERVED.

   `public/sitemap.xml` existed as a static file, and Next serves
   everything in public/ ahead of a generated route of the same name. So
   the live sitemap was a 4-URL file last written in October 2025, two of
   whose URLs (/about and /faq) were routes that did not exist. This file,
   and robots.ts alongside it, were dead code.

   `public/sitemap.xml` and `public/robots.txt` have been removed, and
   `scripts/generate-sitemap.js` — which rewrote the static file on every
   build, from endpoints that 404 in production — has been taken out of
   the postbuild step. This is now the single source of truth.
   ===================================================================== */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com/api';

// GET /api/listings caps `limit` at Math.min(limit, 100) server-side, so
// asking for 1000 in one call silently returned 100. Page through instead.
const PAGE_SIZE = 100;
const MAX_PAGES = 20; // 2,000 listings; raise when we outgrow it

/**
 * Every list endpoint on this API answers
 *   { success: true, data: [...], meta: {...} }
 * The previous version of this file read `data.users` for sellers, which
 * is not a field the API has ever returned — so the sitemap contained
 * zero seller URLs even before the static file shadowed it.
 */
function unwrap(payload: unknown): any[] {
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as Record<string, unknown>;
  return Array.isArray(body.data) ? body.data : [];
}

async function fetchPage(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });

    if (!response.ok) {
      console.error(`[sitemap] ${url} responded ${response.status}`);
      return [];
    }

    return unwrap(await response.json());
  } catch (error) {
    console.error(`[sitemap] ${url} failed:`, error);
    return [];
  }
}

/** Active, approved listings. Unapproved ones are filtered server-side
 *  for unauthenticated callers, which is what we are here. */
async function getListingsForSitemap(): Promise<any[]> {
  const all: any[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await fetchPage(
      `${API_BASE}/listings?status=active&page=${page}&limit=${PAGE_SIZE}`
    );

    all.push(...batch);

    // A short page means we have reached the end.
    if (batch.length < PAGE_SIZE) break;

    if (page === MAX_PAGES) {
      console.warn(
        `[sitemap] Stopped at ${MAX_PAGES} pages (${all.length} listings). Raise MAX_PAGES.`
      );
    }
  }

  return all;
}

async function getSellersForSitemap(): Promise<any[]> {
  const all: any[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await fetchPage(
      `${API_BASE}/users?role=seller&page=${page}&limit=${PAGE_SIZE}`
    );

    all.push(...batch);

    if (batch.length < PAGE_SIZE) break;

    if (page === MAX_PAGES) {
      console.warn(
        `[sitemap] Stopped at ${MAX_PAGES} pages (${all.length} sellers). Raise MAX_PAGES.`
      );
    }
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [listings, sellers] = await Promise.all([
    getListingsForSitemap(),
    getSellersForSitemap(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/browse`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },

    // Content. These are the only pages that can rank before we have
    // inventory, so they are not an afterthought in this list.
    //
    // /blog itself was missing from here because the page did not exist
    // -- it 404'd. That also left the two guides orphaned: nothing on the
    // site linked to them, which is part of why Google crawled both and
    // declined to index either.
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    {
      url: `${BASE_URL}/blog/how-to-sell-used-panties-online-guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog/how-to-buy-used-panties-online-guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    { url: `${BASE_URL}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },

    // Compliance surfaces. Low priority for ranking, but a payment
    // processor checking whether these are real, reachable pages is a
    // better reason to list them than search traffic.
    { url: `${BASE_URL}/complaints`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/content-policy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/age-verification`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Listing detail lives at /browse/[id]. The old generator emitted
  // /listings/[id], a route that has never existed — so every listing URL
  // it produced was a 404 pointed at by our own sitemap.
  const listingPages: MetadataRoute.Sitemap = listings
    .map((listing) => listing?._id || listing?.id)
    .filter((id): id is string => Boolean(id))
    .map((id) => ({
      url: `${BASE_URL}/browse/${encodeURIComponent(String(id))}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

  const sellerPages: MetadataRoute.Sitemap = sellers
    .map((seller) => seller?.username)
    .filter((username): username is string => typeof username === 'string' && username.length > 0)
    .map((username) => ({
      url: `${BASE_URL}/sellers/${encodeURIComponent(username)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [...staticPages, ...listingPages, ...sellerPages];
}