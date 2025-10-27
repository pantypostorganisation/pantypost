// src/components/homepage/PaymentsProcessedCounter.tsx

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { ShieldDollar } from 'lucide-react';
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

  const [formattedCount, setFormattedCount] = useState('$0.00');
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const springValue = useSpring(0, {
    stiffness: 65,
    damping: 14,
    mass: 1,
  });

  const mountedRef = useRef(false);
  const previousCountRef = useRef(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialFetchRef = useRef(true);

  const formatCurrency = useCallback((value: number) => {
    const normalized = Math.max(0, Math.round(Number(value || 0) * 100) / 100);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalized);
  }, []);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (value) => {
      setFormattedCount(formatCurrency(value));
    });

    return () => unsubscribe();
  }, [springValue, formatCurrency]);

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

  const applyNewTotal = useCallback((total: number) => {
    if (!Number.isFinite(total)) return;

    const normalizedTotal = Math.round(total * 100) / 100;
    springValue.set(normalizedTotal);
    previousCountRef.current = normalizedTotal;
    paymentStatsService.updateCachedStats({ totalPaymentsProcessed: normalizedTotal });
  }, [springValue]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await paymentStatsService.getPaymentsProcessed();
      if (response.success && response.data && mountedRef.current) {
        const total = response.data.totalPaymentsProcessed ?? 0;
        applyNewTotal(total);

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
      if (Number.isFinite(total) && total !== previousCountRef.current) {
        const increment = total - previousCountRef.current;
        applyNewTotal(total);

        if (increment > 0) {
          triggerAnimation(increment);
        }
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
  }, [authenticatedWebSocket, publicWebSocket, user, applyNewTotal, triggerAnimation]);

  useEffect(() => {
    if (!authenticatedWebSocket && !publicWebSocket) {
      const interval = setInterval(() => {
        fetchStats();
      }, 15000);

      return () => clearInterval(interval);
    }

    return undefined;
  }, [authenticatedWebSocket, publicWebSocket, fetchStats]);

  const displayValue = isLoading && !hasInitialLoad ? 'Loading' : formattedCount;
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
      aria-label="Total payments processed"
    >
      <ShieldDollar className="h-5 w-5 text-[#ff950e] animate-pulse-slow" aria-hidden="true" />
      <span className={textClasses}>
        Total payments processed ($){' '}
        <span className="relative inline-block">
          <motion.span
            className="font-bold"
            animate={showUpdateAnimation ? {
              scale: [1, 1.15, 1],
              color: ['#ff950e', '#22c55e', '#ff950e']
            } : {}}
            transition={{ duration: 0.5 }}
          >
            {displayValue}
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
