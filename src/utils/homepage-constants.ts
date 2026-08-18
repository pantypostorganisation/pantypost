// src/utils/homepage-constants.ts
import {
  Shield,
  Star,
  CreditCard,
  Lock,
  Users,
  ShoppingBag,
  Heart,
  TrendingUp
} from 'lucide-react';

// Trust badges displayed in the hero section - verified structure
/* "Secure & Private / Verified Sellers / Safe Payments / Encrypted" is
   what every site in every category says, so it read as decoration
   rather than evidence. Each of these is specific, true today, and
   checkable by anyone -- including a payment processor:

     - pre-publication moderation runs on all user content
     - seller identity verification is enforced server-side before a
       listing can be created
     - the 90% split is in order.routes.js / pricing.ts
     - the five-business-day complaints SLA is published

   "Encrypted" was dropped deliberately: design-system-notes.md flags it
   as an unverified claim that should be checked against how messages are
   actually stored BEFORE a processor asks. Do not restore it without
   that check. */
export const TRUST_BADGES = [
  { icon: Shield, text: 'Every listing reviewed' },
  { icon: Star, text: 'ID-verified sellers' },
  { icon: CreditCard, text: 'Sellers keep 90%' },
  { icon: Lock, text: 'Complaints answered in 5 days' },
];

/* NOTE: this constant is not currently rendered anywhere — the live copy
   lives in TrustSignalsSection.tsx, which declares its own list so it can
   attach badge images. Kept in step with that file anyway, so the two do
   not drift into contradicting each other. */
export const TRUST_SIGNALS = [
  { icon: Shield, title: 'Privacy First', desc: 'Your identity is always protected.' },
  { icon: CreditCard, title: 'Secure Payments', desc: 'Encrypted and safe transactions.' },
  { icon: Star, title: 'Verified Sellers', desc: 'Manually reviewed for authenticity.' },
  // Was "24/7 Support — our team is here to help anytime", which we do not
  // operate. What we do run is a published complaints process with a
  // five-business-day resolution commitment — true, checkable, and a
  // stronger claim to a payment processor than a support promise nobody
  // is staffing.
  { icon: Users, title: 'Real Support', desc: 'Every complaint answered within five business days.' },
];

// Main features displayed on homepage - verified structure
export const PLATFORM_FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Browse Listings',
    desc: "Explore our curated selection of premium items from verified sellers. Find exactly what you're looking for."
  },
  {
    icon: Heart,
    title: 'Subscribe to Sellers',
    desc: 'Get exclusive access to premium content from your favorite sellers with monthly subscriptions.'
  },
  {
    icon: TrendingUp,
    title: 'Sell Your Items',
    desc: 'Create your seller profile, list your items, and start earning. Our platform handles payments securely.'
  },
];

// Hero section content - verified structure
export const HERO_CONTENT = {
  /* Was "Trusted by 10,000+ users". We have neither the users nor any way
     to substantiate the number, and inventing social proof on a site with
     a public complaints process and a payment processor mid-review is a
     liability rather than a growth tactic.

     HeroSection does not currently render this field — but an unrendered
     string is exactly the kind of thing that gets dropped into the markup
     later by someone who assumes it was checked. */
  badge: 'Every listing reviewed before it goes live',
  title: 'The',
  titleHighlight: 'Ultimate',
  /* The <h1> is the strongest on-page ranking signal there is, and
     organic is the ONLY acquisition channel available -- adult
     marketplaces are banned from Google, Meta and TikTok ads. "The
     Ultimate Marketplace" contained no keyword and could have described
     any site on the internet. It also contradicted the page's own title
     tag ("Buy & Sell Used Panties Safely"); the two strongest signals on
     the page now agree instead of competing.

     Same three-part structure, same orange highlight, no layout change. */
  titleEnd: 'Marketplace for Used Panties',
  /* Leads with the buyer promise, then states the seller economics.
     Sellers are the priority -- fastest route to revenue, and the drops
     strategy depends on recruiting them -- but their case was buried at
     the very bottom of the page. Both halves are true and checkable. */
  description: 'Buy and sell worn underwear discreetly, with verified sellers and anonymous delivery. Sellers keep 90% of every sale and can list the same day.',
  ctaPrimary: {
    text: 'Browse Listings',
    href: '/browse',
  },
  ctaSecondary: {
    text: 'Start Selling',
    href: '/signup',
  },
};

