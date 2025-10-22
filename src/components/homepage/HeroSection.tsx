// src/components/homepage/HeroSection.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { itemVariants, containerVariants, fadeInVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { HERO_CONTENT } from '@/utils/homepage-constants';
import TrustBadges from './TrustBadges';
import AnimatedUserCounter from './AnimatedUserCounter';

// Lazy load FloatingParticles for better initial load
import dynamic from 'next/dynamic';
const FloatingParticles = dynamic(() => import('./FloatingParticles'), {
  ssr: false,
  loading: () => null
});

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
  const [mounted, setMounted] = useState(false);
  const [phoneImageLoaded, setPhoneImageLoaded] = useState(false);

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
      className="relative w-full pt-10 pb-8 md:pt-12 md:pb-12 overflow-hidden"
    >
      {/* Subtle Noise Overlay - optimized with will-change */}
      <div
        className="absolute inset-0 opacity-[0.02] bg-[url('/noise.png')] bg-repeat pointer-events-none"
        role="presentation"
        style={{ willChange: 'opacity' }}
      />

      {/* Floating particles - lazy loaded */}
      {mounted && <FloatingParticles />}

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between min-h-[70vh] md:min-h-[75vh] z-10">
        {/* LEFT: Info/CTA */}
        <div className="w-full md:w-1/2 lg:w-[48%] xl:w-[45%] relative">
          <motion.div
            className="flex flex-col items-center md:items-start text-center md:text-left justify-center z-20"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={containerVariants}
          >
            {/* Dynamic user counter */}
            <AnimatedUserCounter 
              className="mb-3" 
              compact={true}
            />

            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white mb-5 tracking-tighter"
              variants={itemVariants}
            >
              {HERO_CONTENT.title} <span className="text-[#ff950e]">{HERO_CONTENT.titleHighlight}</span>{' '}
              {HERO_CONTENT.titleEnd}
            </motion.h1>

            <motion.p
              className="text-gray-400 text-base md:text-lg mb-8 max-w-xl font-medium"
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
          </motion.div>
        </div>

        {/* RIGHT: Phone Image - OPTIMIZED with Next.js Image */}
        <div className="w-full md:w-1/2 lg:w-[50%] xl:w-[50%] flex justify-center md:justify-end items-center h-full mt-8 md:mt-0 z-10 perspective pr-0 md:pr-12 lg:pr-20 xl:pr-24 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            variants={fadeInVariants}
            style={mounted ? { y } : {}}
            className="relative"
          >
            {/* Loading skeleton for phone image */}
            {!phoneImageLoaded && (
              <div 
                className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] animate-pulse"
                style={{
                  width: '300px',
                  height: '520px',
                }}
              />
            )}
            
            {/* OPTIMIZED: Next.js Image with priority loading */}
            <div 
              className={`transition-opacity duration-500 ${phoneImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,149,14,0.1))',
              }}
            >
              <Image
                src="/phone-mockup.png"
                alt="PantyPost mobile app interface showcasing the marketplace"
                width={300}
                height={520}
                priority // Critical for above-the-fold content
                quality={85} // Slightly reduce quality for better performance
                placeholder="blur" // Show blur placeholder while loading
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAGCAYAAADkOT91AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAM0lEQVR4nGNgQAX/gZgRiP8D8X8kNhMSH6oOmwZsYjg1YBPDqgGbGE4N2MRwasDhLwYGADm3EQXVn3lFAAAAAElFTkSuQmCC"
                className="h-auto w-auto transform transition-all duration-500 hover:scale-105 hover:rotate-3"
                style={{
                  maxHeight: '520px',
                  width: 'auto',
                  height: 'auto'
                }}
                sizes="(max-width: 640px) 340px, (max-width: 768px) 400px, (max-width: 1024px) 440px, 520px"
                onLoadingComplete={() => setPhoneImageLoaded(true)}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
