// src/components/homepage/AnimatedUserCounter.tsx

'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';
import Image from 'next/image';
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
  /* See PaymentsProcessedCounter: the refresh interval captures
     fetchStats once, so the state variable reads false forever inside
     it. The ref is always current. */
  const hasInitialLoadRef = useRef(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  const { user } = useAuth();
  const authenticatedWebSocket = useWebSocket();
  const publicWebSocket = usePublicWebSocket({ 
    autoConnect: !user,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });
  
  const mountedRef = useRef(true);
  const previousCountRef = useRef(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<(() => void) | undefined>(undefined);

  /* A fixed eased count-up, matching PaymentsProcessedCounter exactly.
   *
   * This was a spring, tuned to LOOK like it finished at the same time.
   * Two problems with that. A spring's settle time depends on the
   * distance travelled, so the two counters drifted apart whenever the
   * numbers differed in size -- which is most of the time, given one
   * counts people and the other counts dollars. And the tuning sat at
   * a damping ratio just under critical, which means it overshoots by
   * design: 149 users animated up to 150 and fell back. That reads as
   * a number briefly being wrong, which on a counter is the one thing
   * it must never do.
   *
   * Same duration, same easing, no overshoot. Both counters now start
   * and finish together regardless of how many digits each is
   * counting. */
  const COUNT_DURATION_MS = 1500;

  const [formattedCount, setFormattedCount] = useState('0');
  const animationFrameRef = useRef<number | null>(null);

  const animateCount = useCallback((from: number, to: number, duration: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (duration <= 0 || from === to) {
      setFormattedCount(Math.round(to).toLocaleString());
      return;
    }

    const startTime = Date.now();
    const difference = to - from;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = () => {
      if (!mountedRef.current) return;

      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const value = from + difference * easeOutCubic(progress);

      setFormattedCount(Math.round(value).toLocaleString());

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        // Land on the exact figure, never a rounded approach to it.
        setFormattedCount(Math.round(to).toLocaleString());
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, []);

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

  const updateCount = useCallback((newCount: number, animate: boolean = true) => {
    if (!mountedRef.current) return;
    
    console.log('[AnimatedUserCounter] Updating count:', { 
      from: previousCountRef.current, 
      to: newCount,
      animate 
    });
    
    const increment = newCount - previousCountRef.current;
    
    setTargetCount(newCount);
    animateCount(
      previousCountRef.current,
      newCount,
      animate ? COUNT_DURATION_MS : 0
    );
    
    if (increment > 0 && animate && hasInitialLoadRef.current) {
      triggerAnimation(increment);
    }
    
    previousCountRef.current = newCount;
  }, [animateCount, triggerAnimation]);

  /* The subscription effect below used to depend on updateCount directly.
     updateCount's identity changes whenever hasInitialLoad flips, and the
     websocket context objects are NOT identity-stable across provider
     re-renders -- so the effect tore down and rebuilt the subscription
     repeatedly, each time waiting 1s before re-subscribing. Any stats
     event arriving in those gaps was silently dropped.

     Same lesson as the messaging typing indicator: read the live
     callback through a ref at call time, and key the effect on what
     actually identifies the subscription. */
  const fetchStatsRef = useRef<() => void>(() => {});
  const updateCountRef = useRef(updateCount);
  useEffect(() => {
    updateCountRef.current = updateCount;
  }, [updateCount]);

  const fetchStats = useCallback(async () => {
    try {
      console.log('[AnimatedUserCounter] Fetching stats...');
      const response = await userStatsService.getUserStats();
      
      if (response.success && response.data && mountedRef.current) {
        console.log('[AnimatedUserCounter] Stats fetched:', response.data);
        
        setNewUsersToday(response.data.newUsersToday || 0);
        
        if (!hasInitialLoadRef.current) {
          /* First paint: count up from zero, the same as the payments
             counter does. Setting the value directly meant the number
             simply appeared while the one beside it counted up. */
          hasInitialLoadRef.current = true;
          previousCountRef.current = response.data.totalUsers;
          setTargetCount(response.data.totalUsers);
          animateCount(0, response.data.totalUsers, COUNT_DURATION_MS);
          setHasInitialLoad(true);
        } else {
          // Update with animation
          updateCount(response.data.totalUsers, true);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[AnimatedUserCounter] Failed to fetch stats:', error);
      setIsLoading(false);
      
      // Retry after 2 seconds
      if (!hasInitialLoadRef.current && mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current) {
            fetchStats();
          }
        }, 2000);
      }
    }
  }, [animateCount, updateCount]);

  useEffect(() => {
    fetchStatsRef.current = fetchStats;
  }, [fetchStats]);

  /* Returning to a backgrounded tab used to make the counter sail past
     the real figure and drift back down from a few hundred.

     The count is a physics spring, and browsers stop delivering
     animation frames to hidden tabs. On return the spring integrates
     one enormous time step, overshoots wildly, then settles -- which
     reads as the number counting DOWN, the opposite of what a counter
     should ever appear to do.

     Snapping the spring to its current resting value the moment the
     tab becomes visible skips that catch-up frame entirely. The
     refetch afterwards still animates any genuine increase, so a real
     jump in signups while you were away is still shown. */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible' || !mountedRef.current) return;

      /* Not on first load. `pageshow` fires on an ordinary page load as
         well as on a back-forward restore, so without this guard a
         refresh cancelled the opening count-up and snapped straight to
         the figure -- the number simply appeared while the payments
         counter beside it animated. Only a genuine return to an
         already-loaded tab needs the snap. */
      if (!hasInitialLoadRef.current) return;

      /* Snap to the settled figure before refetching.
         A tab in the background gets its animation frames throttled or
         paused, so a count-up that was mid-flight resumes from
         wherever it froze -- which looked like the number changing by
         itself on tab return. Cancelling and landing on the real value
         first means the refetch animates from the truth. */
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setFormattedCount(Math.round(previousCountRef.current).toLocaleString());

      fetchStatsRef.current();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    
    // Fetch immediately
    fetchStats();
    
    // Also set up periodic refresh every 60 seconds as backup
    const refreshInterval = setInterval(() => {
      if (mountedRef.current) {
        fetchStatsRef.current();
      }
    }, 60000);

    return () => {
      mountedRef.current = false;
      clearInterval(refreshInterval);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // WebSocket subscription management - FIXED: Only listen to stats:users
  useEffect(() => {
    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = undefined;
    }

    const handleStatsUpdate = (data: any) => {
      console.log('[AnimatedUserCounter] Received stats:users event:', data);
      
      if (!mountedRef.current) return;
      
      if (typeof data.totalUsers === 'number') {
        updateCount(data.totalUsers, true);
        
        if (typeof data.newUsersToday === 'number') {
          setNewUsersToday(data.newUsersToday);
        }
        
        // Update cache
        userStatsService.updateCachedStats(data);
      }
    };

    // Set up subscriptions based on auth state
    const setupSubscription = () => {
      console.log('[AnimatedUserCounter] Setting up subscription...', {
        isAuthenticated: !!user,
        authWsConnected: authenticatedWebSocket?.isConnected,
        publicWsConnected: publicWebSocket.isConnected
      });

      if (user && authenticatedWebSocket) {
        // Authenticated user - use authenticated WebSocket
        console.log('[AnimatedUserCounter] Subscribing via authenticated WebSocket');
        
        // FIXED: Only subscribe to stats:users (removed user:registered)
        subscriptionRef.current = authenticatedWebSocket.subscribe('stats:users', handleStatsUpdate);
      } else {
        // Guest user - use public WebSocket
        console.log('[AnimatedUserCounter] Subscribing via public WebSocket');
        
        // Make sure public WebSocket is connected
        if (!publicWebSocket.isConnected) {
          console.log('[AnimatedUserCounter] Public WebSocket not connected, connecting...');
          publicWebSocket.connect();
        }
        
        // FIXED: Only subscribe to stats:users (removed user:registered)
        subscriptionRef.current = publicWebSocket.subscribe('stats:users', handleStatsUpdate);
      }
    };

    // Set up subscription with a small delay to ensure WebSocket is ready
    const setupTimeout = setTimeout(() => {
      setupSubscription();
    }, 1000);

    // Also listen for connection changes
    const connectionCheckInterval = setInterval(() => {
      const shouldUseAuth = !!user && authenticatedWebSocket?.isConnected;
      const shouldUsePublic = !user && publicWebSocket.isConnected;
      
      // Re-setup if we have a connection but no subscription
      if ((shouldUseAuth || shouldUsePublic) && !subscriptionRef.current) {
        console.log('[AnimatedUserCounter] Connection detected, re-subscribing...');
        setupSubscription();
      }
    }, 2000);

    return () => {
      clearTimeout(setupTimeout);
      clearInterval(connectionCheckInterval);
      
      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [user, authenticatedWebSocket, publicWebSocket, updateCount, hasInitialLoad]);

  const displayValue = isLoading && !hasInitialLoad ? 'Loading' : formattedCount || '0';

  if (compact) {
    return (
      <motion.div 
        className={`flex items-center gap-1 sm:gap-2 relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Custom artwork rather than a lucide glyph, matched with the
            card on the payments counter -- both are solid orange fills
            of the same weight, which is what the earlier outline-vs-
            solid pairing kept failing to achieve. If either changes,
            change both. */}
        <Image
          src="/icons/users-icon.png"
          alt=""
          width={20}
          height={20}
          className="h-3.5 w-3.5 sm:h-5 sm:w-5 flex-shrink-0 object-contain"
          aria-hidden="true"
        />
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
        {process.env.NODE_ENV === 'development' && (
          <span className={`ml-1 text-[8px] ${publicWebSocket.isConnected || authenticatedWebSocket?.isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
            {publicWebSocket.isConnected || authenticatedWebSocket?.isConnected ? '\u25CF' : '\u25CB'}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 relative ${className}`}
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
              className="bg-green-500/20 text-green-400 px-3 py-1 rounded-sm text-sm font-semibold"
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






