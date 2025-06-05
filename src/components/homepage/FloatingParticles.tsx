// src/components/homepage/FloatingParticles.tsx
'use client';

import { motion } from 'framer-motion';

export default function FloatingParticles() {
  // Generate more particles with random properties
  const generateParticles = () => {
    const particlesArray = [];
    const particleCount = 40; // Increased from 15 to 40
    
    for (let i = 0; i < particleCount; i++) {
      particlesArray.push({
        id: i + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() > 0.5 ? 'w-1 h-1' : Math.random() > 0.5 ? 'w-1.5 h-1.5' : 'w-2 h-2',
        duration: 10 + Math.random() * 10, // Random duration between 10-20s
        horizontalDrift: (Math.random() - 0.5) * 100, // Random drift left or right
      });
    }
    return particlesArray;
  };

  const particles = generateParticles();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.size}`}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            // Create sheen effect with gradient and glow
            background: `radial-gradient(circle at 30% 30%, rgba(255, 149, 14, 0.4), rgba(255, 149, 14, 0.2))`,
            boxShadow: `
              0 0 10px rgba(255, 149, 14, 0.3),
              0 0 20px rgba(255, 149, 14, 0.2),
              inset -2px -2px 4px rgba(255, 255, 255, 0.2),
              inset 1px 1px 2px rgba(255, 149, 14, 0.3)
            `,
            filter: 'blur(0.5px)',
          }}
          animate={{
            y: [-100, -300],
            x: [0, particle.horizontalDrift, 0], // Random horizontal movement
            opacity: [0, 0.8, 0.8, 0],
            scale: [0.8, 1.2, 0.8], // Subtle pulsing effect
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
        />
      ))}
      
      {/* Add some extra shimmer particles */}
      {particles.slice(0, 10).map((particle) => (
        <motion.div
          key={`shimmer-${particle.id}`}
          className="absolute w-0.5 h-0.5 rounded-full"
          style={{
            left: `${(particle.left + 5) % 100}%`,
            top: `${(particle.top + 10) % 100}%`,
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
          }}
          animate={{
            y: [-50, -250],
            x: [0, particle.horizontalDrift * 0.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration * 0.7,
            delay: particle.delay + 0.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
