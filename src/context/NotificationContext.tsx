'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types/notification';
import { WebSocketEvent } from '@/types/websocket';

interface NotificationContextType {
  activeNotifications: Notification[];
  clearedNotifications: Notification[];
  unreadCount: number;
  totalCount: number;
  clearNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  restoreNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllCleared: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  addLocalNotification: (message: string, type?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const ws = useWebSocket();
  const subscribe = ws?.subscribe;

  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [clearedNotifications, setClearedNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const FETCH_COOLDOWN = 1000;
  
  // Track processed notification IDs to prevent duplicates
  const processedNotificationIds = useRef<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    if (!user || !isMountedRef.current) return;
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    setError(null);
    try {
      const activeRes = await notificationService.getActiveNotifications(50);
      if (activeRes.success && Array.isArray(activeRes.data) && isMountedRef.current) {
        setActiveNotifications(activeRes.data);
        setUnreadCount(activeRes.data.filter(n => !n.read).length);
        
        // Track all loaded notification IDs
        activeRes.data.forEach(n => {
          const id = n._id || n.id;
          if (id) processedNotificationIds.current.add(id);
        });
      }
      const clearedRes = await notificationService.getClearedNotifications(50);
      if (clearedRes.success && Array.isArray(clearedRes.data) && isMountedRef.current) {
        setClearedNotifications(clearedRes.data);
      }
    } catch (e) {
      if (isMountedRef.current) setError('Failed to load notifications');
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;
    if (user) {
      loadNotifications();
    } else {
      setActiveNotifications([]);
      setClearedNotifications([]);
      setUnreadCount(0);
    }
    return () => { isMountedRef.current = false; };
  }, [user, loadNotifications]);

  // FIXED: Only listen to the primary notification:new event from backend
  useEffect(() => {
    if (!subscribe || !user) return;
    const unsubs: Array<() => void> = [];

    // PRIMARY: This is the ONLY source for tip notifications
    // The backend's Notification.createTipNotification automatically emits this
    unsubs.push(subscribe('notification:new' as WebSocketEvent, (data: any) => {
      if (!isMountedRef.current) return;
      
      console.log('[NotificationContext] notification:new received', data);
      
      // Check if we've already processed this notification
      const notificationId = data.id || data._id;
      if (notificationId && processedNotificationIds.current.has(notificationId)) {
        console.log('[NotificationContext] Skipping duplicate notification:', notificationId);
        return;
      }
      
      // Add to processed set
      if (notificationId) {
        processedNotificationIds.current.add(notificationId);
        
        // Clean up old IDs to prevent memory leak
        if (processedNotificationIds.current.size > 200) {
          const idsArray = Array.from(processedNotificationIds.current);
          processedNotificationIds.current = new Set(idsArray.slice(-100));
        }
      }
      
      const n: Notification = {
        id: notificationId,
        _id: notificationId,
        recipient: data.recipient || user.username,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: false,
        cleared: false,
        priority: data.priority || 'normal',
        createdAt: data.createdAt || new Date().toISOString()
      };
      
      // Check if notification already exists in state
      setActiveNotifications(prev => {
        const exists = prev.some(existing => 
          (existing._id || existing.id) === notificationId
        );
        
        if (exists) {
          console.log('[NotificationContext] Notification already in state:', notificationId);
          return prev;
        }
        
        return [n, ...prev];
      });
      
      setUnreadCount(c => c + 1);
    }));

    // REMOVED: Legacy tip_received listener - no longer needed
    // REMOVED: message:new tip listener - no longer needed
    
    // Clear/restore/delete event handlers remain the same
    unsubs.push(subscribe('notification:cleared' as WebSocketEvent, (data: any) => {
      const id = data?.notificationId;
      setActiveNotifications(prev => {
        const found = prev.find(n => (n._id || n.id) === id);
        if (found) {
          setClearedNotifications(c => [found, ...c]);
          if (!found.read) setUnreadCount(u => Math.max(0, u - 1));
        }
        return prev.filter(n => (n._id || n.id) !== id);
      });
    }));

    unsubs.push(subscribe('notification:all_cleared' as WebSocketEvent, () => {
      setActiveNotifications(prevActive => {
        setClearedNotifications(prevCleared => [
          ...prevActive.map(n => ({ ...n, cleared: true })),
          ...prevCleared
        ]);
        setUnreadCount(0);
        return [];
      });
    }));

    unsubs.push(subscribe('notification:restored' as WebSocketEvent, (data: any) => {
      const id = data?.notificationId;
      setClearedNotifications(prev => {
        const found = prev.find(n => (n._id || n.id) === id);
        if (found) {
          setActiveNotifications(active => {
            // Check if already exists to prevent duplicates
            const exists = active.some(n => (n._id || n.id) === id);
            if (exists) return active;
            return [found, ...active];
          });
          if (!found.read) setUnreadCount(c => c + 1);
        }
        return prev.filter(n => (n._id || n.id) !== id);
      });
    }));

    unsubs.push(subscribe('notification:deleted' as WebSocketEvent, (data: any) => {
      const id = data?.notificationId;
      setClearedNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
    }));

    return () => unsubs.forEach(fn => fn());
  }, [subscribe, user]);

  // Actions
  const clearNotification = useCallback(async (id: string) => {
    try {
      const res = await notificationService.clearNotification(id);
      if (res.success) {
        setActiveNotifications(prev => {
          const found = prev.find(n => (n._id || n.id) === id);
          if (found) {
            setClearedNotifications(c => [{ ...found, cleared: true }, ...c]);
            if (!found.read) setUnreadCount(u => Math.max(0, u - 1));
          }
          return prev.filter(n => (n._id || n.id) !== id);
        });
      } else setError('Failed to clear notification');
    } catch {
      setError('Failed to clear notification');
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      const res = await notificationService.clearAll();
      if (res.success) {
        setActiveNotifications(prevActive => {
          setClearedNotifications(prevCleared => [
            ...prevActive.map(n => ({ ...n, cleared: true })),
            ...prevCleared
          ]);
          setUnreadCount(0);
          return [];
        });
      } else setError('Failed to clear all notifications');
    } catch {
      setError('Failed to clear all notifications');
    }
  }, []);

  const restoreNotification = useCallback(async (id: string) => {
    try {
      const res = await notificationService.restoreNotification(id);
      if (res.success) {
        setClearedNotifications(prev => {
          const found = prev.find(n => (n._id || n.id) === id);
          if (found) {
            setActiveNotifications(active => {
              // Check if already exists to prevent duplicates
              const exists = active.some(n => (n._id || n.id) === id);
              if (exists) return active;
              return [found, ...active];
            });
            if (!found.read) setUnreadCount(u => u + 1);
          }
          return prev.filter(n => (n._id || n.id) !== id);
        });
      } else setError('Failed to restore notification');
    } catch {
      setError('Failed to restore notification');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setClearedNotifications(prev => prev.filter(n => (n._id || n.id) !== id));
      } else setError('Failed to delete notification');
    } catch {
      setError('Failed to delete notification');
    }
  }, []);

