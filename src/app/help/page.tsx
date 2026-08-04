// src/app/help/page.tsx
//
// Server component, deliberately. No 'use client' here: this page has no
// interactivity, so rendering it on the server means the whole thing
// reaches a crawler as real HTML, and we get per-page metadata for free.
//
// This is also a compliance surface. A payment processor reviewing an
// adult marketplace checks that a contact route exists, resolves, and
// names the operating entity. It was previously a hard 404 linked from
// the footer.

import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Mail,
  ShieldCheck,
  Flag,
  BadgeCheck,
  Package,
  Wallet,
  Eye,
  Lock,
  HelpCircle,
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';
const SUPPORT_EMAIL = 'support@pantypost.com';

export const metadata: Metadata = {
  title: 'Help & Contact',
  description:
    'Get help with buying and selling on Panty Post. Answers on seller verification, listing review, fees, payouts, anonymity and reporting content. Contact support at support@pantypost.com.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'Help & Contact | PantyPost',
    description:
      'Answers on seller verification, listing review, fees, payouts, anonymity and reporting content.',
    url: `${BASE_URL}/help`,
    type: 'website',
  },
};

/* =====================================================================
   NOTE ON ORANGE BUTTONS

   globals.css declares `a { color: var(--color-primary) }` outside any
   cascade layer, and Tailwind v4 puts utilities inside @layer utilities.
   Unlayered rules beat layered ones, so `text-black` on an <a> is
   discarded and the label renders orange on orange — 1:1 contrast.

   Until that rule is wrapped in @layer base, the label of any orange
   link-button goes in a child <span>, which nothing unlayered targets.
   ===================================================================== */

/* =====================================================================
   FAQ CONTENT

   Every figure below is read off the code, not estimated:
     buyer pays price x 1.10           listing.routes.js, updateListing
     seller receives 90% + tier bonus  order.routes.js, baseSellerEarnings
     auction seller receives 80%       utils/pricing.ts
     tier bonuses 1% to 5%             utils/sellerTiers.ts
     five business days on complaints  content-policy page, complaint flow
   If any of those change, change them here too.
   ===================================================================== */

type Faq = { q: string; a: React.ReactNode };

const GETTING_STARTED: Faq[] = [
  {
    q: 'What is Panty Post?',
    a: (
      <>
        Panty Post is a marketplace where verified sellers list worn intimate garments and
        buyers purchase them directly. It is a marketplace for physical items — not an
        explicit content platform. Everyone using the site must be 18 or over.
      </>
    ),
  },
  {
    q: 'Do I need to verify my age?',
    a: (
      <>
        Yes. Age assurance is handled by an independent provider and usually needs nothing more
        than a quick selfie. Your photo and any document go to that provider directly — Panty
        Post never sees or stores them. Full detail is in our{' '}
        <Link href="/age-verification">Age Verification Policy</Link>.
      </>
    ),
  },
  {
    q: 'Can I browse without an account?',
    a: (
      <>
        You can browse public listings and seller shops. Buying, messaging, subscribing and
        selling all require an account, and selling additionally requires identity
        verification.
      </>
    ),
  },
];

const SELLING: Faq[] = [
  {
    q: 'How do I start selling?',
    a: (
      <>
        Create an account as a seller, complete identity verification, then post your first
        listing. Verification requires government-issued photographic identification and is
        reviewed by a person — it confirms who you are and that you are 18 or over.{' '}
        <Link href="/signup">Create a seller account</Link>.
      </>
    ),
  },
  {
    q: 'Why is my listing not showing up?',
    a: (
      <>
        Almost always because it is still in the review queue. Panty Post reviews every listing,
        post, profile picture, cover photo and gallery image{' '}
        <strong className="text-ink">before</strong> it becomes publicly visible. Until it is
        approved it is visible only to you — it will not appear in browse, in search or on your
        shop, and it cannot be reached by a direct link.
      </>
    ),
  },
  {
    q: 'I edited a listing and it disappeared. Why?',
    a: (
      <>
        Approval covers the content that was reviewed, not the listing forever. Changing a
        title, description, tags or any image sends the listing back to the queue and withdraws
        it from public view until it is approved again. Changing price or availability does not.
        This is set out in our <Link href="/content-policy">Content Policy</Link>.
      </>
    ),
  },
  {
    q: 'What does Panty Post take?',
    a: (
      <>
        On a direct sale you receive <strong className="text-ink">90%</strong> of your listed
        price, plus your tier bonus. Buyers pay a 10% platform fee on top of your price, so your
        listed price is what you are quoting them before that fee. On an{' '}
        <strong className="text-ink">auction</strong> you receive{' '}
        <strong className="text-ink">80%</strong> of the winning bid, and the buyer pays exactly
        what they bid with nothing added.
      </>
    ),
  },
  {
    q: 'What are seller tiers?',
    a: (
      <>
        Five tiers — Tease, Flirt, Obsession, Desire and Goddess — based on your sales count or
        your total sales value, whichever gets you there first. From Flirt upwards each tier
        adds a bonus on top of your 90%, rising from 1% to 5% at Goddess. The bonus is credited
        automatically at the time of sale.
      </>
    ),
  },
  {
    q: 'How do I get paid?',
    a: (
      <>
        Earnings are credited to your Panty Post wallet as each order completes, and you
        withdraw from there. Every credit and debit is itemised in your wallet history, so the
        fee and the tier bonus on each sale are visible per order.
      </>
    ),
  },
  {
    q: 'Can I sell anonymously?',
    a: (
      <>
        Buyers see your username, your shop, and whatever you choose to put in your bio and
        gallery. They never see your legal name, email or address. Your identity documents are
        held securely for verification only and are never publicly accessible. Putting your own
        address or contact details in a listing or a message is against our{' '}
        <Link href="/content-policy">Content Policy</Link> — for your protection as much as
        anyone else&apos;s.
      </>
    ),
  },
];

