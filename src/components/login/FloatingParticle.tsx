// src/components/login/FloatingParticle.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { FloatingParticleProps } from '@/types/login';
import { generateParticleProps, getParticleColor, createGlowColor } from '@/utils/loginUtils';

export default function FloatingParticle({ delay = 0, index = 0 }: FloatingParticleProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  // Memoize particle properties to prevent recalculation on every render
  const particleProps = useMemo(() => generateParticleProps(), [index]);

  // Memoize color selection
  const particleColor = useMemo(() => getParticleColor(index), [index]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      
      // Set initial random position
      setPosition({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight
      });

      // Set initial random velocity (speed and direction)
      velocityRef.current = {
        x: (Math.random() - 0.5) * 0.8, // Random speed between -0.4 and 0.4
        y: (Math.random() - 0.5) * 0.8
      };
      
      // Add window resize handler
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    // Add explicit return for the else case
    return undefined;
  }, []);

  // Smooth animation loop
  useEffect(() => {
    const animateParticle = () => {
      setPosition(prev => {
        let newX = prev.x + velocityRef.current.x;
        let newY = prev.y + velocityRef.current.y;
        
        // Bounce off edges and slightly randomize velocity
        if (newX <= 0 || newX >= dimensions.width) {
          velocityRef.current.x = -velocityRef.current.x + (Math.random() - 0.5) * 0.1;
          newX = Math.max(0, Math.min(dimensions.width, newX));
        }
        
        if (newY <= 0 || newY >= dimensions.height) {
          velocityRef.current.y = -velocityRef.current.y + (Math.random() - 0.5) * 0.1;
          newY = Math.max(0, Math.min(dimensions.height, newY));
        }

        // Add slight random drift to make movement more organic
        if (Math.random() < 0.02) { // 2% chance each frame
          velocityRef.current.x += (Math.random() - 0.5) * 0.1;
          velocityRef.current.y += (Math.random() - 0.5) * 0.1;
          
          // Keep velocity within reasonable bounds
          velocityRef.current.x = Math.max(-1, Math.min(1, velocityRef.current.x));
          velocityRef.current.y = Math.max(-1, Math.min(1, velocityRef.current.y));
        }
        
        return { x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(animateParticle);
    };

    animationRef.current = requestAnimationFrame(animateParticle);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [dimensions]);

  // Create proper hex color with alpha for box shadow
  const glowColor = createGlowColor(particleColor.hex, particleProps.glowIntensity);

  return (
    <div
      className={`absolute ${particleColor.bg} rounded-full transition-opacity duration-1000 pointer-events-none`}
      style={{
        left: position.x,
        top: position.y,
        width: particleProps.size,
        height: particleProps.size,
        opacity: particleProps.opacity,
        // REMOVED: filter: `blur(0.5px)`,
        boxShadow: `0 0 ${particleProps.glowIntensity * 10}px ${glowColor}`,
        transform: 'translate(-50%, -50%)', // Center the particle on its position
      }}
    />
  );
}
