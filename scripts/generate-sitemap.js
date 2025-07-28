// scripts/generate-sitemap.js

const { writeFileSync } = require('fs');
const { globby } = require('globby');
const prettier = require('prettier');

async function generateSitemap() {
  console.log('✅ Generating sitemap...');

  const pages = await globby([
    'src/app/**/page.tsx',
    '!src/app/**/\\[*.tsx',
    '!src/app/api',
    '!src/app/_*.tsx',
    '!src/app/admin/**',
    '!src/app/dashboard/**'
  ]);

  const sitemap = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map((page) => {
          const path = page
            .replace('src/app', '')
            .replace('/page.tsx', '')
            .replace('/index', '');
          const route = path === '' ? '' : path;
          const priority = route === '' ? '1.0' : route.includes('browse') ? '0.9' : '0.8';

          return `
            <url>
              <loc>${process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com'}${route}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>${route === '' ? 'daily' : 'weekly'}</changefreq>
              <priority>${priority}</priority>
            </url>
          `;
        })
        .join('')}
    </urlset>
  `;

  const formatted = await prettier.format(sitemap, {
    parser: 'html',
  });

  writeFileSync('public/sitemap.xml', formatted);
  console.log('✅ Sitemap generated successfully');
}

generateSitemap().catch(console.error);