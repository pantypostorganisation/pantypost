// src/context/WebSocketContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import { useAuth, getGlobalAuthToken } from '@/context/AuthContext';
import {
  createWebSocketService,
  getWebSocketService,
  destroyWebSocketService,
} from '@/services/websocket.service';
import { apiConfig, websocketConfig } from '@/config/environment';

import type {
  WebSocketHandler,
  TypingData,
  OnlineStatusData,
  RealtimeNotification,
} from '@/types/websocket';

import {
  WebSocketEvent,
  WebSocketState,
} from '@/types/websocket';

interface WebSocketContextType {
  // Connection state
  isConnected: boolean;
  connectionState: WebSocketState;

  // Core
  connect: () => void;
  disconnect: () => void;

  // Event subscription
  subscribe: <T = any>(
    event: WebSocketEvent | string,
    handler: WebSocketHandler<T>
  ) => () => void;

  // Sending
  sendMessage: (event: WebSocketEvent | string, data: any) => void;

  // Typing indicators
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  typingUsers: Map<string, TypingData>;

  // Online status
  onlineUsers: Set<string>;
  updateOnlineStatus: (isOnline: boolean) => void;

  // Notifications
  notifications: RealtimeNotification[];
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  // Return null instead of throwing so consumers can feature-detect
  return context || null;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, getAuthToken } = useAuth();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<WebSocketState>(
    WebSocketState.DISCONNECTED
  );

  // Realtime UI state
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingData>>(
    new Map()
  );
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    []
  );

  // Refs
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const wsService = useRef(getWebSocketService());
  const currentToken = useRef<string | null>(null);
  const hasInitialized = useRef(false);
  const pendingSubscriptions = useRef<
    Array<{ event: string; handler: WebSocketHandler }>
  >([]);

  // ------------------------------
  // Event handlers (declared early to avoid "used before declared")
  // ------------------------------

  // Handle typing updates
  const handleTypingUpdate = useCallback((data: TypingData) => {
    const key = `${data.conversationId}-${data.userId}`;

    if (data.isTyping) {
      setTypingUsers((prev) => new Map(prev).set(key, data));

      const existing = typingTimers.current.get(key);
      if (existing) clearTimeout(existing);

      // Auto-clear typing after 3s
      const timer = setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        typingTimers.current.delete(key);
      }, 3000);

      typingTimers.current.set(key, timer);
    } else {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });

      const existing = typingTimers.current.get(key);
      if (existing) {
        clearTimeout(existing);
        typingTimers.current.delete(key);
      }
    }
  }, []);

  // Handle user online
  const handleUserOnline = useCallback((data: OnlineStatusData) => {
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.add(data.userId);
      return next;
    });
  }, []);

  // Handle user offline
  const handleUserOffline = useCallback((data: OnlineStatusData) => {
    setOnlineUsers((prev) => {
      const next = new Set(prev);
      next.delete(data.userId);
      return next;
    });
  }, []);

  // Handle new realtime notification
  const handleNewNotification = useCallback((notification: RealtimeNotification) => {
    // cap at last 50
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  }, []);

  // ------------------------------
  // Listen for auth token changes from AuthContext (window events)
  // ------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTokenUpdate = (event: Event) => {
      // CustomEvent<{token:string|null}>
      const ce = event as CustomEvent;
      const newToken = ce.detail?.token as string | null;
      console.log('[WebSocket] Auth token updated:', !!newToken);

      if (newToken !== currentToken.current) {
        currentToken.current = newToken;

        // Reconnect with new token if applicable
        if (user && websocketConfig.enabled && wsService.current) {
          console.log('[WebSocket] Reconnecting with updated token...');
          wsService.current.disconnect();
          setTimeout(() => {
            initializeWebSocket().catch((e) =>
              console.error('[WebSocket] Re-init error:', e)
            );
          }, 1000);
        }
      }
    };

    const handleTokenClear = () => {
      console.log('[WebSocket] Auth token cleared');
      currentToken.current = null;

      if (wsService.current) {
        wsService.current.disconnect();
      }

      setIsConnected(false);
      setConnectionState(WebSocketState.DISCONNECTED);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    };

    window.addEventListener(
      'auth-token-updated',
      handleTokenUpdate as EventListener
    );
    window.addEventListener('auth-token-cleared', handleTokenClear);

    return () => {
      window.removeEventListener(
        'auth-token-updated',
        handleTokenUpdate as EventListener
      );
      window.removeEventListener('auth-token-cleared', handleTokenClear);
    };
  }, [user]);

  // ------------------------------
  // WebSocket initialization
  // ------------------------------
  const initializeWebSocket = useCallback(async (): Promise<(() => void) | undefined> => {
    if (!user || !websocketConfig.enabled) {
      console.log('[WebSocket] User not available or WebSocket disabled');
      return undefined;
    }

    // Try multiple sources for auth token
    let token = currentToken.current || getAuthToken() || null;

    if (!token && typeof window !== 'undefined') {
      token = getGlobalAuthToken();
    }

    if (!token) {
      console.log('[WebSocket] No auth token available, skipping connect');
      return undefined;
    }

    currentToken.current = token;
    console.log('[WebSocket] Initializing with token:', !!token);

    try {
      const wsUrl =
        websocketConfig.url ||
        apiConfig.baseUrl.replace('/api', '').replace(/^http/, 'ws');

      // Lazily create service
      if (!wsService.current) {
        wsService.current = createWebSocketService({
          url: wsUrl,
          auth: { token },
          autoConnect: true,
          reconnect: true,
          reconnectAttempts: 5,
          reconnectDelay: 3000,
        });
      }

      // Connection lifecycle
      const unsubConnect = wsService.current.on(WebSocketEvent.CONNECT, () => {
        setIsConnected(true);
        setConnectionState(WebSocketState.CONNECTED);
        console.log('[WebSocket] Connected');

        // Flush any queued subscriptions
        if (pendingSubscriptions.current.length > 0) {
          const pending = [...pendingSubscriptions.current];
          pendingSubscriptions.current = [];
          pending.forEach(({ event, handler }) => {
            wsService.current?.on(event as WebSocketEvent, handler);
          });
        }

        // Broadcast we're online
        updateOnlineStatus(true);
      });

      const unsubDisconnect = wsService.current.on(
        WebSocketEvent.DISCONNECT,
        () => {
          setIsConnected(false);
          setConnectionState(WebSocketState.DISCONNECTED);
          setOnlineUsers(new Set());
          setTypingUsers(new Map());
          console.log('[WebSocket] Disconnected');
        }
      );

      const unsubError = wsService.current.on(WebSocketEvent.ERROR, (error) => {
        setConnectionState(WebSocketState.ERROR);
        console.error('[WebSocket] Error:', error);
      });

      // App events
      const unsubTyping = wsService.current.on<TypingData>(
        WebSocketEvent.MESSAGE_TYPING,
        handleTypingUpdate
      );

      const unsubUserOnline = wsService.current.on<OnlineStatusData>(
        WebSocketEvent.USER_ONLINE,
        handleUserOnline
      );

      const unsubUserOffline = wsService.current.on<OnlineStatusData>(
        WebSocketEvent.USER_OFFLINE,
        handleUserOffline
      );

      const unsubNotification = wsService.current.on<RealtimeNotification>(
        WebSocketEvent.NOTIFICATION_NEW,
        handleNewNotification
      );

      // Message events -> forward to DOM
      const unsubMessageNew = wsService.current.on(
        'message:new' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('message:new', { detail: data }));
          }
        }
      );

      const unsubMessageRead = wsService.current.on(
        'message:read' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('message:read', { detail: data }));
          }
        }
      );

      // Order events -> forward
      const unsubOrderCreated = wsService.current.on(
        'order:created' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('order:created', { detail: data }));
          }
        }
      );

      const unsubOrderNew = wsService.current.on(
        'order:new' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('order:new', { detail: data }));
          }
        }
      );

      // Auction events -> forward
      const unsubAuctionWon = wsService.current.on(
        'auction:won' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auction:won', { detail: data }));
          }
        }
      );

      const unsubAuctionEnded = wsService.current.on(
        'auction:ended' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auction:ended', { detail: data }));
          }
        }
      );

      const unsubListingSold = wsService.current.on(
        'listing:sold' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('listing:sold', { detail: data }));
          }
        }
      );

      // Wallet events -> forward
      const unsubWalletUpdate = wsService.current.on(
        'wallet:balance_update' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('wallet:balance_update', { detail: data })
            );
          }
        }
      );

      const unsubWalletTransaction = wsService.current.on(
        'wallet:transaction' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('wallet:transaction', { detail: data })
            );
          }
        }
      );

      // Notification events -> forward
      const unsubNotificationNew = wsService.current.on(
        'notification:new' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('notification:new', { detail: data })
            );
          }
        }
      );

      const unsubNotificationCleared = wsService.current.on(
        'notification:cleared' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('notification:cleared', { detail: data })
            );
          }
        }
      );

      const unsubNotificationAllCleared = wsService.current.on(
        'notification:all_cleared' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('notification:all_cleared', { detail: data })
            );
          }
        }
      );

      const unsubNotificationRestored = wsService.current.on(
        'notification:restored' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('notification:restored', { detail: data })
            );
          }
        }
      );

      const unsubNotificationDeleted = wsService.current.on(
        'notification:deleted' as WebSocketEvent,
        (data: any) => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('notification:deleted', { detail: data })
            );
          }
        }
      );

      // Connect
      wsService.current.connect?.();

      // Return unified cleanup
      return () => {
        unsubConnect();
        unsubDisconnect();
        unsubError();
        unsubTyping();
        unsubUserOnline();
        unsubUserOffline();
        unsubNotification();
        unsubMessageNew();
        unsubMessageRead();
        unsubOrderCreated();
        unsubOrderNew();
        unsubAuctionWon();
        unsubAuctionEnded();
        unsubListingSold();
        unsubWalletUpdate();
        unsubWalletTransaction();
        unsubNotificationNew();
        unsubNotificationCleared();
        unsubNotificationAllCleared();
        unsubNotificationRestored();
        unsubNotificationDeleted();
      };
    } catch (error) {
      console.error('[WebSocket] Initialization error:', error);
      setConnectionState(WebSocketState.ERROR);
      return undefined;
    }
  }, [
    user,
    getAuthToken,
    handleTypingUpdate,
    handleUserOnline,
    handleUserOffline,
    handleNewNotification,
  ]);

  // Initialize/teardown around user changes
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      if (!hasInitialized.current && user && websocketConfig.enabled) {
        hasInitialized.current = true;
        cleanup = await initializeWebSocket();
      }
    };

    if (user && websocketConfig.enabled) {
      init();
    } else if (wsService.current?.isConnected?.()) {
      wsService.current.disconnect();
      hasInitialized.current = false;
    }

    return () => {
      cleanup?.();
      hasInitialized.current = false;
    };
  }, [user, initializeWebSocket]);

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      typingTimers.current.forEach((t) => clearTimeout(t));
      typingTimers.current.clear();

      if (wsService.current?.isConnected?.()) {
        wsService.current.disconnect();
      }
      destroyWebSocketService();
    };
  }, []);

  // ------------------------------
  // Public methods
  // ------------------------------

  const connect = useCallback(() => {
    if (!currentToken.current) {
      currentToken.current = getAuthToken() || getGlobalAuthToken();
    }
    wsService.current?.connect?.();
  }, [getAuthToken]);

  const disconnect = useCallback(() => {
    wsService.current?.disconnect?.();
  }, []);

  // Subscribe with queuing if service isn't ready yet
  const subscribe = useCallback(
    <T = any,>(event: WebSocketEvent | string, handler: WebSocketHandler<T>) => {
      if (!wsService.current) {
        // Queue for later
        console.log('[WebSocket] Service not ready, queueing subscription:', event);
        pendingSubscriptions.current.push({ event, handler });

        // Return cleanup to remove from queue if needed
        return () => {
          const idx = pendingSubscriptions.current.findIndex(
            (s) => s.event === event && s.handler === handler
          );
          if (idx !== -1) pendingSubscriptions.current.splice(idx, 1);
        };
      }

      // Service ready: normal subscription
      return wsService.current.on<T>(event as WebSocketEvent, handler);
    },
    []
  );

  const sendMessage = useCallback((event: WebSocketEvent | string, data: any) => {
    if (!wsService.current?.isConnected?.()) {
      console.warn('[WebSocket] Not connected; cannot send', event);
      return;
    }
    wsService.current.send?.(event, data);
  }, []);

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!user) return;

      sendMessage(WebSocketEvent.MESSAGE_TYPING, {
        userId: user.id,
        username: user.username,
        conversationId,
        isTyping,
      });
    },
    [user, sendMessage]
  );

  const updateOnlineStatus = useCallback(
    (isOnline: boolean) => {
      if (!user) return;

      sendMessage(
        isOnline ? WebSocketEvent.USER_ONLINE : WebSocketEvent.USER_OFFLINE,
        { userId: user.id, isOnline }
      );
    },
    [user, sendMessage]
  );

  const markNotificationRead = useCallback(
    (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      sendMessage(WebSocketEvent.NOTIFICATION_READ, { notificationId });
    },
    [sendMessage]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    connectionState,
    connect,
    disconnect,
    subscribe,
    sendMessage,
    sendTyping,
    typingUsers,
    onlineUsers,
    updateOnlineStatus,
    notifications,
    markNotificationRead,
    clearNotifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
