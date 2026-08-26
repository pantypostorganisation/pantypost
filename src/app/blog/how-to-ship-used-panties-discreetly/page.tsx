// src/app/blog/how-to-ship-used-panties-discreetly/page.tsx
//
// Seller-intent guide. Same rules as the legality set: informational,
// image-free, deliberately NOT tagged adult so it ranks under
// SafeSearch, cross-linked into the guide mesh, plain ASCII throughout
// (this repo corrupts multi-byte characters in tooling round-trips).

import type { Metadata } from 'next';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

export const metadata: Metadata = {
  title: 'How to Ship Used Panties Discreetly: The Complete 2026 Guide',
  description:
    'Packaging that preserves the product, plain mailers that protect your privacy, honest customs declarations, and the tracking habit that protects you from disputes.',
  alternates: { canonical: '/blog/how-to-ship-used-panties-discreetly' },
  openGraph: {
    title: 'How to Ship Used Panties Discreetly: The Complete 2026 Guide',
    description:
      'Packaging that preserves the product, plain mailers that protect your privacy, honest customs declarations, and the tracking habit that protects you from disputes.',
    url: `${BASE_URL}/blog/how-to-ship-used-panties-discreetly`,
    type: 'article',
    publishedTime: '2026-08-26',
    modifiedTime: '2026-08-26',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How to Ship Used Panties Discreetly: The Complete 2026 Guide',
  description:
    'Packaging that preserves the product, plain mailers that protect your privacy, honest customs declarations, and the tracking habit that protects you from disputes.',
  url: `${BASE_URL}/blog/how-to-ship-used-panties-discreetly`,
  mainEntityOfPage: `${BASE_URL}/blog/how-to-ship-used-panties-discreetly`,
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
      name: 'Do I have to put my real name on the package?',
      acceptedAnswer: { '@type': 'Answer', text: 'Use your initials or just a surname as the sender - postal services need a functional return address, not your full legal identity on display. Many sellers use a PO box for complete separation from their home address.' },
    },
    {
      '@type': 'Question',
      name: 'What do I write on customs forms?',
      acceptedAnswer: { '@type': 'Answer', text: 'The truth, simply: "clothing" is accurate, honest, and all that is required. Never mislabel contents - an honest one-word description protects you; a false one creates the only real legal risk in the whole process.' },
    },
    {
      '@type': 'Question',
      name: 'Should I use tracked shipping?',
      acceptedAnswer: { '@type': 'Answer', text: 'Always. Tracking costs little and is your proof of fulfilment if a buyer ever disputes an order. Sellers who ship untracked are gambling their earnings on trust.' },
    },
  ],
} as const;

export default function ShippingGuidePage() {
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
            How to Ship Used Panties Discreetly
          </h1>
          <p className="text-ink-muted text-lg">
            Preserve the product, protect your privacy, and never give a buyer - or a customs
            officer - a reason to raise an eyebrow.
          </p>
          <div className="flex gap-4 mt-6 text-sm text-ink-faint">
            <span>Published August 2026</span>
            <span>7 min read</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">

        <section className="mb-12 bg-surface-raised border border-primary/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-3 text-white">The three rules</h2>
          <p className="text-ink-muted">
            Everything about shipping in this market reduces to three rules: seal the item so
            it arrives as intended, make the outside of the parcel boring, and be honest on
            anything official. Do those three and shipping is the easiest part of the whole
            business.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Step 1: Seal the product properly</h2>
          <p className="text-ink-muted mb-4">
            The inner seal is what buyers are actually paying for. Standard practice: place
            the item in a zip-seal bag, press the air out, and seal it as soon as possible -
            many sellers double-bag or vacuum-seal for longer transits. The goal is that what
            the buyer opens is what you packed, unchanged by three days in a mail van.
          </p>
          <p className="text-ink-muted mb-4">
            Skip perfumes or additions - buyers in this market are paying for authenticity,
            and seasoned ones can tell. Authentic and well-sealed beats embellished every
            time, and your reviews will reflect it.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Step 2: Make the outside boring</h2>
          <p className="text-ink-muted mb-4">
            The sealed bag goes inside a plain padded mailer - no branding, no stickers, no
            hints. From the outside, your parcel should be indistinguishable from a phone
            case ordered online. That is what "discreet" actually means: not suspicious-plain,
            just ordinary.
          </p>
          <p className="text-ink-muted mb-4">
            For the sender field, use your initials or a surname rather than your full name,
            and consider a PO box if you want complete separation from your home address.
            Buyers on Panty Post never see your address at all - the platform shows them your
            username, nothing else.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Step 3: Be honest on anything official</h2>
          <p className="text-ink-muted mb-4">
            Domestic parcels need nothing declared. International parcels need a customs form,
            and the answer is one honest word: "clothing". It is accurate, it is sufficient,
            and it attracts zero attention. The only way to create a real problem with
            shipping is to lie on that form - so do not.
          </p>
          <p className="text-ink-muted mb-4">
            Country specifics - postal services, taxes, and the law - are covered in our
            country guides:{' '}
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-the-us" className="text-primary hover:underline">US</Link>,{' '}
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-the-uk" className="text-primary hover:underline">UK</Link>,{' '}
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-australia" className="text-primary hover:underline">Australia</Link> and{' '}
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-canada" className="text-primary hover:underline">Canada</Link>.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Step 4: Track everything</h2>
          <p className="text-ink-muted mb-4">
            Tracked postage is your insurance policy. If a buyer ever claims non-delivery,
            the tracking number is the entire conversation. Fold its small cost into your
            pricing and never ship without it - on Panty Post, marking an order shipped with
            tracking is also what keeps your fulfilment record clean.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Quick answers</h2>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Do I have to put my real name on the package?</h3>
            <p className="text-ink-muted">Use your initials or just a surname as the sender - postal services need a functional return address, not your full legal identity on display. Many sellers use a PO box for complete separation from their home address.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">What do I write on customs forms?</h3>
            <p className="text-ink-muted">The truth, simply: "clothing" is accurate, honest, and all that is required. Never mislabel contents - an honest one-word description protects you; a false one creates the only real legal risk in the whole process.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Should I use tracked shipping?</h3>
            <p className="text-ink-muted">Always. Tracking costs little and is your proof of fulfilment if a buyer ever disputes an order. Sellers who ship untracked are gambling their earnings on trust.</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-white">Keep reading</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/blog/how-to-sell-used-panties-online-guide" className="text-primary hover:underline">
              The complete guide to selling
            </Link>
            <Link href="/blog/how-much-money-can-you-make-selling-used-panties" className="text-primary hover:underline">
              How much can you make?
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
            General information as of August 2026. Postal rules change; when in doubt, check
            your carrier.
          </p>
        </div>
      </div>
    </article>
  );
}
