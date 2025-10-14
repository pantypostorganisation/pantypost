// src/app/robots.ts
import { MetadataRoute } from 'next';

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
          '/sellers/dashboard',
          '/sellers/subscribers',
          '/sellers/mylistings',
          '/sellers/create-listing',
          '/sellers/messages',
        ],
      },
      {
        // Google bot specific rules
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/wallet/',
          '/*?token=*',
          '/messages/',
        ],
      },
      {
        // Bing bot specific rules
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/wallet/',
          '/messages/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}