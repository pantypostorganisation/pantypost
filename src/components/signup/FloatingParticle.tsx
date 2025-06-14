// src/components/signup/FloatingParticle.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FloatingParticleProps {
  delay?: number;
}

export default function FloatingParticle({ delay = 0 }: FloatingParticleProps) {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  // Random color variation - mix orange and white particles
  const colors = [
    'bg-[#ff950e]/30', // Orange
    'bg-[#ff950e]/20', // Lighter orange
    'bg-white/20',     // White
    'bg-white/30',     // Brighter white
    'bg-[#ff6b00]/25'  // Orange variant
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      className={`absolute w-1 h-1 ${randomColor} rounded-full`}
      initial={{ 
        x: Math.random() * dimensions.width, 
        y: dimensions.height + 10,
        opacity: 0 
      }}
      animate={{
        y: -10,
        opacity: [0, 1, 1, 0],
        x: Math.random() * dimensions.width,
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}