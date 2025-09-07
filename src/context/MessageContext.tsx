'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { v4 as uuidv4 } from 'uuid';
import { messagesService, storageService } from '@/services';
import { messageSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';

// WebSocket
import { useWebSocket } from '@/context/WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';

// Rate limiter (reuse your shared util)
import { getRateLimiter } from '@/utils/security/rate-limiter';

// ------------ Types ------------
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

type MessageContextType = {
  messages: { [conversationKey: string]: Message[] };
  isLoading: boolean;
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

// Keep conversation key logic unchanged to avoid breaking stored keys
const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

// Validation schemas
const customRequestMetaSchema = z.object({
  title: messageSchemas.customRequest.shape.title,
  price: messageSchemas.customRequest.shape.price,
  message: messageSchemas.customRequest.shape.description,
});

// Helpers
const CLIP = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<{ [conversationKey: string]: Message[] }>({});
  const [blockedUsers, setBlockedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportedUsers, setReportedUsers] = useState<{ [user: string]: string[] }>({});
  const [reportLogs, setReportLogs] = useState<ReportLog[]>([]);
  const [messageNotifications, setMessageNotifications] = useState<{ [seller: string]: MessageNotification[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // WebSocket
  const wsContext = useWebSocket ? useWebSocket() : null;
  const { subscribe, isConnected } = wsContext || { subscribe: null, isConnected: false };

  // Deduping & optimistic mapping
  const processedMessageIds = useRef<Set<string>>(new Set());
  const optimisticMessageMap = useRef<Map<string, string>>(new Map());
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Rate limiter
  const rateLimiter = useRef(getRateLimiter()).current;

  // Initialize service
  useEffect(() => {
    messagesService.initialize();
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);

        const storedMessages = await storageService.getItem<{ [key: string]: Message[] }>('panty_messages', {});
        if (storedMessages && typeof storedMessages === 'object') {
          const sanitized: { [key: string]: Message[] } = {};
          Object.entries(storedMessages).forEach(([key, msgs]) => {
            sanitized[key] = Array.isArray(msgs)
              ? msgs.map((msg) => ({
                  ...msg,
                  content: sanitizeStrict(msg.content || ''),
                  meta: msg.meta
                    ? {
                        ...msg.meta,
                        title: msg.meta.title ? sanitizeStrict(msg.meta.title) : undefined,
                        message: msg.meta.message ? sanitizeStrict(msg.meta.message) : undefined,
                        tags: msg.meta.tags?.map((t) => sanitizeStrict(t).slice(0, 30)),
                      }
                    : undefined,
                }))
              : [];
          });
          setMessages(sanitized);
        }

        setBlockedUsers((await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {})) || {});
        setReportedUsers((await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {})) || {});
        setReportLogs((await storageService.getItem<ReportLog[]>('panty_report_logs', [])) || {});
        setMessageNotifications(
          (await storageService.getItem<{ [seller: string]: MessageNotification[] }>('panty_message_notifications', {})) || {}
        );
      } catch (err) {
        console.error('Error loading message data:', err);
      } finally {
        setIsLoading(false);
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

    // message:new
    const unsubscribeNewMessage = subscribe('message:new' as WebSocketEvent, (data: any) => {
      if (!data || !data.sender || !data.receiver) return;

      const conversationKey = getConversationKey(data.sender, data.receiver);

      // dedupe by id
      if (data.id && processedMessageIds.current.has(data.id)) return;
      if (data.id) {
        processedMessageIds.current.add(data.id);
        // trim memory
        if (processedMessageIds.current.size > 1000) {
          const last = Array.from(processedMessageIds.current).slice(-500);
          processedMessageIds.current = new Set(last);
        }
      }

      // Sanitize payload
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

        // Replace optimistic
        if (data._optimisticId) {
          optimisticMessageMap.current.set(data._optimisticId, newMessage.id!);
          const withoutOptimistic = existing.filter((m) => m._optimisticId !== data._optimisticId);
          const dup = withoutOptimistic.some((m) => m.id && m.id === newMessage.id);
          if (dup) return prev;

          const updated = { ...prev, [conversationKey]: [...withoutOptimistic, newMessage] };
          storageService.setItem('panty_messages', updated).catch((e) => console.error('[MessageContext] save fail:', e));
          return updated;
        }

        // Check duplicate by id or by content+time (~2s)
        const isDup = existing.some((m) => {
          if (m.id && newMessage.id && m.id === newMessage.id) return true;
          if (m.sender === newMessage.sender && m.receiver === newMessage.receiver && m.content === newMessage.content) {
            const Δ = Math.abs(new Date(m.date).getTime() - new Date(newMessage.date).getTime());
            return Δ < 2000;
          }
          return false;
        });
        if (isDup) return prev;

        const updated = { ...prev, [conversationKey]: [...existing, newMessage] };
        storageService.setItem('panty_messages', updated).catch((e) => console.error('[MessageContext] save fail:', e));
        return updated;
      });

      setUpdateTrigger((n) => n + 1);

      // Notifications (sanitize preview)
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

    // message:read
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
        storageService.setItem('panty_messages', updated).catch((e) => console.error('[MessageContext] save fail:', e));
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

  // Persist on changes
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

  // ------------- Actions -------------

  // Send message (rate-limited + block checks + sanitization)
  const sendMessage = useCallback(
    async (sender: string, receiver: string, content: string, options?: MessageOptions) => {
      const cleanSender = sanitizeUsername(sender) || sender;
      const cleanReceiver = sanitizeUsername(receiver) || receiver;

      if (!cleanSender || !cleanReceiver) {
        console.error('Invalid sender or receiver');
        return;
      }

      // Block checks (both directions)
      const recvBlocked = blockedUsers[cleanReceiver]?.includes(cleanSender);
      const sndBlocked = blockedUsers[cleanSender]?.includes(cleanReceiver);
      if (recvBlocked || sndBlocked) {
        console.warn('[MessageContext] Message blocked due to user block settings');
        return;
      }

      // Rate limit per sender
      const rate = rateLimiter.check(`MESSAGE_SEND:${cleanSender}`, { maxAttempts: 20, windowMs: 30_000 });
      if (!rate.allowed) {
        console.warn(`[MessageContext] Rate limit exceeded. Try again in ${rate.waitTime}s`);
        return;
      }

      // Allow image-only messages
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

      // Sanitize meta
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
        const payload = {
          sender: cleanSender,
          receiver: cleanReceiver,
          content: sanitizedContent,
          type: options?.type,
          meta: sanitizedMeta,
          _optimisticId: options?._optimisticId,
        };
        const result = await messagesService.sendMessage(payload);

        if (result.success && result.data) {
          // Rely on WebSocket echo to add the message (prevents duplicates).
          // Update notification preview locally.
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
        const updated = { ...prev, [conversationKey]: updatedConv };
          storageService.setItem('panty_messages', updated).catch((e) => console.error('[MessageContext] save fail:', e));
          return updated;
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

        const result = await messagesService.reportUser({ reporter: cleanReporter, reportee: cleanReportee, messages: reportMessages });
        if (result.success) {
          setReportedUsers((prev) => {
            const list = prev[cleanReporter] || [];
            if (!list.includes(cleanReportee)) return { ...prev, [cleanReporter]: [...list, cleanReportee] };
            return prev;
          });

          const newReport: ReportLog = {
            id: uuidv4(),
            reporter: cleanReporter,
            reportee: cleanReportee,
            messages: reportMessages,
            date: new Date().toISOString(),
            processed: false,
            category: 'other',
          };
          setReportLogs((prev) => [...prev, newReport]);
        }
      } catch (error) {
        console.error('Error reporting user:', error);
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

  const refreshMessages = useCallback(() => {
    setUpdateTrigger((n) => n + 1);
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
  if (!context) throw new Error('useMessages must be used within a MessageProvider');
  return context;
};

// External (header) helper
export const getReportCount = async (): Promise<number> => {
  try {
    if (typeof window === 'undefined') return 0;
    const reports = await storageService.getItem<ReportLog[]>('panty_report_logs', []);
    if (!Array.isArray(reports)) return 0;
    return reports.filter((r) => r && typeof r === 'object' && !r.processed).length;
  } catch (e) {
    console.error('Error getting external report count:', e);
    return 0;
  }
};
