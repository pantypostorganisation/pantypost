// src/components/homepage/HeroSection.tsx
'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ShoppingBag, TrendingUp, CheckCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { itemVariants, containerVariants, fadeInVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { HERO_CONTENT } from '@/utils/homepage-constants';
import TrustBadges from './TrustBadges';
import FloatingParticles from './FloatingParticles';

export default function HeroSection() {
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '20%']);

  return (
    <section ref={heroRef} className="relative w-full pt-10 pb-8 md:pt-12 md:pb-12 bg-gradient-to-b from-black via-[#080808] to-[#101010] overflow-hidden z-10">
      {/* Subtle Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('/noise.png')] bg-repeat pointer-events-none" role="presentation"></div>
      
      {/* Floating particles */}
      <FloatingParticles />
      
      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between min-h-[70vh] md:min-h-[75vh] z-10">
        {/* LEFT: Info/CTA */}
        <motion.div
          className="w-full md:w-1/2 lg:w-[48%] xl:w-[45%] flex flex-col items-center md:items-start text-center md:text-left justify-center z-20"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_CONFIG}
          variants={containerVariants}
        >
          <motion.div className="flex items-center mb-3 gap-2" variants={itemVariants}>
            <CheckCircle 
              className="h-5 w-5 text-[#ff950e] animate-pulse-slow" 
              aria-hidden="true"
            />
            <span className="text-[#ff950e] font-semibold text-xs tracking-wider uppercase">
              {HERO_CONTENT.badge}
            </span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white mb-5 tracking-tighter" 
            variants={itemVariants}
          >
            {HERO_CONTENT.title} <span className="text-[#ff950e]">{HERO_CONTENT.titleHighlight}</span> {HERO_CONTENT.titleEnd}
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
        
        {/* RIGHT: Phone Image - Simplified */}
        <motion.div
          className="w-full md:w-1/2 lg:w-[50%] xl:w-[50%] flex justify-center md:justify-end items-center h-full mt-8 md:mt-0 z-10 perspective pr-0 md:pr-12 lg:pr-20 xl:pr-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={fadeInVariants}
          style={{ y }}
        >
          <img
            src="/phone-mockup.png"
            alt="PantyPost mobile app interface showcasing the marketplace"
            className="h-[280px] sm:h-96 md:h-[440px] lg:h-[520px] w-auto transform transition-all duration-500 hover:scale-105 hover:rotate-3"
            style={{
              filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,149,14,0.1))',
            }}
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'h-[280px] sm:h-96 md:h-[440px] lg:h-[520px] w-[160px] sm:w-[220px] md:w-[250px] lg:w-[300px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[2rem] border border-gray-700 flex items-center justify-center';
              fallback.innerHTML = '<span class="text-gray-400 text-sm">App Preview</span>';
              target.parentNode?.appendChild(fallback);
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
