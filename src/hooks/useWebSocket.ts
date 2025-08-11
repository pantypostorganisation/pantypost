// src/hooks/useWebSocket.ts

import { useCallback, useEffect, useState, useRef } from 'react';
import { useWebSocket as useWebSocketContext } from '@/context/WebSocketContext';
import { 
  WebSocketEvent, 
  WebSocketHandler,
  TypingData,
  OnlineStatusData,
  RealtimeNotification 
} from '@/types/websocket';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { z } from 'zod';
import { useRateLimit } from '@/utils/security/rate-limiter';

// Constants for security
const MAX_USER_IDS = 100;
const MAX_CONVERSATION_ID_LENGTH = 100;
const MAX_ORDER_ID_LENGTH = 100;
const MAX_NOTIFICATION_CACHE = 100;
const TYPING_INDICATOR_RATE_LIMIT = 10; // per minute
const MESSAGE_SEND_RATE_LIMIT = 30; // per minute

// Validation schemas
const ConversationIdSchema = z.string().min(1).max(MAX_CONVERSATION_ID_LENGTH);
const UserIdSchema = z.string().min(1).max(50);
const OrderIdSchema = z.string().min(1).max(MAX_ORDER_ID_LENGTH);

const TypingDataSchema = z.object({
  userId: UserIdSchema,
  conversationId: ConversationIdSchema,
  isTyping: z.boolean(),
  timestamp: z.number().optional()
});

const OnlineStatusDataSchema = z.object({
  userId: UserIdSchema,
  online: z.boolean(),
  timestamp: z.number().optional()
});

// Helper function to get safe WebSocket context
function useSafeWebSocketContext() {
  const context = useWebSocketContext();
  
  // Return safe defaults when context is null
  if (!context) {
    return {
      subscribe: (() => () => {}) as <T = any>(event: WebSocketEvent | string, handler: WebSocketHandler<T>) => () => void,
      sendMessage: (() => {}) as (event: WebSocketEvent | string, data: any) => void,
      sendTyping: (() => {}) as (conversationId: string, isTyping: boolean) => void,
      typingUsers: new Map<string, TypingData>(),
      isConnected: false,
      onlineUsers: new Set<string>(),
      notifications: [] as RealtimeNotification[],
      markNotificationRead: (() => {}) as (notificationId: string) => void,
      clearNotifications: () => {},
    };
  }
  
  return context;
}

