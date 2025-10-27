// src/components/homepage/PaymentsProcessedCounter.tsx

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { usePublicWebSocket } from '@/hooks/usePublicWebSocket';
import { paymentStatsService } from '@/services/paymentStats.service';

interface PaymentsProcessedCounterProps {
  className?: string;
  compact?: boolean;
}

export default function PaymentsProcessedCounter({
  className = '',
  compact = false,
}: PaymentsProcessedCounterProps) {
  const { user } = useAuth();
  const authenticatedWebSocket = useWebSocket();
  const publicWebSocket = usePublicWebSocket({ autoConnect: !user });

  const [displayValue, setDisplayValue] = useState(0);
  const [targetValue, setTargetValue] = useState(0);
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const mountedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialFetchRef = useRef(true);
  const lastTargetRef = useRef(0);

  const formatCurrency = useCallback((value: number) => {
    const normalized = Math.max(0, Math.round(Number(value || 0) * 100) / 100);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalized);
  }, []);

  // Smooth count-up animation with easing
  const animateValue = useCallback((from: number, to: number, duration: number = 1500) => {
    if (!mountedRef.current) return;
    
    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startTime = Date.now();
    const difference = to - from;

    // Cubic ease-out function for smooth deceleration
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = () => {
      if (!mountedRef.current) return;

      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function for smooth deceleration
      const easedProgress = easeOutCubic(progress);
      const currentValue = from + (difference * easedProgress);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we end exactly at the target value
        setDisplayValue(to);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const triggerAnimation = useCallback((increment: number) => {
    if (increment <= 0) return;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setIncrementAmount(Math.round(increment * 100) / 100);
    setShowUpdateAnimation(true);
    setAnimationKey((prev) => prev + 1);

    animationTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setShowUpdateAnimation(false);
      }
    }, 3000);
  }, []);

  const applyNewTotal = useCallback((total: number, isInitial: boolean = false) => {
    if (!Number.isFinite(total)) return;

    const normalizedTotal = Math.round(total * 100) / 100;
    setTargetValue(normalizedTotal);
    
    // For initial load, start from 0 and animate up
    if (isInitial && normalizedTotal > 0) {
      animateValue(0, normalizedTotal, 2000); // 2 second initial animation
    } else {
      // For updates, animate from current display value
      const increment = normalizedTotal - lastTargetRef.current;
      if (Math.abs(increment) > 0.01) {
        animateValue(displayValue, normalizedTotal, 1000); // 1 second for updates
        if (increment > 0) {
          triggerAnimation(increment);
        }
      }
    }
    
    lastTargetRef.current = normalizedTotal;
    paymentStatsService.updateCachedStats({ totalPaymentsProcessed: normalizedTotal });
  }, [animateValue, displayValue, triggerAnimation]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await paymentStatsService.getPaymentsProcessed();
      if (response.success && response.data && mountedRef.current) {
        const total = response.data.totalPaymentsProcessed ?? 0;
        applyNewTotal(total, !hasInitialLoad);

        if (!hasInitialLoad) {
          setHasInitialLoad(true);
          isInitialFetchRef.current = false;
        }
      }
    } catch (error) {
      console.error('[PaymentsProcessedCounter] Failed to fetch stats:', error);
    } finally {
      isInitialFetchRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [applyNewTotal, hasInitialLoad]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();

    return () => {
      mountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [fetchStats]);

  useEffect(() => {
    const handleUpdate = (data: any) => {
      if (!mountedRef.current || isInitialFetchRef.current) {
        return;
      }

      const total = Number(data?.totalPaymentsProcessed);
      if (Number.isFinite(total) && total !== lastTargetRef.current) {
        applyNewTotal(total, false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    const subscribe = () => {
      if (user && authenticatedWebSocket) {
        unsubscribe = authenticatedWebSocket.subscribe('stats:payments_processed', handleUpdate);
      } else if (publicWebSocket) {
        unsubscribe = publicWebSocket.subscribe('stats:payments_processed', handleUpdate);
      }
    };

    const timeout = setTimeout(subscribe, 250);

    return () => {
      clearTimeout(timeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authenticatedWebSocket, publicWebSocket, user, applyNewTotal]);

  useEffect(() => {
    if (!authenticatedWebSocket && !publicWebSocket) {
      const interval = setInterval(() => {
        fetchStats();
      }, 15000);

      return () => clearInterval(interval);
    }

    return undefined;
  }, [authenticatedWebSocket, publicWebSocket, fetchStats]);

  const formattedValue = isLoading && !hasInitialLoad ? 'Loading' : formatCurrency(displayValue);
  const formattedIncrement = useMemo(() => {
    if (incrementAmount <= 0) return '';
    const currency = formatCurrency(incrementAmount);
    return `+${currency.replace('$', '')}`;
  }, [incrementAmount, formatCurrency]);
  
  const containerClasses = compact
    ? `flex items-center gap-2 relative ${className}`
    : `flex items-center gap-3 relative ${className}`;
  const textClasses = compact
    ? 'text-[#ff950e] font-semibold text-xs tracking-wider uppercase relative'
    : 'text-[#ff950e] font-semibold text-sm tracking-wider uppercase relative';

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-label="Payments processed"
    >
      <DollarSign className="h-5 w-5 text-[#ff950e] animate-pulse-slow" aria-hidden="true" />
      <span className={textClasses}>
        Payments processed{' '}
        <span className="relative inline-block">
          <motion.span
            className="font-bold"
            animate={showUpdateAnimation ? {
              scale: [1, 1.15, 1],
              color: ['#ff950e', '#22c55e', '#ff950e']
            } : {}}
            transition={{ duration: 0.5 }}
          >
            {formattedValue}
          </motion.span>

          <AnimatePresence mode="wait">
            {showUpdateAnimation && (
              <motion.span
                key={`payments-inc-${animationKey}`}
                className="absolute left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none"
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.8, 1, 1, 0.8, 0],
                  y: [0, -8, -12, -16, -20, -24],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, ease: 'easeOut', times: [0, 0.1, 0.2, 0.5, 0.8, 1] }}
              >
                {formattedIncrement}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </span>
    </motion.div>
  );
}
