// src/components/homepage/HeroSection.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect, type ButtonHTMLAttributes } from 'react';
import { ShoppingBag, TrendingUp } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  itemVariants,
  containerVariants,
  fadeInVariants,
  VIEWPORT_CONFIG
} from '@/utils/motion.config';
import { HERO_CONTENT } from '@/utils/homepage-constants';
import TrustBadges from './TrustBadges';
import AnimatedUserCounter from './AnimatedUserCounter';
import PaymentsProcessedCounter from './PaymentsProcessedCounter';
import styles from './HeroSection.module.css';

// Lazy load FloatingParticles for better initial load
import dynamic from 'next/dynamic';
const FloatingParticles = dynamic(() => import('./FloatingParticles'), {
  ssr: false,
  loading: () => null
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ type = 'button', ...props }: ButtonProps) {
  return <button type={type} {...props} />;
}

// Suppress Framer Motion’s false positive positioning warning in development
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
  const router = useRouter();

  const handleStartSelling = () => {
    router.push(HERO_CONTENT.ctaSecondary.href);
  };

  const handleBrowseListings = () => {
    router.push(HERO_CONTENT.ctaPrimary.href);
  };

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
      {/* Subtle Noise Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] bg-[url('/noise.png')] bg-repeat pointer-events-none"
        role="presentation"
        style={{ willChange: 'opacity' }}
      />

      {/* Floating particles */}
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
            {/* Counters */}
            <div className="mb-4 md:mb-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center md:justify-start">
              <AnimatedUserCounter compact={true} />
              <PaymentsProcessedCounter compact className="" />
            </div>

            {/* Title */}
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white mb-5 tracking-tighter"
              variants={itemVariants}
            >
              {HERO_CONTENT.title}{' '}
              <span className="text-[#ff950e]">
                {HERO_CONTENT.titleHighlight}
              </span>{' '}
              {HERO_CONTENT.titleEnd}
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-gray-400 text-base md:text-lg mb-8 max-w-xl font-medium"
              variants={itemVariants}
            >
              {HERO_CONTENT.description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              id="hero-ctas"
              className={`flex gap-4 mb-8 flex-col sm:flex-row w-full md:w-auto justify-center md:justify-start ${styles.ctaGroup}`}
              variants={itemVariants}
              role="group"
              aria-label="Primary navigation actions"
            >
              {/* Browse Listings Button */}
              <Button
                className={`${styles.browseListingsBtn} cta-btn`}
                onClick={handleBrowseListings}
                aria-label="Browse available listings on PantyPost marketplace"
              >
                <ShoppingBag
                  className={styles.browseListingsIcon}
                  aria-hidden="true"
                />
                {HERO_CONTENT.ctaPrimary.text}
              </Button>

              {/* Start Selling Button */}
              <Button
                className={`${styles.startSellingBtn} cta-btn`}
                onClick={handleStartSelling}
                aria-label="Start Selling"
              >
                <TrendingUp
                  className={styles.startSellingIcon}
                  aria-hidden="true"
                />
                {HERO_CONTENT.ctaSecondary.text}
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <TrustBadges />
          </motion.div>
        </div>

        {/* RIGHT: Phone Image */}
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
                  height: '520px'
                }}
              />
            )}

            {/* Optimized Image */}
            <div
              className={`transition-opacity duration-500 ${
                phoneImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                filter:
                  'drop-shadow(0 25px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,149,14,0.1))'
              }}
            >
              <Image
                src="/phone-mockup.png"
                alt="PantyPost mobile app interface showcasing the marketplace"
                width={300}
                height={520}
                priority
                quality={85}
                placeholder="blur"
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