const BUYING: Faq[] = [
  {
    q: 'How do I pay?',
    a: (
      <>
        Purchases run through your Panty Post wallet. You top the wallet up, and purchases draw
        down from that balance rather than charging a card each time. On a direct purchase the
        price shown at checkout already includes the 10% platform fee.
      </>
    ),
  },
  {
    q: 'How do auctions work?',
    a: (
      <>
        Sellers can list an item for auction, with an optional reserve. Your bid is held from
        your wallet balance while you are the leading bidder and released automatically if you
        are outbid. You pay exactly your winning bid — nothing is added on auctions.
      </>
    ),
  },
  {
    q: 'What is a subscription?',
    a: (
      <>
        Some sellers offer a monthly subscription that unlocks their premium listings and posts.
        It is set and priced by the seller, and you can unsubscribe at any time from their shop
        page.
      </>
    ),
  },
  {
    q: 'Can I leave a review?',
    a: (
      <>
        Yes, once you have bought from that seller — reviews are tied to a completed purchase,
        which is why the ratings here mean something. Reviews are moderated before they appear.
      </>
    ),
  },
  {
    q: 'Will my order arrive discreetly?',
    a: (
      <>
        Sellers post items in plain, unbranded packaging with no reference to Panty Post on the
        outside. A seller sees the delivery address you provide, and nothing else about you.
      </>
    ),
  },
];

const SAFETY: Faq[] = [
  {
    q: 'What is not allowed on Panty Post?',
    a: (
      <>
        Anything involving anyone under 18, anyone who has not consented, or any depiction of
        coercion or exploitation — these bring immediate removal, a permanent ban and, where
        appropriate, referral to the authorities. Also prohibited: sexually explicit imagery,
        offers of in-person meetings, personal contact details, impersonation, and anything
        directing users off-platform. The full list is in our{' '}
        <Link href="/content-policy">Content Policy</Link>.
      </>
    ),
  },
  {
    q: 'How do I report content, or ask for something to be removed?',
    a: (
      <>
        Use our <Link href="/complaints">Complaints &amp; Content Removal</Link> process. You do
        not need an account. Every complaint gets a reference number and is investigated and
        resolved within five business days. Reports of non-consensual content, or of content
        involving a minor, are urgent: the content is withdrawn from public view the moment we
        receive the report, before any review takes place.
      </>
    ),
  },
  {
    q: 'Someone is depicted in content here without consent. What now?',
    a: (
      <>
        Tell us through the <Link href="/complaints">complaints process</Link> and it comes down
        on receipt. Consent can be withdrawn at any time, including by someone who originally
        gave it. No account is needed to make this request.
      </>
    ),
  },
  {
    q: 'Who reviews content?',
    a: (
      <>
        Trained platform administrators, not automated filtering alone. Every decision records
        who made it, when, and the reason for any denial — and that reason goes to the user, so
        the content can be corrected and resubmitted.
      </>
    ),
  },
];

const SECTIONS: { id: string; title: string; icon: typeof Package; items: Faq[] }[] = [
  { id: 'getting-started', title: 'Getting started', icon: HelpCircle, items: GETTING_STARTED },
  { id: 'selling', title: 'Selling', icon: Package, items: SELLING },
  { id: 'buying', title: 'Buying', icon: Wallet, items: BUYING },
  { id: 'safety', title: 'Safety, moderation & reporting', icon: ShieldCheck, items: SAFETY },
];

/* Quick routes, above the fold. Someone arriving from the footer — during
   a compliance review, or because something has gone wrong — should not
   have to read a FAQ first. */
const QUICK_LINKS = [
  {
    href: `mailto:${SUPPORT_EMAIL}`,
    icon: Mail,
    title: 'Email support',
    body: SUPPORT_EMAIL,
    external: true,
  },
  {
    href: '/complaints',
    icon: Flag,
    title: 'Report content',
    body: 'Resolved within five business days. No account needed.',
    external: false,
  },
  {
    href: '/age-verification',
    icon: BadgeCheck,
    title: 'Age verification',
    body: 'How we confirm everyone here is 18 or over.',
    external: false,
  },
  {
    href: '/content-policy',
    icon: Eye,
    title: 'What is allowed',
    body: 'Content rules, and how review works.',
    external: false,
  },
];

