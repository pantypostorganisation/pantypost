// src/app/blog/is-it-legal-to-sell-used-panties-in-the-uk/page.tsx
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
  title: 'Is It Legal to Sell Used Panties in the UK? (2026 Guide)',
  description:
    'Yes - selling used panties is legal in the UK for adults. What UK sellers need to know about age rules, HMRC and the trading allowance, Royal Mail and staying safe.',
  alternates: {
    canonical: '/blog/is-it-legal-to-sell-used-panties-in-the-uk',
    languages: {
      'en-US': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-us`,
      'en-GB': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-uk`,
      'en-AU': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-australia`,
      'en-CA': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-canada`,
      'x-default': `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-us`,
    },
  },
  openGraph: {
    title: 'Is It Legal to Sell Used Panties in the UK? (2026 Guide)',
    description:
      'Yes - selling used panties is legal in the UK for adults. What UK sellers need to know about age rules, HMRC and the trading allowance, Royal Mail and staying safe.',
    url: `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-uk`,
    type: 'article',
    publishedTime: '2026-08-20',
    modifiedTime: '2026-08-20',
  },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Is It Legal to Sell Used Panties in the UK? (2026 Guide)',
  description:
    'Yes - selling used panties is legal in the UK for adults. What UK sellers need to know about age rules, HMRC and the trading allowance, Royal Mail and staying safe.',
  url: `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-uk`,
  mainEntityOfPage: `${BASE_URL}/blog/is-it-legal-to-sell-used-panties-in-the-uk`,
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
      name: 'Do I need to tell HMRC about my earnings?',
      acceptedAnswer: { '@type': 'Answer', text: 'Only once you earn more than the 1,000 pound trading allowance in a tax year. Below that, casual selling income does not need to be reported; above it, you register for Self Assessment.' },
    },
    {
      '@type': 'Question',
      name: 'How old do I have to be to sell in the UK?',
      acceptedAnswer: { '@type': 'Answer', text: 'Eighteen. UK law now requires adult platforms to verify age robustly, so expect a proper identity check before you can list - that check is what keeps the marketplace legal and safe.' },
    },
    {
      '@type': 'Question',
      name: 'Is it legal to post worn underwear?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. It is second-hand clothing as far as Royal Mail is concerned. Seal it, pack it plainly, and declare international parcels honestly.' },
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
            Is It Legal to Sell Used Panties in the UK?
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
            Selling your own worn underwear to another consenting adult is legal in the UK.
            What the law cares about is not the garment - it is that everyone involved is an
            adult, that income is handled honestly, and that anything you post is declared
            truthfully. This guide covers each of those, plus the practical rules that keep
            you safe while you sell.
          </p>
        </section>

        {/* What the law actually says */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">What the law actually says</h2>
          <p className="text-ink-muted mb-4">Selling your own worn underwear to another consenting adult is legal in the United Kingdom. There is no law that prohibits it - a used garment is second-hand clothing in the eyes of the law, not adult material.</p>
          <p className="text-ink-muted mb-4">The Online Safety Act, which came into force for adult services in 2025, regulates the platforms you sell through rather than you as a seller. It is why serious marketplaces now verify the age of everyone involved - and it is a reason to sell through a platform that takes those checks seriously rather than through unmoderated channels, because the compliant route is also the one that protects you.</p>
          <p className="text-ink-muted mb-4">As everywhere: both parties must be adults, earnings can be taxable, and parcels must be honestly described. Meet those three and you are fully within the law.</p>
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
          <p className="text-ink-muted mb-4">HMRC gives every individual a trading allowance: you can earn up to 1,000 pounds in a tax year from casual self-employment before you need to register or report it. Cross that line and you register for Self Assessment and declare the income like any side business. Either way, keep a simple record of sales from the start - it is the difference between a five-minute tax job and an anxious one.</p>
          <p className="text-ink-faint text-sm">
            This is general information, not tax advice - for your specific situation,
            a local accountant is worth one short conversation.
          </p>
        </section>

        {/* Shipping */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-white">Shipping: plain, sealed, honest</h2>
          <p className="text-ink-muted mb-4">Royal Mail does not prohibit posting worn clothing. Use sealed, plain packaging with nothing on the outside that hints at the contents. For international orders the customs declaration must be truthful - "clothing" is both honest and sufficient.</p>
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
            <h3 className="text-lg font-semibold text-white mb-2">Do I need to tell HMRC about my earnings?</h3>
            <p className="text-ink-muted">Only once you earn more than the 1,000 pound trading allowance in a tax year. Below that, casual selling income does not need to be reported; above it, you register for Self Assessment.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">How old do I have to be to sell in the UK?</h3>
            <p className="text-ink-muted">Eighteen. UK law now requires adult platforms to verify age robustly, so expect a proper identity check before you can list - that check is what keeps the marketplace legal and safe.</p>
          </div>
          <div className="bg-surface-raised border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Is it legal to post worn underwear?</h3>
            <p className="text-ink-muted">Yes. It is second-hand clothing as far as Royal Mail is concerned. Seal it, pack it plainly, and declare international parcels honestly.</p>
          </div>
        </section>

        {/* Other countries */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-white">Selling from somewhere else?</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-the-us" className="text-primary hover:underline">
              Selling in the US
            </Link>
            <Link href="/blog/is-it-legal-to-sell-used-panties-in-australia" className="text-primary hover:underline">
              Selling in Australia
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
