// src/components/signup/SignupHeader.tsx
'use client';

import { motion } from 'framer-motion';
import { SignupHeaderProps } from '@/types/signup';

export default function SignupHeader({ onLogoClick }: SignupHeaderProps) {
  return (
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex justify-center mb-4">
        <motion.img
          src="/logo.png"
          alt="PantyPost logo"
          className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer"
          style={{ width: '160px', height: '160px' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogoClick}
        />
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
      <p className="text-gray-400 text-sm">Join the PantyPost community</p>
    </motion.div>
  );
}