/* Plain-text mirror of the FAQ for structured data. Separate from the JSX
   above because schema.org wants text, not markup. */
const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      q: 'How do I start selling on Panty Post?',
      a: 'Create a seller account, complete identity verification with government-issued photographic ID, then post your first listing. Verification is reviewed by a person and confirms your identity and that you are 18 or over.',
    },
    {
      q: 'Why is my listing not showing up on Panty Post?',
      a: 'Panty Post reviews every listing, post, profile picture, cover photo and gallery image before it becomes publicly visible. Until it is approved it is visible only to you, and it cannot be reached by a direct link.',
    },
    {
      q: 'What fees does Panty Post charge sellers?',
      a: 'On a direct sale the seller receives 90% of their listed price, plus a tier bonus of up to 5%. Buyers pay a 10% platform fee on top. On an auction the seller receives 80% of the winning bid and the buyer pays exactly what they bid, with nothing added.',
    },
    {
      q: 'Can I sell used panties anonymously on Panty Post?',
      a: 'Buyers see only your username, shop, bio and gallery. They never see your legal name, email or address. Identity documents are held securely for verification only and are never publicly accessible.',
    },
    {
      q: 'How do I report content or request its removal from Panty Post?',
      a: 'Use the Complaints and Content Removal process. No account is required. Every complaint receives a reference number and is resolved within five business days. Reports of non-consensual content, or of content involving a minor, are withdrawn from public view on receipt, before review.',
    },
  ].map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <script
        type="application/ld+json"
        // Static content, defined above. No user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10">
          <p className="pill pill-primary">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> Help &amp; Contact
          </p>
          <h1 className="mt-3 text-3xl font-bold">How can we help?</h1>
          <p className="mt-4 leading-relaxed text-ink-muted">
            Answers to what people ask most, and how to reach us. If something here is unclear,
            or your question is not covered, email{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and a person will read it.
          </p>
        </header>

        {/* Quick links.
            Built from utilities rather than the .card class: .card is
            declared unlayered in globals.css, so it would override any
            padding utility set here. */}
        <section className="mb-12" aria-label="Common requests">
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map(({ href, icon: Icon, title, body, external }) => {
              const inner = (
                <>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary-line bg-primary-soft">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{title}</span>
                    <span className="mt-0.5 block text-sm text-ink-muted">{body}</span>
                  </span>
                </>
              );

              const cls =
                'card-interactive flex items-start gap-3 rounded-lg border border-line bg-surface-raised p-4';

              return external ? (
                <a key={href} href={href} className={cls}>
                  {inner}
                </a>
              ) : (
                <Link key={href} href={href} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <div className="space-y-12">
          {SECTIONS.map(({ id, title, icon: Icon, items }) => (
            <section key={id} id={id} aria-labelledby={`${id}-heading`}>
              <h2
                id={`${id}-heading`}
                className="mb-5 flex items-center gap-2 text-xl font-semibold text-ink"
              >
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                {title}
              </h2>

              <div className="divide-y divide-line border-y border-line">
                {items.map(({ q, a }) => (
                  <div key={q} className="py-5">
                    <h3 className="font-semibold text-ink">{q}</h3>
                    <p className="mt-2 leading-relaxed text-ink-muted">{a}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Selling CTA. Part of the point of this page ranking is that some
            of the people who read it are deciding whether to sell here. */}
        <section className="mt-12 rounded-lg border border-primary-line bg-primary-soft p-6">
          <h2 className="text-lg font-semibold text-ink">Thinking about selling?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            You keep 90% of your listed price on a direct sale, rising with your tier. Identity
            verification is required, every listing is reviewed before it goes live, and buyers
            never see anything about you beyond your shop.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-2 transition-colors hover:bg-primary-hover"
            >
              {/* Label in a span: see the note at the top of this file. */}
              <span className="text-sm font-semibold text-black">Create a seller account</span>
            </Link>
            <Link
              href="/blog/how-to-sell-used-panties-online-guide"
              className="rounded-md border border-line-strong px-4 py-2 transition-colors hover:bg-surface-hover"
            >
              <span className="text-sm font-semibold text-ink">Read the selling guide</span>
            </Link>
          </div>
        </section>

        {/* Contact, and operator identification. Payment processors require
            the operating entity to be identifiable on the site itself, not
            only in the terms. */}
        <section className="card mt-8" aria-labelledby="contact-heading">
          <h2
            id="contact-heading"
            className="flex items-center gap-2 text-lg font-semibold text-ink"
          >
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            Contact us
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            General support, account questions, and anything not covered above:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We answer email as quickly
            as we can.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            To report content, please use the{' '}
            <Link href="/complaints">Complaints &amp; Content Removal</Link> form rather than
            email, so your report is logged, given a reference number, and tracked against our
            five-business-day commitment.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/content-policy">Content Policy</Link>
            <Link href="/age-verification">Age Verification</Link>
            <Link href="/complaints">Complaints</Link>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-ink-faint">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Operated by G Dykyj &amp; O.S Richards, trading as Panty Post · ABN 16 501 428 474 ·
            Australia
          </p>
        </section>
      </div>
    </main>
  );
}
