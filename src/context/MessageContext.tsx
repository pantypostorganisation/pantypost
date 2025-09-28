// src/context/MessageContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { v4 as uuidv4 } from 'uuid';
import { messagesService } from '@/services';
import type { MessageThread as ServiceMessageThread } from '@/services/messages.service';
import { messageSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';
import { useWebSocket } from '@/context/WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';
import { getRateLimiter } from '@/utils/security/rate-limiter';

// Types
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
  _optimisticId?: string;
};

type MessageThread = { [otherParty: string]: Message[] };

type ThreadInfo = {
  unreadCount: number;
  lastMessage: Message | null;
  otherParty: string;
};

type MessageNotification = {
  buyer: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
};

type MessageOptions = {
  type?: 'normal' | 'customRequest' | 'image' | 'tip';
  meta?: Message['meta'];
  _optimisticId?: string;
};

// The shape components expect
type SellerProfile = {
  pic: string | null;
  verified: boolean;
};

type MessageContextType = {
  messages: { [conversationKey: string]: Message[] };
  sellerProfiles: { [username: string]: SellerProfile };
  isLoading: boolean;
  isInitialized: boolean;
  sendMessage: (sender: string, receiver: string, content: string, options?: MessageOptions) => Promise<void>;
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
  getSellerProfile: (username: string) => SellerProfile | null;
  markMessagesAsRead: (userA: string, userB: string) => Promise<void>;
  blockUser: (blocker: string, blockee: string) => Promise<void>;
  unblockUser: (blocker: string, blockee: string) => Promise<void>;
  reportUser: (reporter: string, reportee: string) => Promise<void>;
  isBlocked: (blocker: string, blockee: string) => boolean;
  hasReported: (reporter: string, reportee: string) => boolean;
  getReportCount: () => number;
  blockedUsers: { [user: string]: string[] };
  reportedUsers: { [user: string]: string[] };
  reportLogs: any[];
  messageNotifications: { [seller: string]: MessageNotification[] };
  clearMessageNotifications: (seller: string, buyer: string) => void;
  refreshMessages: () => Promise<void>;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

const customRequestMetaSchema = z.object({
  title: messageSchemas.customRequest.shape.title,
  price: messageSchemas.customRequest.shape.price,
  message: messageSchemas.customRequest.shape.description,
});

const CLIP = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [conversationKey: string]: Message[] }>({});
  const [sellerProfiles, setSellerProfiles] = useState<{ [username: string]: SellerProfile }>({});
  const [blockedUsers, setBlockedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportedUsers, setReportedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportLogs, setReportLogs] = useState<any[]>([]);
  const [messageNotifications, setMessageNotifications] = useState<{ [seller: string]: MessageNotification[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const wsContext = useWebSocket ? useWebSocket() : null;
  const { subscribe, isConnected } = wsContext || { subscribe: null, isConnected: false };

  const processedMessageIds = useRef<Set<string>>(new Set());
  const optimisticMessageMap = useRef<Map<string, string>>(new Map());
  const subscriptionsRef = useRef<(() => void)[]>([]);
  const rateLimiter = useRef(getRateLimiter()).current;

  // Initialize service
  useEffect(() => {
    messagesService.initialize();
  }, []);

  // Load initial data from API with profiles
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        setIsLoading(true);
        console.log('[MessageContext] Loading initial data...');

        const [threadsResponse, blockedResponse, notificationsResponse] = await Promise.all([
          messagesService.getThreads(''),
          messagesService.getBlockedUsers(),
          messagesService.getMessageNotifications('')
        ]);

        // Process threads and profiles
        if (threadsResponse.success && threadsResponse.data) {
          const processedMessages: { [key: string]: Message[] } = {};
          const profiles: { [username: string]: SellerProfile } = {};

          // Check if profiles exist at the root level of the response
          if ((threadsResponse as any).profiles) {
            console.log('[MessageContext] Found profiles object:', (threadsResponse as any).profiles);
            
            Object.entries((threadsResponse as any).profiles).forEach(([username, profile]: [string, any]) => {
              // Use the username from the key, not from the profile object
              const key = sanitizeUsername(username) || username;
              
              profiles[key] = {
                pic: profile.profilePic || null,
                verified: profile.isVerified || false
              };
              
              console.log(`[MessageContext] Stored profile for ${key}:`, profiles[key]);
            });
          }

          threadsResponse.data.forEach((thread: ServiceMessageThread) => {
            if (thread.messages && thread.messages.length > 0) {
              processedMessages[thread.id] = thread.messages;
            }
          });

          console.log('[MessageContext] Loaded messages for', Object.keys(processedMessages).length, 'conversations');
          console.log('[MessageContext] Loaded profiles for', Object.keys(profiles).length, 'users:', Object.keys(profiles));

          setMessages(processedMessages);
          setSellerProfiles(profiles);
        }

        // Set blocked users
        if (blockedResponse.success && blockedResponse.data) {
          setBlockedUsers(blockedResponse.data);
        }

        // Set notifications
        if (notificationsResponse.success && notificationsResponse.data) {
          const notifs: { [seller: string]: MessageNotification[] } = {};
          notificationsResponse.data.forEach((notif: any) => {
            const seller = notif.seller || notif.recipient;
            if (seller) {
              if (!notifs[seller]) notifs[seller] = [];
              notifs[seller].push({
                buyer: notif.buyer || notif.sender,
                messageCount: notif.messageCount || 1,
                lastMessage: notif.lastMessage || notif.message || '',
                timestamp: notif.timestamp || notif.createdAt || new Date().toISOString()
              });
            }
          });
          setMessageNotifications(notifs);
        }

      } catch (err) {
        console.error('[MessageContext] Error loading message data from API:', err);
        setMessages({});
        setSellerProfiles({});
        setBlockedUsers({});
        setReportedUsers({});
        setReportLogs([]);
        setMessageNotifications({});
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        console.log('[MessageContext] Initialization complete');
      }
    };

    loadData();
  }, []);

  // WebSocket subscriptions
  useEffect(() => {
    subscriptionsRef.current.forEach((unsub) => unsub());
    subscriptionsRef.current = [];

    if (!subscribe) {
      console.log('[MessageContext] WebSocket subscribe not available');
      return;
    }

    const unsubscribeNewMessage = subscribe('message:new' as WebSocketEvent, (data: any) => {
      if (!data || !data.sender || !data.receiver) return;

      const conversationKey = getConversationKey(data.sender, data.receiver);

      if (data.id && processedMessageIds.current.has(data.id)) return;
      if (data.id) {
        processedMessageIds.current.add(data.id);
        if (processedMessageIds.current.size > 1000) {
          const last = Array.from(processedMessageIds.current).slice(-500);
          processedMessageIds.current = new Set(last);
        }
      }

      const safeContent = sanitizeStrict(data.content || '');
      const safeMeta = data.meta
        ? {
            ...data.meta,
            title: data.meta.title ? sanitizeStrict(data.meta.title) : undefined,
            message: data.meta.message ? sanitizeStrict(data.meta.message) : undefined,
            tags: Array.isArray(data.meta.tags) ? data.meta.tags.map((t: string) => sanitizeStrict(t).slice(0, 30)) : undefined,
          }
        : undefined;

      const newMessage: Message = {
        id: data.id || uuidv4(),
        sender: data.sender,
        receiver: data.receiver,
        content: safeContent,
        date: data.date || data.createdAt || new Date().toISOString(),
        isRead: !!data.isRead,
        read: !!data.read,
        type: data.type || 'normal',
        meta: safeMeta,
        threadId: data.threadId || conversationKey,
        _optimisticId: data._optimisticId,
      };

      setMessages((prev) => {
        const existing = prev[conversationKey] || [];

        if (data._optimisticId) {
          optimisticMessageMap.current.set(data._optimisticId, newMessage.id!);
          const withoutOptimistic = existing.filter((m) => m._optimisticId !== data._optimisticId);
          const dup = withoutOptimistic.some((m) => m.id && m.id === newMessage.id);
          if (dup) return prev;

          return { ...prev, [conversationKey]: [...withoutOptimistic, newMessage] };
        }

        const isDup = existing.some((m) => {
          if (m.id && newMessage.id && m.id === newMessage.id) return true;
          if (m.sender === newMessage.sender && m.receiver === newMessage.receiver && m.content === newMessage.content) {
            const Δ = Math.abs(new Date(m.date).getTime() - new Date(newMessage.date).getTime());
            return Δ < 2000;
          }
          return false;
        });
        if (isDup) return prev;

        return { ...prev, [conversationKey]: [...existing, newMessage] };
      });

      setUpdateTrigger((n) => n + 1);

      if (data.type !== 'customRequest') {
        const preview = CLIP(safeContent, 50);
        setMessageNotifications((prev) => {
          const arr = prev[data.receiver] || [];
          const idx = arr.findIndex((n) => n.buyer === data.sender);
          if (idx >= 0) {
            const updated = [...arr];
            updated[idx] = {
              buyer: data.sender,
              messageCount: updated[idx].messageCount + 1,
              lastMessage: preview,
              timestamp: new Date().toISOString(),
            };
            return { ...prev, [data.receiver]: updated };
          }
          return {
            ...prev,
            [data.receiver]: [
              ...arr,
              { buyer: data.sender, messageCount: 1, lastMessage: preview, timestamp: new Date().toISOString() },
            ],
          };
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message:new', { detail: newMessage }));
      }
    });

    const unsubscribeRead = subscribe('message:read' as WebSocketEvent, (data: any) => {
      if (!data || !data.threadId || !Array.isArray(data.messageIds)) return;

      setMessages((prev) => {
        const updated = { ...prev };
        if (updated[data.threadId]) {
          updated[data.threadId] = updated[data.threadId].map((msg) => {
            const realId = msg._optimisticId ? optimisticMessageMap.current.get(msg._optimisticId) || msg.id : msg.id;
            if (realId && data.messageIds.includes(realId)) {
              return { ...msg, isRead: true, read: true };
            }
            return msg;
          });
        }
        return updated;
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('message:read', { detail: data }));
      }
      setUpdateTrigger((n) => n + 1);
    });

    subscriptionsRef.current = [unsubscribeNewMessage, unsubscribeRead];
    return () => {
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
    };
  }, [subscribe, isConnected]);

  // All actions now use the API service
  const sendMessage = useCallback(
    async (sender: string, receiver: string, content: string, options?: MessageOptions) => {
      const cleanSender = sanitizeUsername(sender) || sender;
      const cleanReceiver = sanitizeUsername(receiver) || receiver;

      if (!cleanSender || !cleanReceiver) {
        console.error('Invalid sender or receiver');
        return;
      }

      const recvBlocked = blockedUsers[cleanReceiver]?.includes(cleanSender);
      const sndBlocked = blockedUsers[cleanSender]?.includes(cleanReceiver);
      if (recvBlocked || sndBlocked) {
        console.warn('[MessageContext] Message blocked due to user block settings');
        return;
      }

      const rate = rateLimiter.check(`MESSAGE_SEND:${cleanSender}`, { maxAttempts: 20, windowMs: 30_000 });
      if (!rate.allowed) {
        console.warn(`[MessageContext] Rate limit exceeded. Try again in ${rate.waitTime}s`);
        return;
      }

      let sanitizedContent = content;
      if (options?.type === 'image' && !sanitizedContent.trim() && options?.meta?.imageUrl) {
        sanitizedContent = 'Image shared';
      }

      if (sanitizedContent.trim()) {
        const contentValidation = messageSchemas.messageContent.safeParse(sanitizedContent);
        if (!contentValidation.success) {
          console.error('Invalid message content:', contentValidation.error);
          return;
        }
        sanitizedContent = contentValidation.data;
      }

      let sanitizedMeta = options?.meta;
      if (sanitizedMeta) {
        sanitizedMeta = {
          ...sanitizedMeta,
          title: sanitizedMeta.title ? sanitizeStrict(sanitizedMeta.title) : undefined,
          message: sanitizedMeta.message ? sanitizeStrict(sanitizedMeta.message) : undefined,
          tags: sanitizedMeta.tags?.map((t) => sanitizeStrict(t).slice(0, 30)),
        };
      }

      try {
        const result = await messagesService.sendMessage({
          sender: cleanSender,
          receiver: cleanReceiver,
          content: sanitizedContent,
          type: options?.type,
          meta: sanitizedMeta,
        });

        if (result.success && result.data) {
          // Message will be added via WebSocket echo
          if (options?.type !== 'customRequest') {
            const preview = CLIP(sanitizeStrict(sanitizedContent), 50);
            setMessageNotifications((prev) => {
              const arr = prev[cleanReceiver] || [];
              const idx = arr.findIndex((n) => n.buyer === cleanSender);
              if (idx >= 0) {
                const updated = [...arr];
                updated[idx] = {
                  buyer: cleanSender,
                  messageCount: updated[idx].messageCount + 1,
                  lastMessage: preview,
                  timestamp: new Date().toISOString(),
                };
                return { ...prev, [cleanReceiver]: updated };
              }
              return {
                ...prev,
                [cleanReceiver]: [...arr, { buyer: cleanSender, messageCount: 1, lastMessage: preview, timestamp: new Date().toISOString() }],
              };
            });
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [blockedUsers, rateLimiter]
  );

  const sendCustomRequest = useCallback(
    (buyer: string, seller: string, content: string, title: string, price: number, tags: string[], listingId: string) => {
      const validation = customRequestMetaSchema.safeParse({ title, price, message: content });
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
          tags: tags.map((t) => sanitizeStrict(t).slice(0, 30)),
          message: validation.data.message,
        },
      });
    },
    [sendMessage]
  );

  const getMessagesForUsers = useCallback(
    (userA: string, userB: string): Message[] => {
      const conversationKey = getConversationKey(userA, userB);
      return messages[conversationKey] || [];
    },
    [messages, updateTrigger]
  );

  const getThreadsForUser = useCallback(
    (username: string, role?: 'buyer' | 'seller'): MessageThread => {
      const threads: MessageThread = {};
      Object.entries(messages).forEach(([_, msgs]) => {
        msgs.forEach((msg) => {
          if (msg.sender === username || msg.receiver === username) {
            const other = msg.sender === username ? msg.receiver : msg.sender;
            (threads[other] ||= []).push(msg);
          }
        });
      });
      Object.values(threads).forEach((thread) => {
        thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      });
      return threads;
    },
    [messages, updateTrigger]
  );

  const getThreadInfo = useCallback(
    (username: string, otherParty: string): ThreadInfo => {
      const conversationKey = getConversationKey(username, otherParty);
      const threadMessages = messages[conversationKey] || [];
      const unreadCount = threadMessages.filter((m) => m.receiver === username && !m.read && !m.isRead).length;
      const lastMessage = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : null;
      return { unreadCount, lastMessage, otherParty };
    },
    [messages, updateTrigger]
  );

  const getAllThreadsInfo = useCallback(
    (username: string, role?: 'buyer' | 'seller') => {
      const threads = getThreadsForUser(username, role);
      const info: { [otherParty: string]: ThreadInfo } = {};
      Object.keys(threads).forEach((other) => {
        info[other] = getThreadInfo(username, other);
      });
      return info;
    },
    [getThreadsForUser, getThreadInfo]
  );

  const getSellerProfile = useCallback(
    (username: string): SellerProfile | null => {
      return sellerProfiles[username] || null;
    },
    [sellerProfiles]
  );

  const markMessagesAsRead = useCallback(async (userA: string, userB: string) => {
    try {
      const result = await messagesService.markMessagesAsRead(userA, userB);
      if (result.success) {
        const conversationKey = getConversationKey(userA, userB);
        setMessages((prev) => {
          const conv = prev[conversationKey] || [];
          const updatedConv = conv.map((msg) =>
            msg.receiver === userA && msg.sender === userB && !msg.read ? { ...msg, read: true, isRead: true } : msg
          );
          return { ...prev, [conversationKey]: updatedConv };
        });

        clearMessageNotifications(userA, userB);
        setUpdateTrigger((n) => n + 1);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  const clearMessageNotifications = useCallback((seller: string, buyer: string) => {
    setMessageNotifications((prev) => {
      const arr = prev[seller] || [];
      const filtered = arr.filter((n) => n.buyer !== buyer);
      if (filtered.length === arr.length) return prev;
      return { ...prev, [seller]: filtered };
    });

    // Also clear on backend
    messagesService.clearMessageNotifications(seller, buyer);
  }, []);

  const blockUser = useCallback(async (blocker: string, blockee: string) => {
    try {
      const cleanBlocker = sanitizeUsername(blocker) || blocker;
      const cleanBlockee = sanitizeUsername(blockee) || blockee;
      const result = await messagesService.blockUser({ blocker: cleanBlocker, blocked: cleanBlockee });
      if (result.success) {
        setBlockedUsers((prev) => {
          const list = prev[cleanBlocker] || [];
          if (!list.includes(cleanBlockee)) return { ...prev, [cleanBlocker]: [...list, cleanBlockee] };
          return prev;
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  }, []);

  const unblockUser = useCallback(async (blocker: string, blockee: string) => {
    try {
      const cleanBlocker = sanitizeUsername(blocker) || blocker;
      const cleanBlockee = sanitizeUsername(blockee) || blockee;
      const result = await messagesService.unblockUser({ blocker: cleanBlocker, blocked: cleanBlockee });
      if (result.success) {
        setBlockedUsers((prev) => {
          const list = prev[cleanBlocker] || [];
          return { ...prev, [cleanBlocker]: list.filter((b) => b !== cleanBlockee) };
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  }, []);

  const reportUser = useCallback(
    async (reporter: string, reportee: string) => {
      const conversationKey = getConversationKey(reporter, reportee);
      const reportMessages = messages[conversationKey] || [];

      try {
        const cleanReporter = sanitizeUsername(reporter) || reporter;
        const cleanReportee = sanitizeUsername(reportee) || reportee;

        // Import reports service dynamically to avoid circular dependency
        const { reportsService } = await import('@/services/reports.service');

        // Submit to the main reports system
        const reportResult = await reportsService.submitReport({
          reportedUser: cleanReportee,
          reportType: 'harassment',
          description: `User reported from messages by ${cleanReporter}`,
          severity: 'medium',
          relatedMessageId: reportMessages.length > 0 ? reportMessages[reportMessages.length - 1].id : undefined
        });

        if (reportResult.success) {
          console.log('[MessageContext] Report submitted successfully');

          // Update local state
          setReportedUsers((prev) => {
            const list = prev[cleanReporter] || [];
            if (!list.includes(cleanReportee)) {
              return { ...prev, [cleanReporter]: [...list, cleanReportee] };
            }
            return prev;
          });

          const newReport = {
            id: reportResult.data?.reportId || reportResult.data?.id || uuidv4(),
            reporter: cleanReporter,
            reportee: cleanReportee,
            messages: reportMessages,
            date: new Date().toISOString(),
            processed: false,
            category: 'harassment',
          };

          setReportLogs((prev) => [...prev, newReport]);
        }
      } catch (error) {
        console.error('[MessageContext] Error reporting user:', error);

        // Even if API fails, update local state so UI shows user as reported
        const cleanReporter = sanitizeUsername(reporter) || reporter;
        const cleanReportee = sanitizeUsername(reportee) || reportee;

        setReportedUsers((prev) => {
          const list = prev[cleanReporter] || [];
          if (!list.includes(cleanReportee)) {
            return { ...prev, [cleanReporter]: [...list, cleanReportee] };
          }
          return prev;
        });
      }
    },
    [messages]
  );

  const isBlocked = useCallback(
    (blocker: string, blockee: string) => {
      return blockedUsers[blocker]?.includes(blockee) ?? false;
    },
    [blockedUsers]
  );

  const hasReported = useCallback(
    (reporter: string, reportee: string) => {
      return reportedUsers[reporter]?.includes(reportee) ?? false;
    },
    [reportedUsers]
  );

  const getReportCount = useCallback(() => {
    return reportLogs.filter((r) => !r.processed).length;
  }, [reportLogs]);

  const refreshMessages = useCallback(async () => {
    console.log('[MessageContext] Refreshing messages...');
    try {
      const threadsResponse = await messagesService.getThreads('');
      console.log('[MessageContext] Full threads response:', JSON.stringify(threadsResponse));
      if (threadsResponse.success && threadsResponse.data) {
        const processedMessages: { [key: string]: Message[] } = {};
        const profiles: { [username: string]: SellerProfile } = {};

        if ((threadsResponse as any).profiles) {
          console.log('[MessageContext] Found profiles object:', (threadsResponse as any).profiles);
          
          Object.entries((threadsResponse as any).profiles).forEach(([username, profile]: [string, any]) => {
            const key = sanitizeUsername(username) || username;
            
            profiles[key] = {
              pic: profile.profilePic || null,
              verified: profile.isVerified || false
            };
            
            console.log(`[MessageContext] Refreshed profile for ${key}:`, profiles[key]);
          });
        }

        threadsResponse.data.forEach((thread: ServiceMessageThread) => {
          if (thread.messages && thread.messages.length > 0) {
            processedMessages[thread.id] = thread.messages;
          }
        });

        setMessages(processedMessages);
        setSellerProfiles(profiles);
        setUpdateTrigger((n) => n + 1);
      }
    } catch (error) {
      console.error('[MessageContext] Error refreshing messages:', error);
    }
  }, []);

  return (
    <MessageContext.Provider
      value={{
        messages,
        sellerProfiles,
        isLoading,
        isInitialized,
        sendMessage,
        sendCustomRequest,
        getMessagesForUsers,
        getThreadsForUser,
        getThreadInfo,
        getAllThreadsInfo,
        getSellerProfile,
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
  if (!context) throw new Error('useMessages must be used within a MessageProvider');
  return context;
};

// External helper for report count (now uses API)
export const getReportCount = async (): Promise<number> => {
  try {
    if (typeof window === 'undefined') return 0;
    const response = await messagesService.getUnreadReports();
    return response.success && response.data ? response.data.count : 0;
  } catch (e) {
    console.error('Error getting external report count:', e);
    return 0;
  }
};
