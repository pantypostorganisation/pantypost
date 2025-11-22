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
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const mountedRef = useRef(true);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTargetRef = useRef(0);
  const pendingUpdateRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    
    console.log('[PaymentsProcessedCounter] Animating from', from, 'to', to);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startTime = Date.now();
    const difference = to - from;

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = () => {
      if (!mountedRef.current) return;

      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = easeOutCubic(progress);
      const currentValue = from + (difference * easedProgress);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
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

  // Debounced update function
  const applyUpdate = useCallback((total: number, isFromFetch: boolean = false) => {
    if (!mountedRef.current || !Number.isFinite(total)) return;

    const normalizedTotal = Math.round(total * 100) / 100;
    
    // Clear pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    // Apply immediately if from fetch
    if (isFromFetch) {
      console.log('[PaymentsProcessedCounter] Applying fetched total:', normalizedTotal);
      
      if (!hasInitialLoad) {
        setDisplayValue(0);
        setTimeout(() => {
          if (mountedRef.current) {
            animateValue(0, normalizedTotal, 2000);
          }
        }, 100);
        setHasInitialLoad(true);
      } else {
        const currentDisplay = lastTargetRef.current;
        const increment = normalizedTotal - currentDisplay;
        if (Math.abs(increment) > 0.01) {
          animateValue(currentDisplay, normalizedTotal, 1000);
          if (increment > 0) {
            triggerAnimation(increment);
          }
        }
      }
      
      lastTargetRef.current = normalizedTotal;
      pendingUpdateRef.current = null;
      paymentStatsService.updateCachedStats({ totalPaymentsProcessed: normalizedTotal });
      return;
    }

    // For WebSocket updates, debounce
    pendingUpdateRef.current = normalizedTotal;
    
    updateTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || pendingUpdateRef.current === null) return;
      
      const finalTotal = pendingUpdateRef.current;
      const currentTarget = lastTargetRef.current;
      
      if (finalTotal !== currentTarget) {
        console.log('[PaymentsProcessedCounter] Applying WebSocket update:', { from: currentTarget, to: finalTotal });
        
        const increment = finalTotal - currentTarget;
        animateValue(currentTarget, finalTotal, 1000);
        
        if (increment > 0 && hasInitialLoad) {
          triggerAnimation(increment);
        }
        
        lastTargetRef.current = finalTotal;
        paymentStatsService.updateCachedStats({ totalPaymentsProcessed: finalTotal });
      }
      
      pendingUpdateRef.current = null;
    }, 300); // 300ms debounce
  }, [animateValue, triggerAnimation, hasInitialLoad]);

  const fetchStats = useCallback(async () => {
    try {
      console.log('[PaymentsProcessedCounter] Fetching initial stats...');
      const response = await paymentStatsService.getPaymentsProcessed();
      
      if (response.success && response.data && mountedRef.current) {
        const total = response.data.totalPaymentsProcessed ?? 0;
        console.log('[PaymentsProcessedCounter] Got initial stats:', total);
        applyUpdate(total, true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[PaymentsProcessedCounter] Failed to fetch stats:', error);
      setIsLoading(false);
      
      // Retry after 2 seconds if initial load hasn't happened
      if (!hasInitialLoad && mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current && !hasInitialLoad) {
            fetchStats();
          }
        }, 2000);
      }
    }
  }, [applyUpdate, hasInitialLoad]);

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
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Handle WebSocket subscriptions
  useEffect(() => {
    const handleUpdate = (data: any) => {
      if (!mountedRef.current || !hasInitialLoad) {
        return;
      }

      console.log('[PaymentsProcessedCounter] WebSocket update received:', data);

      const total = Number(data?.totalPaymentsProcessed);
      if (Number.isFinite(total) && total >= 0) {
        applyUpdate(total, false);
      }
    };

    let unsubscribe: (() => void) | undefined;

    // Wait for WebSocket to be ready
    const subscribeTimeout = setTimeout(() => {
      if (user && authenticatedWebSocket) {
        console.log('[PaymentsProcessedCounter] Using authenticated WebSocket');
        unsubscribe = authenticatedWebSocket.subscribe('stats:payments_processed', handleUpdate);
      } else if (!user && publicWebSocket.isConnected) {
        console.log('[PaymentsProcessedCounter] Using public WebSocket');
        unsubscribe = publicWebSocket.subscribe('stats:payments_processed', handleUpdate);
      } else if (!user) {
        // Try to connect public WebSocket
        console.log('[PaymentsProcessedCounter] Connecting public WebSocket...');
        publicWebSocket.connect();
        
        // Subscribe after a delay
        setTimeout(() => {
          if (publicWebSocket.isConnected && mountedRef.current) {
            unsubscribe = publicWebSocket.subscribe('stats:payments_processed', handleUpdate);
          }
        }, 1000);
      }
    }, 500);

    return () => {
      clearTimeout(subscribeTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authenticatedWebSocket, publicWebSocket, user, applyUpdate, hasInitialLoad]);

  // Fallback polling
  useEffect(() => {
    if (authenticatedWebSocket?.isConnected || publicWebSocket.isConnected || !hasInitialLoad) {
      return;
    }

    console.log('[PaymentsProcessedCounter] Starting fallback polling');
    
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [authenticatedWebSocket?.isConnected, publicWebSocket.isConnected, fetchStats, hasInitialLoad]);

  const formattedValue = isLoading && !hasInitialLoad ? 'Loading...' : formatCurrency(displayValue);
  const formattedIncrement = useMemo(() => {
    if (incrementAmount <= 0) return '';
    return `+$${incrementAmount.toFixed(2)}`;
  }, [incrementAmount]);
  
  const containerClasses = compact
    ? `flex items-center gap-1 sm:gap-2 relative ${className}`
    : `flex items-center gap-3 relative ${className}`;
    
  const iconClasses = compact
    ? 'h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#ff950e] animate-pulse-slow flex-shrink-0'
    : 'h-5 w-5 text-[#ff950e] animate-pulse-slow';
    
  const textClasses = compact
    ? 'text-[#ff950e] font-semibold text-[10px] sm:text-xs tracking-wider uppercase relative whitespace-nowrap'
    : 'text-[#ff950e] font-semibold text-sm tracking-wider uppercase relative';
    
  const incrementClasses = compact
    ? 'absolute left-1/2 -translate-x-1/2 text-green-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none'
    : 'absolute left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none';

  return (
    <motion.div
      className={containerClasses}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      aria-label="Payments processed"
    >
      <DollarSign className={iconClasses} aria-hidden="true" />
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
                className={incrementClasses}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.8, 1, 1, 0.8, 0],
                  y: [0, -6, -10, -14, -18, -20],
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