// CTA section content - verified structure
export const CTA_CONTENT = {
  title: 'Ready to Get Started?',
  /* Was "Join thousands of buyers and sellers on the most secure
     marketplace for used undergarments." We are pre-launch, so there are
     no thousands, and "most secure" is unfalsifiable. The replacement is
     true today and leads with the thing sellers actually decide on. */
  description: 'Sellers keep 90% of every sale, rising with your tier. Verification takes minutes, and your first listing can go up the same day.',
  primaryButton: {
    text: 'Create Account',
    /* Was '/login'. A button labelled "Create Account" that lands on a
       sign-in form is a funnel leak: the visitor most likely to click it
       is precisely the one who does not have an account yet. */
    href: '/signup',
  },
  secondaryButton: {
    text: 'Explore Listings',
    href: '/browse',
  },
};

/* Footer links.

   Previously listed '/help' and '/contact', both hard 404s, while being
   linked from every page — including throughout a payment processor
   review. '/help' now exists and covers contact; '/contact' 301s to it
   (see next.config.ts) so any external link still resolves, but there is
   no reason to send our own users through a redirect. */
/* The homepage FAQ, in ONE place.

   FAQSection renders these on screen and the homepage's FAQPage JSON-LD
   is generated from the same array -- Google requires the schema text to
   match what is visibly on the page, and two hand-maintained copies is
   how they drift apart.

   Every claim below is checkable against how the platform actually
   works. The previous copy said we "monitor all transactions in
   real-time", that "refunds are instant", that "rate-limiting prevents
   fraud" and that messaging is "encrypted" -- none of which we can
   stand behind, in front of users or a payment processor. */
export const HOMEPAGE_FAQ = [
  {
    question: 'How does your wallet system protect buyers?',
    answer:
      'Purchases are paid from your prefunded PantyPost wallet, so your card details are never shared with another user. Every transaction is recorded, and if something goes wrong our admin team can step in and resolve the dispute directly - every complaint is answered within five business days.',
  },
  {
    question: 'What are seller tiers and how do they benefit me?',
    answer:
      'Sellers progress through five tiers - Tease, Flirt, Obsession, Desire and Goddess - based on their sales. Each tier adds a bonus of up to 5% on top of the standard 90% sellers keep from every direct sale. Buyers can also subscribe to their favourite verified sellers for access to premium listings.',
  },
  {
    question: 'How do auctions work on Panty Post?',
    answer:
      'Sellers can list items for competitive bidding with an optional reserve price. When you bid, the funds are held from your wallet balance, and you are automatically refunded the moment you are outbid. The winner pays exactly their final bid - no added fees - and the seller receives 80% of it.',
  },
  {
    question: 'What makes Panty Post safer than other platforms?',
    answer:
      'Every listing, photo and profile is reviewed by a human moderator before it goes live - nothing publishes automatically. Sellers verify their identity and age before they can sell, payments stay inside the platform wallet, and a public complaints process guarantees a response to every report within five business days.',
  },
];

export const FOOTER_LINKS = [
  /* /blog needs a link from somewhere or it is orphaned exactly as its
     two guides were: nothing on the site pointed at them, Google crawled
     both and declined to index either. A footer link appears on every
     page, which is the cheapest possible fix. */
  { href: '/blog', label: 'Guides' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/help', label: 'Help & Contact' },
];

// Generate particle positions (deterministic based on index) - verified structure
export const generateParticlePositions = (count: number = 45) =>
  Array.from({ length: count }, (_, i) => ({
    left: ((i * 37 + i * 7) % 90) + 5, // Creates pseudo-random horizontal distribution
    top: ((i * 23 + i * 13) % 100), // Creates pseudo-random vertical distribution
    delay: (i * 0.2) % 4.5, // Stagger the animations
    duration: 8 + (i % 4) // Vary duration between 8-11 seconds
  }));

// Debug: Log the structure to verify everything is correct
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Homepage constants loaded:', {
    TRUST_BADGES: TRUST_BADGES.map(badge => ({ text: badge.text, hasIcon: !!badge.icon })),
    TRUST_SIGNALS: TRUST_SIGNALS.map(signal => ({ title: signal.title, hasIcon: !!signal.icon })),
    PLATFORM_FEATURES: PLATFORM_FEATURES.map(feature => ({ title: feature.title, hasIcon: !!feature.icon })),
  });
}

