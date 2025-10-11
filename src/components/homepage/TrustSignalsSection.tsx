// src/components/homepage/TrustSignalsSection.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Shield, CreditCard, Users } from 'lucide-react';
import { itemVariants, containerVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { sanitizeStrict } from '@/utils/security/sanitization';
import AnimatedUserCounter from './AnimatedUserCounter';

// Define trust signals directly here with the verification badge
const TRUST_SIGNALS = [
  {
    icon: Shield,
    iconType: 'component',
    title: 'Privacy First',
    desc: 'Your identity is always protected.'
  },
  {
    icon: '/verification_badge.png',
    iconType: 'image',
    title: 'Verified Sellers',
    desc: 'Manually reviewed for authenticity.'
  },
  {
    icon: CreditCard,
    iconType: 'component',
    title: 'Secure Payments',
    desc: 'Encrypted and safe transactions.'
  },
  {
    icon: Users,
    iconType: 'component',
    title: '24/7 Support',
    desc: 'Our team is here to help anytime.'
  }
];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <motion.div className="sm:col-span-2 lg:col-span-2" variants={itemVariants}>
            <AnimatedUserCounter className="h-full" showNewUsersToday />
          </motion.div>

          {TRUST_SIGNALS.map((item) => (
            <motion.div key={item.title} className="flex flex-col items-center" variants={itemVariants}>
              {item.iconType === 'image' ? (
                <div className="h-7 w-7 mb-3 transition-transform duration-300 hover:scale-110 relative">
                  <Image
                    src={item.icon as string}
                    alt="Verification Badge"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <item.icon className="h-7 w-7 text-[#ff950e] mb-3 transition-transform duration-300 hover:scale-110" />
              )}
              <span className="text-white font-medium text-sm">{sanitizeStrict(item.title)}</span>
              <p className="text-gray-400 text-xs mt-1">{sanitizeStrict(item.desc)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
