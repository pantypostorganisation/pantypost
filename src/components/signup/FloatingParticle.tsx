// src/components/signup/FloatingParticle.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface FloatingParticleProps {
  delay?: number;
}

/**
 * Visual particle with reduced-motion support.
 * - Ensures the effect ALWAYS returns a cleanup function (fixes TS7030).
 * - Removes explicit `JSX.Element` return type to avoid TS2503 ("Cannot find namespace 'JSX'").
 */
export default function FloatingParticle({ delay = 0 }: FloatingParticleProps) {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mq: MediaQueryList | null = null;

    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });

      // Respect reduced-motion preference
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const applyPref = () => setReduced(mq!.matches);
      applyPref();

      // Attach listener (handle older addListener/removeListener too)
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', applyPref);
      } else if (typeof (mq as any).addListener === 'function') {
        (mq as any).addListener(applyPref);
      }

      return () => {
        if (!mq) return;
        if (typeof mq.removeEventListener === 'function') {
          mq.removeEventListener('change', applyPref);
        } else if (typeof (mq as any).removeListener === 'function') {
          (mq as any).removeListener(applyPref);
        }
      };
    }

    // No-op cleanup when window is unavailable (SSR/edge cases)
    return () => {};
  }, []);

  // Stable random choices per instance
  const colors = useMemo(
    () => ['bg-[#ff950e]/30', 'bg-[#ff950e]/20', 'bg-white/20', 'bg-white/30', 'bg-[#ff6b00]/25'],
    []
  );
  const randomColor = useMemo(() => colors[Math.floor(Math.random() * colors.length)], [colors]);
  const startX = useMemo(() => Math.random(), []);
  const endX = useMemo(() => Math.random(), []);

  if (reduced) {
    // Static, decorative dot for reduced-motion users
    return (
      <div
        aria-hidden="true"
        className={`absolute w-1 h-1 ${randomColor} rounded-full`}
        style={{ left: `${startX * dimensions.width}px`, bottom: 10 }}
      />
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      className={`absolute w-1 h-1 ${randomColor} rounded-full`}
      initial={{
        x: startX * dimensions.width,
        y: dimensions.height + 10,
        opacity: 0,
      }}
      animate={{
        y: -10,
        opacity: [0, 1, 1, 0],
        x: endX * dimensions.width,
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}
