// src/components/homepage/CTASection.tsx
'use client';

import Link from 'next/link';
import { TrendingUp, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { itemVariants, containerVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { CTA_CONTENT } from '@/utils/homepage-constants';

export default function CTASection() {
  return (
    <div className="pt-16 pb-16 md:pt-20 md:pb-20 relative overflow-hidden">
      {/* Shape Divider 3 (Background Glow) */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] md:w-[70%] h-[500px] pointer-events-none z-0"
        initial="hidden" 
        whileInView="visible" 
        viewport={VIEWPORT_CONFIG} 
        variants={shapeVariants}
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/10 via-[#ff950e]/5 to-transparent blur-3xl rounded-[40%_60%_60%_40%/70%_50%_50%_30%] animate-spin-medium-reverse"></div>
      </motion.div>

      {/* Content container */}
      <motion.div
        className="relative max-w-3xl mx-auto px-6 md:px-12 text-center z-10"
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.4 }} 
        variants={containerVariants}
      >
        <motion.h2 
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight" 
          variants={itemVariants}
        >
          {CTA_CONTENT.title}
        </motion.h2>
        
        <motion.p 
          className="text-gray-400 text-lg max-w-2xl mx-auto mb-10" 
          variants={itemVariants}
        >
          {CTA_CONTENT.description}
        </motion.p>
        
        <motion.div 
          className="flex gap-4 justify-center flex-col sm:flex-row" 
          variants={itemVariants}
        >
          <Link
            href={CTA_CONTENT.primaryButton.href}
            /* Primary: flat brand fill, matching the hero. Was a
               gradient — gradients on surfaces are out per the design
               rules, and a flat fill reads cleaner at this size.
               The inline color below is NOT redundant: globals.css has
               unlayered `a {}` rules that beat Tailwind utilities, so an
               orange <Link> with text-black renders orange-on-orange
               (invisible) without it. Do not remove until globals.css
               moves its element selectors into @layer base. */
            className="group relative inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-md px-8 py-3.5 bg-[#ff950e] text-black font-semibold text-[1.0625rem] shadow-[0_6px_24px_rgba(255,149,14,0.28)] transition-all duration-300 ease-out hover:bg-[#ffa733] hover:shadow-[0_8px_30px_rgba(255,149,14,0.38)] active:bg-[#e0850d] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{ color: '#000' }}
          >
            <TrendingUp className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            <span className="relative z-10">{CTA_CONTENT.primaryButton.text}</span>
          </Link>
          
          <Link
            href={CTA_CONTENT.secondaryButton.href}
            /* Secondary: ghost, matching the hero. Steps back so the
               page has one obvious action. */
            className="group relative inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-md px-8 py-3.5 bg-transparent border border-white/[0.18] text-white font-semibold text-[1.0625rem] transition-all duration-300 ease-out hover:bg-white/[0.06] hover:border-[#ff950e]/75 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <ShoppingBag className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            {CTA_CONTENT.secondaryButton.text}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}