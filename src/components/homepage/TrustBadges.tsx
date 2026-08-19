// src/components/homepage/TrustBadges.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { itemVariants, containerVariants } from '@/utils/motion.config';

// Define proper types for the badges
type ImageBadge = {
  type: 'image';
  src: string;
  text: string;
};

type TrustBadge = ImageBadge;

export default function TrustBadges() {
  // Define badges with all new images
  const trustBadges: TrustBadge[] = [
    { type: 'image', src: '/security_badge.png', text: 'Secure & Private' },
    { type: 'image', src: '/verification_badge.png', text: 'Verified Sellers' },
    { type: 'image', src: '/card_badge.png', text: 'Safe Payments' },
    { type: 'image', src: '/encrypted_badge.png', text: 'Encrypted' },
  ];

  return (
    <motion.div 
      /* One 34rem block shared with the CTA buttons above -- see the
         matching comment in HeroSection.module.css. Four equal columns
         of 8.125rem (130px) + three 0.5rem gaps = 34rem, so the chips'
         outer edges sit flush with the buttons' outer edges. Budget per
         chip: the longest label ("Secure & Private") is ~87px at 11px
         Inter Medium, + 38px of icon/gap/padding/borders = ~125px,
         leaving 5px slack. If a label ever gets longer, re-check that
         budget before it silently wraps.

         Radius is rounded-sm ON PURPOSE, not drift. The buttons use
         0.75rem on a 52px-tall element (23% of height); the same
         0.75rem on a 34px chip curves through far more of the edge and
         reads rounder despite being the identical number -- verified:
         both resolved to 0.75rem before this change. 0.5rem is the
         chip-height equivalent of the buttons' curvature. mt-4 makes
         the row gap equal the buttons' own 1rem gap. */
      className="grid grid-cols-2 gap-2 mt-4 w-full sm:grid-cols-4 sm:w-[34rem]" 
      variants={containerVariants}
      role="region"
      aria-label="Trust and security indicators"
    >
      {trustBadges.map((badge, index) => (
        <motion.span
          key={`trust-badge-${index}`}
          className="flex items-center justify-center gap-1.5 bg-white/5 backdrop-blur-lg text-gray-200 px-2 py-2 sm:py-1.5 rounded-sm border border-white/10 shadow-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-md hover:scale-105 group cursor-default"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.05,
            transition: { duration: 0.2 }
          }}
          role="img"
          aria-label={`Trust indicator: ${badge.text}`}
        >
          <div className="w-3.5 h-3.5 relative group-hover:scale-110 transition-transform duration-200">
            <Image
              src={badge.src}
              alt={`${badge.text} Badge`}
              width={14}
              height={14}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-medium select-none whitespace-nowrap text-[11px]">{badge.text}</span>
        </motion.span>
      ))}
    </motion.div>
  );
}

