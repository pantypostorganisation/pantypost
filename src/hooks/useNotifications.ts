// src/hooks/useNotifications.ts
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNotifications as useNotificationContext } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import type { Notification } from '@/types/notification';

interface UseNotificationsOptions {
  autoMarkAsRead?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  filterType?: string;
  limit?: number;
}

interface UseNotificationsReturn {
  // Notifications
  activeNotifications: Notification[];
  clearedNotifications: Notification[];
  filteredNotifications: Notification[];
  
  // Counts
  unreadCount: number;
  totalCount: number;
  hasUnread: boolean;
  
  // Actions
  clearNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  restoreNotification: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllCleared: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedNotification: Notification | null;
  setSelectedNotification: (notification: Notification | null) => void;
  
  // Refresh
  refresh: () => Promise<void>;
  
  // Grouping
  groupedNotifications: Record<string, Notification[]>;
  notificationsByDate: Record<string, Notification[]>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoMarkAsRead = false,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    filterType,
    limit
  } = options;

  const { user } = useAuth();
  const context = useNotificationContext();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Auto-refresh notifications
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      context.refreshNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, context]);

  // Auto mark as read when viewing
  useEffect(() => {
    if (!autoMarkAsRead || !selectedNotification || selectedNotification.read) return;

    const timer = setTimeout(() => {
      context.markAsRead(selectedNotification.id);
    }, 2000); // Mark as read after 2 seconds

    return () => clearTimeout(timer);
  }, [autoMarkAsRead, selectedNotification, context]);

  // Filter notifications by type if specified
  const filteredNotifications = useMemo(() => {
    let notifications = context.activeNotifications;

    if (filterType) {
      notifications = notifications.filter(n => n.type === filterType);
    }

    if (limit) {
      notifications = notifications.slice(0, limit);
    }

    return notifications;
  }, [context.activeNotifications, filterType, limit]);

  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};

    context.activeNotifications.forEach(notification => {
      if (!groups[notification.type]) {
        groups[notification.type] = [];
      }
      groups[notification.type].push(notification);
    });

    return groups;
  }, [context.activeNotifications]);

  // Group notifications by date
  const notificationsByDate = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    context.activeNotifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      let key: string;

      if (date >= today) {
        key = 'Today';
      } else if (date >= yesterday) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });

    return groups;
  }, [context.activeNotifications]);

  // Enhanced clear notification with optimistic update
  const clearNotification = useCallback(async (notificationId: string) => {
    // Optimistic update can be added here if needed
    await context.clearNotification(notificationId);
  }, [context]);

  // Enhanced clear all with confirmation
  const clearAllNotifications = useCallback(async () => {
    if (context.activeNotifications.length === 0) return;
    
    // You might want to add a confirmation dialog here
    await context.clearAllNotifications();
  }, [context]);

  return {
    // Notifications
    activeNotifications: context.activeNotifications,
    clearedNotifications: context.clearedNotifications,
    filteredNotifications,
    
    // Counts
    unreadCount: context.unreadCount,
    totalCount: context.totalCount,
    hasUnread: context.unreadCount > 0,
    
    // Actions
    clearNotification,
    clearAllNotifications,
    restoreNotification: context.restoreNotification,
    deleteNotification: context.deleteNotification,
    deleteAllCleared: context.deleteAllCleared,
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    
    // UI State
    isLoading: context.isLoading,
    error: context.error,
    selectedNotification,
    setSelectedNotification,
    
    // Refresh
    refresh: context.refreshNotifications,
    
    // Grouping
    groupedNotifications,
    notificationsByDate
  };
}

// Hook for notification statistics
export function useNotificationStats() {
  const { activeNotifications, clearedNotifications } = useNotificationContext();

  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const priorityCount: Record<string, number> = {};
    let readCount = 0;
    let unreadCount = 0;

    activeNotifications.forEach(n => {
      // Count by type
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
      
      // Count by priority
      const priority = n.priority || 'normal';
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      
      // Count read/unread
      if (n.read) {
        readCount++;
      } else {
        unreadCount++;
      }
    });

    return {
      total: activeNotifications.length,
      cleared: clearedNotifications.length,
      byType: typeCount,
      byPriority: priorityCount,
      read: readCount,
      unread: unreadCount,
      readPercentage: activeNotifications.length > 0 
        ? Math.round((readCount / activeNotifications.length) * 100) 
        : 0
    };
  }, [activeNotifications, clearedNotifications]);

  return stats;
}

// Hook for notification preferences
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState({
    soundEnabled: true,
    desktopEnabled: true,
    autoMarkAsRead: false,
    groupByType: false,
    showPriority: true
  });

  useEffect(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('notification_preferences', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const requestDesktopPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreferences({ desktopEnabled: true });
        return true;
      } else {
        updatePreferences({ desktopEnabled: false });
        return false;
      }
    }
    return false;
  }, [updatePreferences]);

  return {
    preferences,
    updatePreferences,
    requestDesktopPermission
  };
}

// Hook for notification actions with loading states
export function useNotificationActions() {
  const context = useNotificationContext();
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});

  const withLoading = useCallback(async (
    actionId: string,
    action: () => Promise<void>
  ) => {
    setActionStates(prev => ({ ...prev, [actionId]: true }));
    try {
      await action();
    } finally {
      setActionStates(prev => ({ ...prev, [actionId]: false }));
    }
  }, []);

  const clearWithLoading = useCallback(async (notificationId: string) => {
    await withLoading(`clear_${notificationId}`, () => 
      context.clearNotification(notificationId)
    );
  }, [context, withLoading]);

  const restoreWithLoading = useCallback(async (notificationId: string) => {
    await withLoading(`restore_${notificationId}`, () => 
      context.restoreNotification(notificationId)
    );
  }, [context, withLoading]);

  const deleteWithLoading = useCallback(async (notificationId: string) => {
    await withLoading(`delete_${notificationId}`, () => 
      context.deleteNotification(notificationId)
    );
  }, [context, withLoading]);

  const clearAllWithLoading = useCallback(async () => {
    await withLoading('clear_all', context.clearAllNotifications);
  }, [context, withLoading]);

  const deleteAllClearedWithLoading = useCallback(async () => {
    await withLoading('delete_all_cleared', context.deleteAllCleared);
  }, [context, withLoading]);

  return {
    clearNotification: clearWithLoading,
    restoreNotification: restoreWithLoading,
    deleteNotification: deleteWithLoading,
    clearAllNotifications: clearAllWithLoading,
    deleteAllCleared: deleteAllClearedWithLoading,
    isLoading: (actionId: string) => actionStates[actionId] || false,
    isAnyLoading: Object.values(actionStates).some(v => v)
  };
}

// Export default hook
export default useNotifications;