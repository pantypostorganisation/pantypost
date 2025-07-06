// src/hooks/useWebSocket.ts

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket as useWebSocketContext } from '@/context/WebSocketContext';
import { 
  WebSocketEvent, 
  WebSocketHandler,
  TypingData,
  OnlineStatusData,
  RealtimeNotification 
} from '@/types/websocket';

// Specific hook for message-related WebSocket events
export function useMessageWebSocket(conversationId?: string) {
  const { 
    subscribe, 
    sendMessage, 
    sendTyping, 
    typingUsers,
    isConnected 
  } = useWebSocketContext();
  
  const [typingUsersList, setTypingUsersList] = useState<TypingData[]>([]);

  // Update typing users list when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setTypingUsersList([]);
      return;
    }

    // Filter typing users for this conversation
    const conversationTypingUsers = Array.from(typingUsers.values())
      .filter(data => data.conversationId === conversationId && data.isTyping);
    
    setTypingUsersList(conversationTypingUsers);
  }, [typingUsers, conversationId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!conversationId || !isConnected) return;
    sendTyping(conversationId, isTyping);
  }, [conversationId, isConnected, sendTyping]);

  // Subscribe to message events for this conversation
  const subscribeToMessages = useCallback((handler: WebSocketHandler) => {
    if (!conversationId) return () => {};
    
    // Filter messages for this conversation
    const filteredHandler = (data: any) => {
      if (data.conversationId === conversationId) {
        handler(data);
      }
    };

    return subscribe(WebSocketEvent.MESSAGE_NEW, filteredHandler);
  }, [conversationId, subscribe]);

  return {
    isConnected,
    typingUsers: typingUsersList,
    sendTypingIndicator,
    subscribeToMessages,
    sendMessage: (event: WebSocketEvent, data: any) => sendMessage(event, data)
  };
}

// Hook for online status tracking
export function useOnlineStatus(userIds: string[]) {
  const { onlineUsers, subscribe } = useWebSocketContext();
  const [onlineStatusMap, setOnlineStatusMap] = useState<Map<string, boolean>>(new Map());

  // Update online status map when users or online status changes
  useEffect(() => {
    const statusMap = new Map<string, boolean>();
    userIds.forEach(userId => {
      statusMap.set(userId, onlineUsers.has(userId));
    });
    setOnlineStatusMap(statusMap);
  }, [userIds, onlineUsers]);

  // Subscribe to online/offline events for specific users
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Subscribe to online events
    const unsubOnline = subscribe<OnlineStatusData>(
      WebSocketEvent.USER_ONLINE,
      (data) => {
        if (userIds.includes(data.userId)) {
          setOnlineStatusMap(prev => new Map(prev).set(data.userId, true));
        }
      }
    );
    unsubscribers.push(unsubOnline);

    // Subscribe to offline events
    const unsubOffline = subscribe<OnlineStatusData>(
      WebSocketEvent.USER_OFFLINE,
      (data) => {
        if (userIds.includes(data.userId)) {
          setOnlineStatusMap(prev => new Map(prev).set(data.userId, false));
        }
      }
    );
    unsubscribers.push(unsubOffline);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userIds, subscribe]);

  return {
    onlineStatusMap,
    isUserOnline: (userId: string) => onlineStatusMap.get(userId) || false
  };
}

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const { 
    notifications, 
    markNotificationRead, 
    clearNotifications,
    subscribe 
  } = useWebSocketContext();
  
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Subscribe to specific notification types
  const subscribeToNotificationType = useCallback(
    (type: RealtimeNotification['type'], handler: (notification: RealtimeNotification) => void) => {
      return subscribe<RealtimeNotification>(
        WebSocketEvent.NOTIFICATION_NEW,
        (notification) => {
          if (notification.type === type) {
            handler(notification);
          }
        }
      );
    },
    [subscribe]
  );

  return {
    notifications,
    unreadCount,
    markAsRead: markNotificationRead,
    clearAll: clearNotifications,
    subscribeToType: subscribeToNotificationType
  };
}

// Hook for order updates
export function useOrderUpdates(orderId?: string) {
  const { subscribe, isConnected } = useWebSocketContext();
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  useEffect(() => {
    if (!orderId || !isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to order updates
    const unsubUpdate = subscribe(WebSocketEvent.ORDER_UPDATE, (data: any) => {
      if (data.orderId === orderId) {
        setLastUpdate(data);
      }
    });
    unsubscribers.push(unsubUpdate);

    // Subscribe to order status changes
    const unsubStatus = subscribe(WebSocketEvent.ORDER_STATUS_CHANGE, (data: any) => {
      if (data.orderId === orderId) {
        setLastUpdate(data);
      }
    });
    unsubscribers.push(unsubStatus);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [orderId, isConnected, subscribe]);

  return {
    lastUpdate,
    isConnected
  };
}

// Hook for wallet balance updates
export function useWalletUpdates() {
  const { subscribe, isConnected } = useWebSocketContext();
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<any>(null);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to balance updates
    const unsubBalance = subscribe(WebSocketEvent.WALLET_BALANCE_UPDATE, (data: any) => {
      setLastBalanceUpdate(data);
    });
    unsubscribers.push(unsubBalance);

    // Subscribe to transactions
    const unsubTransaction = subscribe(WebSocketEvent.WALLET_TRANSACTION, (data: any) => {
      setLastTransaction(data);
    });
    unsubscribers.push(unsubTransaction);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe]);

  return {
    lastBalanceUpdate,
    lastTransaction,
    isConnected
  };
}

// Generic hook for any WebSocket event
export function useWebSocketEvent<T = any>(
  event: WebSocketEvent,
  handler: WebSocketHandler<T>
) {
  const { subscribe, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe<T>(event, handler);
    return unsubscribe;
  }, [event, handler, isConnected, subscribe]);

  return { isConnected };
}

// Re-export the context hook for convenience
export { useWebSocket } from '@/context/WebSocketContext';