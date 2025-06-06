// src/components/homepage/FloatingParticles.tsx
'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

// ✅ OPTIMIZED: Check for reduced motion preference
const useReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

// ✅ FIXED: Deterministic particle generation based on index
const generateDeterministicParticles = (count: number) => {
  const particles = [];
  
  // Use mathematical patterns instead of Math.random() for deterministic results
  for (let i = 0; i < count; i++) {
    // Create pseudo-random values based on index
    const seed = i * 137.5; // Prime number for better distribution
    const x = ((seed * 9.7) % 100);
    const y = ((seed * 13.3) % 100);
    const delay = ((seed * 0.11) % 5);
    const duration = 10 + ((seed * 0.17) % 8);
    const sizeRand = ((seed * 0.23) % 10);
    const horizontalDrift = ((seed * 0.29) % 80) - 40; // -40 to 40
    const opacity = 0.3 + ((seed * 0.31) % 50) / 100; // 0.3 to 0.8
    
    // Determine size based on calculated value
    let size = 'w-1 h-1';
    if (sizeRand > 7) {
      size = 'w-2 h-2';
    } else if (sizeRand > 4) {
      size = 'w-1.5 h-1.5';
    }
    
    particles.push({
      id: i + 1,
      left: x,
      top: y,
      delay: delay,
      size: size,
      duration: duration,
      horizontalDrift: horizontalDrift,
      opacity: opacity,
    });
  }
  
  return particles;
};

export default function FloatingParticles() {
  const prefersReducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  // ✅ FIXED: Only render particles after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ OPTIMIZED: Respect accessibility preferences
  if (prefersReducedMotion) {
    return null; // Don't render particles for motion-sensitive users
  }

  // ✅ FIXED: Generate particles with deterministic values
  const particles = useMemo(() => {
    const particleCount = 35; // Reduced from 40 for better performance
    return generateDeterministicParticles(particleCount);
  }, []);

  // ✅ FIXED: Generate shimmer particles deterministically
  const shimmerParticles = useMemo(() => {
    return particles.slice(0, 8).map((particle) => ({
      ...particle,
      left: (particle.left + 5) % 100,
      top: (particle.top + 10) % 100,
      id: `shimmer-${particle.id}`,
    }));
  }, [particles]);

  // ✅ FIXED: Don't render particles on server to avoid hydration mismatch
  if (!isClient) {
    return null;
  }

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
