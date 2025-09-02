// src/components/homepage/TrustBadges.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Shield, CreditCard, Lock } from 'lucide-react';
import { itemVariants, containerVariants } from '@/utils/motion.config';
import type { LucideIcon } from 'lucide-react';

// Define proper types for the badges
type IconBadge = {
  type: 'icon';
  Icon: LucideIcon;
  text: string;
};

type ImageBadge = {
  type: 'image';
  src: string;
  text: string;
};

type TrustBadge = IconBadge | ImageBadge;

export default function TrustBadges() {
  // Define badges with proper typing
  const trustBadges: TrustBadge[] = [
    { type: 'icon', Icon: Shield, text: 'Secure & Private' },
    { type: 'image', src: '/verification_badge.png', text: 'Verified Sellers' },
    { type: 'icon', Icon: CreditCard, text: 'Safe Payments' },
    { type: 'icon', Icon: Lock, text: 'Encrypted' },
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
          {badge.type === 'image' ? (
            <div className="w-3.5 h-3.5 relative group-hover:scale-110 transition-transform duration-200">
              <Image
                src={badge.src}
                alt="Verification Badge"
                width={14}
                height={14}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <badge.Icon className="w-3.5 h-3.5 text-[#ff950e] group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
          )}
          <span className="font-medium select-none">{badge.text}</span>
        </motion.span>
      ))}
    </motion.div>
  );
}
