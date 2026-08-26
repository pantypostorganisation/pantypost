// src/app/blog/how-much-money-can-you-make-selling-used-panties/page.tsx
//
// Seller-intent guide. Same rules as the legality set: informational,
// image-free, deliberately NOT tagged adult so it ranks under
// SafeSearch, cross-linked into the guide mesh, plain ASCII throughout
// (this repo corrupts multi-byte characters in tooling round-trips).
// Earnings page rule: NO fabricated income figures, NO guarantees.
// Every number on this page is the platform fee structure (verified in
// order.routes.js) or explicitly hedged community framing. Income
// claims are FTC bait and processor poison - keep it honest.

import type { Metadata } from 'next';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

export const metadata: Metadata = {
  title: 'How Much Money Can You Make Selling Used Panties? (Honest 2026 Answer)',
  description:
    'The honest answer: it varies enormously. What actually determines earnings, the exact platform math on a 90% seller cut, and realistic expectations for new sellers in 2026.',
  alternates: { canonical: '/blog/how-much-money-can-you-make-selling-used-panties' },
  openGraph: {
    title: 'How Much Money Can You Make Selling Used Panties? (Honest 2026 Answer)',
    description:
      'The honest answer: it varies enormously. What actually determines earnings, the exact platform math on a 90% seller cut, and realistic expectations for new sellers in 2026.',
    url: `${BASE_URL}/blog/how-much-money-can-you-make-selling-used-panties`,
    type: 'article',
    publishedTime: '2026-08-26',
    modifiedTime: '2026-08-26',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How Much Money Can You Make Selling Used Panties? (Honest 2026 Answer)',
  description:
    'The honest answer: it varies enormously. What actually determines earnings, the exact platform math on a 90% seller cut, and realistic expectations for new sellers in 2026.',
  url: `${BASE_URL}/blog/how-much-money-can-you-make-selling-used-panties`,
  mainEntityOfPage: `${BASE_URL}/blog/how-much-money-can-you-make-selling-used-panties`,
  datePublished: '2026-08-26',
  dateModified: '2026-08-26',
  image: `${BASE_URL}/og-image.png`,
  author: { '@type': 'Organization', name: 'PantyPost', url: BASE_URL },
  publisher: {
    '@type': 'Organization',
    name: 'PantyPost',
    url: BASE_URL,
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/icons/icon-512x512.png` },
  },
} as const;

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I really make money selling used panties?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes, real sellers earn real money - but it is a genuine side business, not free cash. Sellers who treat it seriously (good photos, regular listings, replying to buyers) earn consistently; sellers who list once and disappear rarely sell at all.' },
    },
    {
      '@type': 'Question',
      name: 'How much does the platform take?',
      acceptedAnswer: { '@type': 'Answer', text: 'On Panty Post, sellers keep 90% of every direct sale, and consistent sellers earn tier bonuses on top - up to 5% extra. Auction sales pay sellers 80% of the final bid. There are no listing fees.' },
    },
    {
      '@type': 'Question',
      name: 'How fast can I start earning?',
      acceptedAnswer: { '@type': 'Answer', text: 'You can verify and list on the same day. Your first sale depends on your listings and pricing - some sellers sell in their first week, others take longer while they build a shop buyers trust.' },
    },
  ],
} as const;

export default function EarningsGuidePage() {
  return (
    <article className="min-h-screen bg-surface text-white">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />

      <header className="bg-surface-raised py-12 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/blog" className="text-primary hover:underline text-sm mb-4 inline-block">
            {'\u2190'} All guides
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            How Much Money Can You Make Selling Used Panties?
          </h1>
          <p className="text-ink-muted text-lg">
            The honest answer - what actually drives earnings, and the exact math on what you keep.
          </p>
          <div className="flex gap-4 mt-6 text-sm text-ink-faint">
            <span>Published August 2026</span>
            <span>8 min read</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">

        <section className="mb-12 bg-surface-raised border border-primary/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-3 text-white">The honest answer: it varies enormously</h2>
          <p className="text-ink-muted mb-4">
            Anyone quoting you a guaranteed monthly figure is selling something. Real earnings
            in this market run from pocket money to a serious side income, and the difference
            is almost never luck - it is effort, consistency, and pricing. Around seller
            communities, casual sellers commonly describe earning modest side income from a
            few sales a month, while established sellers with loyal buyers, subscriptions and
            custom orders describe earning far more. Nobody serious promises you a number,
            and neither will we.
          </p>
          <p className="text-ink-muted">
            What we can give you precisely is the math on what you keep - because that part
            is not variable at all.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">The exact math: what you keep per sale</h2>
          <p className="text-ink-muted mb-4">
            On Panty Post, sellers keep <strong className="text-primary">90% of every direct sale</strong>.
            Price an item at $40 and $36 lands in your wallet. Consistent sellers climb tier
            levels that add a bonus on top of the 90% - up to 5% extra at the highest tier -
            so established sellers keep up to 95% of every sale. Auction sales pay the seller
            80% of the final bid, and auctions frequently finish above the price the same
            item would list at.
          </p>
          <p className="text-ink-muted mb-4">
            There are no listing fees and no monthly charges: if you do not sell, you do not
            pay anything. The buyer covers the platform markup at checkout on top of your
            price, so your listed price is genuinely yours.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">What actually separates high earners from everyone else</h2>
          <p className="text-ink-muted mb-4">
            <strong className="text-white">Consistency beats everything.</strong> Buyers follow
            shops that are alive - regular listings, filled-out profiles, and replies within a
            day. A shop with eight listings and a real bio dramatically outperforms a single
            listing posted once and abandoned.
          </p>
          <p className="text-ink-muted mb-4">
            <strong className="text-white">Photos sell, faces optional.</strong> Clear, well-lit
            photos of the actual item are the single biggest conversion factor. You never need
            to show your face - many top sellers never do.
          </p>
          <p className="text-ink-muted mb-4">
            <strong className="text-white">Recurring beats one-off.</strong> Subscriptions and
            custom requests are where established sellers separate from beginners: a buyer who
            subscribes to your shop or commissions a custom order is worth many one-time sales,
            and both features are built into the platform.
          </p>
          <p className="text-ink-muted mb-4">
            <strong className="text-white">Pricing with confidence.</strong> Underpricing does
            not sell faster - it signals low effort. Most sellers land in a comfortable range
            by starting mid-market and adjusting to their own demand.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Realistic expectations for your first month</h2>
          <p className="text-ink-muted mb-4">
            Expect a ramp, not a jackpot. Month one is building: verifying, photographing,
            listing several items, and learning what your buyers respond to. Some sellers make
            their first sale in days; for others it takes a few weeks of showing up. The
            sellers who report meaningful income are almost universally the ones who kept
            listing through the quiet start.
          </p>
          <p className="text-ink-faint text-sm">
            Earnings depend on your own effort, pricing and demand. Nothing on this page is a
            promise of income - anyone who promises you one is lying to you.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Quick answers</h2>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Can I really make money selling used panties?</h3>
            <p className="text-ink-muted">Yes, real sellers earn real money - but it is a genuine side business, not free cash. Sellers who treat it seriously (good photos, regular listings, replying to buyers) earn consistently; sellers who list once and disappear rarely sell at all.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">How much does the platform take?</h3>
            <p className="text-ink-muted">On Panty Post, sellers keep 90% of every direct sale, and consistent sellers earn tier bonuses on top - up to 5% extra. Auction sales pay sellers 80% of the final bid. There are no listing fees.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">How fast can I start earning?</h3>
            <p className="text-ink-muted">You can verify and list on the same day. Your first sale depends on your listings and pricing - some sellers sell in their first week, others take longer while they build a shop buyers trust.</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-white">Keep reading</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/blog/how-to-sell-used-panties-online-guide" className="text-primary hover:underline">
              The complete guide to selling
            </Link>
            <Link href="/blog/how-to-ship-used-panties-discreetly" className="text-primary hover:underline">
              How to ship discreetly
            </Link>
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-the-us" className="text-primary hover:underline">
              Is it legal? (US guide)
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface-raised border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to start selling?</h2>
          <p className="text-ink-muted text-lg mb-6 max-w-2xl mx-auto">
            Verify once, list the same day, and keep
            <strong className="text-primary"> 90% of every sale</strong> - with
            every buyer age-verified and every listing reviewed before it goes live.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-block bg-primary text-black font-semibold px-8 py-4 rounded-md hover:bg-primary-hover transition-colors"
            >
              Create Seller Account
            </Link>
            <Link
              href="/blog/how-to-sell-used-panties-online-guide"
              className="inline-block bg-white/10 text-white font-semibold px-8 py-4 rounded-md hover:bg-white/20 transition-colors border border-white/20"
            >
              Read the Selling Guide
            </Link>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-ink-faint text-sm">
            General information as of August 2026, not financial advice. Your results depend
            on you.
          </p>
        </div>
      </div>
    </article>
  );
}
