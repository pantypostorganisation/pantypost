// src/components/signup/SignupFooter.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { SignupFooterProps } from '@/types/signup';

export default function SignupFooter({}: SignupFooterProps) {
  return (
    <motion.div
      className="text-center mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <p className="text-base text-gray-500">
        Already have an account{' '}
        <span aria-hidden="true">?</span>
        <span className="sr-only">?</span>{' '}
        <Link href="/login" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
