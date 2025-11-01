// src/components/SEO/StructuredData.tsx

import Head from 'next/head';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface ProductStructuredDataProps {
  name: string;
  description: string;
  image: string; // prefer absolute URL; will be absolutized if relative
  price: number;
  currency: string; // ISO 4217, e.g., USD
  availability: 'InStock' | 'OutOfStock';
  brand: string;
  sku: string;
  rating?: {
    value: number; // 0..5 recommended
    count: number; // >=0
  };
}

// Build absolute URLs safely. If already absolute, return as is.
function makeAbsoluteUrl(base: string | undefined, candidate?: string): string | undefined {
  if (!candidate) return undefined;
  const c = candidate.trim();
  if (/^https?:\/\//i.test(c)) return c;
  if (!base) return undefined;
  const cleanBase = base.replace(/\/+$/, '');
  const path = c.startsWith('/') ? c : `/${c}`;
  return `${cleanBase}${path}`;
}

export function ProductStructuredData({
  name,
  description,
  image,
  price,
  currency,
  availability,
  brand,
  sku,
  rating,
}: ProductStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '');

  // Sanitize strings
  const safeName = sanitizeStrict(name).slice(0, 150);
  const safeDesc = sanitizeStrict(description).slice(0, 5000);
  const safeSku = sanitizeStrict(sku).slice(0, 100);
  const safeBrand = sanitizeStrict(brand).slice(0, 150);
  const safeCurrency = sanitizeStrict(currency.toUpperCase()).replace(/[^A-Z]/g, '').slice(0, 3) || 'USD';

  // Coerce numeric ranges
  const safePrice = Number.isFinite(price) && price >= 0 ? Number(price) : 0;
  const safeRatingValue =
    rating && Number.isFinite(rating.value) ? Math.max(0, Math.min(5, Number(rating.value))) : undefined;
  const safeRatingCount = rating && Number.isFinite(rating.count) && rating.count >= 0 ? Math.floor(rating.count) : undefined;

  const imageAbs = makeAbsoluteUrl(baseUrl, image) || image;

  const structuredData: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: safeName,
    description: safeDesc,
    ...(imageAbs && { image: imageAbs }),
    sku: safeSku,
    brand: {
      '@type': 'Brand',
      name: safeBrand,
    },
    offers: {
      '@type': 'Offer',
      price: safePrice,
      priceCurrency: safeCurrency,
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        name: 'Panty Post',
      },
      ...(baseUrl && { url: baseUrl }),
    },
    ...(safeRatingValue !== undefined &&
      safeRatingCount !== undefined && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: safeRatingValue,
          reviewCount: safeRatingCount,
        },
      }),
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        // JSON.stringify on sanitized values avoids XSS vectors.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}

// Organization structured data - UPDATED to use googlesearchimage.png
export function OrganizationStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || '';
  const logoAbs = makeAbsoluteUrl(baseUrl, '/googlesearchimage.png') || '/googlesearchimage.png';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Panty Post',
    ...(baseUrl && { url: baseUrl }),
    ...(logoAbs && { logo: logoAbs }),
    description: 'Premium marketplace for intimate apparel',
    sameAs: [
      'https://twitter.com/pantypost',
      'https://instagram.com/pantypost',
    ],
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </Head>
  );
}
