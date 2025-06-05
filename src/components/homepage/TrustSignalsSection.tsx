// src/components/homepage/TrustSignalsSection.tsx
'use client';

import { motion } from 'framer-motion';
import { itemVariants, containerVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { TRUST_SIGNALS } from '@/utils/homepage-constants';

export default function TrustSignalsSection() {
  return (
    <div className="bg-gradient-to-b from-[#101010] to-black pt-8 md:pt-12 pb-16 md:pb-20 relative z-20 overflow-hidden">
      {/* Shape Divider 1 (Background Glow) */}
      <motion.div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[150%] md:w-[100%] lg:w-[80%] h-80 pointer-events-none z-0"
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.2 }} 
        variants={shapeVariants}
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/15 via-[#ff950e]/5 to-transparent blur-3xl rounded-[50%_30%_70%_40%/60%_40%_60%_50%] animate-spin-slow-reverse"></div>
      </motion.div>

      {/* Content container */}
      <motion.div
        className="relative max-w-5xl mx-auto px-6 md:px-8 z-10"
        initial="hidden" 
        whileInView="visible" 
        viewport={VIEWPORT_CONFIG} 
        variants={containerVariants}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {TRUST_SIGNALS.map((item, index) => (
            <motion.div key={index} className="flex flex-col items-center" variants={itemVariants}>
              <item.icon className="h-7 w-7 text-[#ff950e] mb-3 transition-transform duration-300 hover:scale-110" />
              <span className="text-white font-medium text-sm">{item.title}</span>
              <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}