// src/hooks/useMessageData.ts
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';

type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  type?: 'normal' | 'customRequest' | 'image';
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
  };
};

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
    hasReported
  } = useMessages();
  const { getRequestsForUser, respondToRequest } = useRequests();
  
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [observerReadMessages, setObserverReadMessages] = useState<Set<string>>(new Set());
  const [messageUpdate, setMessageUpdate] = useState(0);
  
  const readThreadsRef = useRef<Set<string>>(new Set());

  // Debug logging
  useEffect(() => {
    console.log('MessageContext messages:', messages);
    console.log('Current user:', user);
    console.log('Active thread:', activeThread);
  }, [messages, user, activeThread]);

  // Reset the readThreadsRef when logging in/out
  useEffect(() => {
    readThreadsRef.current = new Set();
    setMessageUpdate(prev => prev + 1);
  }, [user?.username]);

  // Load previously read threads from localStorage
  useEffect(() => {
    try {
      if (user) {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        const readThreads = localStorage.getItem(readThreadsKey);
        if (readThreads) {
          const threads = JSON.parse(readThreads);
          if (Array.isArray(threads)) {
            readThreadsRef.current = new Set(threads);
            setMessageUpdate(prev => prev + 1);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load read threads', e);
    }
  }, [user]);

  // Save read threads to localStorage
  useEffect(() => {
    if (user && readThreadsRef.current.size > 0 && typeof window !== 'undefined') {
      const readThreadsKey = `panty_read_threads_${user.username}`;
      const threadsArray = Array.from(readThreadsRef.current);
      localStorage.setItem(readThreadsKey, JSON.stringify(threadsArray));
      
      const event = new CustomEvent('readThreadsUpdated', { 
        detail: { threads: threadsArray, username: user.username }
      });
      window.dispatchEvent(event);
    }
  }, [messageUpdate, user]);

  // Memoize messages data
  const { 
    threads, 
    unreadCounts, 
    lastMessages, 
    buyerProfiles, 
    totalUnreadCount 
  } = useMemo(() => {
    const threads: { [buyer: string]: Message[] } = {};
    const unreadCounts: { [buyer: string]: number } = {};
    const lastMessages: { [buyer: string]: Message } = {};
    const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (user) {
      // Get all messages - handle the MessageContext structure
      let allMessages: Message[] = [];
      
      if (messages && typeof messages === 'object') {
        // The MessageContext stores messages by receiver username
        // We need to get messages from ALL keys where we're involved
        Object.entries(messages).forEach(([username, userMessages]) => {
          if (Array.isArray(userMessages)) {
            // Get messages where we're either sender or receiver
            const relevantMessages = userMessages.filter((msg: Message) => 
              msg.sender === user.username || msg.receiver === user.username
            );
            allMessages = [...allMessages, ...relevantMessages];
          }
        });
        
        // Remove duplicates based on unique message properties
        const uniqueMessages = new Map();
        allMessages.forEach(msg => {
          const key = `${msg.sender}-${msg.receiver}-${msg.date}-${msg.content}`;
          uniqueMessages.set(key, msg);
        });
        allMessages = Array.from(uniqueMessages.values());
      }
      
      console.log('MessageContext structure:', messages);
      console.log('All messages found:', allMessages);
      console.log('Current user:', user.username);
      
      // Filter messages for this seller
      const sellerMessages = allMessages.filter(
        (msg: Message) =>
          msg.sender === user.username || msg.receiver === user.username
      );
      
      console.log('Filtered seller messages:', sellerMessages);
        
      sellerMessages.forEach((msg) => {
        const otherParty =
          msg.sender === user.username ? msg.receiver : msg.sender;
        if (!threads[otherParty]) threads[otherParty] = [];
        threads[otherParty].push(msg);
      });
      
      Object.values(threads).forEach((thread) =>
        thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
      
      Object.entries(threads).forEach(([buyer, msgs]) => {
        lastMessages[buyer] = msgs[msgs.length - 1];
        
        const storedPic = sessionStorage.getItem(`profile_pic_${buyer}`);
        const buyerInfo = users?.[buyer];
        const isVerified = buyerInfo?.verified || buyerInfo?.verificationStatus === 'verified';
        
        buyerProfiles[buyer] = { 
          pic: storedPic, 
          verified: isVerified
        };
        
        const threadUnreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === buyer && msg.receiver === user?.username
        ).length;
        
        unreadCounts[buyer] = threadUnreadCount;
        
        if (!readThreadsRef.current.has(buyer) && threadUnreadCount > 0) {
          totalUnreadCount += threadUnreadCount;
        }
      });
    }
    
    console.log('Processed threads:', threads);
    
    return { 
      threads, 
      unreadCounts, 
      lastMessages, 
      buyerProfiles, 
      totalUnreadCount 
    };
  }, [user, messages, users, messageUpdate]);

  // Memoize sellerRequests
  const sellerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'seller') : [];
  }, [user, getRequestsForUser]);

  // Calculate UI unread counts
  const uiUnreadCounts = useMemo(() => {
    const counts: { [buyer: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(buyer => {
        counts[buyer] = readThreadsRef.current.has(buyer) ? 0 : unreadCounts[buyer];
      });
    }
    return counts;
  }, [threads, unreadCounts, messageUpdate]);

  // Handle message visibility from Intersection Observer
  const handleMessageVisible = useCallback((msg: Message) => {
    if (!user || msg.sender === user.username || msg.read) return;
    
    const messageId = `${msg.sender}-${msg.receiver}-${msg.date}`;
    
    if (observerReadMessages.has(messageId)) return;
    
    markMessagesAsRead(user.username, msg.sender);
    
    setObserverReadMessages(prev => new Set(prev).add(messageId));
    
    const threadUnreadCount = threads[msg.sender]?.filter(
      m => !m.read && m.sender === msg.sender && m.receiver === user.username
    ).length || 0;
    
    if (threadUnreadCount === 0 && !readThreadsRef.current.has(msg.sender)) {
      readThreadsRef.current.add(msg.sender);
      setMessageUpdate(prev => prev + 1);
    }
  }, [user, markMessagesAsRead, threads, observerReadMessages]);

  const handleSendMessage = useCallback((content: string, type: 'normal' | 'image' = 'normal', imageUrl?: string) => {
    if (!user || !activeThread) return;
    
    console.log('handleSendMessage called with:', {
      sender: user.username,
      receiver: activeThread,
      content,
      type
    });
    
    sendMessage(user.username, activeThread, content, {
      type,
      meta: imageUrl ? { imageUrl } : undefined
    });
    
    // Force immediate update
    setMessageUpdate(prev => prev + 1);
  }, [user, activeThread, sendMessage, setMessageUpdate]);

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
    setActiveThread,
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
    respondToRequest
  };
}
