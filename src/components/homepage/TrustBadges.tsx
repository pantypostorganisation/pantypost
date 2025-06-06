// src/components/homepage/TrustBadges.tsx
'use client';

import { motion } from 'framer-motion';
import { Shield, Star, CreditCard, Lock } from 'lucide-react';
import { itemVariants, containerVariants } from '@/utils/motion.config';

export default function TrustBadges() {
  // Define badges directly here instead of importing from constants
  // This ensures the icons are properly imported and available
  const trustBadges = [
    { Icon: Shield, text: 'Secure & Private' },
    { Icon: Star, text: 'Verified Sellers' },
    { Icon: CreditCard, text: 'Safe Payments' },
    { Icon: Lock, text: 'Encrypted' },
  ];

  return (
    <motion.div 
      className="flex gap-2.5 mt-6 flex-wrap" 
      variants={containerVariants}
      role="region"
      aria-label="Trust and security indicators"
    >
      {trustBadges.map((badge, index) => (
        <motion.span
          key={`trust-badge-${index}`}
          className="flex items-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-3 py-1.5 rounded-full text-xs border border-white/10 shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-md hover:scale-105 group cursor-default"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
          role="img"
          aria-label={`Trust indicator: ${badge.text}`}
        >
          <badge.Icon className="w-3.5 h-3.5 text-[#ff950e] group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
          <span className="font-medium select-none">{badge.text}</span>
        </motion.span>
      ))}
    </motion.div>
  );
}
