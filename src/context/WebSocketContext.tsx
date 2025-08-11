// src/context/WebSocketContext.tsx

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, getGlobalAuthToken } from '@/context/AuthContext';
import { authService } from '@/services';
import { 
  createWebSocketService, 
  getWebSocketService, 
  destroyWebSocketService 
} from '@/services/websocket.service';
import { 
  WebSocketEvent, 
  WebSocketState, 
  WebSocketHandler,
  TypingData,
  OnlineStatusData,
  RealtimeNotification
} from '@/types/websocket';
import { apiConfig, websocketConfig } from '@/config/environment';

interface WebSocketContextType {
  // Connection state
  isConnected: boolean;
  connectionState: WebSocketState;
  
  // Core methods
  connect: () => void;
  disconnect: () => void;
  
  // Event subscription
  subscribe: <T = any>(event: WebSocketEvent, handler: WebSocketHandler<T>) => () => void;
  
  // Sending events
  sendMessage: (event: WebSocketEvent, data: any) => void;
  
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

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, getAuthToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingData>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const wsService = useRef(getWebSocketService());
  const currentToken = useRef<string | null>(null);

  // 🔧 FIX: Listen for auth token events from AuthContext
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTokenUpdate = (event: CustomEvent) => {
      const newToken = event.detail?.token;
      console.log('[WebSocket] Auth token updated:', !!newToken);
      
      if (newToken !== currentToken.current) {
        currentToken.current = newToken;
        
        // Reconnect with new token if we have a user and WebSocket is enabled
        if (user && websocketConfig.enabled && wsService.current) {
          console.log('[WebSocket] Reconnecting with new token...');
          wsService.current.disconnect();
          setTimeout(() => {
            initializeWebSocket();
          }, 1000);
        }
      }
    };

    const handleTokenClear = () => {
      console.log('[WebSocket] Auth token cleared');
      currentToken.current = null;
      
      // Disconnect WebSocket when token is cleared
      if (wsService.current) {
        wsService.current.disconnect();
      }
      
      setIsConnected(false);
      setConnectionState(WebSocketState.DISCONNECTED);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    };

    // Listen for auth events from AuthContext
    window.addEventListener('auth-token-updated', handleTokenUpdate as EventListener);
    window.addEventListener('auth-token-cleared', handleTokenClear);

