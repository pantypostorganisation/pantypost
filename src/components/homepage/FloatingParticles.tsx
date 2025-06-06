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
      
      // Listen for changes in user preference
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

// Enhanced particle configuration with better distribution
const PARTICLE_CONFIG = {
  count: 35, // Optimized count for performance
  baseSize: {
    small: 'w-1 h-1',
    medium: 'w-1.5 h-1.5', 
    large: 'w-2 h-2'
  },
  animationDuration: {
    min: 10,
    max: 18
  },
  drift: {
    horizontal: 80,
    vertical: { min: -80, max: -250 }
  },
  opacity: {
    min: 0.3,
    max: 0.8
  },
  shimmerCount: 8,
  blurAmount: 0.3
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
  hue: number; // For slight color variation
}

interface ShimmerParticle extends Omit<Particle, 'size'> {
  shimmerIntensity: number;
}

export default function FloatingParticles() {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [animationError, setAnimationError] = useState<string | null>(null);

  // Respect accessibility preferences
  if (prefersReducedMotion) {
    return null;
  }

  // Enhanced particle generation with better randomization and error handling
  const particles = useMemo<Particle[]>(() => {
    try {
      const particlesArray: Particle[] = [];
      
      for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
        // Enhanced random distribution using better algorithms
        const angle = (i / PARTICLE_CONFIG.count) * 2 * Math.PI;
        const radius = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
        
        particlesArray.push({
          id: i + 1,
          left: (Math.cos(angle) * radius + 0.5) * 100, // Convert to percentage
          top: Math.random() * 100,
          delay: Math.random() * 5,
          size: Math.random() > 0.7 
            ? PARTICLE_CONFIG.baseSize.large 
            : Math.random() > 0.4 
              ? PARTICLE_CONFIG.baseSize.medium 
              : PARTICLE_CONFIG.baseSize.small,
          duration: PARTICLE_CONFIG.animationDuration.min + 
                   Math.random() * (PARTICLE_CONFIG.animationDuration.max - PARTICLE_CONFIG.animationDuration.min),
          horizontalDrift: (Math.random() - 0.5) * PARTICLE_CONFIG.drift.horizontal,
          verticalDrift: PARTICLE_CONFIG.drift.vertical.min + 
                        Math.random() * (PARTICLE_CONFIG.drift.vertical.max - PARTICLE_CONFIG.drift.vertical.min),
          opacity: PARTICLE_CONFIG.opacity.min + 
                  Math.random() * (PARTICLE_CONFIG.opacity.max - PARTICLE_CONFIG.opacity.min),
          hue: Math.random() * 30 - 15 // -15 to +15 degrees hue variation
        });
      }
      
      return particlesArray;
    } catch (error) {
      console.error('Error generating particles:', error);
      setAnimationError('Failed to generate particles');
      return [];
    }
  }, []);

  // Enhanced shimmer particles with better performance
  const shimmerParticles = useMemo<ShimmerParticle[]>(() => {
    try {
      return particles.slice(0, PARTICLE_CONFIG.shimmerCount).map((particle) => ({
        ...particle,
        left: (particle.left + 5) % 100,
        top: (particle.top + 10) % 100,
        id: particle.id + 1000, // Unique ID for shimmer particles
        shimmerIntensity: 0.6 + Math.random() * 0.4 // 0.6 to 1.0
      }));
    } catch (error) {
      console.error('Error generating shimmer particles:', error);
      return [];
    }
  }, [particles]);

  // Error handling for animation failures
  useEffect(() => {
    if (animationError) {
      console.warn('FloatingParticles animation error:', animationError);
      // Auto-hide particles after error to prevent visual issues
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [animationError]);

  // Don't render if there's an error or not visible
  if (!isVisible || animationError || particles.length === 0) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none" 
      role="presentation" 
      aria-hidden="true"
      onError={(error) => {
        console.error('FloatingParticles container error:', error);
        setAnimationError('Container error');
      }}
    >
      {/* Main particles with enhanced styling and error handling */}
      {particles.map((particle) => {
        try {
          return (
            <motion.div
              key={`particle-${particle.id}`}
              className={`absolute rounded-full ${particle.size}`}
              style={{
                left: `${Math.max(0, Math.min(100, particle.left))}%`,
                top: `${Math.max(0, Math.min(100, particle.top))}%`,
                background: `radial-gradient(circle at 30% 30%, 
                  hsl(${39 + particle.hue}, 100%, ${60 + Math.random() * 10}%, ${particle.opacity}), 
                  hsl(${39 + particle.hue}, 100%, ${50 + Math.random() * 10}%, ${particle.opacity * 0.5}))`,
                boxShadow: `
                  0 0 8px hsla(${39 + particle.hue}, 100%, 60%, ${particle.opacity * 0.4}),
                  0 0 16px hsla(${39 + particle.hue}, 100%, 60%, ${particle.opacity * 0.2}),
                  inset -1px -1px 2px rgba(255, 255, 255, 0.1),
                  inset 1px 1px 1px hsla(${39 + particle.hue}, 100%, 60%, 0.2)
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
              onAnimationComplete={() => {
                // Optional: Handle animation completion
              }}
              onError={() => {
                console.warn(`Particle ${particle.id} animation error`);
              }}
            />
          );
        } catch (error) {
          console.error(`Error rendering particle ${particle.id}:`, error);
          return null;
        }
      })}
      
      {/* Enhanced shimmer particles with better performance and error handling */}
      {shimmerParticles.map((particle) => {
        try {
          return (
            <motion.div
              key={`shimmer-${particle.id}`}
              className="absolute w-0.5 h-0.5 rounded-full"
              style={{
                left: `${Math.max(0, Math.min(100, particle.left))}%`,
                top: `${Math.max(0, Math.min(100, particle.top))}%`,
                background: `rgba(255, 255, 255, ${particle.shimmerIntensity})`,
                boxShadow: `0 0 4px rgba(255, 255, 255, ${particle.shimmerIntensity * 0.6})`,
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
              onError={() => {
                console.warn(`Shimmer particle ${particle.id} animation error`);
              }}
            />
          );
        } catch (error) {
          console.error(`Error rendering shimmer particle ${particle.id}:`, error);
          return null;
        }
      })}

      {/* Enhanced background glow with better performance */}
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
        style={{ 
          willChange: 'opacity',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)' // Force hardware acceleration
        }}
        onError={() => {
          console.warn('Background glow animation error');
        }}
      />
    </div>
  );
}
