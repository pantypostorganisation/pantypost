// src/hooks/useUserActivityStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';

interface ActivityStatus {
  isOnline: boolean;
  lastActive: Date | null;
}

export function useUserActivityStatus(username: string | null) {
  const [activityStatus, setActivityStatus] = useState<ActivityStatus>({
    isOnline: false,
    lastActive: null
  });
  const [loading, setLoading] = useState(true);
  
  const wsContext = useWebSocket();
  const { apiClient } = useAuth();
  
  // Handler functions wrapped in useCallback to prevent recreation
  const handleStatusUpdate = useCallback((data: any) => {
    if (!username) return;
    
    console.log(`[useUserActivityStatus] Processing user:status event for ${username}:`, data);
    
    if (data.username === username) {
      console.log(`[useUserActivityStatus] ✅ Status update matches ${username}: online=${data.isOnline}`);
      setActivityStatus({
        isOnline: Boolean(data.isOnline),
        lastActive: data.lastActive ? new Date(data.lastActive) : new Date()
      });
    }
  }, [username]);
  
  const handleOnlineEvent = useCallback((data: any) => {
    if (!username) return;
    
    console.log(`[useUserActivityStatus] Processing user:online event for ${username}:`, data);
    
    if (data.username === username) {
      console.log(`[useUserActivityStatus] ✅ ${username} is now ONLINE`);
      setActivityStatus({
        isOnline: true,
        lastActive: new Date()
      });
    }
  }, [username]);
  
  const handleOfflineEvent = useCallback((data: any) => {
    if (!username) return;
    
    console.log(`[useUserActivityStatus] Processing user:offline event for ${username}:`, data);
    
    if (data.username === username) {
      console.log(`[useUserActivityStatus] ✅ ${username} is now OFFLINE`);
      setActivityStatus({
        isOnline: false,
        lastActive: data.lastActive ? new Date(data.lastActive) : new Date()
      });
    }
  }, [username]);
  
  // Main effect for fetching and subscribing
  useEffect(() => {
    if (!username) {
      setActivityStatus({ isOnline: false, lastActive: null });
      setLoading(false);
      return;
    }
    
    let mounted = true;
    const unsubscribers: (() => void)[] = [];
    
    // First, set up WebSocket subscriptions if available
    if (wsContext) {
      console.log(`[useUserActivityStatus] Subscribing to WebSocket events for ${username}`);
      
      try {
        // Subscribe to all status events
        const unsub1 = wsContext.subscribe('user:status', handleStatusUpdate);
        const unsub2 = wsContext.subscribe('user:online', handleOnlineEvent);
        const unsub3 = wsContext.subscribe('user:offline', handleOfflineEvent);
        
        unsubscribers.push(unsub1, unsub2, unsub3);
        
        console.log(`[useUserActivityStatus] ✅ Successfully subscribed to events for ${username}`);
      } catch (error) {
        console.error(`[useUserActivityStatus] Error subscribing to events:`, error);
      }
    } else {
      console.warn(`[useUserActivityStatus] No WebSocket context available for ${username}`);
    }
    
    // Then fetch initial status from API
    const fetchInitialStatus = async () => {
      try {
        console.log(`[useUserActivityStatus] Fetching initial status for ${username}...`);
        const response = await apiClient.get(`/messages/user-status/${username}`);
        
        if (mounted && response.success && response.data) {
          console.log(`[useUserActivityStatus] Initial status for ${username}:`, response.data);
          setActivityStatus({
            isOnline: response.data.isOnline || false,
            lastActive: response.data.lastActive ? new Date(response.data.lastActive) : null
          });
        }
      } catch (error) {
        console.error(`[useUserActivityStatus] Error fetching status for ${username}:`, error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchInitialStatus();
    
    // Cleanup function
    return () => {
      mounted = false;
      console.log(`[useUserActivityStatus] Unsubscribing from events for ${username}`);
      unsubscribers.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.error(`[useUserActivityStatus] Error unsubscribing:`, error);
        }
      });
    };
  }, [username, wsContext, apiClient, handleStatusUpdate, handleOnlineEvent, handleOfflineEvent]);
  
  // Update relative times periodically
  useEffect(() => {
    if (!activityStatus.isOnline && activityStatus.lastActive) {
      const interval = setInterval(() => {
        // Force a re-render to update the relative time display
        setActivityStatus(prev => ({ ...prev }));
      }, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
    return undefined;
  }, [activityStatus.isOnline, activityStatus.lastActive]);
  
  return { activityStatus, loading };
}