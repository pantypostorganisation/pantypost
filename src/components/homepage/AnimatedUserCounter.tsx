// src/components/homepage/AnimatedUserCounter.tsx

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { CheckCircle, Users, TrendingUp } from 'lucide-react';
import { userStatsService } from '@/services/userStats.service';
import { useWebSocket } from '@/context/WebSocketContext';
import { usePublicWebSocket } from '@/hooks/usePublicWebSocket';
import { useAuth } from '@/context/AuthContext';

interface AnimatedUserCounterProps {
  className?: string;
  showNewUsersToday?: boolean;
  compact?: boolean;
}

export default function AnimatedUserCounter({ 
  className = '', 
  showNewUsersToday = false,
  compact = false 
}: AnimatedUserCounterProps) {
  const [targetCount, setTargetCount] = useState(0);
  const [newUsersToday, setNewUsersToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(1);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  const { user } = useAuth();
  const authenticatedWebSocket = useWebSocket();
  const publicWebSocket = usePublicWebSocket({ autoConnect: !user });
  const mountedRef = useRef(true);
  const previousCountRef = useRef(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const pendingUpdateRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Spring animation for smooth counting
  const springValue = useSpring(0, { 
    stiffness: 65,
    damping: 14,
    mass: 1 
  });

  const displayCount = useTransform(springValue, (value) => Math.round(value));
  const [formattedCount, setFormattedCount] = useState('0');

  useEffect(() => {
    const unsubscribe = displayCount.on('change', (value) => {
      setFormattedCount(value.toLocaleString());
    });
    return () => unsubscribe();
  }, [displayCount]);

  const triggerAnimation = useCallback((increment: number) => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    setIncrementAmount(increment);
    setShowUpdateAnimation(true);
    setAnimationKey(prev => prev + 1);
    
    animationTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setShowUpdateAnimation(false);
      }
    }, 3500);
  }, []);

  // Debounced update function to handle rapid WebSocket updates
  const applyUpdate = useCallback((newTotal: number, isFromFetch: boolean = false) => {
    if (!mountedRef.current) return;
    
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    // If this is from a fetch, apply immediately
    if (isFromFetch) {
      console.log('[AnimatedUserCounter] Applying fetched total:', newTotal);
      setTargetCount(newTotal);
      
      if (!hasInitialLoad) {
        springValue.set(newTotal);
        previousCountRef.current = newTotal;
        setHasInitialLoad(true);
      } else {
        const increment = newTotal - previousCountRef.current;
        if (increment !== 0) {
          springValue.set(newTotal);
          if (increment > 0) {
            triggerAnimation(increment);
          }
          previousCountRef.current = newTotal;
        }
      }
      pendingUpdateRef.current = null;
      return;
    }

    // For WebSocket updates, debounce
    pendingUpdateRef.current = newTotal;
    
    updateTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || pendingUpdateRef.current === null) return;
      
      const finalTotal = pendingUpdateRef.current;
      const currentCount = previousCountRef.current;
      
      if (finalTotal !== currentCount) {
        console.log('[AnimatedUserCounter] Applying WebSocket update:', { from: currentCount, to: finalTotal });
        
        const increment = finalTotal - currentCount;
        setTargetCount(finalTotal);
        springValue.set(finalTotal);
        
        if (increment > 0 && hasInitialLoad) {
          triggerAnimation(increment);
        }
        
        previousCountRef.current = finalTotal;
        lastUpdateTimeRef.current = Date.now();
      }
      
      pendingUpdateRef.current = null;
    }, 300); // 300ms debounce
  }, [springValue, hasInitialLoad, triggerAnimation]);

  const fetchStats = useCallback(async () => {
    try {
      console.log('[AnimatedUserCounter] Fetching initial stats...');
      const response = await userStatsService.getUserStats();
      
      if (response.success && response.data && mountedRef.current) {
        console.log('[AnimatedUserCounter] Got initial stats:', response.data);
        setNewUsersToday(response.data.newUsersToday);
        applyUpdate(response.data.totalUsers, true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[AnimatedUserCounter] Failed to fetch user stats:', error);
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
    const handleStatsUpdate = (data: any) => {
      if (!mountedRef.current || !hasInitialLoad) {
        return;
      }
      
      console.log('[AnimatedUserCounter] Stats update received:', data);
      
      if (data.totalUsers !== undefined) {
        applyUpdate(data.totalUsers, false);
      }
      
      if (data.newUsersToday !== undefined) {
        setNewUsersToday(data.newUsersToday);
      }
      
      userStatsService.updateCachedStats(data);
    };

    const handleUserRegistered = (data: any) => {
      if (!mountedRef.current || !hasInitialLoad) {
        return;
      }
      
      console.log('[AnimatedUserCounter] User registered event:', data);
      
      // Increment the current count by 1
      const newTotal = previousCountRef.current + 1;
      applyUpdate(newTotal, false);
      
      // Also increment today's count
      setNewUsersToday(prev => prev + 1);
      
      // Update cache
      userStatsService.incrementUserCount(1);
    };

    let unsubscribeStats: (() => void) | undefined;
    let unsubscribeRegistered: (() => void) | undefined;

    // Wait a bit for WebSocket to be ready
    const subscribeTimeout = setTimeout(() => {
      if (user && authenticatedWebSocket) {
        console.log('[AnimatedUserCounter] Using authenticated WebSocket');
        unsubscribeStats = authenticatedWebSocket.subscribe('stats:users', handleStatsUpdate);
        unsubscribeRegistered = authenticatedWebSocket.subscribe('user:registered', handleUserRegistered);
      } else if (!user && publicWebSocket.isConnected) {
        console.log('[AnimatedUserCounter] Using public WebSocket for guest');
        unsubscribeStats = publicWebSocket.subscribe('stats:users', handleStatsUpdate);
        unsubscribeRegistered = publicWebSocket.subscribe('user:registered', handleUserRegistered);
      } else if (!user) {
        // Try to connect public WebSocket if not connected
        console.log('[AnimatedUserCounter] Connecting public WebSocket...');
        publicWebSocket.connect();
        
        // Subscribe after a delay
        setTimeout(() => {
          if (publicWebSocket.isConnected && mountedRef.current) {
            unsubscribeStats = publicWebSocket.subscribe('stats:users', handleStatsUpdate);
            unsubscribeRegistered = publicWebSocket.subscribe('user:registered', handleUserRegistered);
          }
        }, 1000);
      }
    }, 500);

    return () => {
      clearTimeout(subscribeTimeout);
      unsubscribeStats?.();
      unsubscribeRegistered?.();
    };
  }, [user, authenticatedWebSocket, publicWebSocket, applyUpdate, hasInitialLoad]);

  // Fallback polling
  useEffect(() => {
    const shouldPoll = !authenticatedWebSocket?.isConnected && !publicWebSocket.isConnected && hasInitialLoad;
    
    if (!shouldPoll) {
      return;
    }

    console.log('[AnimatedUserCounter] Starting fallback polling (every 30s)');
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await userStatsService.getUserStats();
        if (response.success && response.data && mountedRef.current) {
          const newTotal = response.data.totalUsers;
          
          if (newTotal !== previousCountRef.current) {
            console.log('[AnimatedUserCounter] Polling detected change:', newTotal);
            applyUpdate(newTotal, false);
            setNewUsersToday(response.data.newUsersToday);
          }
        }
      } catch (error) {
        console.error('[AnimatedUserCounter] Polling error:', error);
      }
    }, 30000);
    
    return () => {
      console.log('[AnimatedUserCounter] Stopping fallback polling');
      clearInterval(pollInterval);
    };
  }, [authenticatedWebSocket?.isConnected, publicWebSocket.isConnected, hasInitialLoad, applyUpdate]);

  const displayValue = isLoading && !hasInitialLoad ? 'Loading' : formattedCount || '0';

  if (compact) {
    return (
      <motion.div 
        className={`flex items-center gap-1 sm:gap-2 relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#ff950e] animate-pulse-slow flex-shrink-0" aria-hidden="true" />
        <span className="text-[#ff950e] font-semibold text-[10px] sm:text-xs tracking-wider uppercase relative whitespace-nowrap">
          Trusted by{' '}
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
                  key={`inc-${animationKey}`}
                  className="absolute left-1/2 -translate-x-1/2 text-green-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none"
                  initial={{ 
                    opacity: 0, 
                    y: 0,
                  }}
                  animate={{ 
                    opacity: [0, 0.8, 1, 1, 0.8, 0],
                    y: [0, -6, -10, -14, -18, -20],
                  }}
                  exit={{ 
                    opacity: 0,
                  }}
                  transition={{ 
                    duration: 3,
                    ease: "easeOut",
                    times: [0, 0.1, 0.2, 0.5, 0.8, 1]
                  }}
                >
                  +{incrementAmount}
                </motion.span>
              )}
            </AnimatePresence>
          </span>{' '}
          users
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 relative ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ff950e]/10 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-[#ff950e]" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Total Users</h3>
            <p className="text-gray-400 text-sm">Growing community</p>
          </div>
        </div>
        
        <AnimatePresence>
          {showUpdateAnimation && (
            <motion.div
              key={`badge-${animationKey}`}
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: 180 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold"
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {incrementAmount > 1 ? `${incrementAmount} New Users!` : 'New User!'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-4xl font-bold text-white mb-2 relative">
        <motion.span
          animate={showUpdateAnimation ? { 
            scale: [1, 1.05, 1],
            color: ['#ffffff', '#ff950e', '#ffffff']
          } : {}}
          transition={{ duration: 0.5 }}
        >
          {displayValue}
        </motion.span>
      </div>

      {showNewUsersToday && newUsersToday > 0 && (
        <motion.div 
          className="text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-green-400">+{newUsersToday}</span> joined today
        </motion.div>
      )}
    </motion.div>
  );
}
