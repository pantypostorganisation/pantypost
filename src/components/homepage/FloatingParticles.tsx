// src/components/homepage/FloatingParticles.tsx
'use client';

import { motion } from 'framer-motion';
import { floatVariants } from '@/utils/motion.config';
import { generateParticlePositions } from '@/utils/homepage-constants';

export default function FloatingParticles() {
  const particlePositions = generateParticlePositions(45);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particlePositions.map((particle, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${
            i % 4 === 0 ? 'w-1.5 h-1.5 bg-[#ff950e]/10' : 
            i % 4 === 1 ? 'w-1 h-1 bg-[#ff950e]/15' : 
            i % 4 === 2 ? 'w-2 h-2 bg-[#ff950e]/10' :
            'w-1 h-1 bg-[#ff950e]/20'
          }`}
          style={{ 
            left: `${particle.left}%`,
            top: `${particle.top}%` 
          }}
          variants={floatVariants}
          initial="initial"
          animate="animate"
          transition={{ 
            delay: particle.delay,
            duration: particle.duration
          }}
        />
      ))}
    </div>
  );
}
