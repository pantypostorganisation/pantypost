// src/hooks/useSellerMessages.ts

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { storageService } from '@/services';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { securityService } from '@/services/security.service';
import { sanitizeStrict, sanitizeHtml, sanitizeCurrency } from '@/utils/security/sanitization';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { reportsService } from '@/services/reports.service';
import { messageSchemas, financialSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'next/navigation';

// Helper function
const getConversationKey = (userA: string, userB: string): string => {
  // Sanitize usernames before creating key
  const sanitizedA = sanitizeStrict(userA);
  const sanitizedB = sanitizeStrict(userB);
  return [sanitizedA, sanitizedB].sort().join('-');
};

// Define message schema for validation
const MessageSchema = z.object({
  sender: z.string().min(1).max(100),
  receiver: z.string().min(1).max(100),
  content: z.string().min(0).max(5000),
  date: z.string(),
  read: z.boolean().optional(),
  isRead: z.boolean().optional(),
  type: z.enum(['normal', 'customRequest', 'image', 'tip']).optional(),
  meta: z.object({
    id: z.string().optional(),
    title: z.string().max(200).optional(),
    price: z.number().min(0).max(10000).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    message: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    tipAmount: z.number().min(1).max(500).optional(),
  }).optional(),
}).passthrough(); // Allow additional fields like id

type Message = z.infer<typeof MessageSchema>;

// Optimistic message type - includes a temporary flag
interface OptimisticMessage extends Message {
  _optimistic?: boolean;
  _tempId?: string;
}

export function useSellerMessages() {
  const { user } = useAuth();
  const { addSellerNotification, users } = useListings();
  const { 
    messages, 
    sendMessage, 
    markMessagesAsRead, 
    blockUser, 
    unblockUser, 
    reportUser, 
    isBlocked, 
    hasReported,
    clearMessageNotifications,
    getMessagesForUsers,
    refreshMessages,
    isLoading: messagesLoading,
    isInitialized
  } = useMessages();
  const { requests, addRequest, getRequestsForUser, respondToRequest, markRequestAsPaid, getRequestById } = useRequests();
  const { getBuyerBalance, purchaseCustomRequest } = useWallet();
  const searchParams = useSearchParams();
  
  // Add state to track message updates
  const [messageUpdateCounter, setMessageUpdateCounter] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  
  // Track optimistic messages locally
  const [optimisticMessages, setOptimisticMessages] = useState<{ [threadId: string]: OptimisticMessage[] }>({});
  const optimisticMessageIds = useRef<Map<string, string>>(new Map()); // tempId -> realId mapping
  
  // Rate limiting
  const { checkLimit: checkMessageLimit } = useRateLimit('MESSAGE_SEND', {
    maxAttempts: 30,
    windowMs: 60 * 1000 // 1 minute
  });
  
  const { checkLimit: checkImageLimit } = useRateLimit('IMAGE_UPLOAD', {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  });
  
  const { checkLimit: checkRequestLimit } = useRateLimit('CUSTOM_REQUEST', {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000 // 1 hour
  });
  
  // State for UI
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [observerReadMessages, setObserverReadMessages] = useState<Set<string>>(new Set());
  
  // State for message input
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  
  // State for custom request editing
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const readThreadsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedEmojis = useRef(false);
  const lastActiveThread = useRef<string | null>(null);
  
  const isAdmin = user?.role === 'admin';
  
  // CRITICAL FIX: Force refresh messages on mount if needed
  useEffect(() => {
    const initializeMessages = async () => {
      if (user && !initialLoadAttempted) {
        setInitialLoadAttempted(true);
        console.log('[useSellerMessages] Initializing messages...');
        
        // Always refresh on mount to ensure we have the latest data
        if (!isInitialized || Object.keys(messages).length === 0) {
          console.log('[useSellerMessages] Refreshing messages...');
          await refreshMessages();
        }
        
        setMounted(true);
        console.log('[useSellerMessages] Initialization complete');
      }
    };

    initializeMessages();
  }, [user, isInitialized, messages, refreshMessages, initialLoadAttempted]);

  // Refresh messages when returning to the tab/app
  useEffect(() => {
    if (!mounted) {
      return;
    }

    let isRefreshing = false;
    let lastRefresh = 0;

    const refreshIfVisible = async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const now = Date.now();
      // Throttle refreshes to avoid rapid consecutive calls
      if (isRefreshing || now - lastRefresh < 1000) {
        return;
      }

      isRefreshing = true;
      try {
        await refreshMessages();
        setMessageUpdateCounter(prev => prev + 1);
      } finally {
        lastRefresh = Date.now();
        isRefreshing = false;
      }
    };

    const handleVisibilityChange = () => {
      void refreshIfVisible();
    };

    const handleFocus = () => {
      void refreshIfVisible();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [mounted, refreshMessages]);
  
  // CRITICAL: Listen for new messages and handle optimistic updates
  useEffect(() => {
    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newMessage = customEvent.detail;
      
      console.log('[useSellerMessages] New message event received:', newMessage);
      
      // Check if this is a confirmation of an optimistic message
      if (newMessage.sender === user?.username && newMessage.receiver === activeThread) {
        // This is our message coming back from the server
        const threadId = getConversationKey(newMessage.sender, newMessage.receiver);
        
        // Find matching optimistic message by content and approximate time
        setOptimisticMessages(prev => {
          const threadOptimistic = prev[threadId] || [];
          const matchingOptimistic = threadOptimistic.find(msg => 
            msg._optimistic && 
            msg.content === newMessage.content &&
            Math.abs(new Date(msg.date).getTime() - new Date(newMessage.date || newMessage.createdAt).getTime()) < 5000 // Within 5 seconds
          );
          
          if (matchingOptimistic && matchingOptimistic._tempId) {
            // Store the mapping
            optimisticMessageIds.current.set(matchingOptimistic._tempId, newMessage.id);
            
            // Remove the optimistic message (real one will be in main messages now)
            return {
              ...prev,
              [threadId]: threadOptimistic.filter(msg => msg._tempId !== matchingOptimistic._tempId)
            };
          }
          
          return prev;
        });
      }
      
      // Force a re-render to show the new message
      setMessageUpdateCounter(prev => prev + 1);
      
      // If the message is for the active thread, scroll to bottom
      if (activeThread && 
          (newMessage.sender === activeThread || newMessage.receiver === activeThread)) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    
    // Also listen for read events to update UI
    const handleMessageRead = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[useSellerMessages] Message read event received:', customEvent.detail);
      
      // Update optimistic messages' read status
      if (customEvent.detail.messageIds) {
        setOptimisticMessages(prev => {
          const updated = { ...prev };
          
          Object.keys(updated).forEach(threadId => {
            updated[threadId] = updated[threadId].map(msg => {
              // Check if this message's real ID is in the read list
              const realId = msg._tempId ? optimisticMessageIds.current.get(msg._tempId) : msg.id;
              if (realId && customEvent.detail.messageIds.includes(realId)) {
                return { ...msg, isRead: true, read: true };
              }
              return msg;
            });
          });
          
          return updated;
        });
      }
      
      // Force a re-render to update read receipts
      setMessageUpdateCounter(prev => prev + 1);
    };
    
    window.addEventListener('message:new', handleNewMessage);
    window.addEventListener('message:read', handleMessageRead);
    
    return () => {
      window.removeEventListener('message:new', handleNewMessage);
      window.removeEventListener('message:read', handleMessageRead);
    };
  }, [activeThread, user?.username]);
  
  // Clean up old optimistic messages periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setOptimisticMessages(prev => {
        const updated = { ...prev };
        const now = Date.now();
        
        Object.keys(updated).forEach(threadId => {
          // Remove optimistic messages older than 10 seconds (they should have been confirmed by now)
          updated[threadId] = updated[threadId].filter(msg => {
            if (msg._optimistic) {
              const messageTime = new Date(msg.date).getTime();
              return now - messageTime < 10000; // Keep if less than 10 seconds old
            }
            return true;
          });
        });
        
        return updated;
      });
      
      // Clean up ID mappings
      if (optimisticMessageIds.current.size > 100) {
        optimisticMessageIds.current.clear();
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Load recent emojis once on mount
  useEffect(() => {
    const loadRecentEmojis = async () => {
      if (!hasLoadedEmojis.current) {
        hasLoadedEmojis.current = true;
        try {
          const stored = await storageService.getItem<string[]>('panty_recent_emojis', []);
          if (Array.isArray(stored) && stored.every(item => typeof item === 'string')) {
            // Sanitize stored emojis
            const sanitized = stored.map(emoji => sanitizeStrict(emoji).slice(0, 10));
            setRecentEmojis(sanitized.slice(0, 30));
          }
        } catch (error) {
          console.error('Failed to load recent emojis:', error);
        }
      }
    };
    loadRecentEmojis();
  }, []);
  
  // Save recent emojis with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await storageService.setItem('panty_recent_emojis', recentEmojis.slice(0, 30));
      } catch (error) {
        console.error('Failed to save recent emojis:', error);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [recentEmojis]);
  
  // Handle URL thread parameter with validation
  useEffect(() => {
    const threadParam = searchParams.get('thread');
    if (threadParam && !activeThread && user && mounted) {
      // Sanitize and validate thread parameter
      const sanitizedThread = sanitizeStrict(threadParam);
      if (sanitizedThread && sanitizedThread.length <= 100) {
        console.log('[useSellerMessages] Setting active thread from URL:', sanitizedThread);
        setActiveThread(sanitizedThread);
      }
    }
  }, [searchParams, user, activeThread, mounted]);
  
  // ENHANCED: Merge real messages with optimistic messages - FIXED to not require initialization
  const { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount } = useMemo(() => {
    const threads: { [buyer: string]: Message[] } = {};
    const unreadCounts: { [buyer: string]: number } = {};
    const lastMessages: { [buyer: string]: Message } = {};
    const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (!user) {
      return { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
    }
    
    console.log('[SellerMessages] Processing messages for seller:', user.username);
    console.log('[SellerMessages] Total conversation keys:', Object.keys(messages).length);
    
    // Process all conversations to find ones involving the seller
    Object.entries(messages).forEach(([conversationKey, msgs]) => {
      if (!Array.isArray(msgs) || msgs.length === 0) return;
      
      // Check if this conversation involves the current seller
      const participants = conversationKey.split('-');
      const involvesCurrentSeller = participants.includes(user.username);
      
      if (!involvesCurrentSeller) return;
      
      // Determine the other party
      const otherParty = participants.find(p => p !== user.username);
      if (!otherParty) return;
      
      // Check if other party is a buyer (skip seller-to-seller conversations)
      const otherUser = users?.[otherParty];
      // If we don't know the role, assume they're a buyer (better to show than hide)
      const isOtherSeller = otherUser?.role === 'seller' || otherUser?.role === 'admin';
      if (isOtherSeller) {
        console.log('[SellerMessages] Skipping conversation with seller/admin:', otherParty);
        return;
      }
      
      console.log('[SellerMessages] Including conversation with buyer:', otherParty);
      
      // Validate messages
      const validMessages = msgs.filter(msg => {
        try {
          return msg && msg.sender && msg.receiver && msg.content !== undefined && msg.date;
        } catch (error) {
          console.warn('Invalid message skipped:', error);
          return false;
        }
      });
      
      if (validMessages.length === 0 && !optimisticMessages[conversationKey]) return;
      
      // Combine real messages with optimistic ones for this thread
      let combinedMessages = [...validMessages];
      
      // Add optimistic messages for this thread
      const threadOptimistic = optimisticMessages[conversationKey] || [];
      if (threadOptimistic.length > 0) {
        combinedMessages = [...combinedMessages, ...threadOptimistic];
      }
      
      // Sort messages by date
      combinedMessages.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Add to threads
      threads[otherParty] = combinedMessages;
      
      // Get last message
      if (combinedMessages.length > 0) {
        lastMessages[otherParty] = combinedMessages[combinedMessages.length - 1];
      }
      
      // Count unread messages (only real messages, not optimistic)
      const threadUnreadCount = validMessages.filter(
        (msg) => msg.receiver === user.username && msg.sender === otherParty && !msg.read && !msg.isRead
      ).length;
      
      unreadCounts[otherParty] = threadUnreadCount;
      
      // Add to total if not already marked as read
      if (!readThreadsRef.current.has(otherParty) && threadUnreadCount > 0) {
        totalUnreadCount += threadUnreadCount;
      }
      
      // Get buyer profile
      const buyerInfo = users?.[otherParty];
      const isVerified = buyerInfo?.verified || buyerInfo?.verificationStatus === 'verified';
      
      buyerProfiles[otherParty] = { 
        pic: null,
        verified: isVerified || false
      };
    });
    
    console.log('[SellerMessages] Final thread count:', Object.keys(threads).length);
    
    return { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
  }, [user?.username, messages, users, optimisticMessages, messageUpdateCounter]);
  
  // Get seller's requests with validation
  const sellerRequests = useMemo(() => {
    if (!user) return [];
    
    const rawRequests = getRequestsForUser(user.username, 'seller');
    
    // Validate requests
    return rawRequests.filter(request => {
      try {
        // Basic validation
        return request.id && 
               request.buyer && 
               request.seller === user.username &&
               typeof request.price === 'number' &&
               request.price > 0 &&
               request.price <= 10000;
      } catch {
        return false;
      }
    });
  }, [user?.username, getRequestsForUser, messageUpdateCounter]);
  
  // Compute UI unread counts
  const uiUnreadCounts = useMemo(() => {
    const counts: { [buyer: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(buyer => {
        counts[buyer] = readThreadsRef.current.has(buyer) ? 0 : unreadCounts[buyer];
      });
    }
    return counts;
  }, [threads, unreadCounts, messageUpdateCounter]);
  
  // Mark messages as read when thread is selected AND clear notifications
  useEffect(() => {
    if (!activeThread || !user || activeThread === lastActiveThread.current) {
      return;
    }
    
    // Update the last active thread
    lastActiveThread.current = activeThread;
    
    // Clear message notifications for this buyer
    clearMessageNotifications(user.username, activeThread);
    
    // Check if there are unread messages
    const threadMessages = threads[activeThread] || [];
    
    const hasUnread = threadMessages.some(
      msg => msg.receiver === user.username && msg.sender === activeThread && !msg.read && !msg.isRead && !msg._optimistic
    );
    
    if (hasUnread) {
      // Use a small delay to prevent render loops
      const timer = setTimeout(() => {
        markMessagesAsRead(user.username, activeThread);
        
        // Update read threads ref
        if (!readThreadsRef.current.has(activeThread)) {
          readThreadsRef.current.add(activeThread);
        }
        
        // Force update
        setMessageUpdateCounter(prev => prev + 1);
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    return;
  }, [activeThread, user?.username, markMessagesAsRead, threads, clearMessageNotifications]);
  
  // Handle message visibility for marking as read
  const handleMessageVisible = useCallback((msg: any) => {
    if (!user || msg.sender === user.username || msg.read || msg.isRead || msg._optimistic) return;
    
    const messageId = `${msg.sender}-${msg.receiver}-${msg.date}`;
    
    if (observerReadMessages.has(messageId)) return;
    
    // Use requestAnimationFrame to batch updates
    requestAnimationFrame(() => {
      markMessagesAsRead(user.username, msg.sender);
      
      setObserverReadMessages(prev => {
        const newSet = new Set(prev);
        newSet.add(messageId);
        return newSet;
      });
      
      // Update read threads if all messages are read
      const threadMessages = threads[msg.sender] || [];
      
      const remainingUnread = threadMessages.filter(
        m => !m.read && !m.isRead && !m._optimistic && m.sender === msg.sender && m.receiver === user.username && 
        `${m.sender}-${m.receiver}-${m.date}` !== messageId
      ).length;
      
      if (remainingUnread === 0 && !readThreadsRef.current.has(msg.sender)) {
        readThreadsRef.current.add(msg.sender);
      }
      
      // Force update
      setMessageUpdateCounter(prev => prev + 1);
    });
  }, [user, markMessagesAsRead, threads]);
  
  // OPTIMISTIC: Handle sending reply with instant UI update
  const handleReply = useCallback(async () => {
    if (!activeThread || !user || (!replyMessage.trim() && !selectedImage)) return;

    // Check rate limit
    const rateLimitResult = checkMessageLimit();
    if (!rateLimitResult.allowed) {
      setValidationErrors({ message: `Too many messages. Wait ${rateLimitResult.waitTime} seconds.` });
      return;
    }

    try {
      // Validate and sanitize message content
      const validationResult = messageSchemas.messageContent.safeParse(replyMessage);
      
      if (!validationResult.success && replyMessage.trim()) {
        setValidationErrors({ message: validationResult.error.errors[0].message });
        return;
      }

      const sanitizedContent = replyMessage ? sanitizeHtml(validationResult.data || replyMessage) : '';

      // For image messages, validate URL
      if (selectedImage) {
        const urlValidation = z.string().url().safeParse(selectedImage);
        if (!urlValidation.success) {
          setValidationErrors({ image: 'Invalid image URL' });
          return;
        }
      }

      console.log('[SellerMessages] Sending message:', {
        text: sanitizedContent,
        imageUrl: selectedImage,
        receiver: activeThread
      });

      // For image messages, allow empty text
      const messageContent = sanitizedContent || (selectedImage ? 'Image shared' : '');

      // Create optimistic message
      const tempId = uuidv4();
      const threadId = getConversationKey(user.username, activeThread);
      const optimisticMsg: OptimisticMessage = {
        id: tempId,
        _tempId: tempId,
        _optimistic: true,
        sender: user.username,
        receiver: activeThread,
        content: messageContent,
        date: new Date().toISOString(),
        isRead: false,
        read: false,
        type: selectedImage ? 'image' : 'normal',
        meta: selectedImage ? { imageUrl: selectedImage } : undefined,
      };
      
      // Add optimistic message to UI immediately
      setOptimisticMessages(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), optimisticMsg]
      }));
      
      // Clear input immediately for better UX
      setReplyMessage('');
      setSelectedImage(null);
      setImageError(null);
      setShowEmojiPicker(false);
      setValidationErrors({});
      
      // Scroll to bottom immediately
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
      
      // Send the actual message in the background
      sendMessage(user.username, activeThread, messageContent, {
        type: selectedImage ? 'image' : 'normal',
        meta: selectedImage ? { imageUrl: selectedImage } : undefined,
      }).catch(error => {
        console.error('Failed to send message:', error);
        
        // Remove optimistic message on error
        setOptimisticMessages(prev => ({
          ...prev,
          [threadId]: prev[threadId]?.filter(msg => msg._tempId !== tempId) || []
        }));
        
        // Restore input on error
        setReplyMessage(messageContent);
        setSelectedImage(selectedImage);
        setValidationErrors({ message: 'Failed to send message. Please try again.' });
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      setValidationErrors({ message: 'Failed to send message' });
    }
  }, [activeThread, user, replyMessage, selectedImage, sendMessage, checkMessageLimit]);
  
  // Handle block toggle
  const handleBlockToggle = useCallback(() => {
    if (!activeThread || !user) return;
    
    if (isBlocked(user.username, activeThread)) {
      unblockUser(user.username, activeThread);
    } else {
      blockUser(user.username, activeThread);
    }
    
    // Force update
    setMessageUpdateCounter(prev => prev + 1);
  }, [activeThread, user, isBlocked, unblockUser, blockUser]);
  
  // Handle report
  const handleReport = useCallback(async () => {
    if (!activeThread || !user) return;
    
    if (!hasReported(user.username, activeThread)) {
      // Use the reports service to send to MongoDB
      const reportData = {
       reportedUser: activeThread,
       reportType: 'harassment' as const,
       description: `Buyer reported from messages by seller ${user.username}`,
       severity: 'medium' as const,
       relatedMessageId: threads[activeThread]?.[threads[activeThread].length - 1]?.id as string | undefined
     };
      
      try {
        const response = await reportsService.submitReport(reportData);
        if (response.success) {
          // Also update local state for UI
          reportUser(user.username, activeThread);
        }
      } catch (error) {
        console.error('Failed to submit report:', error);
        // Fallback to local report
        reportUser(user.username, activeThread);
      }
    }
    
    // Force update
    setMessageUpdateCounter(prev => prev + 1);
  }, [activeThread, user, hasReported, reportUser, threads]);
  
  // Handle accepting custom request with validation
  const handleAccept = useCallback(async (customRequestId: string) => {
    if (!user) return;
    
    // Validate request ID
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customRequestId) ||
                       /^req_\d+_[a-z0-9]+$/i.test(customRequestId);
    
    if (!isValidUuid) {
      console.error('Invalid request ID format');
      return;
    }
    
    const request = requests.find(r => r.id === customRequestId);
    if (!request) return;
    
    // Validate request data
    if (!request.price || request.price <= 0 || request.price > 10000) {
      console.error('Invalid request price');
      return;
    }
    
    // Check rate limit
    const rateLimitResult = checkRequestLimit();
    if (!rateLimitResult.allowed) {
      addSellerNotification(user.username, `⚠️ Too many requests. Wait ${rateLimitResult.waitTime} seconds.`);
      return;
    }
    
    // Check if buyer has sufficient balance
    const markupPrice = request.price * 1.1;
    const buyerBalance = getBuyerBalance(request.buyer);
    
    if (buyerBalance >= markupPrice) {
      // Auto-process payment
      const customRequest = {
        requestId: request.id,
        buyer: request.buyer,
        seller: user.username,
        amount: request.price,
        description: sanitizeStrict(request.title),
        metadata: request
      };
      
      const success = await purchaseCustomRequest(customRequest);
      
      if (success) {
        // Mark as paid
        markRequestAsPaid(request.id);
        
        // Notify seller (self)
        addSellerNotification(user.username, `💰 Custom request "${sanitizeStrict(request.title)}" has been paid! Check your orders to fulfill.`);
        
        // Send confirmation message to buyer
        await sendMessage(user.username, request.buyer, `✅ Your custom request "${sanitizeStrict(request.title)}" has been accepted and automatically paid!`, {
          type: 'normal'
        });
      } else {
        // Payment failed
        await sendMessage(user.username, request.buyer, `⚠️ Custom request "${sanitizeStrict(request.title)}" accepted but payment failed. Please try paying manually.`, {
          type: 'normal'
        });
        respondToRequest(customRequestId, 'accepted', undefined, undefined, user.username);
      }
    } else {
      // Insufficient balance - just accept without payment
      respondToRequest(customRequestId, 'accepted', undefined, undefined, user.username);
      
      await sendMessage(user.username, request.buyer, `✅ Your custom request "${sanitizeStrict(request.title)}" has been accepted! Payment required - you have insufficient balance (need $${markupPrice.toFixed(2)}).`, {
        type: 'normal'
      });
    }
    
    // Force update
    setMessageUpdateCounter(prev => prev + 1);
  }, [user, requests, getBuyerBalance, purchaseCustomRequest, markRequestAsPaid, addSellerNotification, sendMessage, respondToRequest, checkRequestLimit]);
  
  // Handle declining custom request
  const handleDecline = useCallback((customRequestId: string) => {
    if (!user) return;
    
    // Validate request ID
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customRequestId) ||
                       /^req_\d+_[a-z0-9]+$/i.test(customRequestId);
    
    if (!isValidUuid) {
      console.error('Invalid request ID format');
      return;
    }
    
    respondToRequest(customRequestId, 'rejected', undefined, undefined, user.username);
    
    const request = requests.find(r => r.id === customRequestId);
    if (request) {
      sendMessage(user.username, request.buyer, `Your custom request "${sanitizeStrict(request.title)}" has been declined.`, {
        type: 'normal'
      });
    }
    
    // Force update
    setMessageUpdateCounter(prev => prev + 1);
  }, [user, respondToRequest, requests, sendMessage]);
  
  // Handle custom request editing with validation
  const handleEditRequest = useCallback((requestId: string, title: string, price: number, message: string) => {
    // Validate inputs
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId) ||
                       /^req_\d+_[a-z0-9]+$/i.test(requestId);
    
    if (!isValidUuid) {
      console.error('Invalid request ID format');
      return;
    }
    
    setEditRequestId(requestId);
    setEditTitle(sanitizeStrict(title).slice(0, 200));
    setEditPrice(sanitizeCurrency(price));
    setEditMessage(sanitizeHtml(message).slice(0, 1000));
  }, []);
  
  // Handle submitting edited request with validation
  const handleEditSubmit = useCallback(() => {
    if (!editRequestId || !user || editTitle.trim() === '' || editPrice === '' || editPrice <= 0) return;
    
    // Validate all inputs
    try {
      const validatedData = messageSchemas.customRequest.parse({
        title: editTitle,
        description: editMessage,
        price: Number(editPrice)
      });
      
      const request = requests.find(r => r.id === editRequestId);
      if (!request) return;
      
      // Check rate limit
      const rateLimitResult = checkRequestLimit();
      if (!rateLimitResult.allowed) {
        setValidationErrors({ edit: `Too many edits. Wait ${rateLimitResult.waitTime} seconds.` });
        return;
      }
      
      // Update the request with seller as editor
      respondToRequest(
        editRequestId, 
        'edited',
        validatedData.description,
        {
          title: validatedData.title,
          price: validatedData.price,
          description: validatedData.description
        },
        user.username
      );
      
      // Send message about the edit
      sendMessage(
        user.username,
        request.buyer,
        `📝 I've modified your custom request "${validatedData.title}"`,
        {
          type: 'customRequest',
          meta: {
            id: editRequestId,
            title: validatedData.title,
            price: validatedData.price,
            message: validatedData.description,
          }
        }
      );
      
      // Reset edit state
      setEditRequestId(null);
      setEditTitle('');
      setEditPrice('');
      setEditMessage('');
      setValidationErrors({});
      
      // Force update
      setMessageUpdateCounter(prev => prev + 1);
      
      addSellerNotification(user.username, `Custom request modified and sent to buyer!`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors({ edit: error.errors[0].message });
      } else {
        setValidationErrors({ edit: 'Failed to update request' });
      }
    }
  }, [editRequestId, editTitle, editPrice, editMessage, user, requests, respondToRequest, sendMessage, addSellerNotification, checkRequestLimit]);
  
  // Handle emoji click with sanitization
  const handleEmojiClick = useCallback((emoji: string) => {
    // Sanitize emoji
    const sanitizedEmoji = sanitizeStrict(emoji).slice(0, 10);
    
    setReplyMessage(prev => prev + sanitizedEmoji);
    
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== sanitizedEmoji);
      return [sanitizedEmoji, ...filtered].slice(0, 30);
    });
    
    setShowEmojiPicker(false);
  }, []);
  
  // Handle image selection with enhanced validation
  const handleImageSelect = useCallback(async (file: File) => {
    if (!file) return;
    
    // Check rate limit
    const rateLimitResult = checkImageLimit();
    if (!rateLimitResult.allowed) {
      setImageError(`Too many uploads. Wait ${rateLimitResult.waitTime} seconds.`);
      return;
    }
    
    setIsImageLoading(true);
    setImageError(null);
    
    try {
      // Validate file with security service
      const validation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }
      
      // Upload to Cloudinary
      console.log('Uploading image to Cloudinary...');
      const uploadResult = await uploadToCloudinary(file);
      
      // Validate returned URL
      const urlValidation = z.string().url().safeParse(uploadResult.url);
      if (!urlValidation.success) {
        throw new Error('Invalid upload URL received');
      }
      
      // Set the Cloudinary URL
      setSelectedImage(uploadResult.url);
      console.log('Image uploaded successfully:', uploadResult.url);
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setImageError(errorMessage);
      setSelectedImage(null);
    } finally {
      setIsImageLoading(false);
    }
  }, [checkImageLimit]);
  
  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));
  
  return {
    // Auth
    user,
    isAdmin,
    
    // Messages & threads
    threads,
    unreadCounts,
    uiUnreadCounts,
    lastMessages,
    buyerProfiles,
    totalUnreadCount,
    activeThread,
    setActiveThread,
    
    // UI State
    previewImage,
    setPreviewImage,
    searchQuery,
    setSearchQuery: (query: string) => setSearchQuery(sanitizeStrict(query).slice(0, 100)),
    filterBy,
    setFilterBy,
    observerReadMessages,
    setObserverReadMessages,
    messagesEndRef,
    
    // Message input
    replyMessage,
    setReplyMessage: (msg: string) => setReplyMessage(msg.slice(0, 5000)),
    selectedImage,
    setSelectedImage,
    isImageLoading,
    setIsImageLoading,
    imageError,
    setImageError,
    showEmojiPicker,
    setShowEmojiPicker,
    recentEmojis,
    
    // Custom requests
    sellerRequests,
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice: (price: number | '') => setEditPrice(price === '' ? '' : sanitizeCurrency(price)),
    editTitle,
    setEditTitle: (title: string) => setEditTitle(sanitizeStrict(title).slice(0, 200)),
    editMessage,
    setEditMessage: (msg: string) => setEditMessage(sanitizeHtml(msg).slice(0, 1000)),
    
    // Validation
    validationErrors,
    
    // Actions
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,
    
    // Status
    isUserBlocked,
    isUserReported,
  };
}
