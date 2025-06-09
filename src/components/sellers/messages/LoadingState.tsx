// src/components/sellers/messages/LoadingState.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        {/* Loading Animation */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-purple-500/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border-4 border-pink-500/30 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"
          />
        </div>
        
        {/* Loading Text */}
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gray-400 font-medium"
        >
          Loading messages...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoadingState;