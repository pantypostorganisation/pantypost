// src/components/SEO/MetaTags.tsx
'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { z } from 'zod';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string; // ISO-8601 preferred
  modifiedTime?: string;  // ISO-8601 preferred
  tags?: string[];
  price?: {
    amount: number;
    currency: string; // ISO 4217 (e.g., USD)
  };
}

// Relaxed ISO date guard (avoids hard-failing if format varies slightly)
const isParsableDate = (v?: string) => !v || !Number.isNaN(Date.parse(v));

const MetaPropsSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(300),
  image: z.string().optional(),
  type: z.enum(['website', 'article', 'product']).optional(),
  author: z.string().optional(),
  publishedTime: z.string().refine(isParsableDate, 'Invalid date').optional(),
  modifiedTime: z.string().refine(isParsableDate, 'Invalid date').optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  price: z
    .object({
      amount: z.number().nonnegative(),
      currency: z.string().toUpperCase().regex(/^[A-Z]{3}$/, 'Currency must be 3-letter ISO 4217'),
    })
    .optional(),
});

// Build absolute URLs safely. If `candidate` is already absolute, return it.
// Otherwise, prefix with `base` (no trailing slash) and ensure a leading slash.
function makeAbsoluteUrl(base: string | undefined, candidate?: string): string | undefined {
  if (!candidate) return undefined;
  const c = candidate.trim();
  if (/^https?:\/\//i.test(c)) return c;
  if (!base) return undefined;
  const cleanBase = base.replace(/\/+$/, '');
  const path = c.startsWith('/') ? c : `/${c}`;
  return `${cleanBase}${path}`;
}

export function MetaTags(rawProps: MetaTagsProps) {
  const pathname = usePathname() || '/';

  // Parse & validate props (won’t throw; falls back to minimal safe set)
  const parsed = MetaPropsSchema.safeParse(rawProps);
  const props = parsed.success
    ? parsed.data
    : {
        title: sanitizeStrict(rawProps.title || ''),
        description: sanitizeStrict(rawProps.description || ''),
        image: rawProps.image,
        type: rawProps.type,
        author: rawProps.author,
        publishedTime: rawProps.publishedTime,
        modifiedTime: rawProps.modifiedTime,
        tags: rawProps.tags,
        price: rawProps.price,
      };

  // Resolve base URL. Prefer env; otherwise use window location (client-safe).
  const baseUrl =
    (process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '') : '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  // Canonical path should always be a path, not a full URL coming from router.
  const safePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const canonicalUrl = makeAbsoluteUrl(baseUrl, safePath);

  // Absolute OG/Twitter image if possible
  const ogImageAbs = makeAbsoluteUrl(baseUrl, props.image) || props.image || makeAbsoluteUrl(baseUrl, '/og-image.png') || '/og-image.png';

  // Sanitize text fields
  const safeTitle = sanitizeStrict(props.title).slice(0, 150);
  const safeDesc = sanitizeStrict(props.description).slice(0, 300);
  const safeAuthor = props.author ? sanitizeStrict(props.author) : undefined;

  // Sanitize/limit tags
  const safeTags = (props.tags || [])
    .slice(0, 20)
    .map((t) => sanitizeStrict(t))
    .filter(Boolean);

  // Sanitize price (only used if type === 'product')
  const priceAmount = props.price?.amount ?? undefined;
  const priceCurrency = props.price?.currency ? sanitizeStrict(props.price.currency.toUpperCase()) : undefined;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{safeTitle ? `${safeTitle} | PantyPost` : 'PantyPost'}</title>
      {safeDesc && <meta name="description" content={safeDesc} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph Tags */}
      {safeTitle && <meta property="og:title" content={safeTitle} />}
      {safeDesc && <meta property="og:description" content={safeDesc} />}
      <meta property="og:type" content={props.type || 'website'} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {ogImageAbs && <meta property="og:image" content={ogImageAbs} />}
      <meta property="og:site_name" content="PantyPost" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      {safeTitle && <meta name="twitter:title" content={safeTitle} />}
      {safeDesc && <meta name="twitter:description" content={safeDesc} />}
      {ogImageAbs && <meta name="twitter:image" content={ogImageAbs} />}

      {/* Article specific tags */}
      {props.type === 'article' && (
        <>
          {safeAuthor && <meta property="article:author" content={safeAuthor} />}
          {props.publishedTime && isParsableDate(props.publishedTime) && (
            <meta property="article:published_time" content={new Date(props.publishedTime).toISOString()} />
          )}
          {props.modifiedTime && isParsableDate(props.modifiedTime) && (
            <meta property="article:modified_time" content={new Date(props.modifiedTime).toISOString()} />
          )}
          {safeTags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Product specific tags */}
      {props.type === 'product' && typeof priceAmount === 'number' && priceCurrency && (
        <>
          <meta property="product:price:amount" content={String(priceAmount)} />
          <meta property="product:price:currency" content={priceCurrency} />
        </>
      )}

      {/* Additional SEO tags */}
      <meta name="robots" content="index,follow" />
      <meta name="googlebot" content="index,follow" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
    </Head>
  );
}
