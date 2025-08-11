// src/context/MessageContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { v4 as uuidv4 } from 'uuid';
import { messagesService, storageService } from '@/services';
import { messageSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';

// Import WebSocket context
import { useWebSocket } from '@/context/WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';

// Enhanced Message type with id and isRead
type Message = {
  id?: string;
  sender: string;
  receiver: string;
  content: string;
  date: string;
  isRead?: boolean;
  read?: boolean;
  type?: 'normal' | 'customRequest' | 'image' | 'tip';
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
    tipAmount?: number;
  };
  threadId?: string;
};

// Enhanced ReportLog type with processing status
type ReportLog = {
  id?: string;
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
  processed?: boolean;
  banApplied?: boolean;
  banId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
};

type MessageOptions = {
  type?: 'normal' | 'customRequest' | 'image' | 'tip';
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
    tipAmount?: number;
  };
};

// Thread type for organized message threads
type MessageThread = {
  [otherParty: string]: Message[];
};

// Thread info type for additional thread metadata
type ThreadInfo = {
  unreadCount: number;
  lastMessage: Message | null;
  otherParty: string;
};

// Message notification type
type MessageNotification = {
  buyer: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
};

// Enhanced MessageContextType with additional methods
type MessageContextType = {
  messages: { [conversationKey: string]: Message[] };
  isLoading: boolean;
  sendMessage: (
    sender: string,
    receiver: string,
    content: string,
    options?: MessageOptions
  ) => Promise<void>;
  sendCustomRequest: (
    buyer: string,
    seller: string,
    content: string,
    title: string,
    price: number,
    tags: string[],
    listingId: string
  ) => void;
  getMessagesForUsers: (userA: string, userB: string) => Message[];
  getThreadsForUser: (username: string, role?: 'buyer' | 'seller') => MessageThread;
  getThreadInfo: (username: string, otherParty: string) => ThreadInfo;
  getAllThreadsInfo: (username: string, role?: 'buyer' | 'seller') => { [otherParty: string]: ThreadInfo };
  markMessagesAsRead: (userA: string, userB: string) => Promise<void>;
  blockUser: (blocker: string, blockee: string) => Promise<void>;
  unblockUser: (blocker: string, blockee: string) => Promise<void>;
  reportUser: (reporter: string, reportee: string) => Promise<void>;
  isBlocked: (blocker: string, blockee: string) => boolean;
  hasReported: (reporter: string, reportee: string) => boolean;
  getReportCount: () => number;
  blockedUsers: { [user: string]: string[] };
  reportedUsers: { [user: string]: string[] };
  reportLogs: ReportLog[];
  messageNotifications: { [seller: string]: MessageNotification[] };
  clearMessageNotifications: (seller: string, buyer: string) => void;
  refreshMessages: () => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Helper to create a consistent conversation key
const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

// Validation schemas
const customRequestMetaSchema = z.object({
  title: messageSchemas.customRequest.shape.title,
  price: messageSchemas.customRequest.shape.price,
  message: messageSchemas.customRequest.shape.description,
});

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [conversationKey: string]: Message[] }>({});
  const [blockedUsers, setBlockedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportedUsers, setReportedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([]);
  const [messageNotifications, setMessageNotifications] = useState<{ [seller: string]: MessageNotification[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Use WebSocket context - with safe fallback
  const wsContext = useWebSocket ? useWebSocket() : null;
  const { subscribe, isConnected } = wsContext || { subscribe: null, isConnected: false };
  
  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Initialize service on mount
  useEffect(() => {
    messagesService.initialize();
  }, []);

  // Load initial data using services
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load messages
        const storedMessages = await storageService.getItem<{ [key: string]: Message[] }>('panty_messages', {});

        // Ensure we have a valid object
        if (storedMessages && typeof storedMessages === 'object') {
          // Migrate old format if needed
          const needsMigration = Object.values(storedMessages).some(
            value => !Array.isArray(value) || (value.length > 0 && !value[0].sender)
          );

          if (needsMigration) {
            console.log('Migrating message format...');
            const migrated: { [key: string]: Message[] } = {};

            Object.entries(storedMessages).forEach(([key, msgs]) => {
              if (Array.isArray(msgs)) {
                msgs.forEach((msg: any) => {
                  if (msg.sender && msg.receiver) {
                    const conversationKey = getConversationKey(msg.sender, msg.receiver);
                    if (!migrated[conversationKey]) {
                      migrated[conversationKey] = [];
                    }
                    migrated[conversationKey].push({
                      ...msg,
                      content: sanitizeStrict(msg.content || '')
                    });
                  }
                });
              }
            });

            setMessages(migrated);
            await storageService.setItem('panty_messages', migrated);
          } else {
            // Sanitize existing messages
            const sanitized: { [key: string]: Message[] } = {};
            Object.entries(storedMessages).forEach(([key, msgs]) => {
              sanitized[key] = msgs.map(msg => ({
                ...msg,
                content: sanitizeStrict(msg.content || '')
              }));
            });
            setMessages(sanitized);
          }
        }

        // Load blocked users
        const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
        setBlockedUsers(blocked || {});

        // Load reported users
        const reported = await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {});
        setReportedUsers(reported || {});

        // Load report logs
        const reports = await storageService.getItem<ReportLog[]>('panty_report_logs', []);
        setReportLogs(reports || []);

        // Load message notifications
        const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>('panty_message_notifications', {});
        setMessageNotifications(notifications || {});

      } catch (error) {
        console.error('Error loading message data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // FIXED: WebSocket listener for new messages
  useEffect(() => {
    // Clean up previous subscriptions
    subscriptionsRef.current.forEach(unsub => unsub());
    subscriptionsRef.current = [];

    if (!subscribe) {
      console.log('[MessageContext] WebSocket subscribe not available');
      return;
    }

    console.log('[MessageContext] Setting up WebSocket listeners, connected:', isConnected);

    // Subscribe to new message events - use the correct event name
    const unsubscribeNewMessage = subscribe('message:new' as WebSocketEvent, (data: any) => {
      console.log('[MessageContext] New message received via WebSocket:', data);
      
      if (data && data.sender && data.receiver) {
        const conversationKey = getConversationKey(data.sender, data.receiver);
        
        // Check if we've already processed this message ID
        if (data.id && processedMessageIds.current.has(data.id)) {
          console.log('[MessageContext] Message already processed, skipping:', data.id);
          return;
        }
        
        if (data.id) {
          processedMessageIds.current.add(data.id);
          // Clean up old IDs to prevent memory leak
          if (processedMessageIds.current.size > 1000) {
            const idsArray = Array.from(processedMessageIds.current);
            processedMessageIds.current = new Set(idsArray.slice(-500));
          }
        }
        
        const newMessage: Message = {
          id: data.id || uuidv4(),
          sender: data.sender,
          receiver: data.receiver,
          content: data.content || '',
          date: data.date || data.createdAt || new Date().toISOString(),
          isRead: data.isRead || false,
          read: data.read || false,
          type: data.type || 'normal',
          meta: data.meta,
          threadId: data.threadId || conversationKey,
        };
        
        console.log('[MessageContext] Adding new message to conversation:', conversationKey);
        
        // Update messages state
        setMessages(prev => {
          const existingMessages = prev[conversationKey] || [];
          
          // Check if message already exists (by ID or by content+timestamp)
          const isDuplicate = existingMessages.some(m => 
            (m.id && m.id === newMessage.id) ||
            (m.sender === newMessage.sender && 
             m.content === newMessage.content && 
             Math.abs(new Date(m.date).getTime() - new Date(newMessage.date).getTime()) < 1000)
          );
          
          if (isDuplicate) {
            console.log('[MessageContext] Duplicate message detected, skipping');
            return prev;
          }
          
          const updatedMessages = {
            ...prev,
            [conversationKey]: [...existingMessages, newMessage],
          };
          
          console.log('[MessageContext] Updated messages state with new message');
          
          // Save to storage
          storageService.setItem('panty_messages', updatedMessages).catch(err => 
            console.error('[MessageContext] Failed to save messages:', err)
          );
          
          return updatedMessages;
        });
        
        // Force a re-render to ensure UI updates
        setUpdateTrigger(prev => {
          console.log('[MessageContext] Triggering update:', prev + 1);
          return prev + 1;
        });
        
        // Update notifications if it's not a custom request
        if (data.type !== 'customRequest') {
          setMessageNotifications(prev => {
            const sellerNotifs = prev[data.receiver] || [];
            const existingIndex = sellerNotifs.findIndex((n: MessageNotification) => n.buyer === data.sender);

            if (existingIndex >= 0) {
              const updated = [...sellerNotifs];
              updated[existingIndex] = {
                buyer: data.sender,
                messageCount: updated[existingIndex].messageCount + 1,
                lastMessage: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
                timestamp: new Date().toISOString()
              };
              return {
                ...prev,
                [data.receiver]: updated
              };
            } else {
              return {
                ...prev,
                [data.receiver]: [...sellerNotifs, {
                  buyer: data.sender,
                  messageCount: 1,
                  lastMessage: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
                  timestamp: new Date().toISOString()
                }]
              };
            }
          });
        }
        
        // Emit a custom event for components to listen to
        if (typeof window !== 'undefined') {
          console.log('[MessageContext] Dispatching DOM event for new message');
          window.dispatchEvent(new CustomEvent('message:new', { detail: newMessage }));
        }
      }
    });

    // Also listen for message:read events
    const unsubscribeRead = subscribe('message:read' as WebSocketEvent, (data: any) => {
      console.log('[MessageContext] Messages marked as read via WebSocket:', data);
      
      if (data && data.threadId && data.messageIds) {
        setMessages(prev => {
          const updatedMessages = { ...prev };
          if (updatedMessages[data.threadId]) {
            updatedMessages[data.threadId] = updatedMessages[data.threadId].map(msg => {
              if (data.messageIds.includes(msg.id)) {
                return { ...msg, isRead: true, read: true };
              }
              return msg;
            });
          }
          return updatedMessages;
        });
        
        // Force a re-render
        setUpdateTrigger(prev => prev + 1);
      }
    });

    subscriptionsRef.current = [unsubscribeNewMessage, unsubscribeRead];

    return () => {
      console.log('[MessageContext] Cleaning up WebSocket listeners');
      subscriptionsRef.current.forEach(unsub => unsub());
      subscriptionsRef.current = [];
    };
  }, [subscribe, isConnected]);

  // Also listen for custom DOM events as fallback
  useEffect(() => {
    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      
      console.log('[MessageContext] New message via DOM event:', data);
      
      if (data && data.sender && data.receiver) {
        const conversationKey = getConversationKey(data.sender, data.receiver);
        
        // Check if we've already processed this message
        if (data.id && processedMessageIds.current.has(data.id)) {
          return;
        }
        
        if (data.id) {
          processedMessageIds.current.add(data.id);
        }
        
        setMessages(prev => {
          const existingMessages = prev[conversationKey] || [];
          
          // Check if message already exists
          if (data.id && existingMessages.some(m => m.id === data.id)) {
            return prev;
          }
          
          const newMessage: Message = {
            id: data.id || uuidv4(),
            sender: data.sender,
            receiver: data.receiver,
            content: data.content || '',
            date: data.date || data.createdAt || new Date().toISOString(),
            isRead: data.isRead || false,
            read: data.read || false,
            type: data.type || 'normal',
            meta: data.meta,
            threadId: data.threadId || conversationKey,
          };
          
          const updated = {
            ...prev,
            [conversationKey]: [...existingMessages, newMessage],
          };
          
          // Save to storage
          storageService.setItem('panty_messages', updated).catch(err => 
            console.error('[MessageContext] Failed to save messages:', err)
          );
          
          return updated;
        });
        
        // Force a re-render
        setUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('message:new', handleNewMessage);

    return () => {
      window.removeEventListener('message:new', handleNewMessage);
    };
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      storageService.setItem('panty_messages', messages);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      storageService.setItem('panty_blocked', blockedUsers);
    }
  }, [blockedUsers, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      storageService.setItem('panty_reported', reportedUsers);
    }
  }, [reportedUsers, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      storageService.setItem('panty_report_logs', reportLogs);
    }
  }, [reportLogs, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      storageService.setItem('panty_message_notifications', messageNotifications);
    }
  }, [messageNotifications, isLoading]);

  // Send message with proper image handling
  const sendMessage = useCallback(async (
    sender: string,
    receiver: string,
    content: string,
    options?: MessageOptions
  ) => {
    // Validate inputs
    if (!sender || !receiver) {
      console.error('Invalid sender or receiver');
      return;
    }

    if (!content.trim() && !options?.meta?.imageUrl) {
      console.error('Cannot send empty message without image');
      return;
    }

    // For image messages, allow empty content or provide default
    let sanitizedContent = content;
    if (options?.type === 'image' && !content.trim() && options?.meta?.imageUrl) {
      sanitizedContent = 'Image shared';
    }

    // Validate message content only if we have content to validate
    if (sanitizedContent.trim()) {
      const contentValidation = messageSchemas.messageContent.safeParse(sanitizedContent);
      if (!contentValidation.success) {
        console.error('Invalid message content:', contentValidation.error);
        return;
      }
      sanitizedContent = contentValidation.data;
    }

    // Validate and sanitize meta fields if present
    let sanitizedMeta = options?.meta;
    if (sanitizedMeta) {
      sanitizedMeta = {
        ...sanitizedMeta,
        title: sanitizedMeta.title ? sanitizeStrict(sanitizedMeta.title) : undefined,
        message: sanitizedMeta.message ? sanitizeStrict(sanitizedMeta.message) : undefined,
        tags: sanitizedMeta.tags?.map(tag => sanitizeStrict(tag).slice(0, 30)),
      };
    }

    try {
      const result = await messagesService.sendMessage({
        sender,
        receiver,
        content: sanitizedContent,
        type: options?.type,
        meta: sanitizedMeta,
      });

      if (result.success && result.data) {
        const conversationKey = getConversationKey(sender, receiver);
        const newMessage: Message = {
          id: result.data.id,
          sender: result.data.sender,
          receiver: result.data.receiver,
          content: result.data.content,
          date: result.data.date,
          isRead: result.data.isRead,
          read: result.data.read,
          type: result.data.type,
          meta: result.data.meta,
          threadId: result.data.threadId || conversationKey,
        };

        // For image messages, ensure we have the image URL in meta
        if (options?.type === 'image' && options?.meta?.imageUrl) {
          console.log('Sending image message with URL:', options.meta.imageUrl);
          newMessage.meta = {
            ...newMessage.meta,
            imageUrl: options.meta.imageUrl
          };
        }

        // Add to local state immediately for optimistic update
        setMessages(prev => ({
          ...prev,
          [conversationKey]: [...(prev[conversationKey] || []), newMessage],
        }));

        // Force a re-render
        setUpdateTrigger(prev => prev + 1);

        // Update notifications if needed
        if (options?.type !== 'customRequest') {
          setMessageNotifications(prev => {
            const sellerNotifs = prev[receiver] || [];
            const existingIndex = sellerNotifs.findIndex(n => n.buyer === sender);

            if (existingIndex >= 0) {
              const updated = [...sellerNotifs];
              updated[existingIndex] = {
                buyer: sender,
                messageCount: updated[existingIndex].messageCount + 1,
                lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
                timestamp: new Date().toISOString()
              };
              return {
                ...prev,
                [receiver]: updated
              };
            } else {
              return {
                ...prev,
                [receiver]: [...sellerNotifs, {
                  buyer: sender,
                  messageCount: 1,
                  lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
                  timestamp: new Date().toISOString()
                }]
              };
            }
          });
        }

        console.log('Message sent successfully:', newMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  const sendCustomRequest = useCallback((
    buyer: string,
    seller: string,
    content: string,
    title: string,
    price: number,
    tags: string[],
    listingId: string
  ) => {
    // Validate custom request data
    const validation = customRequestMetaSchema.safeParse({
      title,
      price,
      message: content,
    });

    if (!validation.success) {
      console.error('Invalid custom request:', validation.error);
      return;
    }

    sendMessage(buyer, seller, validation.data.message, {
      type: 'customRequest',
      meta: {
        id: uuidv4(),
        title: validation.data.title,
        price: validation.data.price,
        tags: tags.map(tag => sanitizeStrict(tag).slice(0, 30)),
        message: validation.data.message,
      },
    });
  }, [sendMessage]);

  const getMessagesForUsers = useCallback((userA: string, userB: string): Message[] => {
    const conversationKey = getConversationKey(userA, userB);
    return messages[conversationKey] || [];
  }, [messages, updateTrigger]); // Add updateTrigger to dependencies

  const getThreadsForUser = useCallback((username: string, role?: 'buyer' | 'seller'): MessageThread => {
    const threads: MessageThread = {};

    Object.entries(messages).forEach(([key, msgs]) => {
      msgs.forEach(msg => {
        if (msg.sender === username || msg.receiver === username) {
          const otherParty = msg.sender === username ? msg.receiver : msg.sender;
          if (!threads[otherParty]) {
            threads[otherParty] = [];
          }
          threads[otherParty].push(msg);
        }
      });
    });

    Object.values(threads).forEach(thread => {
      thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return threads;
  }, [messages, updateTrigger]); // Add updateTrigger to dependencies

  const getThreadInfo = useCallback((username: string, otherParty: string): ThreadInfo => {
    const conversationKey = getConversationKey(username, otherParty);
    const threadMessages = messages[conversationKey] || [];

    const unreadCount = threadMessages.filter(
      msg => msg.receiver === username && !msg.read && !msg.isRead
    ).length;

    const lastMessage = threadMessages.length > 0 ?
      threadMessages[threadMessages.length - 1] : null;

    return {
      unreadCount,
      lastMessage,
      otherParty
    };
  }, [messages, updateTrigger]); // Add updateTrigger to dependencies

  const getAllThreadsInfo = useCallback((username: string, role?: 'buyer' | 'seller'): { [otherParty: string]: ThreadInfo } => {
    const threads = getThreadsForUser(username, role);
    const threadInfos: { [otherParty: string]: ThreadInfo } = {};

    Object.keys(threads).forEach(otherParty => {
      threadInfos[otherParty] = getThreadInfo(username, otherParty);
    });

    return threadInfos;
  }, [getThreadsForUser, getThreadInfo]);

  const markMessagesAsRead = useCallback(async (userA: string, userB: string) => {
    try {
      const result = await messagesService.markMessagesAsRead(userA, userB);
      if (result.success) {
        const conversationKey = getConversationKey(userA, userB);
        setMessages(prev => {
          const conversationMessages = prev[conversationKey] || [];
          const updatedMessages = conversationMessages.map(msg =>
            msg.receiver === userA && msg.sender === userB && !msg.read
              ? { ...msg, read: true, isRead: true }
              : msg
          );

          return {
            ...prev,
            [conversationKey]: updatedMessages,
          };
        });

        clearMessageNotifications(userA, userB);
        
        // Force a re-render
        setUpdateTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  const clearMessageNotifications = useCallback((seller: string, buyer: string) => {
    setMessageNotifications(prev => {
      const sellerNotifs = prev[seller] || [];
      const filtered = sellerNotifs.filter(n => n.buyer !== buyer);

      if (filtered.length === sellerNotifs.length) {
        return prev;
      }

      return {
        ...prev,
        [seller]: filtered
      };
    });
  }, []);

  const blockUser = useCallback(async (blocker: string, blockee: string) => {
    try {
      const result = await messagesService.blockUser({
        blocker,
        blocked: blockee,
      });

      if (result.success) {
        setBlockedUsers(prev => {
          const blockerList = prev[blocker] || [];
          if (!blockerList.includes(blockee)) {
            return {
              ...prev,
              [blocker]: [...blockerList, blockee],
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  }, []);

  const unblockUser = useCallback(async (blocker: string, blockee: string) => {
    try {
      const result = await messagesService.unblockUser({
        blocker,
        blocked: blockee,
      });

      if (result.success) {
        setBlockedUsers(prev => {
          const blockerList = prev[blocker] || [];
          return {
            ...prev,
            [blocker]: blockerList.filter(b => b !== blockee),
          };
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  }, []);

  const reportUser = useCallback(async (reporter: string, reportee: string) => {
    const conversationKey = getConversationKey(reporter, reportee);
    const reportMessages = messages[conversationKey] || [];

    try {
      const result = await messagesService.reportUser({
        reporter,
        reportee,
        messages: reportMessages,
      });

      if (result.success) {
        setReportedUsers(prev => {
          const reporterList = prev[reporter] || [];
          if (!reporterList.includes(reportee)) {
            return {
              ...prev,
              [reporter]: [...reporterList, reportee],
            };
          }
          return prev;
        });

        const newReport: ReportLog = {
          id: uuidv4(),
          reporter,
          reportee,
          messages: reportMessages,
          date: new Date().toISOString(),
          processed: false,
          category: 'other'
        };

        setReportLogs(prev => [...prev, newReport]);
      }
    } catch (error) {
      console.error('Error reporting user:', error);
    }
  }, [messages]);

  const isBlocked = useCallback((blocker: string, blockee: string): boolean => {
    return blockedUsers[blocker]?.includes(blockee) ?? false;
  }, [blockedUsers]);

  const hasReported = useCallback((reporter: string, reportee: string): boolean => {
    return reportedUsers[reporter]?.includes(reportee) ?? false;
  }, [reportedUsers]);

  const getReportCount = useCallback((): number => {
    return reportLogs.filter(report => !report.processed).length;
  }, [reportLogs]);

  // Add a method to force refresh messages
  const refreshMessages = useCallback(() => {
    console.log('[MessageContext] Force refresh triggered');
    setUpdateTrigger(prev => prev + 1);
  }, []);

  return (
    <MessageContext.Provider
      value={{
        messages,
        isLoading,
        sendMessage,
        sendCustomRequest,
        getMessagesForUsers,
        getThreadsForUser,
        getThreadInfo,
        getAllThreadsInfo,
        markMessagesAsRead,
        blockUser,
        unblockUser,
        reportUser,
        isBlocked,
        hasReported,
        getReportCount,
        blockedUsers,
        reportedUsers,
        reportLogs,
        messageNotifications,
        clearMessageNotifications,
        refreshMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

// Enhanced external getReportCount function for header use
export const getReportCount = async (): Promise<number> => {
  try {
    if (typeof window === 'undefined') return 0;

    const reports = await storageService.getItem<ReportLog[]>('panty_report_logs', []);
    if (!Array.isArray(reports)) return 0;

    const pendingReports = reports.filter(report =>
      report &&
      typeof report === 'object' &&
      !report.processed
    );

    return pendingReports.length;
  } catch (error) {
    console.error('Error getting external report count:', error);
    return 0;
  }
};