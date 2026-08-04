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
export const TRUST_BADGES = [
  { icon: Shield, text: 'Secure & Private' },
  { icon: Star, text: 'Verified Sellers' },
  { icon: CreditCard, text: 'Safe Payments' },
  { icon: Lock, text: 'Encrypted' },
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
  titleEnd: 'Marketplace',
  description: 'Connect discreetly with verified sellers offering premium personal items. The safe, anonymous way to buy and sell worn undergarments online.',
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
export const FOOTER_LINKS = [
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
