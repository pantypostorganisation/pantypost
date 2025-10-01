// src/components/homepage/TrustSignalsSection.tsx
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Shield, CreditCard, Users, FileCheck, Headphones } from 'lucide-react';
import { itemVariants, containerVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { sanitizeStrict } from '@/utils/security/sanitization';

const TRUST_SIGNALS = [
  {
    iconType: 'component' as const,
    icon: Shield,
    title: 'Privacy first',
    desc: 'Multi-layer identity protection keeps every interaction discreet.',
  },
  {
    iconType: 'image' as const,
    icon: '/verification_badge.png',
    title: 'Verified storefronts',
    desc: 'Every seller is manually reviewed by our compliance team.',
  },
  {
    iconType: 'component' as const,
    icon: CreditCard,
    title: 'Escrowed payments',
    desc: 'Funds are held securely until both parties confirm delivery.',
  },
  {
    iconType: 'component' as const,
    icon: Users,
    title: 'Round-the-clock support',
    desc: 'Specialists on duty 24/7 for buyers and sellers worldwide.',
  },
] as const;

const SUPPORT_POINTS = [
  'Dedicated trust & safety agents monitoring the marketplace daily.',
  'Fraud analytics flag suspicious behaviour before it reaches you.',
  'Encrypted messaging and redacted file sharing for every account.',
] as const;

const POLICY_POINTS = [
  'Age verification and AML screening for payouts.',
  'Chargeback protection with documented fulfilment evidence.',
  'GDPR and CCPA aligned data retention controls.',
] as const;

export default function TrustSignalsSection() {
  return (
    <section
      id="trust"
      className="relative bg-gradient-to-b from-[#101010] to-black pt-12 md:pt-16 pb-16 md:pb-20 z-20 overflow-hidden"
      aria-labelledby="trust-section-title"
    >
      {/* Shape Divider 1 (Background Glow) */}
      <motion.div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[150%] md:w-[100%] lg:w-[80%] h-80 pointer-events-none z-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={shapeVariants}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/15 via-[#ff950e]/5 to-transparent blur-3xl rounded-[50%_30%_70%_40%/60%_40%_60%_50%] animate-spin-slow-reverse"></div>
      </motion.div>

      <div className="relative max-w-6xl mx-auto px-6 md:px-8 z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_CONFIG}
          variants={containerVariants}
        >
          <motion.span
            className="inline-flex items-center justify-center rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#ff950e]"
            variants={itemVariants}
          >
            Trust & safety
          </motion.span>
          <motion.h2
            id="trust-section-title"
            className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight"
            variants={itemVariants}
          >
            Infrastructure that makes every transaction production-grade
          </motion.h2>
          <motion.p
            className="mt-4 text-gray-400 text-base md:text-lg leading-relaxed"
            variants={itemVariants}
          >
            We blend human moderation with automated safeguards so you can focus on building relationships—not troubleshooting platform risk.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-12 items-start">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={containerVariants}
            role="list"
            aria-label="Key trust pillars"
          >
            {TRUST_SIGNALS.map((item, index) => (
              <motion.div
                key={`${item.title}-${index}`}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-lg shadow-black/20 transition-transform duration-300 hover:-translate-y-1"
                variants={itemVariants}
                role="listitem"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                {item.iconType === 'image' ? (
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff950e]/10">
                    <Image
                      src={item.icon}
                      alt="Verification badge"
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff950e]/10 text-[#ff950e]">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {sanitizeStrict(item.title)}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {sanitizeStrict(item.desc)}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT_CONFIG}
            variants={containerVariants}
          >
            <motion.div
              className="rounded-3xl border border-[#ff950e]/20 bg-gradient-to-br from-[#151515] via-[#101010] to-[#0a0a0a] p-6 shadow-lg shadow-[#ff950e]/10"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-[#ff950e]" aria-hidden="true" />
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff950e]">
                  Concierge support
                </p>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                {SUPPORT_POINTS.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-[#ff950e]" aria-hidden="true" />
                    <p className="leading-relaxed">{sanitizeStrict(point)}</p>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-white/10 bg-[#111111] p-6"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-[#ff950e]" aria-hidden="true" />
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff950e]">
                  Compliance ready
                </p>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                {POLICY_POINTS.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-white/60" aria-hidden="true" />
                    <p className="leading-relaxed">{sanitizeStrict(point)}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
