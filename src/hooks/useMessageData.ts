// src/hooks/useMessageData.ts
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { storageService } from '@/services';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { messageSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';

// Secure message type with validation
const MessageSchema = z.object({
  sender: z.string().min(1).max(30),
  receiver: z.string().min(1).max(30),
  content: z.string().min(1).max(1000),
  date: z.string(),
  read: z.boolean().optional(),
  type: z.enum(['normal', 'customRequest', 'image']).optional(),
  meta: z.object({
    id: z.string().optional(),
    title: z.string().max(100).optional(),
    price: z.number().positive().optional(),
    tags: z.array(z.string().max(30)).optional(),
    message: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
  }).optional(),
});

type Message = z.infer<typeof MessageSchema>;

// Validate and sanitize message
function sanitizeMessage(message: any): Message | null {
  try {
    // Parse with schema
    const parsed = MessageSchema.parse(message);
    
    // Additional sanitization
    return {
      ...parsed,
      sender: sanitizeUsername(parsed.sender),
      receiver: sanitizeUsername(parsed.receiver),
      content: sanitizeStrict(parsed.content),
      meta: parsed.meta ? {
        ...parsed.meta,
        title: parsed.meta.title ? sanitizeStrict(parsed.meta.title) : undefined,
        message: parsed.meta.message ? sanitizeStrict(parsed.meta.message) : undefined,
        tags: parsed.meta.tags?.map(tag => sanitizeStrict(tag))
      } : undefined
    };
  } catch (error) {
    console.error('Invalid message format:', error);
    return null;
  }
}

// Validate storage key
function validateStorageKey(username: string): string {
  const sanitized = sanitizeUsername(username);
  if (!sanitized || sanitized.length > 30) {
    throw new Error('Invalid username for storage key');
  }
  return `panty_read_threads_${sanitized}`;
}

export function useMessageData() {
  const { user } = useAuth();
  const { users } = useListings();
  const { 
    messages,
    markMessagesAsRead,
    sendMessage,
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
    hasReported,
    getThreadsForUser,
    getAllThreadsInfo
  } = useMessages();
  const { getRequestsForUser, respondToRequest } = useRequests();
  
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [observerReadMessages, setObserverReadMessages] = useState<Set<string>>(new Set());
  const [messageUpdate, setMessageUpdate] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  
  const readThreadsRef = useRef<Set<string>>(new Set());

  // Sanitized active thread setter
  const handleSetActiveThread = useCallback((thread: string | null) => {
    if (thread) {
      const sanitized = sanitizeUsername(thread);
      setActiveThread(sanitized);
    } else {
      setActiveThread(null);
    }
  }, []);

  // Reset the readThreadsRef when logging in/out
  useEffect(() => {
    readThreadsRef.current = new Set();
    setMessageUpdate(prev => prev + 1);
  }, [user?.username]);

  // Load previously read threads from localStorage with validation
  useEffect(() => {
    const loadReadThreads = async () => {
      try {
        if (user) {
          const readThreadsKey = validateStorageKey(user.username);
          const readThreads = await storageService.getItem<string[]>(readThreadsKey, []);
          
          if (Array.isArray(readThreads)) {
            // Sanitize loaded thread IDs
            const sanitizedThreads = readThreads
              .map(thread => sanitizeUsername(thread))
              .filter(thread => thread && thread.length <= 30);
              
            readThreadsRef.current = new Set(sanitizedThreads);
            setMessageUpdate(prev => prev + 1);
          }
        }
      } catch (e) {
        console.error('Failed to load read threads', e);
        setErrors(prev => [...prev, 'Failed to load read status']);
      }
    };
    
    loadReadThreads();
  }, [user]);

  // Save read threads to localStorage with validation
  useEffect(() => {
    const saveReadThreads = async () => {
      if (user && readThreadsRef.current.size > 0 && typeof window !== 'undefined') {
        try {
          const readThreadsKey = validateStorageKey(user.username);
          const threadsArray = Array.from(readThreadsRef.current)
            .map(thread => sanitizeUsername(thread))
            .filter(thread => thread && thread.length <= 30);
            
          await storageService.setItem(readThreadsKey, threadsArray);
          
          const event = new CustomEvent('readThreadsUpdated', { 
            detail: { 
              threads: threadsArray, 
              username: sanitizeUsername(user.username) 
            }
          });
          window.dispatchEvent(event);
        } catch (e) {
          console.error('Failed to save read threads', e);
        }
      }
    };
    
    saveReadThreads();
  }, [messageUpdate, user]);

  // UPDATED: Use new helper functions from MessageContext with sanitization
  const { 
    threads, 
    unreadCounts, 
    lastMessages, 
    buyerProfiles, 
    totalUnreadCount 
  } = useMemo(() => {
    if (!user) return { 
      threads: {}, 
      unreadCounts: {}, 
      lastMessages: {}, 
      buyerProfiles: {}, 
      totalUnreadCount: 0 
    };
    
    try {
      // Use the new helper functions (determine role based on context where this hook is used)
      const rawThreads = getThreadsForUser(user.username);
      const threadInfos = getAllThreadsInfo(user.username);
      
      // Sanitize threads
      const threads: { [key: string]: Message[] } = {};
      Object.entries(rawThreads).forEach(([buyer, msgs]) => {
        const sanitizedBuyer = sanitizeUsername(buyer);
        if (sanitizedBuyer) {
          threads[sanitizedBuyer] = msgs
            .map(msg => sanitizeMessage(msg))
            .filter((msg): msg is Message => msg !== null);
        }
      });
      
      const unreadCounts: { [buyer: string]: number } = {};
      const lastMessages: { [buyer: string]: Message } = {};
      const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};
      let totalUnreadCount = 0;
      
      Object.entries(threadInfos).forEach(([buyer, info]) => {
        const sanitizedBuyer = sanitizeUsername(buyer);
        if (!sanitizedBuyer) return;
        
        unreadCounts[sanitizedBuyer] = Math.max(0, info.unreadCount);
        
        // Sanitize last message
        const sanitizedLastMessage = sanitizeMessage(info.lastMessage);
        if (sanitizedLastMessage) {
          lastMessages[sanitizedBuyer] = sanitizedLastMessage;
        }
        
        // Get buyer profile picture and verification status
        const buyerInfo = users?.[buyer];
        const isVerified = Boolean(buyerInfo?.verified || buyerInfo?.verificationStatus === 'verified');
        
        buyerProfiles[sanitizedBuyer] = { 
          pic: null, // Profile pics should be loaded through proper channels
          verified: isVerified
        };
        
        // Only add to total if not in readThreadsRef
        if (!readThreadsRef.current.has(sanitizedBuyer) && info.unreadCount > 0) {
          totalUnreadCount += info.unreadCount;
        }
      });
      
      return { 
        threads, 
        unreadCounts, 
        lastMessages, 
        buyerProfiles, 
        totalUnreadCount: Math.max(0, totalUnreadCount)
      };
    } catch (error) {
      console.error('Error processing message data:', error);
      setErrors(prev => [...prev, 'Failed to process messages']);
      
      return { 
        threads: {}, 
        unreadCounts: {}, 
        lastMessages: {}, 
        buyerProfiles: {}, 
        totalUnreadCount: 0 
      };
    }
  }, [user, messages, users, messageUpdate, getThreadsForUser, getAllThreadsInfo]);

  // Memoize sellerRequests with sanitization
  const sellerRequests = useMemo(() => {
    if (!user) return [];
    
    try {
      const requests = getRequestsForUser(user.username, 'seller');
      // Sanitize request data
      return requests.map(request => ({
        ...request,
        title: sanitizeStrict(request.title || ''),
        buyer: sanitizeUsername(request.buyer || ''),
        seller: sanitizeUsername(request.seller || ''),
        price: Math.max(0, request.price || 0)
      }));
    } catch (error) {
      console.error('Error loading seller requests:', error);
      return [];
    }
  }, [user, getRequestsForUser]);

  // Calculate UI unread counts
  const uiUnreadCounts = useMemo(() => {
    const counts: { [buyer: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(buyer => {
        const sanitizedBuyer = sanitizeUsername(buyer);
        if (sanitizedBuyer) {
          counts[sanitizedBuyer] = readThreadsRef.current.has(sanitizedBuyer) ? 0 : (unreadCounts[sanitizedBuyer] || 0);
        }
      });
    }
    return counts;
  }, [threads, unreadCounts, messageUpdate]);

  // Handle message visibility from Intersection Observer
  const handleMessageVisible = useCallback((msg: any) => {
    if (!user) return;
    
    // Sanitize message first
    const sanitizedMsg = sanitizeMessage(msg);
    if (!sanitizedMsg || sanitizedMsg.sender === user.username || sanitizedMsg.read) return;
    
    const messageId = `${sanitizedMsg.sender}-${sanitizedMsg.receiver}-${sanitizedMsg.date}`;
    
    if (observerReadMessages.has(messageId)) return;
    
    markMessagesAsRead(user.username, sanitizedMsg.sender);
    
    setObserverReadMessages(prev => new Set(prev).add(messageId));
    
    const threadUnreadCount = threads[sanitizedMsg.sender]?.filter(
      m => !m.read && m.sender === sanitizedMsg.sender && m.receiver === user.username
    ).length || 0;
    
    if (threadUnreadCount === 0 && !readThreadsRef.current.has(sanitizedMsg.sender)) {
      readThreadsRef.current.add(sanitizedMsg.sender);
      setMessageUpdate(prev => prev + 1);
    }
  }, [user, markMessagesAsRead, threads, observerReadMessages]);

  // Handle send message with validation
  const handleSendMessage = useCallback((content: string, type: 'normal' | 'image' = 'normal', imageUrl?: string) => {
    if (!user || !activeThread) return;
    
    // Validate message content
    const validation = messageSchemas.messageContent.safeParse(content);
    if (!validation.success) {
      console.error('Invalid message content:', validation.error);
      return;
    }
    
    // Validate image URL if provided
    if (imageUrl && type === 'image') {
      try {
        new URL(imageUrl);
      } catch {
        console.error('Invalid image URL');
        return;
      }
    }
    
    sendMessage(
      user.username, 
      activeThread, 
      validation.data,
      {
        type,
        meta: imageUrl ? { imageUrl } : undefined
      }
    );
  }, [user, activeThread, sendMessage]);

  const handleBlockToggle = useCallback(() => {
    if (!user || !activeThread) return;
    if (isBlocked(user.username, activeThread)) {
      unblockUser(user.username, activeThread);
    } else {
      blockUser(user.username, activeThread);
    }
  }, [user, activeThread, isBlocked, unblockUser, blockUser]);

  const handleReport = useCallback(() => {
    if (user && activeThread && !hasReported(user.username, activeThread)) {
      reportUser(user.username, activeThread);
    }
  }, [user, activeThread, hasReported, reportUser]);

  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));

  return {
    user,
    threads,
    unreadCounts,
    lastMessages,
    buyerProfiles,
    totalUnreadCount,
    sellerRequests,
    uiUnreadCounts,
    activeThread,
    setActiveThread: handleSetActiveThread,
    isUserBlocked,
    isUserReported,
    observerReadMessages,
    setObserverReadMessages,
    readThreadsRef,
    messageUpdate,
    setMessageUpdate,
    handleMessageVisible,
    handleSendMessage,
    handleBlockToggle,
    handleReport,
    respondToRequest,
    errors
  };
}
