// src/components/homepage/Footer.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { FOOTER_LINKS } from '@/utils/homepage-constants';

const FOOTER_NAV = [
  {
    heading: 'Marketplace',
    links: [
      { href: '/browse', label: 'Browse listings' },
      { href: '/browse?filter=auctions', label: 'Live auctions' },
      { href: '/login', label: 'Start selling' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { href: '/help', label: 'Help centre' },
      { href: '/contact', label: 'Contact us' },
      { href: '/help#safety', label: 'Safety guide' },
    ],
  },
  {
    heading: 'Legal',
    links: FOOTER_LINKS,
  },
] as const;

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
    <footer className="bg-gradient-to-b from-black to-[#050505] pt-16 pb-12 relative z-50 overflow-hidden">
      <motion.div
        className="absolute -top-52 left-[-15%] md:left-[-5%] w-[130%] md:w-[80%] h-96 pointer-events-none z-0"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={shapeVariants}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/5 via-transparent to-transparent blur-3xl rounded-[30%_70%_50%_50%/60%_40%_70%_40%] animate-spin-medium"></div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-8 z-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <h2 className="text-2xl font-bold text-[#ff950e]">PantyPost</h2>
            <p className="mt-2 text-sm text-gray-400">
              The premium peer-to-peer marketplace for discreet, authenticated experiences.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm font-semibold text-white">Stay in the loop</p>
              <p className="mt-2 text-xs text-gray-400">
                Join our monthly compliance newsletter to receive seller growth insights and safety updates.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#ff950e]/50 bg-[#ff950e]/10 px-4 py-2 text-xs font-semibold text-[#ff950e] transition-colors hover:bg-[#ff950e]/20 hover:text-white"
              >
                Create an account
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-sm text-gray-400">
            {FOOTER_NAV.map((section) => (
              <div key={section.heading}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ff950e]">{section.heading}</p>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} PantyPost. All rights reserved.
          </p>
          <p className="mt-3 text-xs text-gray-600 max-w-3xl mx-auto">
            PantyPost operates a zero-tolerance policy for minors, trafficking, and any illegal activity. All users must be 21+ and pass verification checks to transact on the platform.
          </p>

          <div className="mt-6">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-[#ff950e] hover:underline text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] rounded"
            >
              <HelpCircleIcon />
              Contact support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
