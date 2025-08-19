// src/context/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { notificationService } from '@/services/notification.service';
import type { Notification, NotificationResponse } from '@/types/notification';
import { WebSocketEvent } from '@/types/websocket';
import { storageService } from '@/services';
import { v4 as uuidv4 } from 'uuid';

interface NotificationContextType {
  // Notification lists
  activeNotifications: Notification[];
  clearedNotifications: Notification[];
  
  // Counts
  unreadCount: number;
  totalCount: number;
  
  // Actions
  clearNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  restoreNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllCleared: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // Refresh
  refreshNotifications: () => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Add notification locally (for testing or offline)
  addLocalNotification: (message: string, type?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const webSocketContext = useWebSocket();
  const subscribe = webSocketContext?.subscribe;
  
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);
  const [clearedNotifications, setClearedNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);
  const FETCH_COOLDOWN = 1000; // 1 second cooldown between fetches

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    if (!user || !isMountedRef.current) return;
    
    // Check cooldown
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN) {
      console.log('[NotificationContext] Skipping fetch due to cooldown');
      return;
    }
    lastFetchRef.current = now;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch active notifications
      const activeResponse = await notificationService.getActiveNotifications(50);
      if (activeResponse.success && activeResponse.data && isMountedRef.current) {
        const notifications = Array.isArray(activeResponse.data) ? activeResponse.data : [];
        setActiveNotifications(notifications);
        
        // Calculate unread count
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
      
      // Fetch cleared notifications
      const clearedResponse = await notificationService.getClearedNotifications(50);
      if (clearedResponse.success && clearedResponse.data && isMountedRef.current) {
        const notifications = Array.isArray(clearedResponse.data) ? clearedResponse.data : [];
        setClearedNotifications(notifications);
      }
    } catch (err) {
      console.error('[NotificationContext] Error loading notifications:', err);
      if (isMountedRef.current) {
        setError('Failed to load notifications');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Load notifications on mount and when user changes
  useEffect(() => {
    isMountedRef.current = true;
    
    if (user) {
      loadNotifications();
    } else {
      // Clear notifications when user logs out
      setActiveNotifications([]);
      setClearedNotifications([]);
      setUnreadCount(0);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [user, loadNotifications]);

  // Subscribe to WebSocket events for real-time notifications
  useEffect(() => {
    if (!subscribe || !user) return;
    
    console.log('[NotificationContext] Setting up WebSocket subscriptions');
    
    const unsubscribers: (() => void)[] = [];
    
    // New notification event
    const unsubNew = subscribe('notification:new' as WebSocketEvent, (data: any) => {
      console.log('[NotificationContext] New notification received:', data);
      
      if (!isMountedRef.current) return;
      
      const notification: Notification = {
        id: data.id || data._id,
        _id: data._id || data.id,
        recipient: user.username,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        read: false,
        cleared: false,
        priority: data.priority || 'normal',
        createdAt: data.createdAt || new Date().toISOString()
      };
      
      setActiveNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Fire browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
          tag: notification.id
        });
      }
    });
    unsubscribers.push(unsubNew);
    
    // Notification cleared event
    const unsubCleared = subscribe('notification:cleared' as WebSocketEvent, (data: any) => {
      console.log('[NotificationContext] Notification cleared:', data);
      
      if (!isMountedRef.current) return;
      
      const notificationId = data.notificationId;
      
      setActiveNotifications(prev => {
        const notification = prev.find(n => (n._id || n.id) === notificationId);
        if (notification) {
          setClearedNotifications(cleared => [notification, ...cleared]);
        }
        return prev.filter(n => (n._id || n.id) !== notificationId);
      });
    });
    unsubscribers.push(unsubCleared);
    
    // All notifications cleared event
    const unsubAllCleared = subscribe('notification:all_cleared' as WebSocketEvent, () => {
      console.log('[NotificationContext] All notifications cleared');
      
      if (!isMountedRef.current) return;
      
      setClearedNotifications(prev => [...activeNotifications, ...prev]);
      setActiveNotifications([]);
      setUnreadCount(0);
    });
    unsubscribers.push(unsubAllCleared);
    
    // Notification restored event
    const unsubRestored = subscribe('notification:restored' as WebSocketEvent, (data: any) => {
      console.log('[NotificationContext] Notification restored:', data);
      
      if (!isMountedRef.current) return;
      
      const notificationId = data.notificationId;
      
      setClearedNotifications(prev => {
        const notification = prev.find(n => (n._id || n.id) === notificationId);
        if (notification) {
          setActiveNotifications(active => [notification, ...active]);
          if (!notification.read) {
            setUnreadCount(count => count + 1);
          }
        }
        return prev.filter(n => (n._id || n.id) !== notificationId);
      });
    });
    unsubscribers.push(unsubRestored);
    
    // Notification deleted event
    const unsubDeleted = subscribe('notification:deleted' as WebSocketEvent, (data: any) => {
      console.log('[NotificationContext] Notification deleted:', data);
      
      if (!isMountedRef.current) return;
      
      const notificationId = data.notificationId;
      
      setClearedNotifications(prev => prev.filter(n => (n._id || n.id) !== notificationId));
    });
    unsubscribers.push(unsubDeleted);
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [subscribe, user, activeNotifications]);

  // Clear notification
  const clearNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.clearNotification(notificationId);
      
      if (response.success) {
        const notification = activeNotifications.find(n => (n._id || n.id) === notificationId);
        
        if (notification) {
          setActiveNotifications(prev => prev.filter(n => (n._id || n.id) !== notificationId));
          setClearedNotifications(prev => [{ ...notification, cleared: true }, ...prev]);
          
          if (!notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      } else {
        setError('Failed to clear notification');
      }
    } catch (err) {
      console.error('Error clearing notification:', err);
      setError('Failed to clear notification');
    }
  }, [activeNotifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await notificationService.clearAll();
      
      if (response.success) {
        setClearedNotifications(prev => [
          ...activeNotifications.map(n => ({ ...n, cleared: true })),
          ...prev
        ]);
        setActiveNotifications([]);
        setUnreadCount(0);
      } else {
        setError('Failed to clear all notifications');
      }
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      setError('Failed to clear all notifications');
    }
  }, [activeNotifications]);

  // Restore notification
  const restoreNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.restoreNotification(notificationId);
      
      if (response.success) {
        const notification = clearedNotifications.find(n => (n._id || n.id) === notificationId);
        
        if (notification) {
          setClearedNotifications(prev => prev.filter(n => (n._id || n.id) !== notificationId));
          setActiveNotifications(prev => [{ ...notification, cleared: false }, ...prev]);
          
          if (!notification.read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      } else {
        setError('Failed to restore notification');
      }
    } catch (err) {
      console.error('Error restoring notification:', err);
      setError('Failed to restore notification');
    }
  }, [clearedNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      
      if (response.success) {
        setClearedNotifications(prev => prev.filter(n => (n._id || n.id) !== notificationId));
      } else {
        setError('Failed to delete notification');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  }, []);

  // Delete all cleared notifications
  const deleteAllCleared = useCallback(async () => {
    try {
      const response = await notificationService.deleteAllCleared();
      
      if (response.success) {
        setClearedNotifications([]);
      } else {
        setError('Failed to delete cleared notifications');
      }
    } catch (err) {
      console.error('Error deleting cleared notifications:', err);
      setError('Failed to delete cleared notifications');
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      
      if (response.success) {
        setActiveNotifications(prev => 
          prev.map(n => (n._id || n.id) === notificationId ? { ...n, read: true } : n)
        );
        
        const notification = activeNotifications.find(n => (n._id || n.id) === notificationId);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [activeNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      
      if (response.success) {
        setActiveNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  // Add local notification
  const addLocalNotification = useCallback((message: string, type: string = 'system') => {
    if (!user) return;
    
    const notification: Notification = {
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
    
    setActiveNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Also create in service for persistence
    notificationService.createLocalNotification(user.username, message, type);
  }, [user]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Sync notifications periodically
  useEffect(() => {
    if (!user) return;
    
    const syncInterval = setInterval(() => {
      notificationService.syncNotifications();
    }, 60000); // Sync every minute
    
    return () => clearInterval(syncInterval);
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
    refreshNotifications,
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