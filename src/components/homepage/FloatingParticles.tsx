// src/components/homepage/FloatingParticles.tsx
'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

// Enhanced reduced motion detection with error handling
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setPrefersReducedMotion(false);
        return;
      }
      
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } catch (error) {
      console.error('Error detecting reduced motion preference:', error);
      setPrefersReducedMotion(false);
    }
  }, []);

  return prefersReducedMotion;
};

// Enhanced particle configuration with preference for smaller particles
const PARTICLE_CONFIG = {
  count: 40, // Increased count for more particles
  baseSize: {
    small: 'w-1 h-1',      // Most common
    medium: 'w-1.5 h-1.5', // Less common
    large: 'w-2 h-2'       // Rare
  },
  animationDuration: {
    min: 12,
    max: 20
  },
  drift: {
    horizontal: 60,
    vertical: { min: -60, max: -200 }
  },
  opacity: {
    min: 0.2,
    max: 0.6
  },
  shimmerCount: 10,
  blurAmount: 0.5
} as const;

// Particle type definition for better type safety
interface Particle {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: string;
  duration: number;
  horizontalDrift: number;
  verticalDrift: number;
  opacity: number;
  hue: number;
}

interface ShimmerParticle extends Omit<Particle, 'size'> {
  shimmerIntensity: number;
}

// Deterministic pseudo-random number generator
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export default function FloatingParticles() {
  const prefersReducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  // Generate particles with deterministic positioning
  // MUST be called before any conditional returns to follow Rules of Hooks
  const particles = useMemo<Particle[]>(() => {
    const particlesArray: Particle[] = [];
    
    for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
      const seed = i * 1000;
      
      // Deterministic "random" values using seeded random
      const rand1 = seededRandom(seed);
      const rand2 = seededRandom(seed + 1);
      const rand3 = seededRandom(seed + 2);
      const rand4 = seededRandom(seed + 3);
      const rand5 = seededRandom(seed + 4);
      const rand6 = seededRandom(seed + 5);
      const rand7 = seededRandom(seed + 6);
      
      // Heavily favor small particles (80% small, 15% medium, 5% large)
      let size: string;
      if (rand3 < 0.8) {
        size = PARTICLE_CONFIG.baseSize.small;
      } else if (rand3 < 0.95) {
        size = PARTICLE_CONFIG.baseSize.medium;
      } else {
        size = PARTICLE_CONFIG.baseSize.large;
      }
      
      particlesArray.push({
        id: i + 1,
        left: rand1 * 100,
        top: rand2 * 100,
        delay: rand3 * 5,
        size: size,
        duration: PARTICLE_CONFIG.animationDuration.min + 
                 rand4 * (PARTICLE_CONFIG.animationDuration.max - PARTICLE_CONFIG.animationDuration.min),
        horizontalDrift: (rand5 - 0.5) * PARTICLE_CONFIG.drift.horizontal,
        verticalDrift: PARTICLE_CONFIG.drift.vertical.min + 
                      rand6 * (PARTICLE_CONFIG.drift.vertical.max - PARTICLE_CONFIG.drift.vertical.min),
        opacity: PARTICLE_CONFIG.opacity.min + 
                rand7 * (PARTICLE_CONFIG.opacity.max - PARTICLE_CONFIG.opacity.min),
        hue: (rand1 * 30) - 15 // -15 to +15 degrees hue variation
      });
    }
    
    return particlesArray;
  }, []);

  // Generate shimmer particles
  const shimmerParticles = useMemo<ShimmerParticle[]>(() => {
    return particles.slice(0, PARTICLE_CONFIG.shimmerCount).map((particle, index) => ({
      ...particle,
      left: (particle.left + 5) % 100,
      top: (particle.top + 10) % 100,
      id: particle.id + 1000,
      shimmerIntensity: 0.4 + seededRandom(particle.id * 100) * 0.4
    }));
  }, [particles]);

  // Only render particles on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Respect accessibility preferences
  // This MUST come after all hooks
  if (prefersReducedMotion || !isClient) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none" 
      role="presentation" 
      aria-hidden="true"
    >
      {/* Main particles */}
      {particles.map((particle) => (
        <motion.div
          key={`particle-${particle.id}`}
          className={`absolute rounded-full ${particle.size}`}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            background: `radial-gradient(circle at 30% 30%, 
              hsl(${39 + particle.hue}, 100%, 65%, ${particle.opacity}), 
              hsl(${39 + particle.hue}, 100%, 55%, ${particle.opacity * 0.5}))`,
            boxShadow: `
              0 0 6px hsla(${39 + particle.hue}, 100%, 60%, ${particle.opacity * 0.3}),
              0 0 12px hsla(${39 + particle.hue}, 100%, 60%, ${particle.opacity * 0.15})
            `,
            filter: `blur(${PARTICLE_CONFIG.blurAmount}px)`,
            willChange: 'transform, opacity',
          }}
          animate={{
            y: [0, particle.verticalDrift],
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
      
      {/* Shimmer particles (even smaller) */}
      {shimmerParticles.map((particle) => (
        <motion.div
          key={`shimmer-${particle.id}`}
          className="absolute w-0.5 h-0.5 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            background: `rgba(255, 255, 255, ${particle.shimmerIntensity})`,
            boxShadow: `0 0 3px rgba(255, 255, 255, ${particle.shimmerIntensity * 0.5})`,
            willChange: 'transform, opacity',
          }}
          animate={{
            y: [0, particle.verticalDrift * 0.6],
            x: [0, particle.horizontalDrift * 0.4, 0],
            opacity: [0, particle.shimmerIntensity, 0],
          }}
          transition={{
            duration: particle.duration * 0.7,
            delay: particle.delay + 0.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-[#ff950e]/3 via-transparent to-transparent"
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ 
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
      />
    </div>
  );
}
