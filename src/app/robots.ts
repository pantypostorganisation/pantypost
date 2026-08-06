// src/app/robots.ts
import { MetadataRoute } from 'next';

/* =====================================================================
   LIKE sitemap.ts, THIS HAD NEVER BEEN SERVED.

   `public/robots.txt` existed as a static file and shadowed this route.
   That file has been removed, so this is now what crawlers actually get.

   Two things changed while making it live:

   1. The separate Googlebot group is gone. A crawler obeys only the most
      specific group that matches it, so Googlebot was reading its own
      block and ignoring the `*` one entirely — which meant Googlebot was
      permitted to crawl /buyers/profile, /sellers/messages,
      /purchase-success and the rest of the signed-in surface that we
      deliberately block for everyone else. Those pages render an empty
      or sign-in state to a crawler: thin, duplicated, and competing with
      the pages we do want indexed. With no Googlebot group, Googlebot
      falls through to `*` and gets the same rules as everybody.

   2. The old static file blocked AhrefsBot, SemrushBot and MJ12bot, and
      set Crawl-delay: 1. Neither is carried over. Crawl-delay is ignored
      by Google outright, and blocking SEO crawlers only hides us from
      competitor research — it does nothing for rankings, and it also
      means those tools cannot audit our own site. Add them back if you
      would rather not appear in competitors' tooling.
   ===================================================================== */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/wallet/',
          '/*?token=*',
          '/*?session=*',
          '/reset-password*',
          '/verify-reset-code*',
          '/verify-email*',
          '/messages/',
          '/buyers/dashboard',
          '/buyers/messages',
          '/buyers/profile',
          '/buyers/my-orders',
          '/sellers/dashboard',
          '/sellers/subscribers',
          '/sellers/my-listings',
          '/sellers/messages',
          '/sellers/profile',
          '/sellers/orders-to-fulfil',
          '/sellers/verify',
          '/test-auth',
          '/maintenance',
          '/offline',
          '/purchase-success',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