  const deleteAllCleared = useCallback(async () => {
    try {
      const res = await notificationService.deleteAllCleared();
      if (res.success) {
        setClearedNotifications([]);
      } else setError('Failed to delete cleared notifications');
    } catch {
      setError('Failed to delete cleared notifications');
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setActiveNotifications(prev =>
          prev.map(n => (n._id || n.id) === id ? { ...n, read: true } : n)
        );
        const found = activeNotifications.find(n => (n._id || n.id) === id);
        if (found && !found.read) setUnreadCount(u => Math.max(0, u - 1));
      }
    } catch {}
  }, [activeNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setActiveNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {}
  }, []);

  const addLocalNotification = useCallback((message: string, type: string = 'system') => {
    if (!user) return;
    const n: Notification = {
      id: `local_${Date.now()}`,
      recipient: user.username,
      type: type as any,
      title: 'Notification',
      message,
      read: false,
      cleared: false,
      createdAt: new Date().toISOString(),
      priority: 'normal'
    };
    setActiveNotifications(prev => [n, ...prev]);
    setUnreadCount(c => c + 1);
  }, [user]);

  const value: NotificationContextType = {
    activeNotifications,
    clearedNotifications,
    unreadCount,
    totalCount: activeNotifications.length + clearedNotifications.length,
    clearNotification,
    clearAllNotifications,
    restoreNotification,
    deleteNotification,
    deleteAllCleared,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications,
    isLoading,
    error,
    addLocalNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
