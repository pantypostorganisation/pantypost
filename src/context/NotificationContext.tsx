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
const getId = (n: Partial<Notification> | any) => n?._id || n?.id || undefined;

// Shallow-sanitize: sanitize string leaves one level deep (keeps numbers/objects intact)
const sanitizeDataPayload = (val: any) => {
  if (!val || typeof val !== 'object') return val;
  const out: any = Array.isArray(val) ? [] : {};
  Object.entries(val).forEach(([k, v]) => {
    if (typeof v === 'string') out[k] = sanitizeStrict(v);
    else out[k] = v; // keep non-strings as-is
  });
  return out;
};

const sanitizeNotification = (n: any, fallbackRecipient?: string): Notification => {
  const id = getId(n);
  return {
    id,
    _id: id,
    recipient: sanitizeUsername(n?.recipient) || fallbackRecipient || '',
    type: typeof n?.type === 'string' ? sanitizeStrict(n.type) : 'system',
    title: n?.title ? sanitizeStrict(n.title) : 'Notification',
    message: n?.message ? sanitizeStrict(n.message) : '',
    data: sanitizeDataPayload(n?.data),
    read: !!n?.read,
    cleared: !!n?.cleared,
    priority: (typeof n?.priority === 'string' ? sanitizeStrict(n.priority) : 'normal') as any,
    createdAt: typeof n?.createdAt === 'string' ? n.createdAt : new Date().toISOString(),
  } as Notification;
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

  // Track processed IDs to prevent dupes
  const processedNotificationIds = useRef<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    if (!user || !isMountedRef.current) return;
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    setError(null);
    try {
      const [activeRes, clearedRes] = await Promise.all([
        notificationService.getActiveNotifications(50),
        notificationService.getClearedNotifications(50),
      ]);

      if (isMountedRef.current && activeRes.success && Array.isArray(activeRes.data)) {
        const sanitizedActive = activeRes.data.map((n: any) =>
          sanitizeNotification(n, user.username)
        );
        setActiveNotifications(sanitizedActive);
        setUnreadCount(sanitizedActive.filter((n) => !n.read).length);
        sanitizedActive.forEach((n) => {
          const id = getId(n);
          if (id) processedNotificationIds.current.add(id);
        });
      }

      if (isMountedRef.current && clearedRes.success && Array.isArray(clearedRes.data)) {
        const sanitizedCleared = clearedRes.data.map((n: any) =>
          sanitizeNotification(n, user.username)
        );
        setClearedNotifications(sanitizedCleared);
      }
    } catch {
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
    return () => {
      isMountedRef.current = false;
    };
  }, [user, loadNotifications]);

  // WebSocket listeners
  useEffect(() => {
    if (!subscribe || !user) return;
    const unsubs: Array<() => void> = [];

    // Primary event from backend
    unsubs.push(
      subscribe('notification:new' as WebSocketEvent, (data: any) => {
        if (!isMountedRef.current) return;

        const rawId = getId(data);
        if (rawId && processedNotificationIds.current.has(rawId)) {
          // already handled
          return;
        }
        if (rawId) {
          processedNotificationIds.current.add(rawId);
          // memory cap
          if (processedNotificationIds.current.size > 400) {
            const ids = Array.from(processedNotificationIds.current);
            processedNotificationIds.current = new Set(ids.slice(-200));
          }
        }

        const n = sanitizeNotification(data, user.username);

        // de-dupe state
        setActiveNotifications((prev) => {
          if (rawId && prev.some((x) => getId(x) === rawId)) return prev;
          return [n, ...prev];
        });

        if (!n.read) setUnreadCount((c) => c + 1);
      })
    );

    // Keep management events
    unsubs.push(
      subscribe('notification:cleared' as WebSocketEvent, (data: any) => {
        const id = getId(data?.notificationId ? { id: data.notificationId } : data);
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
      subscribe('notification:restored' as WebSocketEvent, (data: any) => {
        const id = getId(data?.notificationId ? { id: data.notificationId } : data);
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
      subscribe('notification:deleted' as WebSocketEvent, (data: any) => {
        const id = getId(data?.notificationId ? { id: data.notificationId } : data);
        if (!id) return;
        setClearedNotifications((prev) => prev.filter((n) => getId(n) !== id));
      })
    );

    return () => unsubs.forEach((fn) => fn());
  }, [subscribe, user]);

  // -------- Actions (API + state) --------

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
        // Update atomically based on current state
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

  const addLocalNotification = useCallback(
    (message: string, type: string = 'system') => {
      if (!user) return;
      const safeType = /^[a-z0-9_\-]+$/i.test(type) ? type : 'system';
      const n: Notification = {
        id: `local_${Date.now()}`,
        recipient: sanitizeUsername(user.username) || user.username,
        type: safeType as any,
        title: 'Notification',
        message: sanitizeStrict(message),
        read: false,
        cleared: false,
        createdAt: new Date().toISOString(),
        priority: 'normal' as any,
      };
      setActiveNotifications((prev) => [n, ...prev]);
      setUnreadCount((c) => c + 1);
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
