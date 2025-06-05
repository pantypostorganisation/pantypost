// src/components/homepage/TrustBadges.tsx
'use client';

import { motion } from 'framer-motion';
import { itemVariants, containerVariants } from '@/utils/motion.config';
import { TRUST_BADGES } from '@/utils/homepage-constants';

export default function TrustBadges() {
  return (
    <motion.div 
      className="flex gap-2.5 mt-6 flex-wrap justify-center md:justify-start" 
      variants={containerVariants}
    >
      {TRUST_BADGES.map((badge, index) => (
        <motion.span
          key={index}
          className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-3 py-1.5 rounded-full text-xs border border-white/10 shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-md"
          variants={itemVariants}
        >
          <badge.icon className="w-3.5 h-3.5 text-[#ff950e]" /> {badge.text}
        </motion.span>
      ))}
    </motion.div>
  );
}
