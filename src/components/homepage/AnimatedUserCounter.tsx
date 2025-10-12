// src/components/homepage/AnimatedUserCounter.tsx
‘use client’;

import React, { useEffect, useState, useRef, useCallback } from ‘react’;
import { motion, useSpring, useTransform, AnimatePresence } from ‘framer-motion’;
import { CheckCircle, Users, TrendingUp } from ‘lucide-react’;
import { userStatsService } from ‘@/services/userStats.service’;
import { useWebSocket } from ‘@/context/WebSocketContext’;
import { usePublicWebSocket } from ‘@/hooks/usePublicWebSocket’;
import { useAuth } from ‘@/context/AuthContext’;

interface AnimatedUserCounterProps {
className?: string;
showNewUsersToday?: boolean;
compact?: boolean;
}

export default function AnimatedUserCounter({
className = ‘’,
showNewUsersToday = false,
compact = false
}: AnimatedUserCounterProps) {
const [targetCount, setTargetCount] = useState(0);
const [newUsersToday, setNewUsersToday] = useState(0);
const [isLoading, setIsLoading] = useState(true);
const [showUpdateAnimation, setShowUpdateAnimation] = useState(false);
const [incrementAmount, setIncrementAmount] = useState(1);
const [hasInitialLoad, setHasInitialLoad] = useState(false);
const [animationKey, setAnimationKey] = useState(0); // Key to force new animation instance

const { user } = useAuth();
const authenticatedWebSocket = useWebSocket();
const publicWebSocket = usePublicWebSocket({ autoConnect: !user });
const mountedRef = useRef(true);
const previousCountRef = useRef(0);
const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const isInitialFetchRef = useRef(true); // Track if this is the initial fetch

// Spring animation for smooth counting
const springValue = useSpring(0, {
stiffness: 65,
damping: 14,
mass: 1
});

// Transform the spring value to an integer
const displayCount = useTransform(springValue, (value) => Math.round(value));
const [formattedCount, setFormattedCount] = useState(‘0’);

// Update formatted count when display count changes
useEffect(() => {
const unsubscribe = displayCount.on(‘change’, (value) => {
setFormattedCount(value.toLocaleString());
});
return () => unsubscribe();
}, [displayCount]);

// Helper to trigger animation
const triggerAnimation = useCallback((increment: number) => {
// Clear any existing animation timeout
if (animationTimeoutRef.current) {
clearTimeout(animationTimeoutRef.current);
}

```
setIncrementAmount(increment);
setShowUpdateAnimation(true);
setAnimationKey(prev => prev + 1); // Force new animation instance

animationTimeoutRef.current = setTimeout(() => {
  if (mountedRef.current) {
    setShowUpdateAnimation(false);
  }
}, 3500);
```

}, []);

// Fetch initial stats
const fetchStats = useCallback(async () => {
try {
console.log(’[AnimatedUserCounter] Fetching initial stats…’);
const response = await userStatsService.getUserStats();
if (response.success && response.data && mountedRef.current) {
console.log(’[AnimatedUserCounter] Got initial stats:’, response.data);
setTargetCount(response.data.totalUsers);
setNewUsersToday(response.data.newUsersToday);

```
    if (!hasInitialLoad) {
      // First load - just set the value without animation
      springValue.set(response.data.totalUsers);
      previousCountRef.current = response.data.totalUsers;
      setHasInitialLoad(true);
      isInitialFetchRef.current = false; // Mark initial fetch as complete
    } else {
      // Subsequent fetches - check for changes
      const increment = response.data.totalUsers - previousCountRef.current;
      if (increment > 0) {
        springValue.set(response.data.totalUsers);
        previousCountRef.current = response.data.totalUsers;
        triggerAnimation(increment);
      }
    }
    
    setIsLoading(false);
  }
} catch (error) {
  console.error('[AnimatedUserCounter] Failed to fetch user stats:', error);
  setTargetCount(0);
  setFormattedCount('0');
  setIsLoading(false);
  isInitialFetchRef.current = false;
}
```

}, [springValue, hasInitialLoad, triggerAnimation]);

// Initial fetch
useEffect(() => {
mountedRef.current = true;
fetchStats();

```
return () => {
  mountedRef.current = false;
  if (animationTimeoutRef.current) {
    clearTimeout(animationTimeoutRef.current);
  }
};
```

}, [fetchStats]);

// Handle real-time updates based on authentication status
useEffect(() => {
const handleStatsUpdate = (data: any) => {
if (!mountedRef.current) return;

```
  // Skip if we're still doing initial fetch
  if (isInitialFetchRef.current) {
    console.log('[AnimatedUserCounter] Skipping WebSocket update during initial fetch');
    return;
  }
  
  console.log('[AnimatedUserCounter] Stats update received:', data);
  
  if (data.totalUsers !== undefined && data.totalUsers !== previousCountRef.current) {
    console.log('[AnimatedUserCounter] Updating to new total:', data.totalUsers);
    
    const increment = data.totalUsers - previousCountRef.current;
    
    setTargetCount(data.totalUsers);
    springValue.set(data.totalUsers);
    
    if (increment > 0) {
      triggerAnimation(increment);
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
  
  // Skip if we're still doing initial fetch
  if (isInitialFetchRef.current) {
    console.log('[AnimatedUserCounter] Skipping new user event during initial fetch');
    return;
  }
  
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
  
  triggerAnimation(1);
};

let unsubscribeStats: (() => void) | undefined;
let unsubscribeNewUser: (() => void) | undefined;

// Wait a bit before subscribing to avoid race conditions with initial fetch
const subscribeTimeout = setTimeout(() => {
  if (user && authenticatedWebSocket) {
    console.log('[AnimatedUserCounter] Using authenticated WebSocket');
    unsubscribeStats = authenticatedWebSocket.subscribe('stats:users', handleStatsUpdate);
    unsubscribeNewUser = authenticatedWebSocket.subscribe('user:registered', handleNewUser);
  } else if (publicWebSocket.isConnected) {
    console.log('[AnimatedUserCounter] Using public WebSocket for guest');
    unsubscribeStats = publicWebSocket.subscribe('stats:users', handleStatsUpdate);
    unsubscribeNewUser = publicWebSocket.subscribe('user:registered', handleNewUser);
  }
}, 500); // Small delay to ensure initial fetch completes first

return () => {
  clearTimeout(subscribeTimeout);
  unsubscribeStats?.();
  unsubscribeNewUser?.();
};
```

}, [user, authenticatedWebSocket, publicWebSocket.isConnected, springValue, triggerAnimation]);

// Fallback polling for when WebSocket is not available
useEffect(() => {
const shouldPoll = !authenticatedWebSocket?.isConnected && !publicWebSocket.isConnected;

```
if (!shouldPoll || isLoading) {
  return;
}

console.log('[AnimatedUserCounter] Starting fallback polling (every 15s)');

const pollInterval = setInterval(async () => {
  // Skip if we're still doing initial fetch
  if (isInitialFetchRef.current) return;
  
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
          triggerAnimation(increment);
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
```

}, [
authenticatedWebSocket?.isConnected,
publicWebSocket.isConnected,
isLoading,
springValue,
triggerAnimation
]);

const displayValue = isLoading && !hasInitialLoad ? ‘Loading’ : formattedCount || ‘0’;

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
Trusted by{’ ‘}
<span className="relative inline-block">
<motion.span
className=“font-bold”
animate={showUpdateAnimation ? {
scale: [1, 1.15, 1],
color: [’#ff950e’, ‘#22c55e’, ‘#ff950e’]
} : {}}
transition={{ duration: 0.5 }}
>
{displayValue}
</motion.span>

```
        {/* Improved floating increment animation */}
        <AnimatePresence mode="wait">
          {showUpdateAnimation && (
            <motion.span
              key={`inc-${animationKey}`}
              className="absolute left-1/2 -translate-x-1/2 text-green-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none"
              initial={{ 
                opacity: 0, 
                y: 0,
              }}
              animate={{ 
                opacity: [0, 0.8, 1, 1, 0.8, 0],
                y: [0, -8, -12, -16, -20, -24],
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
```

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

```
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
        key={`particle-${animationKey}-${i}`}
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
```

);
}