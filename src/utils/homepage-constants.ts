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

// Trust signals displayed in the trust section - verified structure
export const TRUST_SIGNALS = [
  { icon: Shield, title: 'Privacy First', desc: 'Your identity is always protected.' },
  { icon: CreditCard, title: 'Secure Payments', desc: 'Encrypted and safe transactions.' },
  { icon: Star, title: 'Verified Sellers', desc: 'Manually reviewed for authenticity.' },
  { icon: Users, title: '24/7 Support', desc: 'Our team is here to help anytime.' },
];

// Main features displayed on homepage - verified structure
export const PLATFORM_FEATURES = [
  { 
    icon: ShoppingBag, 
    title: 'Browse Listings', 
    desc: "Explore our curated collection of intimate apparel from verified sellers. Find unique pieces you'll love." 
  },
  { 
    icon: Heart, 
    title: 'Subscribe to Sellers', 
    desc: 'Get exclusive access to premium content from your favorite sellers with monthly subscriptions.' 
  },
  { 
    icon: TrendingUp, 
    title: 'Sell Your Items', 
    desc: 'Create your seller profile, list your pieces, and start earning. Our platform handles payments securely.' 
  },
];

// Hero section content - verified structure
export const HERO_CONTENT = {
  badge: 'Trusted by 10,000+ users',
  title: 'The',
  titleHighlight: 'Ultimate',
  titleEnd: 'Lingerie Marketplace',
  description: 'Discover unique intimate apparel from verified sellers. The trusted marketplace to buy and sell premium lingerie — securely and discreetly.',
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
  description: 'Join thousands of buyers and sellers on the most trusted marketplace for premium intimate apparel.',
  primaryButton: {
    text: 'Create Account',
    href: '/login',
  },
  secondaryButton: {
    text: 'Explore Listings',
    href: '/browse',
  },
};

// Footer links - verified structure
export const FOOTER_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/help', label: 'Help' },
  { href: '/contact', label: 'Contact' },
];

// Generate particle positions (deterministic based on index) - verified structure
export const generateParticlePositions = (count: number = 45) => 
  Array.from({ length: count }, (_, i) => ({
    left: ((i * 37 + i * 7) % 90) + 5,
    top: ((i * 23 + i * 13) % 100),
    delay: (i * 0.2) % 4.5,
    duration: 8 + (i % 4)
  }));

// Debug: Log the structure to verify everything is correct
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Homepage constants loaded:', {
    TRUST_BADGES: TRUST_BADGES.map(badge => ({ text: badge.text, hasIcon: !!badge.icon })),
    TRUST_SIGNALS: TRUST_SIGNALS.map(signal => ({ title: signal.title, hasIcon: !!signal.icon })),
    PLATFORM_FEATURES: PLATFORM_FEATURES.map(feature => ({ title: feature.title, hasIcon: !!feature.icon })),
  });
}
