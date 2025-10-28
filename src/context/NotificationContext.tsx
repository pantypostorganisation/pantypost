// src/context/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { notificationService } from '@/services/notification.service';
import type { Notification } from '@/types/notification';
import { WebSocketEvent } from '@/types/websocket';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';

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

// ---------- helpers ----------
type NotificationData = Record<string, unknown> | unknown[];

type RawNotification = Partial<Notification> & {
  notificationId?: string;
  data?: unknown;
  priority?: Notification['priority'] | string | null;
  createdAt?: string;
};

const NOTIFICATION_TYPES: ReadonlySet<Notification['type']> = new Set([
  'sale',
  'bid',
  'subscription',
  'tip',
  'order',
  'auction_end',
  'message',
  'system',
]);

const NOTIFICATION_PRIORITIES: ReadonlySet<NonNullable<Notification['priority']>> = new Set([
  'low',
  'normal',
  'high',
]);

const getId = (notification: RawNotification): string | undefined => {
  if (typeof notification.notificationId === 'string') return notification.notificationId;
  if (typeof notification._id === 'string') return notification._id;
  if (typeof notification.id === 'string') return notification.id;
  return undefined;
};

const sanitizeDataPayload = (value: unknown): NotificationData | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? sanitizeStrict(item) : item));
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
    (acc, [key, entry]) => {
      acc[key] = typeof entry === 'string' ? sanitizeStrict(entry) : entry;
      return acc;
    },
    {}
  );
};

const normalizeNotificationType = (value: string | undefined): Notification['type'] => {
  if (value && NOTIFICATION_TYPES.has(value as Notification['type'])) {
    return value as Notification['type'];
  }
  return 'system';
};

const normalizeNotificationPriority = (
  value: string | null | undefined
): NonNullable<Notification['priority']> => {
  if (value && NOTIFICATION_PRIORITIES.has(value as NonNullable<Notification['priority']>)) {
    return value as NonNullable<Notification['priority']>;
  }
  return 'normal';
};

