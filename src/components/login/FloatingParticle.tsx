// src/components/login/FloatingParticle.tsx
'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';
import { FloatingParticleProps as TypedFloatingParticleProps } from '@/types/login';

// Extend the typed props with additional props we need
interface ExtendedFloatingParticleProps extends TypedFloatingParticleProps {
  color?: string; // Just use string for color
  size?: 'small' | 'medium' | 'large';
}

// Enhanced reduced motion detection with error handling
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setPrefersReducedMotion(false);
        return; // Explicit return
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
      return; // Explicit return
    }
  }, []);

  return prefersReducedMotion;
};

// Deterministic pseudo-random number generator
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export default function FloatingParticle({ 
  color = '#ff950e',
  delay = 0,
  size = 'small',
  index = 0
}: ExtendedFloatingParticleProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  // Deterministic particle properties
  const particleProps = useMemo(() => {
    const seed = (delay + index) * 1000; // Use index in seed calculation
    
    const sizeMap = {
      small: 'w-1 h-1',
      medium: 'w-1.5 h-1.5',
      large: 'w-2 h-2'
    };
    
    const rand1 = seededRandom(seed);
    const rand2 = seededRandom(seed + 1);
    const rand3 = seededRandom(seed + 2);
    const rand4 = seededRandom(seed + 3);
    const rand5 = seededRandom(seed + 4);
    
    return {
      left: rand1 * 100,
      top: rand2 * 100,
      duration: 12 + rand3 * 8, // 12-20s
      horizontalDrift: (rand4 - 0.5) * 60,
      verticalDrift: -60 - rand5 * 140, // -60 to -200
      opacity: 0.2 + rand3 * 0.4,
      sizeClass: sizeMap[size]
    };
  }, [delay, size, index]);

  // Only render particles on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Respect accessibility preferences
  if (prefersReducedMotion || !isClient) {
    return null;
  }

  return (
    <motion.div
      className={`absolute rounded-full ${particleProps.sizeClass}`}
      style={{
        left: `${particleProps.left}%`,
        top: `${particleProps.top}%`,
        background: `radial-gradient(circle at 30% 30%, ${color}, ${color}88)`,
        boxShadow: `0 0 6px ${color}33, 0 0 12px ${color}22`,
        filter: 'blur(0.5px)',
        willChange: 'transform, opacity',
      }}
      animate={{
        y: [0, particleProps.verticalDrift],
        x: [0, particleProps.horizontalDrift, 0],
        opacity: [0, particleProps.opacity, particleProps.opacity, 0],
        scale: [0.8, 1.1, 0.8],
      }}
      transition={{
        duration: particleProps.duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
        scale: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }
      }}
    />
  );
}
