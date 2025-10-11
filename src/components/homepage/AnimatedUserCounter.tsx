// src/components/homepage/AnimatedUserCounter.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { CheckCircle, Users, TrendingUp } from 'lucide-react';
import { userStatsService } from '@/services/userStats.service';
import { useWebSocket } from '@/context/WebSocketContext';

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
  const webSocket = useWebSocket();
  const mountedRef = useRef(true);

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
        springValue.set(response.data.totalUsers);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[AnimatedUserCounter] Failed to fetch user stats:', error);
      setIsLoading(false);
    }
  }, [springValue]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchStats();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchStats]);

  // WebSocket real-time updates (for authenticated users)
  useEffect(() => {
    if (!webSocket) {
      console.log('[AnimatedUserCounter] WebSocket not available - user is likely a guest');
      return;
    }

    console.log('[AnimatedUserCounter] Setting up WebSocket subscriptions for authenticated user');

    // Listen for new user registration events
    const unsubscribeNewUser = webSocket.subscribe('user:registered', (data: any) => {
      if (!mountedRef.current) return;
      
      console.log('[AnimatedUserCounter] New user registered event received:', data);
      
      // Increment the count with animation
      setTargetCount((prev) => {
        const newCount = prev + 1;
        console.log('[AnimatedUserCounter] Incrementing count from', prev, 'to', newCount);
        springValue.set(newCount);
        return newCount;
      });
      
      setNewUsersToday((prev) => prev + 1);
      
      // Update cached stats in service
      userStatsService.incrementUserCount(1);
      
      // Show update animation
      setShowUpdateAnimation(true);
      setTimeout(() => {
        if (mountedRef.current) setShowUpdateAnimation(false);
      }, 3000);
    });

    // Listen for stats update events (full stats broadcast)
    const unsubscribeStatsUpdate = webSocket.subscribe('stats:users', (data: any) => {
      if (!mountedRef.current) return;
      
      console.log('[AnimatedUserCounter] Stats update event received:', data);
      
      if (data.totalUsers !== undefined) {
        console.log('[AnimatedUserCounter] Updating to new total:', data.totalUsers);
        setTargetCount(data.totalUsers);
        springValue.set(data.totalUsers);
      }
      
      if (data.newUsersToday !== undefined) {
        setNewUsersToday(data.newUsersToday);
      }
      
      // Update cached stats
      userStatsService.updateCachedStats(data);
    });

    return () => {
      console.log('[AnimatedUserCounter] Cleaning up WebSocket subscriptions');
      unsubscribeNewUser();
      unsubscribeStatsUpdate();
    };
  }, [webSocket, springValue]);

  // Polling for guests (when WebSocket not available)
  useEffect(() => {
    // Only poll if:
    // 1. Not loading initial data
    // 2. No WebSocket (guest user)
    if (isLoading || webSocket) {
      return;
    }

    console.log('[AnimatedUserCounter] Starting polling for guest user (every 10s)');
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await userStatsService.getUserStats();
        if (response.success && response.data && mountedRef.current) {
          const newTotal = response.data.totalUsers;
          
          // Check if count increased
          if (newTotal > targetCount) {
            console.log('[AnimatedUserCounter] Polling detected new users:', newTotal, '(was', targetCount + ')');
            
            setTargetCount(newTotal);
            setNewUsersToday(response.data.newUsersToday);
            springValue.set(newTotal);
            
            // Show celebration animation
            setShowUpdateAnimation(true);
            setTimeout(() => {
              if (mountedRef.current) setShowUpdateAnimation(false);
            }, 3000);
          }
        }
      } catch (error) {
        console.error('[AnimatedUserCounter] Polling error:', error);
      }
    }, 10000); // Poll every 10 seconds
    
    return () => {
      console.log('[AnimatedUserCounter] Stopping polling');
      clearInterval(pollInterval);
    };
  }, [webSocket, isLoading, targetCount, springValue]);

  if (compact) {
    return (
      <motion.div 
        className={`flex items-center gap-2 relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className="h-5 w-5 text-[#ff950e] animate-pulse-slow" aria-hidden="true" />
        <span className="text-[#ff950e] font-semibold text-xs tracking-wider uppercase">
          Trusted by{' '}
          <motion.span 
            className="font-bold"
            animate={showUpdateAnimation ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {isLoading ? '...' : formattedCount}
          </motion.span>{' '}
          users
        </span>
        
        {/* Celebration animation for new users */}
        {showUpdateAnimation && (
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-green-400 text-xs font-bold">+1</span>
          </motion.div>
        )}
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
            New User!
          </motion.div>
        )}
      </div>

      <div className="text-4xl font-bold text-white mb-2">
        <motion.span
          animate={showUpdateAnimation ? { 
            scale: [1, 1.05, 1],
            color: ['#ffffff', '#ff950e', '#ffffff']
          } : {}}
          transition={{ duration: 0.5 }}
        >
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : (
            formattedCount
          )}
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

      {/* Animated background particles */}
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