#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const PUBLIC_ROUTES = [
  { loc: '/', priority: 1.0 },
  { loc: '/browse', priority: 0.7 },
  { loc: '/about', priority: 0.7 },
  { loc: '/faq', priority: 0.7 },
];

const API_ENDPOINTS = {
  sellers: 'https://pantypost.com/api/users?role=seller&limit=1000',
  listings: 'https://pantypost.com/api/listings?public=true&limit=2000',
};

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

function formatUrl(loc, priority, lastmod, changefreq = 'weekly') {
  const siteUrl = new URL(loc, 'https://pantypost.com');
  return `    <url>\n      <loc>${siteUrl.href.replace(/\/$/, '') || siteUrl.href}</loc>\n      <lastmod>${lastmod}</lastmod>\n      <changefreq>${changefreq}</changefreq>\n      <priority>${priority.toFixed(1)}</priority>\n    </url>`;
}

async function fetchJson(url, description) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PantyPost Sitemap Generator/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`${description} request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${description}:`, error.message);
    return null;
  }
}

async function loadSellers() {
  const data = await fetchJson(API_ENDPOINTS.sellers, 'seller data');
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.users)) {
    return data.users;
  }

  console.warn('Unexpected seller response format.');
  return [];
}

async function loadListings() {
  const data = await fetchJson(API_ENDPOINTS.listings, 'listing data');
  if (!data) return [];

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.listings)) {
    return data.listings;
  }

  console.warn('Unexpected listing response format.');
  return [];
}

async function generateSitemap() {
  const lastmod = new Date().toISOString();

  const [sellers, listings] = await Promise.all([loadSellers(), loadListings()]);

  const entries = [];

  for (const route of PUBLIC_ROUTES) {
    entries.push(formatUrl(route.loc, route.priority, lastmod));
  }

  for (const seller of sellers) {
    const username = seller?.username || seller?.handle || seller?.slug;
    if (!username) {
      continue;
    }
    entries.push(formatUrl(`/sellers/${encodeURIComponent(username)}`, 0.9, lastmod));
  }

  for (const listing of listings) {
    const id = listing?.id || listing?._id;
    if (!id) {
      continue;
    }
    entries.push(formatUrl(`/listings/${encodeURIComponent(id)}`, 0.8, lastmod));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${entries.join('\n')}\n` +
    `</urlset>\n`;

  try {
    await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await fs.unlink(OUTPUT_PATH).catch(() => {});
    await fs.writeFile(OUTPUT_PATH, xml, 'utf8');
    console.log(`Sitemap generated with ${entries.length} entries at ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Failed to write sitemap:', error.message);
    process.exitCode = 1;
  }
}

(async () => {
  try {
    await generateSitemap();
  } catch (error) {
    console.error('Unexpected error while generating sitemap:', error);
    process.exitCode = 1;
  }
})();
