// src/components/homepage/HeroSection.tsx
'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  CheckCircle,
  ShieldCheck,
  Users,
  BadgeCheck,
  Timer,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { itemVariants, containerVariants, fadeInVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { HERO_CONTENT } from '@/utils/homepage-constants';
import TrustBadges from './TrustBadges';
import FloatingParticles from './FloatingParticles';

const HERO_STATS = [
  {
    icon: Users,
    value: '48k+',
    label: 'Monthly buyers',
    helper: 'Actively browsing curated listings',
  },
  {
    icon: ShieldCheck,
    value: '98%',
    label: 'Resolution rate',
    helper: 'Support tickets solved within 24h',
  },
  {
    icon: BadgeCheck,
    value: '100%',
    label: 'Seller verification',
    helper: 'Manual vetting on every storefront',
  },
] as const;

const HERO_ASSURANCES = [
  {
    title: 'Fast seller payouts',
    description: 'Verified sellers receive cleared payouts within 48 hours of delivery confirmation.',
  },
  {
    title: 'Discreet packaging by default',
    description: 'All orders dispatch in neutral wrapping and unbranded billing descriptors.',
  },
] as const;

const RATING_STARS = Array.from({ length: 5 });

// Suppress Framer Motion's false positive positioning warning in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ensure scroll offset is calculated correctly')
    ) {
      return; // Suppress this specific warning
    }
    originalWarn.apply(console, args);
  };
}

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only apply animations after mount to ensure smooth loading
  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '20%']);

  return (
    <section
      ref={heroRef}
      className="relative w-full pt-10 pb-12 md:pt-12 md:pb-16 bg-gradient-to-b from-black via-[#080808] to-[#101010] overflow-hidden z-10"
    >
      {/* Subtle Noise Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] bg-[url('/noise.png')] bg-repeat pointer-events-none"
        role="presentation"
      />

      {/* Floating particles */}
      <FloatingParticles />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-10 min-h-[70vh] md:min-h-[75vh] z-10">
        {/* LEFT: Info/CTA */}
        <div className="w-full md:w-1/2 lg:w-[48%] xl:w-[45%] relative">
          <motion.div
            className="flex flex-col items-center md:items-start text-center md:text-left justify-center z-20"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={containerVariants}
          >
            <motion.div className="flex items-center mb-3 gap-2" variants={itemVariants}>
              <CheckCircle className="h-5 w-5 text-[#ff950e] animate-pulse-slow" aria-hidden="true" />
              <span className="text-[#ff950e] font-semibold text-xs tracking-wider uppercase">
                {HERO_CONTENT.badge}
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight text-white mb-5 tracking-tighter"
              variants={itemVariants}
            >
              {HERO_CONTENT.title} <span className="text-[#ff950e]">{HERO_CONTENT.titleHighlight}</span>{' '}
              {HERO_CONTENT.titleEnd}
            </motion.h1>

            <motion.p
              className="text-gray-400 text-base md:text-lg mb-6 md:mb-8 max-w-xl font-medium"
              variants={itemVariants}
            >
              {HERO_CONTENT.description}
            </motion.p>

            <motion.div
              className="flex gap-4 mb-8 flex-col sm:flex-row w-full md:w-auto justify-center md:justify-start"
              variants={itemVariants}
              role="group"
              aria-label="Primary navigation actions"
            >
              <Link
                href={HERO_CONTENT.ctaPrimary.href}
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-2.5 bg-gradient-to-r from-[#ff950e] to-[#ffb347] text-black font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                style={{ color: '#000' }}
                aria-label="Browse available listings on PantyPost marketplace"
              >
                <ShoppingBag
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[-2px]"
                  aria-hidden="true"
                />
                <span className="relative z-10">{HERO_CONTENT.ctaPrimary.text}</span>
              </Link>

              <Link
                href={HERO_CONTENT.ctaSecondary.href}
                className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-2.5 bg-black border border-[#ff950e]/60 text-[#ff950e] font-semibold text-sm transition-all duration-300 ease-out hover:scale-105 hover:bg-[#111] hover:border-[#ff950e] hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Start selling on PantyPost platform"
              >
                <TrendingUp
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-[-2px]"
                  aria-hidden="true"
                />
                {HERO_CONTENT.ctaSecondary.text}
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <TrustBadges />

            {/* Platform stats */}
            <motion.div
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full"
              variants={containerVariants}
              role="list"
              aria-label="Marketplace highlights"
            >
              {HERO_STATS.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-lg px-4 py-4"
                  variants={itemVariants}
                  role="listitem"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#ff950e]/10 text-[#ff950e]">
                    <stat.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-white leading-none">{stat.value}</p>
                    <p className="text-sm text-gray-300 font-medium leading-tight">{stat.label}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{stat.helper}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Operational assurances */}
            <motion.div
              className="mt-6 w-full rounded-3xl border border-[#ff950e]/20 bg-[#0b0b0b]/80 p-5 text-left shadow-lg shadow-[#ff950e]/10"
              variants={itemVariants}
              aria-label="Operational assurances"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ff950e]">
                <Timer className="h-4 w-4" aria-hidden="true" />
                Built for serious sellers
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                {HERO_ASSURANCES.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#ff950e]" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-white leading-tight">{item.title}</p>
                      <p className="text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>

        {/* RIGHT: Phone Image - with parallax effect */}
        <div className="w-full md:w-1/2 lg:w-[50%] xl:w-[50%] flex justify-center md:justify-end items-center h-full mt-8 md:mt-0 z-10 perspective pr-0 md:pr-12 lg:pr-20 xl:pr-24 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeInVariants}
            style={mounted ? { y } : {}}
          >
            {!imgError ? (
              <img
                src="/phone-mockup.png"
                alt="PantyPost mobile app interface showcasing the marketplace"
                className="h-[320px] sm:h-[380px] md:h-[440px] lg:h-[520px] w-auto transform transition-all duration-500 hover:scale-105 hover:rotate-3"
                style={{
                  filter:
                    'drop-shadow(0 25px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,149,14,0.1))',
                }}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-[320px] sm:h-[380px] md:h-[440px] lg:h-[520px] w-[200px] sm:w-[220px] md:w-[250px] lg:w-[300px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] border border-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-sm">App Preview</span>
              </div>
            )}
          </motion.div>

          <motion.div
            className="absolute -bottom-6 left-1/2 w-full max-w-[280px] -translate-x-1/2 rounded-3xl border border-white/10 bg-[#0b0b0b]/90 p-5 shadow-xl shadow-black/40 backdrop-blur"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Marketplace satisfaction</p>
                <p className="text-xs text-gray-400">Ratings from verified buyers</p>
              </div>
              <div className="flex items-center gap-1 text-[#ff950e]">
                {RATING_STARS.map((_, index) => (
                  <span key={`rating-star-${index}`} aria-hidden="true">★</span>
                ))}
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-white tracking-tight">
              4.9
              <span className="ml-1 text-base font-semibold text-gray-400">/5</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">Based on 2,300+ marketplace reviews from the last 12 months.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
