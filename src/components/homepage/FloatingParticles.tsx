// src/components/homepage/FloatingParticles.tsx
'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// ✅ OPTIMIZED: Check for reduced motion preference
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

export default function FloatingParticles() {
  const prefersReducedMotion = useReducedMotion();

  // ✅ OPTIMIZED: Respect accessibility preferences
  if (prefersReducedMotion) {
    return null; // Don't render particles for motion-sensitive users
  }

  // ✅ OPTIMIZED: Memoized particle generation for better performance
  const particles = useMemo(() => {
    const particlesArray = [];
    const particleCount = 35; // Reduced from 40 for better performance
    
    for (let i = 0; i < particleCount; i++) {
      particlesArray.push({
        id: i + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        size: Math.random() > 0.7 ? 'w-2 h-2' : Math.random() > 0.4 ? 'w-1.5 h-1.5' : 'w-1 h-1',
        duration: 10 + Math.random() * 8, // Slightly reduced duration range
        horizontalDrift: (Math.random() - 0.5) * 80, // Reduced drift for smoother animation
        opacity: 0.3 + Math.random() * 0.5, // Variable opacity for depth
      });
    }
    return particlesArray;
  }, []);

  // ✅ OPTIMIZED: Memoized shimmer particles with better distribution
  const shimmerParticles = useMemo(() => {
    return particles.slice(0, 8).map((particle) => ({
      ...particle,
      left: (particle.left + 5) % 100,
      top: (particle.top + 10) % 100,
      id: `shimmer-${particle.id}`,
    }));
  }, [particles]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" role="presentation" aria-hidden="true">
      {/* Main particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.size}`}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            // ✅ OPTIMIZED: Enhanced gradient with better performance
            background: `radial-gradient(circle at 30% 30%, rgba(255, 149, 14, ${particle.opacity}), rgba(255, 149, 14, ${particle.opacity * 0.5}))`,
            boxShadow: `
              0 0 8px rgba(255, 149, 14, ${particle.opacity * 0.4}),
              0 0 16px rgba(255, 149, 14, ${particle.opacity * 0.2}),
              inset -1px -1px 2px rgba(255, 255, 255, 0.1),
              inset 1px 1px 1px rgba(255, 149, 14, 0.2)
            `,
            filter: 'blur(0.3px)',
            willChange: 'transform, opacity', // ✅ OPTIMIZED: Performance hint
          }}
          animate={{
            y: [-80, -250],
            x: [0, particle.horizontalDrift, 0],
            opacity: [0, particle.opacity, particle.opacity, 0],
            scale: [0.8, 1.1, 0.8],
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
      
      {/* ✅ OPTIMIZED: Enhanced shimmer particles with better performance */}
      {shimmerParticles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-0.5 h-0.5 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            background: 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.6)',
            willChange: 'transform, opacity', // ✅ OPTIMIZED: Performance hint
          }}
          animate={{
            y: [-40, -200],
            x: [0, particle.horizontalDrift * 0.4, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: particle.duration * 0.7,
            delay: particle.delay + 0.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* ✅ NEW: Subtle background glow for depth */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-[#ff950e]/5 via-transparent to-transparent"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ willChange: 'opacity' }}
      />
    </div>
  );
}