    return () => {
      window.removeEventListener('auth-token-updated', handleTokenUpdate as EventListener);
      window.removeEventListener('auth-token-cleared', handleTokenClear);
    };
  }, [user]);

  // 🔧 FIX: Improved WebSocket initialization
  const initializeWebSocket = useCallback(async (): Promise<(() => void) | undefined> => {
    if (!user || !websocketConfig.enabled) {
      console.log('[WebSocket] User not available or WebSocket disabled');
      return undefined;
    }

    // Try multiple ways to get the auth token
    let token = currentToken.current;
    
    if (!token) {
      token = getAuthToken();
    }
    
    if (!token && typeof window !== 'undefined') {
      token = getGlobalAuthToken();
    }
    
    if (!token) {
      console.log('[WebSocket] No auth token available');
      return undefined;
    }

    console.log('[WebSocket] Initializing with token:', !!token);
    currentToken.current = token;
    
    try {
      // Use WebSocket URL from config
      const wsUrl = websocketConfig.url || apiConfig.baseUrl.replace('/api', '').replace('http', 'ws');
      
      // Create WebSocket service if it doesn't exist
      if (!wsService.current) {
        wsService.current = createWebSocketService({
          url: wsUrl,
          auth: { token },
          autoConnect: true,
          reconnect: true,
          reconnectAttempts: 5,
          reconnectDelay: 3000
        });
      } else {
        // Update token if service exists - remove updateAuth call for now
        // wsService.current.updateAuth({ token });
      }

      // Subscribe to connection events
      const unsubConnect = wsService.current.on(WebSocketEvent.CONNECT, () => {
        setIsConnected(true);
        setConnectionState(WebSocketState.CONNECTED);
        console.log('[WebSocket] Connected');
        
        // Send initial online status
        updateOnlineStatus(true);
      });

      const unsubDisconnect = wsService.current.on(WebSocketEvent.DISCONNECT, () => {
        setIsConnected(false);
        setConnectionState(WebSocketState.DISCONNECTED);
        setOnlineUsers(new Set());
        setTypingUsers(new Map());
        console.log('[WebSocket] Disconnected');
      });

      const unsubError = wsService.current.on(WebSocketEvent.ERROR, (error) => {
        setConnectionState(WebSocketState.ERROR);
        console.error('[WebSocket] Error:', error);
      });

      // Subscribe to app events
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

      // 🔧 NEW: Subscribe to auction events
      const unsubAuctionBid = wsService.current.on(WebSocketEvent.AUCTION_BID, (data: any) => {
        console.log('[WebSocket] New auction bid:', data);
        // Dispatch custom event for auction components to listen to
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auction:bid', { detail: data }));
        }
      });

      const unsubAuctionEnd = wsService.current.on(WebSocketEvent.AUCTION_ENDED, (data: any) => {
        console.log('[WebSocket] Auction ended:', data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auction:end', { detail: data }));
        }
      });

      // 🔧 NEW: Subscribe to wallet events - use string literals for custom events
      const unsubWalletUpdate = wsService.current.on('wallet:balance_update' as WebSocketEvent, (data: any) => {
        console.log('[WebSocket] Wallet balance updated:', data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wallet:balance_update', { detail: data }));
        }
      });

      const unsubWalletTransaction = wsService.current.on('wallet:transaction' as WebSocketEvent, (data: any) => {
        console.log('[WebSocket] New wallet transaction:', data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('wallet:transaction', { detail: data }));
        }
      });

      // 🔧 NEW: Subscribe to message events
      const unsubMessageNew = wsService.current.on('message:new' as WebSocketEvent, (data: any) => {
        console.log('[WebSocket] New message:', data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('message:new', { detail: data }));
        }
      });

      // Connect
      wsService.current.connect();

      // Store cleanup functions
      return () => {
        unsubConnect();
        unsubDisconnect();
        unsubError();
        unsubTyping();
        unsubUserOnline();
        unsubUserOffline();
        unsubNotification();
        unsubAuctionBid();
        unsubAuctionEnd();
        unsubWalletUpdate();
        unsubWalletTransaction();
        unsubMessageNew();
      };
    } catch (error) {
      console.error('[WebSocket] Initialization error:', error);
      setConnectionState(WebSocketState.ERROR);
      return undefined;
    }
  }, [user, getAuthToken]);

  // Initialize WebSocket connection when user is available
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      cleanup = await initializeWebSocket();
    };

    if (user && websocketConfig.enabled) {
      init();
    } else if (wsService.current?.isConnected()) {
      // Disconnect if no user or WebSocket disabled
      wsService.current.disconnect();
    }

    return () => {
      cleanup?.();
    };
  }, [user, initializeWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      typingTimers.current.forEach(timer => clearTimeout(timer));
      if (wsService.current?.isConnected()) {
        wsService.current.disconnect();
      }
      destroyWebSocketService();
    };
  }, []);

  // Handle typing updates
  const handleTypingUpdate = useCallback((data: TypingData) => {
    const key = `${data.conversationId}-${data.userId}`;
    
    if (data.isTyping) {
      setTypingUsers(prev => new Map(prev).set(key, data));
      
      // Clear existing timer
      const existingTimer = typingTimers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // Set new timer to remove typing indicator after 3 seconds
      const timer = setTimeout(() => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
        typingTimers.current.delete(key);
      }, 3000);
      
      typingTimers.current.set(key, timer);
    } else {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
      
      const timer = typingTimers.current.get(key);
      if (timer) {
        clearTimeout(timer);
        typingTimers.current.delete(key);
      }
    }
  }, []);

  // Handle user online
  const handleUserOnline = useCallback((data: OnlineStatusData) => {
    setOnlineUsers(prev => new Set(prev).add(data.userId));
  }, []);

  // Handle user offline
  const handleUserOffline = useCallback((data: OnlineStatusData) => {
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.userId);
      return newSet;
    });
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback((notification: RealtimeNotification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  // Public methods
  const connect = useCallback(() => {
    if (!currentToken.current) {
      currentToken.current = getAuthToken() || getGlobalAuthToken();
    }
    wsService.current?.connect();
  }, [getAuthToken]);

  const disconnect = useCallback(() => {
    wsService.current?.disconnect();
  }, []);

  const subscribe = useCallback(<T = any>(
    event: WebSocketEvent, 
    handler: WebSocketHandler<T>
  ): (() => void) => {
    if (!wsService.current) {
      console.warn('[WebSocket] Service not initialized');
      return () => {};
    }
    return wsService.current.on<T>(event, handler);
  }, []);

  const sendMessage = useCallback((event: WebSocketEvent, data: any) => {
    if (!wsService.current?.isConnected()) {
      console.warn('[WebSocket] Not connected, cannot send message');
      return;
    }
    wsService.current.send(event, data);
  }, []);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!user) return;
    
    sendMessage(WebSocketEvent.MESSAGE_TYPING, {
      userId: user.id,
      username: user.username,
      conversationId,
      isTyping
    });
  }, [user, sendMessage]);

  const updateOnlineStatus = useCallback((isOnline: boolean) => {
    if (!user) return;
    
    sendMessage(
      isOnline ? WebSocketEvent.USER_ONLINE : WebSocketEvent.USER_OFFLINE,
      { userId: user.id, isOnline }
    );
  }, [user, sendMessage]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    sendMessage(WebSocketEvent.NOTIFICATION_READ, { notificationId });
  }, [sendMessage]);

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
    clearNotifications
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};