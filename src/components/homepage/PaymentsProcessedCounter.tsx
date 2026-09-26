// src/components/homepage/PaymentsProcessedCounter.tsx

'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { usePublicWebSocket } from '@/hooks/usePublicWebSocket';
import {
  paymentStatsService,
  type PaymentStats,
} from '@/services/paymentStats.service';

interface PaymentsProcessedCounterProps {
  className?: string;
  compact?: boolean;
}

function normalizeMoney(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.round(numeric * 100) / 100);
}

function getActualTotal(stats: PaymentStats) {
  return normalizeMoney(
    stats.actualPaymentsProcessed ?? stats.totalPaymentsProcessed
  );
}

function getDisplayTotal(stats: PaymentStats) {
  return normalizeMoney(
    stats.displayedCounterTotal ??
      stats.actualPaymentsProcessed ??
      stats.totalPaymentsProcessed
  );
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
    reconnectionDelay: 1000,
  });

  const [displayValue, setDisplayValue] = useState(0);
  const [counterLabel, setCounterLabel] = useState('Payments processed');
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const hasInitialLoadRef = useRef(false);
  const mountedRef = useRef(true);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTargetRef = useRef(0);
  const lastActualRef = useRef(0);
  const subscriptionRef = useRef<(() => void) | undefined>(undefined);

  const formatCurrency = useCallback((value: number) => {
    const normalized = Math.max(0, Math.round(Number(value || 0)));
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(normalized);
  }, []);

  const animateValue = useCallback(
    (from: number, to: number, duration: number = 1500) => {
      if (!mountedRef.current) return;

      console.log('[PaymentsProcessedCounter] Animating:', { from, to });

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (duration <= 0) {
        setDisplayValue(to);
        return;
      }

      const startTime = Date.now();
      const difference = to - from;

      const easeOutCubic = (t: number): number =>
        1 - Math.pow(1 - t, 3);

      const animate = () => {
        if (!mountedRef.current) return;

        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentValue = from + difference * easedProgress;

        setDisplayValue(currentValue);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(to);
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    []
  );

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

  const applyStats = useCallback(
    (stats: PaymentStats, animate: boolean = true) => {
      if (!mountedRef.current) return;

      const displayTotal = getDisplayTotal(stats);
      const actualTotal = getActualTotal(stats);
      const genuineIncrement = actualTotal - lastActualRef.current;

      setCounterLabel(
        stats.counterLabel ||
          (stats.heroDisplayAdjustmentEnabled
            ? 'Promotional counter'
            : 'Payments processed')
      );

      console.log('[PaymentsProcessedCounter] Updating stats:', {
        actualTotal,
        displayTotal,
        fromDisplay: lastTargetRef.current,
        genuineIncrement,
      });

      if (Math.abs(displayTotal - lastTargetRef.current) > 0.01) {
        animateValue(
          lastTargetRef.current,
          displayTotal,
          animate ? 1000 : 0
        );
      } else {
        setDisplayValue(displayTotal);
      }

      // Only genuine processed-payment growth gets the green +$ animation.
      // Applying/removing a display adjustment never masquerades as a payment.
      if (
        genuineIncrement > 0.01 &&
        animate &&
        hasInitialLoadRef.current
      ) {
        triggerAnimation(genuineIncrement);
      }

      lastTargetRef.current = displayTotal;
      lastActualRef.current = actualTotal;
      paymentStatsService.updateCachedStats(stats);
    },
    [animateValue, triggerAnimation]
  );

  const fetchStatsRef = useRef<() => void>(() => {});
  const applyStatsRef = useRef(applyStats);

  useEffect(() => {
    applyStatsRef.current = applyStats;
  }, [applyStats]);

  const fetchStats = useCallback(async () => {
    try {
      console.log('[PaymentsProcessedCounter] Fetching stats...');
      const response = await paymentStatsService.getPaymentsProcessed();

      if (response.success && response.data && mountedRef.current) {
        const data = response.data;
        const displayTotal = getDisplayTotal(data);
        const actualTotal = getActualTotal(data);

        console.log('[PaymentsProcessedCounter] Stats fetched:', {
          actualTotal,
          displayTotal,
          counterLabel: data.counterLabel,
        });

        setCounterLabel(
          data.counterLabel ||
            (data.heroDisplayAdjustmentEnabled
              ? 'Promotional counter'
              : 'Payments processed')
        );

        if (!hasInitialLoadRef.current) {
          hasInitialLoadRef.current = true;
          setDisplayValue(0);
          lastTargetRef.current = displayTotal;
          lastActualRef.current = actualTotal;
          paymentStatsService.updateCachedStats(data);

          setTimeout(() => {
            if (mountedRef.current) {
              animateValue(0, displayTotal, 2000);
            }
          }, 100);

          setHasInitialLoad(true);
        } else {
          applyStatsRef.current(data, true);
        }

        setIsLoading(false);
      }
    } catch (error) {
      console.error(
        '[PaymentsProcessedCounter] Failed to fetch stats:',
        error
      );
      setIsLoading(false);

      if (!hasInitialLoadRef.current && mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current) {
            fetchStatsRef.current();
          }
        }, 2000);
      }
    }
  }, [animateValue]);

  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  useEffect(() => {
    mountedRef.current = true;
    void fetchStats();

    const refreshInterval = setInterval(() => {
      if (mountedRef.current) {
        fetchStatsRef.current();
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
  }, [fetchStats]);

  useEffect(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = undefined;
    }

    const handleUpdate = (data: PaymentStats) => {
      console.log(
        '[PaymentsProcessedCounter] Received stats:payments_processed event:',
        data
      );

      if (!mountedRef.current) return;

      const actual = Number(
        data?.actualPaymentsProcessed ?? data?.totalPaymentsProcessed
      );
      const displayed = Number(
        data?.displayedCounterTotal ??
          data?.actualPaymentsProcessed ??
          data?.totalPaymentsProcessed
      );

      if (
        Number.isFinite(actual) &&
        actual >= 0 &&
        Number.isFinite(displayed) &&
        displayed >= 0
      ) {
        applyStatsRef.current(data, true);
      }
    };

    const setupSubscription = () => {
      console.log(
        '[PaymentsProcessedCounter] Setting up subscription...',
        {
          isAuthenticated: !!user,
          authWsConnected: authenticatedWebSocket?.isConnected,
          publicWsConnected: publicWebSocket.isConnected,
        }
      );

      if (user && authenticatedWebSocket) {
        subscriptionRef.current = authenticatedWebSocket.subscribe(
          'stats:payments_processed',
          handleUpdate
        );
      } else {
        if (!publicWebSocket.isConnected) {
          publicWebSocket.connect();
        }

        subscriptionRef.current = publicWebSocket.subscribe(
          'stats:payments_processed',
          handleUpdate
        );
      }
    };

    const setupTimeout = setTimeout(setupSubscription, 1000);

    const connectionCheckInterval = setInterval(() => {
      const shouldUseAuth =
        !!user && Boolean(authenticatedWebSocket?.isConnected);
      const shouldUsePublic = !user && publicWebSocket.isConnected;

      if (
        (shouldUseAuth || shouldUsePublic) &&
        !subscriptionRef.current
      ) {
        setupSubscription();
      }
    }, 2000);

    return () => {
      clearTimeout(setupTimeout);
      clearInterval(connectionCheckInterval);

      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = undefined;
      }
    };
  }, [user, authenticatedWebSocket, publicWebSocket]);

  const formattedValue =
    isLoading && !hasInitialLoad
      ? 'Loading...'
      : formatCurrency(displayValue);

  const formattedIncrement = useMemo(() => {
    if (incrementAmount <= 0) return '';
    return `+$${Math.round(incrementAmount).toLocaleString('en-US')}`;
  }, [incrementAmount]);

  const containerClasses = compact
    ? `flex items-center gap-1 sm:gap-2 relative ${className}`
    : `flex items-center gap-3 relative ${className}`;

  const iconClasses = compact
    ? 'h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#ff950e] flex-shrink-0'
    : 'h-5 w-5 text-[#ff950e]';

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
      aria-label={counterLabel}
    >
      <Image
        src="/icons/payments-icon.png"
        alt=""
        width={20}
        height={20}
        className={`${iconClasses} object-contain`}
        aria-hidden="true"
      />

      <span className={textClasses}>
        {counterLabel}{' '}
        <span className="relative inline-block">
          <motion.span
            className="font-bold"
            animate={
              showUpdateAnimation
                ? {
                    scale: [1, 1.15, 1],
                    color: ['#ff950e', '#22c55e', '#ff950e'],
                  }
                : {}
            }
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
                transition={{
                  duration: 3,
                  ease: 'easeOut',
                  times: [0, 0.1, 0.2, 0.5, 0.8, 1],
                }}
              >
                {formattedIncrement}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </span>

      {process.env.NODE_ENV === 'development' && compact && (
        <span
          className={`ml-1 text-[8px] ${
            publicWebSocket.isConnected ||
            authenticatedWebSocket?.isConnected
              ? 'text-green-400'
              : 'text-yellow-400'
          }`}
        >
          {publicWebSocket.isConnected ||
          authenticatedWebSocket?.isConnected
            ? '\u25CF'
            : '\u25CB'}
        </span>
      )}
    </motion.div>
  );
}
