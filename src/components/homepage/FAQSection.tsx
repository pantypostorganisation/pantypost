// src/components/homepage/FAQSection.tsx
'use client';

import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/utils/motion.config';

const FAQ_ITEMS = [
  {
    question: 'What is PantyPost and how does it work?',
    answer:
      'PantyPost is a discreet marketplace that connects verified sellers with qualified buyers of used panties. Create a free account, browse curated listings, and complete secure, anonymous transactions backed by our privacy-first platform.'
  },
  {
    question: 'Is PantyPost the same as Panty Post?',
    answer:
      'Yes. PantyPost—also known as Panty Post—is our official brand. Using either spelling will bring you to the same trusted community marketplace dedicated to safe, adult-only panty trading experiences.'
  },
  {
    question: 'How does PantyPost keep buyers and sellers safe?',
    answer:
      'We combine ID verification, automated moderation, and secure escrow-style payments to keep every PantyPost transaction anonymous and protected. Dedicated support specialists monitor the marketplace around the clock to maintain a compliant environment.'
  },
  {
    question: 'Can I sell other adult content on PantyPost?',
    answer:
      'PantyPost focuses on intimate apparel, scent items, and add-on experiences that complement used panty sales. Our team regularly reviews listings to ensure they match what shoppers search for when they look for PantyPost or Panty Post online.'
  }
];

export default function FAQSection() {
  return (
    <section
      className="bg-[#0b0b0b] border-t border-white/5"
      aria-labelledby="homepage-faq-title"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={containerVariants}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2
            id="homepage-faq-title"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4"
            variants={itemVariants}
          >
            Frequently Asked Questions About PantyPost
          </motion.h2>
          <motion.p
            className="text-base sm:text-lg text-gray-400"
            variants={itemVariants}
          >
            Learn more about the PantyPost marketplace—sometimes called Panty Post—and how we help adult shoppers connect safely with verified sellers.
          </motion.p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:mt-16">
          {FAQ_ITEMS.map((item) => (
            <motion.div
              key={item.question}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="rounded-2xl border border-white/10 bg-black/60 p-6 text-left shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur"
            >
              <h3 className="text-xl font-semibold text-white mb-3">
                {item.question}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-gray-400">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