// Specific hook for message-related WebSocket events
export function useMessageWebSocket(conversationId?: string) {
  const context = useSafeWebSocketContext();
  const { 
    subscribe, 
    sendMessage, 
    sendTyping, 
    typingUsers,
    isConnected 
  } = context;
  
  const [typingUsersList, setTypingUsersList] = useState<TypingData[]>([]);
  const [validConversationId, setValidConversationId] = useState<string | null>(null);
  const lastTypingUpdate = useRef<number>(0);
  
  // Rate limiting for typing indicators
  const { checkLimit: checkTypingLimit } = useRateLimit('WS_TYPING', {
    maxAttempts: TYPING_INDICATOR_RATE_LIMIT,
    windowMs: 60 * 1000
  });
  
  // Rate limiting for messages
  const { checkLimit: checkMessageLimit } = useRateLimit('WS_MESSAGE', {
    maxAttempts: MESSAGE_SEND_RATE_LIMIT,
    windowMs: 60 * 1000
  });

  // Validate conversation ID
  useEffect(() => {
    if (!conversationId) {
      setValidConversationId(null);
      return;
    }

    try {
      const validated = ConversationIdSchema.parse(conversationId);
      setValidConversationId(sanitizeStrict(validated));
    } catch (error) {
      console.error('Invalid conversation ID:', error);
      setValidConversationId(null);
    }
  }, [conversationId]);

  // Update typing users list when conversationId changes
  useEffect(() => {
    if (!validConversationId) {
      setTypingUsersList([]);
      return;
    }

    // Filter and validate typing users for this conversation
    const conversationTypingUsers = Array.from(typingUsers.values())
      .filter(data => {
        try {
          // Validate typing data
          const validated = TypingDataSchema.parse(data);
          return validated.conversationId === validConversationId && validated.isTyping;
        } catch {
          return false;
        }
      })
      .slice(0, 50); // Limit to prevent memory issues
    
    setTypingUsersList(conversationTypingUsers);
  }, [typingUsers, validConversationId]);

  // Send typing indicator with rate limiting and validation
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!validConversationId || !isConnected) return;
    
    // Rate limiting
    const now = Date.now();
    if (now - lastTypingUpdate.current < 1000) { // Minimum 1 second between updates
      return;
    }
    
    const rateLimitResult = checkTypingLimit();
    if (!rateLimitResult.allowed) {
      console.warn('Typing indicator rate limit exceeded');
      return;
    }
    
    lastTypingUpdate.current = now;
    sendTyping(validConversationId, !!isTyping); // Ensure boolean
  }, [validConversationId, isConnected, sendTyping, checkTypingLimit]);

  // Subscribe to message events for this conversation with validation
  const subscribeToMessages = useCallback((handler: WebSocketHandler) => {
    if (!validConversationId) return () => {};
    
    // Filter and validate messages for this conversation
    const filteredHandler = (data: any) => {
      try {
        // Basic validation of message data
        if (typeof data !== 'object' || !data.conversationId) {
          return;
        }
        
        // Validate conversation ID matches
        const msgConversationId = ConversationIdSchema.parse(data.conversationId);
        if (msgConversationId === validConversationId) {
          handler(data);
        }
      } catch (error) {
        console.error('Invalid message data:', error);
      }
    };

    return subscribe(WebSocketEvent.MESSAGE_NEW, filteredHandler);
  }, [validConversationId, subscribe]);

  // Secure sendMessage with rate limiting
  const secureSendMessage = useCallback((event: WebSocketEvent | string, data: any) => {
    const rateLimitResult = checkMessageLimit();
    if (!rateLimitResult.allowed) {
      console.error(`Message rate limit exceeded. Wait ${rateLimitResult.waitTime}s`);
      throw new Error('Too many messages. Please slow down.');
    }
    
    // Validate event type if it's a WebSocketEvent enum value
    if (typeof event === 'string' && !event.includes(':')) {
      // If it's a string without ':', check if it's a valid WebSocketEvent
      if (!Object.values(WebSocketEvent).includes(event as WebSocketEvent)) {
        console.error('Invalid WebSocket event type');
        return;
      }
    }
    
    sendMessage(event, data);
  }, [sendMessage, checkMessageLimit]);

  return {
    isConnected,
    typingUsers: typingUsersList,
    sendTypingIndicator,
    subscribeToMessages,
    sendMessage: secureSendMessage,
    conversationId: validConversationId
  };
}

