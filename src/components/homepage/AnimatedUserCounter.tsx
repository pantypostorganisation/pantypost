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
  
  const { user } = useAuth();
  const authenticatedWebSocket = useWebSocket();
  const publicWebSocket = usePublicWebSocket({ autoConnect: !user });
  const mountedRef = useRef(true);
  const previousCountRef = useRef(0);

  // Spring animation for smooth counting
  const springValue = useSpring(0, { 
    stiffness: 65,
    damping: 14,
    mass: 1 
  });

  // Transform the spring value to an integer
  const displayCount = useTransform(springValue, (value) => Math.round(value));
  const [formattedCount, setFormattedCount] = useState('0');

  // Update formatted count when display count changes
  useEffect(() => {
    const unsubscribe = displayCount.on('change', (value) => {
      setFormattedCount(value.toLocaleString());
    });
    return () => unsubscribe();
  }, [displayCount]);

  // Fetch initial stats
  const fetchStats = useCallback(async () => {
    try {
      console.log('[AnimatedUserCounter] Fetching initial stats...');
      const response = await userStatsService.getUserStats();
      if (response.success && response.data && mountedRef.current) {
        console.log('[AnimatedUserCounter] Got initial stats:', response.data);
        setTargetCount(response.data.totalUsers);
        setNewUsersToday(response.data.newUsersToday);
        previousCountRef.current = response.data.totalUsers;
        
        if (!hasInitialLoad) {
          springValue.set(response.data.totalUsers);
          setHasInitialLoad(true);
        } else {
          springValue.set(response.data.totalUsers);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[AnimatedUserCounter] Failed to fetch user stats:', error);
      setTargetCount(0);
      setFormattedCount('0');
      setIsLoading(false);
    }
  }, [springValue, hasInitialLoad]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchStats();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchStats]);

  // Handle real-time updates based on authentication status
  useEffect(() => {
    const handleStatsUpdate = (data: any) => {
      if (!mountedRef.current) return;
      
      console.log('[AnimatedUserCounter] Stats update received:', data);
      
      if (data.totalUsers !== undefined && data.totalUsers !== previousCountRef.current) {
        console.log('[AnimatedUserCounter] Updating to new total:', data.totalUsers);
        
        const increment = data.totalUsers - previousCountRef.current;
        
        setTargetCount(data.totalUsers);
        springValue.set(data.totalUsers);
        
        if (increment > 0) {
          setIncrementAmount(increment);
          setShowUpdateAnimation(true);
          setTimeout(() => {
            if (mountedRef.current) setShowUpdateAnimation(false);
          }, 3500);
        }
        
        previousCountRef.current = data.totalUsers;
      }
      
      if (data.newUsersToday !== undefined) {
        setNewUsersToday(data.newUsersToday);
      }
      
      userStatsService.updateCachedStats(data);
    };

    const handleNewUser = (data: any) => {
      if (!mountedRef.current) return;
      
      console.log('[AnimatedUserCounter] New user registered:', data);
      
      setTargetCount((prev) => {
        const newCount = prev + 1;
        console.log('[AnimatedUserCounter] Incrementing count from', prev, 'to', newCount);
        springValue.set(newCount);
        previousCountRef.current = newCount;
        return newCount;
      });
      
      setNewUsersToday((prev) => prev + 1);
      
      userStatsService.incrementUserCount(1);
      
      setIncrementAmount(1);
      setShowUpdateAnimation(true);
      setTimeout(() => {
        if (mountedRef.current) setShowUpdateAnimation(false);
      }, 3500);
    };

    let unsubscribeStats: (() => void) | undefined;
    let unsubscribeNewUser: (() => void) | undefined;

    if (user && authenticatedWebSocket) {
      console.log('[AnimatedUserCounter] Using authenticated WebSocket');
      unsubscribeStats = authenticatedWebSocket.subscribe('stats:users', handleStatsUpdate);
      unsubscribeNewUser = authenticatedWebSocket.subscribe('user:registered', handleNewUser);
    } else if (publicWebSocket.isConnected) {
      console.log('[AnimatedUserCounter] Using public WebSocket for guest');
      unsubscribeStats = publicWebSocket.subscribe('stats:users', handleStatsUpdate);
      unsubscribeNewUser = publicWebSocket.subscribe('user:registered', handleNewUser);
    }

    return () => {
      unsubscribeStats?.();
      unsubscribeNewUser?.();
    };
  }, [user, authenticatedWebSocket, publicWebSocket.isConnected, springValue]);

  // Fallback polling for when WebSocket is not available
  useEffect(() => {
    const shouldPoll = !authenticatedWebSocket?.isConnected && !publicWebSocket.isConnected;
    
    if (!shouldPoll || isLoading) {
      return;
    }

    console.log('[AnimatedUserCounter] Starting fallback polling (every 15s)');
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await userStatsService.getUserStats();
        if (response.success && response.data && mountedRef.current) {
          const newTotal = response.data.totalUsers;
          
          if (newTotal !== previousCountRef.current) {
            console.log('[AnimatedUserCounter] Polling detected change:', newTotal);
            
            const increment = newTotal - previousCountRef.current;
            
            setTargetCount(newTotal);
            setNewUsersToday(response.data.newUsersToday);
            springValue.set(newTotal);
            
            if (increment > 0) {
              setIncrementAmount(increment);
              setShowUpdateAnimation(true);
              setTimeout(() => {
                if (mountedRef.current) setShowUpdateAnimation(false);
              }, 3500);
            }
            
            previousCountRef.current = newTotal;
          }
        }
      } catch (error) {
        console.error('[AnimatedUserCounter] Polling error:', error);
      }
    }, 15000);
    
    return () => {
      console.log('[AnimatedUserCounter] Stopping fallback polling');
      clearInterval(pollInterval);
    };
  }, [
    authenticatedWebSocket?.isConnected, 
    publicWebSocket.isConnected, 
    isLoading, 
    springValue
  ]);

  const displayValue = isLoading && !hasInitialLoad ? 'Loading' : formattedCount || '0';

  if (compact) {
    return (
      <motion.div 
        className={`flex items-center gap-2 relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className="h-5 w-5 text-[#ff950e] animate-pulse-slow" aria-hidden="true" />
        <span className="text-[#ff950e] font-semibold text-xs tracking-wider uppercase relative">
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
            
            {/* Single slow floating increment */}
            <AnimatePresence mode="wait">
              {showUpdateAnimation && (
                <motion.span
                  key={`inc-${incrementAmount}-${Date.now()}`}
                  className="absolute left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  initial={{ 
                    opacity: 0, 
                    y: 0,
                  }}
                  animate={{ 
                    opacity: [0, 1, 1, 1, 0],
                    y: [0, -6, -10, -14, -18],
                  }}
                  exit={{ 
                    opacity: 0,
                  }}
                  transition={{ 
                    duration: 3,
                    ease: "easeOut",
                    times: [0, 0.1, 0.4, 0.7, 1]
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
        
        {showUpdateAnimation && (
          <motion.div
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

      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs">
          {user ? (
            <span className={`px-2 py-1 rounded ${authenticatedWebSocket?.isConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {authenticatedWebSocket?.isConnected ? 'WS Connected' : 'Polling'}
            </span>
          ) : (
            <span className={`px-2 py-1 rounded ${publicWebSocket.isConnected ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {publicWebSocket.isConnected ? 'Public WS' : 'Polling'}
            </span>
          )}
        </div>
      )}

      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
        {showUpdateAnimation && Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#ff950e] rounded-full"
            initial={{ 
              x: '50%', 
              y: '50%',
              opacity: 1 
            }}
            animate={{ 
              x: `${50 + (Math.random() - 0.5) * 100}%`, 
              y: `${50 + (Math.random() - 0.5) * 100}%`,
              opacity: 0
            }}
            transition={{ 
              duration: 1.5,
              delay: i * 0.1,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}