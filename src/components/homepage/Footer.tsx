// src/components/homepage/Footer.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { FOOTER_LINKS } from '@/utils/homepage-constants';

// Inline the HelpCircle icon to avoid Turbopack issues
const HelpCircleIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="inline-block"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <path d="M12 17h.01"></path>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-black via-[#030303] to-[#050505] pt-16 pb-16 md:pt-20 md:pb-20 relative z-50 overflow-hidden">
      {/* Shape Divider 4 (Background Glow) */}
      <motion.div
        className="absolute -top-52 left-[-15%] md:left-[-5%] w-[130%] md:w-[80%] h-96 pointer-events-none z-0"
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.1 }} 
        variants={shapeVariants}
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/5 via-transparent to-transparent blur-3xl rounded-[30%_70%_50%_50%/60%_40%_70%_40%] animate-spin-medium"></div>
      </motion.div>

      {/* Content container */}
      <div className="relative max-w-7xl mx-auto px-6 md:px-8 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-xl font-bold text-[#ff950e]">Panty Post</h2>
            <p className="text-gray-500 text-sm mt-1">
              The premium marketplace for authentic items
            </p>
          </div>
          
          <div className="flex gap-6 md:gap-8">
            {FOOTER_LINKS.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="text-gray-400 hover:text-[#ff950e] text-sm transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Panty Post (PantyPost). All rights reserved.
            <span className="block mt-2 text-xs text-gray-600">
              Disclaimer: Panty Post is committed to user safety and privacy. 
              All users must be 21+ and comply with our terms.
            </span>
          </p>
          
          <div className="mt-4">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-[#ff950e] hover:underline text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] rounded"
            >
              <HelpCircleIcon />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}