// Hook for online status tracking with security
export function useOnlineStatus(userIds: string[]) {
  const context = useSafeWebSocketContext();
  const { onlineUsers, subscribe } = context;
  const [onlineStatusMap, setOnlineStatusMap] = useState<Map<string, boolean>>(new Map());
  const [validUserIds, setValidUserIds] = useState<string[]>([]);

  // Validate and limit user IDs
  useEffect(() => {
    const validated: string[] = [];
    
    for (let i = 0; i < Math.min(userIds.length, MAX_USER_IDS); i++) {
      try {
        const userId = UserIdSchema.parse(userIds[i]);
        validated.push(sanitizeUsername(userId));
      } catch {
        console.warn(`Invalid user ID at index ${i}`);
      }
    }
    
    setValidUserIds(validated);
  }, [userIds]);

  // Update online status map when users or online status changes
  useEffect(() => {
    const statusMap = new Map<string, boolean>();
    validUserIds.forEach(userId => {
      statusMap.set(userId, onlineUsers.has(userId));
    });
    setOnlineStatusMap(statusMap);
  }, [validUserIds, onlineUsers]);

  // Subscribe to online/offline events for specific users
  useEffect(() => {
    if (validUserIds.length === 0) return;
    
    const unsubscribers: (() => void)[] = [];

    // Subscribe to online events
    const unsubOnline = subscribe<OnlineStatusData>(
      WebSocketEvent.USER_ONLINE,
      (data) => {
        try {
          const validated = OnlineStatusDataSchema.parse(data);
          if (validUserIds.includes(validated.userId)) {
            setOnlineStatusMap(prev => new Map(prev).set(validated.userId, true));
          }
        } catch (error) {
          console.error('Invalid online status data:', error);
        }
      }
    );
    unsubscribers.push(unsubOnline);

    // Subscribe to offline events
    const unsubOffline = subscribe<OnlineStatusData>(
      WebSocketEvent.USER_OFFLINE,
      (data) => {
        try {
          const validated = OnlineStatusDataSchema.parse(data);
          if (validUserIds.includes(validated.userId)) {
            setOnlineStatusMap(prev => new Map(prev).set(validated.userId, false));
          }
        } catch (error) {
          console.error('Invalid offline status data:', error);
        }
      }
    );
    unsubscribers.push(unsubOffline);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [validUserIds, subscribe]);

  return {
    onlineStatusMap,
    isUserOnline: (userId: string) => {
      try {
        const validUserId = UserIdSchema.parse(userId);
        return onlineStatusMap.get(validUserId) || false;
      } catch {
        return false;
      }
    },
    trackedUserCount: validUserIds.length
  };
}

// Hook for real-time notifications with security
export function useRealtimeNotifications() {
  const context = useSafeWebSocketContext();
  const { 
    notifications, 
    markNotificationRead, 
    clearNotifications,
    subscribe 
  } = context;
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [filteredNotifications, setFilteredNotifications] = useState<RealtimeNotification[]>([]);

  // Filter and limit notifications
  useEffect(() => {
    // Limit notifications to prevent memory issues
    const limited = notifications.slice(0, MAX_NOTIFICATION_CACHE);
    setFilteredNotifications(limited);
    
    // Calculate unread count
    const count = limited.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Subscribe to specific notification types with validation
  const subscribeToNotificationType = useCallback(
    (type: RealtimeNotification['type'], handler: (notification: RealtimeNotification) => void) => {
      // Validate notification type
      const validTypes = ['message', 'order', 'wallet', 'system'] as const;
      if (!validTypes.includes(type as any)) {
        console.error('Invalid notification type');
        return () => {};
      }
      
      return subscribe<RealtimeNotification>(
        WebSocketEvent.NOTIFICATION_NEW,
        (notification) => {
          try {
            // Basic validation of notification structure
            if (typeof notification !== 'object' || !notification.type) {
              return;
            }
            
            if (notification.type === type) {
              handler(notification);
            }
          } catch (error) {
            console.error('Error handling notification:', error);
          }
        }
      );
    },
    [subscribe]
  );

  // Secure mark as read with validation
  const secureMarkAsRead = useCallback((notificationId: string) => {
    if (!notificationId || typeof notificationId !== 'string') {
      console.error('Invalid notification ID');
      return;
    }
    
    // Sanitize ID
    const sanitizedId = sanitizeStrict(notificationId).substring(0, 100);
    markNotificationRead(sanitizedId);
  }, [markNotificationRead]);

  return {
    notifications: filteredNotifications,
    unreadCount,
    markAsRead: secureMarkAsRead,
    clearAll: clearNotifications,
    subscribeToType: subscribeToNotificationType
  };
}

// Hook for order updates with validation
export function useOrderUpdates(orderId?: string) {
  const context = useSafeWebSocketContext();
  const { subscribe, isConnected } = context;
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const [validOrderId, setValidOrderId] = useState<string | null>(null);

  // Validate order ID
  useEffect(() => {
    if (!orderId) {
      setValidOrderId(null);
      return;
    }

    try {
      const validated = OrderIdSchema.parse(orderId);
      setValidOrderId(sanitizeStrict(validated));
    } catch (error) {
      console.error('Invalid order ID:', error);
      setValidOrderId(null);
    }
  }, [orderId]);

  useEffect(() => {
    if (!validOrderId || !isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to order updates
    const unsubUpdate = subscribe(WebSocketEvent.ORDER_UPDATE, (data: any) => {
      try {
        if (data?.orderId === validOrderId) {
          // Sanitize update data
          const sanitized = {
            ...data,
            orderId: sanitizeStrict(data.orderId),
            timestamp: Date.now()
          };
          setLastUpdate(sanitized);
        }
      } catch (error) {
        console.error('Invalid order update data:', error);
      }
    });
    unsubscribers.push(unsubUpdate);

    // Subscribe to order status changes
    const unsubStatus = subscribe(WebSocketEvent.ORDER_STATUS_CHANGE, (data: any) => {
      try {
        if (data?.orderId === validOrderId) {
          // Validate status
          const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
          if (data.status && validStatuses.includes(data.status)) {
            const sanitized = {
              ...data,
              orderId: sanitizeStrict(data.orderId),
              status: data.status,
              timestamp: Date.now()
            };
            setLastUpdate(sanitized);
          }
        }
      } catch (error) {
        console.error('Invalid order status data:', error);
      }
    });
    unsubscribers.push(unsubStatus);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [validOrderId, isConnected, subscribe]);

  return {
    lastUpdate,
    isConnected,
    orderId: validOrderId
  };
}

// Hook for wallet balance updates with security
export function useWalletUpdates() {
  const context = useSafeWebSocketContext();
  const { subscribe, isConnected } = context;
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<any>(null);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to balance updates
    const unsubBalance = subscribe(WebSocketEvent.WALLET_BALANCE_UPDATE, (data: any) => {
      try {
        // Validate balance data
        if (typeof data?.balance === 'number' && data.balance >= 0 && isFinite(data.balance)) {
          const sanitized = {
            balance: Math.round(data.balance * 100) / 100, // Round to 2 decimals
            currency: data.currency || 'USD',
            timestamp: Date.now()
          };
          setLastBalanceUpdate(sanitized);
        }
      } catch (error) {
        console.error('Invalid balance update:', error);
      }
    });
    unsubscribers.push(unsubBalance);

    // Subscribe to transactions
    const unsubTransaction = subscribe(WebSocketEvent.WALLET_TRANSACTION, (data: any) => {
      try {
        // Validate transaction data
        if (data?.amount && typeof data.amount === 'number' && data.type) {
          const validTypes = ['deposit', 'withdrawal', 'purchase', 'refund'];
          if (validTypes.includes(data.type)) {
            const sanitized = {
              id: data.id ? sanitizeStrict(String(data.id)).substring(0, 50) : undefined,
              amount: Math.round(data.amount * 100) / 100,
              type: data.type,
              timestamp: Date.now()
            };
            setLastTransaction(sanitized);
          }
        }
      } catch (error) {
        console.error('Invalid transaction data:', error);
      }
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

// Generic hook for any WebSocket event with validation
export function useWebSocketEvent<T = any>(
  event: WebSocketEvent,
  handler: WebSocketHandler<T>,
  options?: {
    validateData?: (data: any) => boolean;
    rateLimit?: { maxAttempts: number; windowMs: number };
  }
) {
  const context = useSafeWebSocketContext();
  const { subscribe, isConnected } = context;
  const handlerRef = useRef(handler);
  
  // Update handler ref
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Rate limiting if specified
  const { checkLimit } = useRateLimit(`WS_EVENT_${event}`, 
    options?.rateLimit || { maxAttempts: 100, windowMs: 60 * 1000 }
  );

  useEffect(() => {
    if (!isConnected) return;

    // Validate event type
    if (!Object.values(WebSocketEvent).includes(event)) {
      console.error('Invalid WebSocket event type:', event);
      return;
    }

    const wrappedHandler = (data: T) => {
      try {
        // Custom validation if provided
        if (options?.validateData && !options.validateData(data)) {
          console.warn('Data validation failed for event:', event);
          return;
        }
        
        // Rate limiting check
        if (options?.rateLimit) {
          const result = checkLimit();
          if (!result.allowed) {
            console.warn(`Rate limit exceeded for event ${event}`);
            return;
          }
        }
        
        handlerRef.current(data);
      } catch (error) {
        console.error(`Error handling WebSocket event ${event}:`, error);
      }
    };

    const unsubscribe = subscribe<T>(event, wrappedHandler);
    return unsubscribe;
  }, [event, isConnected, subscribe, options, checkLimit]);

  return { isConnected };
}

// Re-export the context hook for convenience
export { useWebSocket } from '@/context/WebSocketContext';

// Export the safe version as well for direct usage
export { useSafeWebSocketContext };