const sanitizeNotification = (notification: RawNotification, fallbackRecipient?: string): Notification => {
  const id = getId(notification) ?? `notification_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const recipient = sanitizeUsername(notification.recipient) || fallbackRecipient || '';
  const type = normalizeNotificationType(
    typeof notification.type === 'string' ? sanitizeStrict(notification.type) : undefined
  );

  return {
    id,
    _id: notification._id ?? id,
    recipient,
    type,
    title: notification.title ? sanitizeStrict(notification.title) : 'Notification',
    message: notification.message ? sanitizeStrict(notification.message) : '',
    data: sanitizeDataPayload(notification.data),
    read: Boolean(notification.read),
    cleared: Boolean(notification.cleared),
    deleted: Boolean(notification.deleted),
    priority: normalizeNotificationPriority(
      typeof notification.priority === 'string' ? sanitizeStrict(notification.priority) : notification.priority ?? 'normal'
    ),
    relatedId: notification.relatedId ? sanitizeStrict(notification.relatedId) : undefined,
    relatedType: notification.relatedType ?? undefined,
    createdAt: typeof notification.createdAt === 'string' ? notification.createdAt : new Date().toISOString(),
    updatedAt: notification.updatedAt,
  };
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
  const processedNotificationIds = useRef<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    if (!user || !isMountedRef.current) return;
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    setError(null);
    try {
      // ONLY load from API, NO localStorage fallback
      const [activeRes, clearedRes] = await Promise.all([
        notificationService.getActiveNotifications(50),
        notificationService.getClearedNotifications(50),
      ]);

      if (isMountedRef.current && activeRes.success && Array.isArray(activeRes.data)) {
        const sanitizedActive = activeRes.data.map((notification) =>
          sanitizeNotification(notification, user.username)
        );
        setActiveNotifications(sanitizedActive);
        setUnreadCount(sanitizedActive.filter((n) => !n.read).length);
        sanitizedActive.forEach((n) => {
          const id = getId(n);
          if (id) processedNotificationIds.current.add(id);
        });
      }

      if (isMountedRef.current && clearedRes.success && Array.isArray(clearedRes.data)) {
        const sanitizedCleared = clearedRes.data.map((notification) =>
          sanitizeNotification(notification, user.username)
        );
        setClearedNotifications(sanitizedCleared);
      }
    } catch (err) {
      console.error('Failed to load notifications from API:', err);
      if (isMountedRef.current) {
        setError('Failed to load notifications');
        // Don't set any fallback data - just show empty
        setActiveNotifications([]);
        setClearedNotifications([]);
      }
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
    return () => {
      isMountedRef.current = false;
    };
  }, [user, loadNotifications]);

  // WebSocket listeners
  useEffect(() => {
    if (!subscribe || !user) return;
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<RawNotification | null>('notification:new' as WebSocketEvent, (data) => {
        if (!isMountedRef.current || !data) return;

        const rawId = getId(data);
        if (rawId && processedNotificationIds.current.has(rawId)) {
          return;
        }
        if (rawId) {
          processedNotificationIds.current.add(rawId);
          if (processedNotificationIds.current.size > 400) {
            const ids = Array.from(processedNotificationIds.current);
            processedNotificationIds.current = new Set(ids.slice(-200));
          }
        }

        const n = sanitizeNotification(data, user.username);

        setActiveNotifications((prev) => {
          if (rawId && prev.some((x) => getId(x) === rawId)) return prev;
          return [n, ...prev];
        });

        if (!n.read) setUnreadCount((c) => c + 1);
      })
    );

    unsubs.push(
      subscribe<RawNotification | null>('notification:cleared' as WebSocketEvent, (data) => {
        const id = data ? getId(data) : undefined;
        if (!id) return;

        setActiveNotifications((prev) => {
          const found = prev.find((n) => getId(n) === id);
          if (found) {
            setClearedNotifications((c) => [{ ...found, cleared: true }, ...c]);
            if (!found.read) setUnreadCount((u) => Math.max(0, u - 1));
          }
          return prev.filter((n) => getId(n) !== id);
        });
      })
    );

    unsubs.push(
      subscribe('notification:all_cleared' as WebSocketEvent, () => {
        setActiveNotifications((prevActive) => {
          setClearedNotifications((prevCleared) => [
            ...prevActive.map((n) => ({ ...n, cleared: true })),
            ...prevCleared,
          ]);
          setUnreadCount(0);
          return [];
        });
      })
    );

    unsubs.push(
      subscribe<RawNotification | null>('notification:restored' as WebSocketEvent, (data) => {
        const id = data ? getId(data) : undefined;
        if (!id) return;

        setClearedNotifications((prev) => {
          const found = prev.find((n) => getId(n) === id);
          if (found) {
            setActiveNotifications((active) => {
              if (active.some((n) => getId(n) === id)) return active;
              return [found, ...active];
            });
            if (!found.read) setUnreadCount((c) => c + 1);
          }
          return prev.filter((n) => getId(n) !== id);
        });
      })
    );

    unsubs.push(
      subscribe<RawNotification | null>('notification:deleted' as WebSocketEvent, (data) => {
        const id = data ? getId(data) : undefined;
        if (!id) return;
        setClearedNotifications((prev) => prev.filter((n) => getId(n) !== id));
      })
    );

    return () => unsubs.forEach((fn) => fn());
  }, [subscribe, user]);

  // All actions now ONLY use API, no localStorage
  const clearNotification = useCallback(async (id: string) => {
    try {
      const res = await notificationService.clearNotification(id);
      if (res.success) {
        setActiveNotifications((prev) => {
          const found = prev.find((n) => getId(n) === id);
          if (found) {
            setClearedNotifications((c) => [{ ...found, cleared: true }, ...c]);
            if (!found.read) setUnreadCount((u) => Math.max(0, u - 1));
          }
          return prev.filter((n) => getId(n) !== id);
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
        setActiveNotifications((prevActive) => {
          setClearedNotifications((prevCleared) => [
            ...prevActive.map((n) => ({ ...n, cleared: true })),
            ...prevCleared,
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
        setClearedNotifications((prev) => {
          const found = prev.find((n) => getId(n) === id);
          if (found) {
            setActiveNotifications((active) => {
              if (active.some((n) => getId(n) === id)) return active;
              return [found, ...active];
            });
            if (!found.read) setUnreadCount((u) => u + 1);
          }
          return prev.filter((n) => getId(n) !== id);
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
        setClearedNotifications((prev) => prev.filter((n) => getId(n) !== id));
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
        setActiveNotifications((prev) => {
          let dec = 0;
          const next = prev.map((n) => {
            if (getId(n) === id) {
              if (!n.read) dec = 1;
              return { ...n, read: true };
            }
            return n;
          });
          if (dec) setUnreadCount((u) => Math.max(0, u - dec));
          return next;
        });
      }
    } catch {
      /* no-op */
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setActiveNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      /* no-op */
    }
  }, []);

  // This is now only for temporary UI notifications, not persisted
  const addLocalNotification = useCallback(
    (message: string, type: string = 'system') => {
      if (!user) return;
      const candidateType = /^[a-z0-9_\-]+$/i.test(type) ? type : 'system';
      const safeType = normalizeNotificationType(candidateType);
      const n: Notification = {
        id: `temp_${Date.now()}`,
        recipient: sanitizeUsername(user.username) || user.username,
        type: safeType,
        title: 'Notification',
        message: sanitizeStrict(message),
        read: false,
        cleared: false,
        createdAt: new Date().toISOString(),
        priority: 'normal',
      };
      setActiveNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
      
      // Optionally, send to backend to persist
      // notificationService.createNotification(n);
    },
    [user]
  );

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
    addLocalNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
