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
  const publicWebSocket = usePublicWebSocket({ 
    autoConnect: !user,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

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
  const subscriptionRef = useRef<(() => void) | undefined>(undefined);

  const formatCurrency = useCallback((value: number) => {
    const normalized = Math.max(0, Math.round(Number(value || 0) * 100) / 100);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(normalized);
  }, []);

  const animateValue = useCallback((from: number, to: number, duration: number = 1500) => {
    if (!mountedRef.current) return;
    
    console.log('[PaymentsProcessedCounter] Animating:', { from, to });
    
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

  const updateValue = useCallback((newValue: number, animate: boolean = true) => {
    if (!mountedRef.current || !Number.isFinite(newValue)) return;
    
    const normalized = Math.round(newValue * 100) / 100;
    
    console.log('[PaymentsProcessedCounter] Updating value:', { 
      from: lastTargetRef.current, 
      to: normalized,
      animate 
    });
    
    const increment = normalized - lastTargetRef.current;
    
    if (Math.abs(increment) > 0.01) {
      animateValue(lastTargetRef.current, normalized, animate ? 1000 : 0);
      
      if (increment > 0 && animate && hasInitialLoad) {
        triggerAnimation(increment);
      }
      
      lastTargetRef.current = normalized;
      paymentStatsService.updateCachedStats({ totalPaymentsProcessed: normalized });
    }
  }, [animateValue, triggerAnimation, hasInitialLoad]);

  const fetchStats = useCallback(async () => {
    try {
      console.log('[PaymentsProcessedCounter] Fetching stats...');
      const response = await paymentStatsService.getPaymentsProcessed();
      
      if (response.success && response.data && mountedRef.current) {
        const total = response.data.totalPaymentsProcessed ?? 0;
        console.log('[PaymentsProcessedCounter] Stats fetched:', total);
        
        if (!hasInitialLoad) {
          // Initial load - animate from 0
          setDisplayValue(0);
          lastTargetRef.current = total;
          setTimeout(() => {
            if (mountedRef.current) {
              animateValue(0, total, 2000);
            }
          }, 100);
          setHasInitialLoad(true);
        } else {
          // Update
          updateValue(total, true);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[PaymentsProcessedCounter] Failed to fetch stats:', error);
      setIsLoading(false);
      
      // Retry after 2 seconds
      if (!hasInitialLoad && mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current) {
            fetchStats();
          }
        }, 2000);
      }
    }
  }, [animateValue, hasInitialLoad, updateValue]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    mountedRef.current = true;
    
    // Fetch immediately
    fetchStats();
    
    // Set up periodic refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      if (mountedRef.current) {
        fetchStats();
      }
    }, 60000);

    return () => {
      mountedRef.current = false;
      clearInterval(refreshInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // WebSocket subscription
  useEffect(() => {
    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = undefined;
    }

    const handleUpdate = (data: any) => {
      console.log('[PaymentsProcessedCounter] Received stats:payments_processed event:', data);
      
      if (!mountedRef.current) return;
      
      const total = Number(data?.totalPaymentsProcessed);
      if (Number.isFinite(total) && total >= 0) {
        updateValue(total, true);
      }
    };

    const setupSubscription = () => {
      console.log('[PaymentsProcessedCounter] Setting up subscription...', {
        isAuthenticated: !!user,
        authWsConnected: authenticatedWebSocket?.isConnected,
        publicWsConnected: publicWebSocket.isConnected
      });

      if (user && authenticatedWebSocket) {
        console.log('[PaymentsProcessedCounter] Subscribing via authenticated WebSocket');
        subscriptionRef.current = authenticatedWebSocket.subscribe('stats:payments_processed', handleUpdate);
      } else {
        console.log('[PaymentsProcessedCounter] Subscribing via public WebSocket');
        
        if (!publicWebSocket.isConnected) {
          console.log('[PaymentsProcessedCounter] Public WebSocket not connected, connecting...');
          publicWebSocket.connect();
        }
        
        subscriptionRef.current = publicWebSocket.subscribe('stats:payments_processed', handleUpdate);
      }
    };

    // Set up subscription with delay
    const setupTimeout = setTimeout(() => {
      setupSubscription();
    }, 1000);

    // Check connection periodically
    const connectionCheckInterval = setInterval(() => {
      const shouldUseAuth = !!user && authenticatedWebSocket?.isConnected;
      const shouldUsePublic = !user && publicWebSocket.isConnected;
      
      if ((shouldUseAuth || shouldUsePublic) && !subscriptionRef.current) {
        console.log('[PaymentsProcessedCounter] Connection detected, re-subscribing...');
        setupSubscription();
      }
    }, 2000);

    return () => {
      clearTimeout(setupTimeout);
      clearInterval(connectionCheckInterval);
      
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [user, authenticatedWebSocket, publicWebSocket, updateValue]);

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
      {process.env.NODE_ENV === 'development' && compact && (
        <span className={`ml-1 text-[8px] ${publicWebSocket.isConnected || authenticatedWebSocket?.isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
          {publicWebSocket.isConnected || authenticatedWebSocket?.isConnected ? '●' : '○'}
        </span>
      )}
    </motion.div>
  );
}
