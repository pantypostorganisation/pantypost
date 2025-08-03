// src/context/WebSocketContext.tsx

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingData>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  
  const typingTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const wsService = useRef(getWebSocketService());

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      if (user && websocketConfig.enabled) {
        // Get the auth token
        const token = await authService.getAuthToken();
        
        if (!token) {
          console.log('[WebSocket] No auth token available');
          return undefined;
        }
        
        // Use WebSocket URL from config
        const wsUrl = websocketConfig.url || apiConfig.baseUrl.replace('/api', '');
        
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
        }

        // Subscribe to connection events
        const unsubConnect = wsService.current.on(WebSocketEvent.CONNECT, () => {
          setIsConnected(true);
          setConnectionState(WebSocketState.CONNECTED);
          console.log('[WebSocket] Connected');
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

        // Connect
        wsService.current.connect();

        // Cleanup
        return () => {
          unsubConnect();
          unsubDisconnect();
          unsubError();
          unsubTyping();
          unsubUserOnline();
          unsubUserOffline();
          unsubNotification();
        };
      } else {
        // Disconnect if no user or WebSocket disabled
        if (wsService.current?.isConnected()) {
          wsService.current.disconnect();
        }
        return undefined;
      }
    };

    // Call the async function
    const cleanup = initializeWebSocket();

    // Return cleanup function
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      typingTimers.current.forEach(timer => clearTimeout(timer));
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
    wsService.current?.connect();
  }, []);

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
    if (!wsService.current) {
      console.warn('[WebSocket] Service not initialized');
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