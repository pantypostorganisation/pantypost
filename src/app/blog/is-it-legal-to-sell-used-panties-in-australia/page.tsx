// src/app/blog/is-it-legal-to-sell-used-panties-in-australia/page.tsx
//
// One of four country legality guides (US / UK / AU / CA). These are
// the seller-intent pages the SEO plan is built on: informational,
// image-free and deliberately NOT tagged adult, so they rank for
// searchers with SafeSearch on -- where the product pages cannot.
// The four cross-reference each other via hreflang alternates below.
// All text is plain ASCII on purpose: this repo has a history of
// tooling round-trips corrupting multi-byte characters.

import type { Metadata } from 'next';
import Link from 'next/link';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

export const metadata: Metadata = {
  title: 'Is It Legal to Sell Used Panties in Australia? (2026 Guide)',
  description:
    'Yes - selling used panties is legal in Australia for adults. What Australian sellers need to know about age rules, the ATO, Australia Post and staying safe in 2026.',
  alternates: {
    canonical: '/blog/is-it-legal-to-sell-used-panties-in-australia',
    languages: {
      'en-US': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-us`,
      'en-GB': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-uk`,
      'en-AU': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-australia`,
      'en-CA': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-canada`,
      'x-default': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-us`,
    },
  },
  openGraph: {
    title: 'Is It Legal to Sell Used Panties in Australia? (2026 Guide)',
    description:
      'Yes - selling used panties is legal in Australia for adults. What Australian sellers need to know about age rules, the ATO, Australia Post and staying safe in 2026.',
    url: `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-australia`,
    type: 'article',
    publishedTime: '2026-08-20',
    modifiedTime: '2026-08-20',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Is It Legal to Sell Used Panties in Australia? (2026 Guide)',
  description:
    'Yes - selling used panties is legal in Australia for adults. What Australian sellers need to know about age rules, the ATO, Australia Post and staying safe in 2026.',
  url: `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-australia`,
  mainEntityOfPage: `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-australia`,
  datePublished: '2026-08-20',
  dateModified: '2026-08-20',
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
      name: 'Do I need an ABN to sell used panties in Australia?',
      acceptedAnswer: { '@type': 'Answer', text: 'Not to start selling casually. If you sell regularly enough that it becomes a business in the ATO\u2019s eyes, an ABN becomes appropriate - the same threshold at which your income becomes clearly declarable.' },
    },
    {
      '@type': 'Question',
      name: 'How old do I have to be?',
      acceptedAnswer: { '@type': 'Answer', text: 'Eighteen. Australian age-assurance rules mean legitimate platforms verify this properly - a seller who has passed identity verification is also a safer person for buyers to deal with.' },
    },
    {
      '@type': 'Question',
      name: 'Do I declare my earnings to the ATO?',
      acceptedAnswer: { '@type': 'Answer', text: 'If you sell regularly with a profit motive, yes - it is assessable income. Occasional one-off sales may be hobby income, but regular selling should be declared.' },
    },
  ],
} as const;

export default function LegalityGuidePage() {
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

      {/* Header */}
      <header className="bg-surface-raised py-12 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/blog" className="text-primary hover:underline text-sm mb-4 inline-block">
            {'\u2190'} All guides
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Is It Legal to Sell Used Panties in Australia?
          </h1>
          <p className="text-ink-muted text-lg">
            The short answer, the actual rules, and what they mean for you as a seller.
          </p>
          <div className="flex gap-4 mt-6 text-sm text-ink-faint">
            <span>Published August 2026</span>
            <span>8 min read</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* The short answer */}
        <section className="mb-12 bg-surface-raised border border-primary/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-3 text-white">The short answer: yes, it is legal</h2>
          <p className="text-ink-muted">
            Selling your own worn underwear to another consenting adult is legal in Australia.
            What the law cares about is not the garment - it is that everyone involved is an
            adult, that income is handled honestly, and that anything you post is declared
            truthfully. This guide covers each of those, plus the practical rules that keep
            you safe while you sell.
          </p>
        </section>

        {/* What the law actually says */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">What the law actually says</h2>
          <p className="text-ink-muted mb-4">Selling your own worn underwear to another consenting adult is legal in Australia. No federal or state law prohibits the sale itself - a worn garment is second-hand clothing, not restricted adult material.</p>
          <p className="text-ink-muted mb-4">Australia introduced age-assurance requirements for adult online services from 2026, and like the UK rules they apply to platforms, not to individual sellers. The practical effect for you is that legitimate marketplaces verify everyone is over 18 before anything is bought or sold - which is exactly the environment you want to be selling in.</p>
          <p className="text-ink-muted mb-4">Panty Post is operated by an Australian-registered business, which matters here: the platform is built around Australian compliance requirements rather than treating them as an afterthought.</p>
        </section>

        {/* Age */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">The one hard rule: everyone must be 18+</h2>
          <p className="text-ink-muted mb-4">
            This is the non-negotiable. Both sellers and buyers must be adults, and any
            marketplace worth using verifies that with a real identity check rather than a
            checkbox. On Panty Post, every seller completes identity and age verification
            before a single listing goes live, and every listing is reviewed by a human
            moderator before publication. That is not bureaucracy - it is the thing that
            makes the whole category legal to operate in, and it protects you as much as
            anyone.
          </p>
        </section>

        {/* Tax */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Taxes: treat it like the income it is</h2>
          <p className="text-ink-muted mb-4">The ATO draws a line between a hobby and a business: sell occasionally and irregularly and it may be hobby income, but sell regularly with the intention of making a profit and it is assessable income you must declare. Most active sellers land on the business side of that line, so the safe assumption is that your earnings are declarable. Keep records from day one.</p>
          <p className="text-ink-faint text-sm">
            This is general information, not tax advice - for your specific situation,
            a local accountant is worth one short conversation.
          </p>
        </section>

        {/* Shipping */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Shipping: plain, sealed, honest</h2>
          <p className="text-ink-muted mb-4">Australia Post does not prohibit sending worn clothing domestically or internationally. Sealed, plain packaging is the standard. International parcels need an honest customs declaration - "clothing" is accurate and sufficient.</p>
          <p className="text-ink-muted mb-4">
            For the full playbook on discreet packaging and staying anonymous while you
            ship, see the packaging section of our{' '}
            <Link href="/blog/how-to-sell-used-panties-online-guide" className="text-primary hover:underline">
              complete guide to selling
            </Link>.
          </p>
        </section>

        {/* Platform vs independent */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Selling independently vs selling on a platform</h2>
          <p className="text-ink-muted mb-4">
            Nothing stops you selling through social media or forums - but everything that
            makes this category risky lives there: no verification that a buyer is an adult,
            no payment protection, no one to turn to when someone tries a chargeback or a
            scam, and your personal accounts one mistake away from your real identity.
          </p>
          <p className="text-ink-muted mb-4">
            A dedicated marketplace exists to remove exactly those risks. On Panty Post,
            buyers pay from a prefunded wallet so card details are never shared between
            users, sellers keep 90% of every direct sale, every account is age-verified,
            and a public complaints process answers every report within five business days.
            You sell under a username; your legal identity stays between you and the
            verification process.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Quick answers</h2>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Do I need an ABN to sell used panties in Australia?</h3>
            <p className="text-ink-muted">Not to start selling casually. If you sell regularly enough that it becomes a business in the ATO\u2019s eyes, an ABN becomes appropriate - the same threshold at which your income becomes clearly declarable.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">How old do I have to be?</h3>
            <p className="text-ink-muted">Eighteen. Australian age-assurance rules mean legitimate platforms verify this properly - a seller who has passed identity verification is also a safer person for buyers to deal with.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Do I declare my earnings to the ATO?</h3>
            <p className="text-ink-muted">If you sell regularly with a profit motive, yes - it is assessable income. Occasional one-off sales may be hobby income, but regular selling should be declared.</p>
          </div>
        </section>

        {/* Other countries */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-white">Selling from somewhere else?</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-the-us" className="text-primary hover:underline">
              Selling in the US
            </Link>
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-the-uk" className="text-primary hover:underline">
              Selling in the UK
            </Link>
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-canada" className="text-primary hover:underline">
              Selling in Canada
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface-raised border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to start selling?</h2>
          <p className="text-ink-muted text-lg mb-6 max-w-2xl mx-auto">
            It is legal, it is workable, and the safest way to do it is on a platform built
            for it. Create your account, verify once, and list the same day - sellers keep
            <strong className="text-primary"> 90% of every sale</strong>.
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
            This guide is general information about selling as of August 2026, not legal
            advice. Laws change; when in doubt, check with a local professional.
          </p>
        </div>
      </div>
    </article>
  );
}
