// src/components/homepage/FAQSection.tsx
'use client';

import { motion } from 'framer-motion';
import { Wallet, Gavel, Shield, Crown } from 'lucide-react';
import { containerVariants, itemVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';

const FAQ_ITEMS = [
  {
    icon: Wallet,
    iconColor: 'text-green-400',
    question: 'How does your wallet system protect buyers from scams?',
    answer:
      'Panty Post uses a secure escrow-style wallet system. When you make a purchase, funds are held in your wallet balance until the order is confirmed. If any issues arise, our admin team can credit or debit accounts to resolve disputes, making scams extremely rare. All transactions are tracked and transparent.'
  },
  {
    icon: Crown,
    iconColor: 'text-[#ff950e]',
    question: 'What are seller tiers and how do they benefit me?',
    answer:
      'Sellers on Panty Post progress through five tiers (Tease, Flirt, Obsession, Desire, Goddess) based on sales volume. Higher tiers unlock better revenue shares, reduced platform fees, and exclusive features. Buyers benefit from a premium subscription system that grants access to exclusive content from their favorite verified sellers.'
  },
  {
    icon: Gavel,
    iconColor: 'text-purple-400',
    question: 'How do auctions work on Panty Post?',
    answer:
      'Our auction system lets sellers create competitive bidding listings with optional reserve prices. When you place a bid, funds are securely held in your wallet. If you\'re outbid, you\'re automatically refunded. Winners are charged only once at auction end, and sellers receive 80% of the final bid (20% platform fee). It\'s transparent, secure, and exciting!'
  },
  {
    icon: Shield,
    iconColor: 'text-blue-400',
    question: 'What makes Panty Post safer than other platforms?',
    answer:
      'Beyond our wallet escrow system, we verify seller identities, monitor all transactions in real-time, and maintain a dedicated admin team that can intervene in disputes. Every payment is tracked, refunds are instant, and our rate-limiting prevents fraud. Plus, encrypted messaging keeps your conversations private.'
  }
];

export default function FAQSection() {
  return (
    <section
      className="bg-gradient-to-b from-black to-[#101010] pt-16 pb-16 md:pt-20 md:pb-20 relative z-35 overflow-hidden"
      aria-labelledby="homepage-faq-title"
    >
      {/* Enhanced Shape Divider with matching style */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] md:w-[70%] h-[400px] pointer-events-none z-0"
        initial="hidden" 
        whileInView="visible" 
        viewport={VIEWPORT_CONFIG} 
        variants={shapeVariants}
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/8 via-[#ff950e]/3 to-transparent blur-3xl rounded-[50%_50%_50%_50%/60%_40%_60%_40%] animate-spin-slow"></div>
      </motion.div>

      <div className="mx-auto max-w-6xl px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={containerVariants}
          className="mx-auto max-w-3xl text-center mb-12 sm:mb-16"
        >
          <motion.h2
            id="homepage-faq-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4"
            variants={itemVariants}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-gray-400"
            variants={itemVariants}
          >
            Learn how Panty Post's unique features keep buyers and sellers safe while maximizing earnings
          </motion.p>
        </motion.div>

        <div className="grid gap-6">
          {FAQ_ITEMS.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.question}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className="group relative bg-[#131313] rounded-2xl p-6 sm:p-8 text-left border border-white/10 hover:border-[#ff950e]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff950e]/10"
              >
                {/* Enhanced shine effect on hover - matching Features section */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                </div>

                <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Icon with gradient background - matching Features section style */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#ff950e]/10 to-[#ff950e]/5 rounded-2xl flex items-center justify-center border border-[#ff950e]/20 group-hover:scale-110 transition-transform duration-300">
                      <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${item.iconColor}`} aria-hidden="true" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 group-hover:text-[#ff950e] transition-colors duration-300">
                      {item.question}
                    </h3>
                    <p className="text-sm sm:text-base leading-relaxed text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Optional: Add a CTA at the bottom */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-sm sm:text-base">
            Still have questions?{' '}
            <a 
              href="/help" 
              className="text-[#ff950e] hover:text-[#ffb347] font-semibold transition-colors underline-offset-4 hover:underline"
            >
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
