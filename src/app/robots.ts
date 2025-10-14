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
      {
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
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}