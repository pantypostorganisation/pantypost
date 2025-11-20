// src/components/browse-detail/AnimatedViewCounter.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useSpring } from 'framer-motion';

interface AnimatedViewCounterProps {
  value: number | null | undefined;
}

/**
 * Smoothly animates the listing view counter and shows a brief "+X" toast
 * whenever the count increases. This mirrors the behaviour of the animated
 * user counter on the landing page so that buyers instantly see their view
 * being recorded.
 */
export default function AnimatedViewCounter({ value }: AnimatedViewCounterProps) {
  const sanitizedValue = useMemo(() => {
    const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return Math.max(0, Math.round(numericValue));
  }, [value]);

  const spring = useSpring(sanitizedValue, {
    stiffness: 80,
    damping: 18,
    mass: 1.1,
  });

  const previousValueRef = useRef(sanitizedValue);
  const [formattedValue, setFormattedValue] = useState(() => sanitizedValue.toLocaleString());
  const [delta, setDelta] = useState(0);
  const [showDelta, setShowDelta] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationKeyRef = useRef(0);

  useEffect(() => {
    spring.set(sanitizedValue);
  }, [sanitizedValue, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', val => {
      const rounded = Math.max(0, Math.round(val));
      setFormattedValue(rounded.toLocaleString());
    });

    return () => unsubscribe();
  }, [spring]);

  useEffect(() => {
    if (previousValueRef.current === sanitizedValue) {
      return;
    }

    const difference = sanitizedValue - previousValueRef.current;
    previousValueRef.current = sanitizedValue;

    if (difference <= 0) {
      return;
    }

    setDelta(difference);
    setShowDelta(true);
    animationKeyRef.current += 1;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setShowDelta(false);
    }, 2200);
  }, [sanitizedValue]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex items-center">
      <motion.span
        key={`view-count-${animationKeyRef.current}`}
        layout
        className="font-semibold"
      >
        {formattedValue}
      </motion.span>

      <AnimatePresence>
        {showDelta && delta > 0 && (
          <motion.span
            key={`view-delta-${animationKeyRef.current}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-4 right-0 text-[10px] font-semibold text-[#ff950e] drop-shadow"
          >
            +{delta}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
