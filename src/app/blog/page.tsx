// src/app/blog/page.tsx
//
// Server component, deliberately. No 'use client': this page has no
// interactivity, so the whole thing reaches a crawler as real HTML and
// per-page metadata comes for free. Same pattern as src/app/help/page.tsx.
//
// WHY THIS PAGE EXISTS
//
// /blog was a hard 404. The two guides underneath it existed but nothing
// on the site linked to them, so they were orphans: Google crawled both
// in April and chose not to index either. A page with no internal links
// reads as unimportant, and gets deprioritised accordingly.
//
// This is also the only surface that can rank BEFORE there is inventory.
// Adult marketplaces are banned from Google, Meta and TikTok ads, so
// organic is the entire available channel -- and guides are what can earn
// position while the marketplace itself is still filling up.

import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Clock } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

export const metadata: Metadata = {
  title: 'Guides',
  description:
    'Practical guides to buying and selling used panties online safely and anonymously. Getting started, pricing, discreet shipping, staying anonymous, and avoiding scams.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Guides | PantyPost',
    description:
      'Practical guides to buying and selling used panties online safely and anonymously.',
    url: `${BASE_URL}/blog`,
    type: 'website',
  },
};

/* The posts, listed newest first.
 *
 * A plain array rather than a CMS or filesystem scan: there are two
 * posts. Adding the third is one object here plus a folder, which is
 * less work than maintaining machinery to avoid it. Worth revisiting at
 * around a dozen. */
const POSTS = [
  {
    slug: 'is-it-legal-to-sell-used-panties-in-the-us',
    title: 'Is It Legal to Sell Used Panties in the US?',
    description:
      'Yes - and here is exactly what US sellers need to know: the age rule, taxes, shipping, and how to sell safely in 2026.',
    published: '2026-08-20',
    publishedLabel: 'August 2026',
    readingMinutes: 8,
    audience: 'For sellers',
  },
  {
    slug: 'is-it-legal-to-sell-used-panties-in-the-uk',
    title: 'Is It Legal to Sell Used Panties in the UK?',
    description:
      'Yes - what UK sellers need to know about the law, HMRC and the 1,000 pound trading allowance, Royal Mail and selling safely.',
    published: '2026-08-20',
    publishedLabel: 'August 2026',
    readingMinutes: 8,
    audience: 'For sellers',
  },
  {
    slug: 'is-it-legal-to-sell-used-panties-in-australia',
    title: 'Is It Legal to Sell Used Panties in Australia?',
    description:
      'Yes - what Australian sellers need to know about the law, the ATO, Australia Post and selling safely on an Australian-operated platform.',
    published: '2026-08-20',
    publishedLabel: 'August 2026',
    readingMinutes: 8,
    audience: 'For sellers',
  },
  {
    slug: 'is-it-legal-to-sell-used-panties-in-canada',
    title: 'Is It Legal to Sell Used Panties in Canada?',
    description:
      'Yes - what Canadian sellers need to know about the law, the CRA, Canada Post and cross-border shipping in 2026.',
    published: '2026-08-20',
    publishedLabel: 'August 2026',
    readingMinutes: 8,
    audience: 'For sellers',
  },
  {
    slug: 'how-to-buy-used-panties-online-guide',
    title: 'The Complete Guide to Buying Used Panties Online',
    description:
      'Everything you need to know about buying used panties safely and discreetly -- how listings work, what to look for in a seller, payment safety and delivery.',
    published: '2025-10-15',
    publishedLabel: 'October 2025',
    readingMinutes: 12,
    audience: 'For buyers',
  },
  {
    slug: 'how-to-sell-used-panties-online-guide',
    title: 'How to Sell Used Panties Online',
    description:
      'The complete guide to starting, growing and succeeding as a seller -- pricing, photography, staying anonymous, discreet shipping and what actually sells.',
    published: '2025-01-15',
    publishedLabel: 'January 2025',
    readingMinutes: 15,
    audience: 'For sellers',
  },
];

export default function BlogIndexPage() {
  /* JSON-LD as an inline script in a server component.
     src/components/SEO/StructuredData.tsx is dead code -- it uses
     next/head, a Pages Router API that is a no-op in the App Router, so
     it emits nothing wherever it is used. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'PantyPost Guides',
    description:
      'Practical guides to buying and selling used panties online safely and anonymously.',
    url: `${BASE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'PantyPost',
      url: BASE_URL,
    },
    blogPost: POSTS.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.published,
      url: `${BASE_URL}/blog/${post.slug}`,
      author: { '@type': 'Organization', name: 'PantyPost' },
    })),
  };

  return (
    <main className="min-h-screen bg-surface text-white">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Guides</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Straight answers on buying and selling used underwear online -- how it works, how to
            stay anonymous, how to price, and how to ship discreetly.
          </p>
        </header>

        <ul className="divide-y divide-line border-y border-line">
          {POSTS.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-2 py-6 transition-colors"
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  {post.audience}
                </span>

                <h2 className="text-xl font-bold text-white transition-colors group-hover:text-primary sm:text-2xl">
                  {post.title}
                </h2>

                <p className="text-sm leading-relaxed text-ink-muted">{post.description}</p>

                <span className="mt-1 flex items-center gap-3 text-xs text-ink-faint">
                  <time dateTime={post.published}>{post.publishedLabel}</time>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {post.readingMinutes} min read
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Every guide should end somewhere. The whole point of ranking
            for "how to sell used panties" is that the reader can then
            start doing it. */}
        <section className="mt-12 rounded-lg border border-line bg-surface-raised p-6 text-center">
          <h2 className="text-lg font-bold text-white">Ready to start selling?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            Sellers keep 90% of every sale. Verification takes minutes and your first listing can go
            up the same day.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold transition-colors hover:bg-primary-hover active:bg-primary-press"
            style={{ color: '#000' }}
          >
            {/* The label is wrapped in a span carrying text-black.
                globals.css declares `a { color: var(--color-primary) }`
                OUTSIDE any cascade layer, and unlayered rules beat
                layered ones -- so a Tailwind text-* utility on the <a>
                itself loses, and the button renders orange on orange.
                Nothing unlayered targets span. See design-system-notes. */}
            <span className="text-black">Create a seller account</span>
            <ArrowRight className="h-4 w-4 text-black" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}


