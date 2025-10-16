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
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3 bg-gradient-to-r from-[#ff950e] to-[#ffb347] text-black font-semibold text-base transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/40 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{ color: '#000' }}
          >
            <TrendingUp className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            <span className="relative z-10">{CTA_CONTENT.primaryButton.text}</span>
          </Link>
          
          <Link
            href={CTA_CONTENT.secondaryButton.href}
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3 bg-black border border-[#ff950e]/60 text-[#ff950e] font-semibold text-base transition-all duration-300 ease-out hover:scale-105 hover:bg-[#111] hover:border-[#ff950e] hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <ShoppingBag className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-[-2px]" />
            {CTA_CONTENT.secondaryButton.text}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}