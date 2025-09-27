// src/hooks/useBuyerMessages.ts
// Declare global to prevent TypeScript errors
declare global {
  interface Window {
    _processingPayment?: boolean;
  }
}

import { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { WalletContext } from '@/context/WalletContext';
import { useRequests } from '@/context/RequestContext';
import { useListings } from '@/context/ListingContext';
import { useLocalStorage } from './useLocalStorage';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { securityService } from '@/services';
import { reportsService } from '@/services/reports.service';
import {
  saveRecentEmojis,
  getRecentEmojis,
  validateImageSize,
  checkImageExists,
  getMessageKey,
  formatMessage,
  Message
} from '@/utils/messageUtils';
import { FREQUENT_EMOJIS } from '@/constants/emojis';
import { v4 as uuidv4 } from 'uuid';

interface CustomRequestForm {
  title: string;
  description: string;
  price: string;
  tags: string;
  hoursWorn: string;
}

// Optimistic message type - includes a temporary flag
interface OptimisticMessage extends Message {
  _optimistic?: boolean;
  _tempId?: string;
}

// Helper to get conversation key
const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

export const useBuyerMessages = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // CRITICAL CHANGE: Get sellerProfiles from MessageContext
  const { 
    messages, 
    sellerProfiles: contextProfiles, // GET PROFILES FROM CONTEXT
    sendMessage, 
    blockedUsers, 
    reportedUsers, 
    blockUser, 
    unblockUser, 
    reportUser, 
    markMessagesAsRead,
    refreshMessages,
    isLoading: messagesLoading,
    isInitialized,
    getSellerProfile // GET THIS FUNCTION TOO
  } = useMessages();
  
  // Use useContext directly to check if wallet context is available
  const walletContext = useContext(WalletContext);
  const { getRequestsForUser, markRequestAsPaid, addRequest, respondToRequest, getRequestById } = useRequests();
  const { users, addSellerNotification } = useListings();
  
  // Initialize thread from URL
  const threadParam = searchParams.get('thread');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Add state to track message updates
  const [messageUpdateCounter, setMessageUpdateCounter] = useState(0);
  
  // Track optimistic messages locally
  const [optimisticMessages, setOptimisticMessages] = useState<{ [threadId: string]: OptimisticMessage[] }>({});
  const optimisticMessageIds = useRef<Map<string, string>>(new Map()); // tempId -> realId mapping
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'favorites' | 'requests'>('messages');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  
  // UI States
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('recentEmojis', []);
  const [observerReadMessages, setObserverReadMessages] = useState<Set<string>>(new Set());
  const [uiUnreadCounts, setUiUnreadCounts] = useState<{ [key: string]: number }>({});
  
  // Message input states
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Custom request states
  const [showCustomRequestModal, setShowCustomRequestModal] = useState(false);
  const [customRequestForm, setCustomRequestForm] = useState<CustomRequestForm>({
    title: '',
    description: '',
    price: '',
    tags: '',
    hoursWorn: '24'
  });
  const [customRequestErrors, setCustomRequestErrors] = useState<Partial<CustomRequestForm>>({});
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [editMessage, setEditMessage] = useState<string>('');
  
  // Payment states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRequest, setPayingRequest] = useState<any | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Tip states
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipResult, setTipResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const lastManualScrollTime = useRef(Date.now());
  
  // Add a ref to track if we've already marked messages as read for the current thread
  const hasMarkedReadRef = useRef<string | null>(null);
  
  const isAdmin = user?.role === 'admin';
  
  // CRITICAL FIX: Ensure messages are loaded on mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (user && !initialLoadComplete) {
        console.log('[useBuyerMessages] Loading initial data...');
        
        // If messages context is not initialized, refresh
        if (!isInitialized) {
          await refreshMessages();
        }
        
        setInitialLoadComplete(true);
        setMounted(true);
      }
    };
    
    loadInitialData();
  }, [user, isInitialized, refreshMessages, initialLoadComplete]);
  
  // Handle wallet context availability
  const getBuyerBalance = useCallback((username: string) => {
    if (!walletContext) return 0;
    return walletContext.getBuyerBalance(username);
  }, [walletContext]);
  
  // FIXED: Memoize wallet object properly
  const wallet = useMemo(() => {
    if (!user || !walletContext) return {};
    
    const balances: { [username: string]: number } = {};
    balances[user.username] = getBuyerBalance(user.username);
    return balances;
  }, [user, walletContext, getBuyerBalance]);
  
  const buyerRequests = useMemo(() =>
    getRequestsForUser(user?.username || '', 'buyer'),
    [user?.username, getRequestsForUser]
  );
  
  // Mark messages as read and update UI
  const markMessageAsReadAndUpdateUI = useCallback((message: Message) => {
    if (message.id) {
      setObserverReadMessages(prev => {
        const newSet = new Set(prev);
        newSet.add(message.id!);
        return newSet;
      });
    }
  }, []);
  
  const handleMessageVisible = useCallback((message: Message) => {
    // Don't mark optimistic messages as read
    if ((message as OptimisticMessage)._optimistic) return;
    markMessageAsReadAndUpdateUI(message);
  }, [markMessageAsReadAndUpdateUI]);
  
  // CRITICAL: Listen for new messages and handle optimistic updates properly
  useEffect(() => {
    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newMessage = customEvent.detail;
      
      console.log('[useBuyerMessages] New message event received:', newMessage);
      
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
      
      // Force a re-render by updating counter
      setMessageUpdateCounter(prev => prev + 1);
      
      // If the message is for the active thread, scroll to bottom
      if (activeThread && 
          (newMessage.sender === activeThread || newMessage.receiver === activeThread)) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    
    // Also listen for read events to update optimistic messages
    const handleMessageRead = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[useBuyerMessages] Message read event received:', customEvent.detail);
      
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
  
  // ENHANCED: Merge real messages with optimistic messages and deduplicate
  const threads = useMemo(() => {
    const result: { [seller: string]: Message[] } = {};
    
    // Process messages even if not fully initialized to show loading state properly
    if (user) {
      // Get all messages for the user
      Object.values(messages).forEach((msgs) => {
        msgs.forEach((msg) => {
          if (msg.sender === user.username || msg.receiver === user.username) {
            const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
            if (!result[otherParty]) result[otherParty] = [];
            result[otherParty].push(msg);
          }
        });
      });
      
      // Add optimistic messages
      Object.entries(optimisticMessages).forEach(([threadId, optMsgs]) => {
        // Find the other party from threadId
        const [party1, party2] = threadId.split('-');
        const otherParty = party1 === user.username ? party2 : party1;
        
        if (otherParty && otherParty !== user.username) {
          if (!result[otherParty]) result[otherParty] = [];
          result[otherParty].push(...optMsgs);
        }
      });
      
      // Deduplicate and sort messages in each thread
      Object.keys(result).forEach((otherParty) => {
        const seenIds = new Set<string>();
        const seenOptimisticIds = new Set<string>();
        const deduplicated: Message[] = [];
        
        // Sort by date first
        result[otherParty].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Then deduplicate
        result[otherParty].forEach((msg) => {
          const optMsg = msg as OptimisticMessage;
          
          // Handle optimistic messages
          if (optMsg._optimistic && optMsg._tempId) {
            // Check if we already have the real version of this optimistic message
            const realId = optimisticMessageIds.current.get(optMsg._tempId);
            if (realId && seenIds.has(realId)) {
              // Skip this optimistic message, we have the real one
              return;
            }
            
            // Check if we already have this optimistic message
            if (seenOptimisticIds.has(optMsg._tempId)) {
              return;
            }
            
            seenOptimisticIds.add(optMsg._tempId);
            deduplicated.push(msg);
          } 
          // Handle regular messages
          else if (msg.id) {
            // Check if this is a real version of an optimistic message we already have
            const hasOptimistic = Array.from(optimisticMessageIds.current.entries()).some(
              ([tempId, realId]) => realId === msg.id && seenOptimisticIds.has(tempId)
            );
            
            if (hasOptimistic) {
              // Remove the optimistic version and add the real one
              const tempId = Array.from(optimisticMessageIds.current.entries())
                .find(([_, realId]) => realId === msg.id)?.[0];
              
              if (tempId) {
                const optIndex = deduplicated.findIndex(
                  m => (m as OptimisticMessage)._tempId === tempId
                );
                if (optIndex !== -1) {
                  deduplicated.splice(optIndex, 1);
                }
              }
            }
            
            // Add if not seen
            if (!seenIds.has(msg.id)) {
              seenIds.add(msg.id);
              deduplicated.push(msg);
            }
          } else {
            // Message without ID - include it but watch for duplicates by content/time
            const isDuplicate = deduplicated.some(existing => 
              existing.sender === msg.sender &&
              existing.receiver === msg.receiver &&
              existing.content === msg.content &&
              Math.abs(new Date(existing.date).getTime() - new Date(msg.date).getTime()) < 1000
            );
            
            if (!isDuplicate) {
              deduplicated.push(msg);
            }
          }
        });
        
        result[otherParty] = deduplicated;
      });
    }
    
    console.log('[useBuyerMessages] Threads updated, count:', Object.keys(result).length);
    
    return result;
  }, [messages, user, optimisticMessages, messageUpdateCounter]);
  
  // SIMPLIFIED FIX: Use profiles directly from context since they're already resolved
  const sellerProfiles = useMemo(() => {
    const profiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
    
    Object.keys(threads).forEach(seller => {
      // Get profile from context (already has resolved URLs)
      const profile = getSellerProfile ? getSellerProfile(seller) : contextProfiles?.[seller];
      
      if (profile) {
        profiles[seller] = {
          pic: profile.profilePic, // Already resolved in MessageContext
          verified: profile.isVerified || false
        };
      } else {
        // Fallback if no profile data
        profiles[seller] = {
          pic: null,
          verified: false
        };
      }
    });
    
    console.log('[useBuyerMessages] Seller profiles ready:', Object.keys(profiles).length);
    
    return profiles;
  }, [threads, contextProfiles, getSellerProfile]);
  
  const { unreadCounts, lastMessages, totalUnreadCount } = useMemo(() => {
    const unreadCounts: { [seller: string]: number } = {};
    const lastMessages: { [seller: string]: Message } = {};
    let totalUnreadCount = 0;
    
    Object.entries(threads).forEach(([seller, msgs]) => {
      // Get last non-optimistic message for lastMessages
      const realMessages = msgs.filter(m => !(m as OptimisticMessage)._optimistic);
      if (realMessages.length > 0) {
        lastMessages[seller] = realMessages[realMessages.length - 1];
      } else if (msgs.length > 0) {
        // If only optimistic messages, use the last one
        lastMessages[seller] = msgs[msgs.length - 1];
      }
      
      // Count unread messages (exclude optimistic ones)
      const unread = msgs.filter(msg =>
        !(msg as OptimisticMessage)._optimistic &&
        msg.receiver === user?.username && 
        !msg.isRead && 
        !msg.read
      ).length;
      
      unreadCounts[seller] = unread;
      totalUnreadCount += unread;
    });
    
    console.log('[useBuyerMessages] Unread counts updated, total:', totalUnreadCount);
    
    return { unreadCounts, lastMessages, totalUnreadCount };
  }, [threads, user?.username, messageUpdateCounter]);
  
  // Update UI unread counts based on actual unread counts
  useEffect(() => {
    if (!user) return;
    
    const newUiUnreadCounts: { [key: string]: number } = {};
    
    Object.entries(threads).forEach(([seller, msgs]) => {
      // If this is the active thread, always show 0 unread
      if (seller === activeThread) {
        newUiUnreadCounts[seller] = 0;
      } else {
        // Otherwise, count unread messages (exclude optimistic)
        const unreadMessages = msgs.filter(msg =>
          !(msg as OptimisticMessage)._optimistic &&
          msg.receiver === user.username &&
          !msg.isRead &&
          !msg.read &&
          (!msg.id || !observerReadMessages.has(msg.id))
        );
        newUiUnreadCounts[seller] = unreadMessages.length;
      }
    });
    
    // Only update state if the counts actually changed
    setUiUnreadCounts(prev => {
      const hasChanged = Object.keys(newUiUnreadCounts).some(key =>
        prev[key] !== newUiUnreadCounts[key]
      ) || Object.keys(prev).length !== Object.keys(newUiUnreadCounts).length;
      
      return hasChanged ? newUiUnreadCounts : prev;
    });
  }, [user, threads, observerReadMessages, activeThread, messageUpdateCounter]);
  
  // Mark all messages as read when opening a thread
  useEffect(() => {
    if (activeThread && user && hasMarkedReadRef.current !== activeThread) {
      // Track that we've marked this thread as read
      hasMarkedReadRef.current = activeThread;
      
      // Mark all messages in this thread as read immediately
      markMessagesAsRead(user.username, activeThread);
      
      // Clear observer read messages for this thread
      setObserverReadMessages(new Set());
      
      // Force UI to show 0 unread for this thread
      setUiUnreadCounts(prev => ({
        ...prev,
        [activeThread]: 0
      }));
    }
  }, [activeThread, user, markMessagesAsRead]);
  
  // Handle thread initialization
  useEffect(() => {
    if (!mounted || !initialLoadComplete) return;
    
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user, mounted, initialLoadComplete]);
  
  // Handle clicks outside the emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Auto-scroll to bottom when new messages arrive - IMPROVED
  useEffect(() => {
    const timeSinceManualScroll = Date.now() - lastManualScrollTime.current;
    if (timeSinceManualScroll > 1000 && activeThread && threads[activeThread]) {
      // Only auto-scroll if we're near the bottom already
      if (messagesContainerRef.current) {
        const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeThread, threads, messageUpdateCounter]);
  
  // OPTIMISTIC: Handle sending reply with instant UI update
  const handleReply = useCallback(async () => {
    if (!activeThread || (!replyMessage.trim() && !selectedImage) || !user) return;
    
    console.log('Sending message:', {
      text: replyMessage.trim(),
      imageUrl: selectedImage,
      receiver: activeThread
    });
    
    // Create optimistic message
    const tempId = uuidv4();
    const threadId = getConversationKey(user.username, activeThread);
    const messageContent = replyMessage.trim() || (selectedImage ? 'Image shared' : '');
    
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
    
    // Force update to show the new message immediately
    setMessageUpdateCounter(prev => prev + 1);
    
    // Scroll to bottom immediately
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
    
    // Send the actual message in the background
    try {
      await sendMessage(
        user.username,
        activeThread,
        messageContent,
        {
          type: selectedImage ? 'image' : 'normal',
          meta: selectedImage ? { imageUrl: selectedImage } : undefined,
          _optimisticId: tempId
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove optimistic message on error
      setOptimisticMessages(prev => ({
        ...prev,
        [threadId]: prev[threadId]?.filter(msg => msg._tempId !== tempId) || []
      }));
      
      // Restore input on error
      setReplyMessage(messageContent);
      setSelectedImage(selectedImage);
      setImageError('Failed to send message. Please try again.');
      
      // Force update to remove optimistic message
      setMessageUpdateCounter(prev => prev + 1);
    }
  }, [activeThread, replyMessage, selectedImage, user, sendMessage]);
  
  const handleBlockToggle = useCallback(() => {
    if (!activeThread || !user) return;
    
    const isBlocked = blockedUsers[user.username]?.includes(activeThread);
    if (isBlocked) {
      unblockUser(user.username, activeThread);
    } else {
      blockUser(user.username, activeThread);
    }
  }, [activeThread, user, blockedUsers, unblockUser, blockUser]);
  
  const handleReport = useCallback(async () => {
    if (!activeThread || !user) return;
    
    // Use the reports service to send to MongoDB
    const reportData = {
      reportedUser: activeThread,
      reportType: 'harassment' as const,
      description: `User reported from messages by ${user.username}`,
      severity: 'medium' as const,
      relatedMessageId: threads[activeThread]?.[threads[activeThread].length - 1]?.id
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
  }, [activeThread, user, reportUser, threads]);
  
  // FIXED: Handle accepting custom request (by buyer when seller edits)
  const handleAccept = useCallback(async (request: any) => {
    if (!user || !request || !walletContext) return;
    
    // Check if buyer has sufficient balance
    const markupPrice = request.price * 1.1;
    const currentBalance = getBuyerBalance(user.username);
    
    if (currentBalance >= markupPrice) {
      // Auto-process payment
      const customRequest = {
        requestId: request.id,
        buyer: user.username,
        seller: request.seller,
        amount: request.price,
        description: request.title,
        metadata: request
      };
      
      const success = await walletContext.purchaseCustomRequest(customRequest);
      
      if (success) {
        // Mark as paid
        markRequestAsPaid(request.id);
        
        // Send notification to seller
        addSellerNotification(
          request.seller,
          `💰 Custom request "${request.title}" has been paid! Check your orders to fulfill.`
        );
        
        // Send confirmation message (optimistically)
        const tempId = uuidv4();
        const threadId = getConversationKey(user.username, request.seller);
        const confirmMessage = `✅ Accepted and paid for custom request: ${request.title}`;
        
        const optimisticMsg: OptimisticMessage = {
          id: tempId,
          _tempId: tempId,
          _optimistic: true,
          sender: user.username,
          receiver: request.seller,
          content: confirmMessage,
          date: new Date().toISOString(),
          isRead: false,
          read: false,
          type: 'normal'
        };
        
        setOptimisticMessages(prev => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), optimisticMsg]
        }));
        
        // Send actual message in background
        sendMessage(user.username, request.seller, confirmMessage, { type: 'normal', _optimisticId: tempId });
        
        // Force update
        setMessageUpdateCounter(prev => prev + 1);
      } else {
        alert('Payment failed. Please try again.');
      }
    } else {
      // Update status to accepted but not paid
      respondToRequest(request.id, 'accepted', undefined, undefined, user.username);
      
      // Send message optimistically
      const tempId = uuidv4();
      const threadId = getConversationKey(user.username, request.seller);
      const confirmMessage = `✅ Accepted custom request: ${request.title} (payment pending - insufficient balance)`;
      
      const optimisticMsg: OptimisticMessage = {
        id: tempId,
        _tempId: tempId,
        _optimistic: true,
        sender: user.username,
        receiver: request.seller,
        content: confirmMessage,
        date: new Date().toISOString(),
        isRead: false,
        read: false,
        type: 'normal'
      };
      
      setOptimisticMessages(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), optimisticMsg]
      }));
      
      // Send actual message in background
      sendMessage(user.username, request.seller, confirmMessage, { type: 'normal', _optimisticId: tempId });
      
      // Force update
      setMessageUpdateCounter(prev => prev + 1);
    }
  }, [user, walletContext, getBuyerBalance, markRequestAsPaid, addSellerNotification, sendMessage, respondToRequest]);
  
  const handleDecline = useCallback(async (request: any) => {
    if (!user || !request) return;
    
    // Update status
    respondToRequest(request.id, 'rejected', undefined, undefined, user.username);
    
    // Send decline message optimistically
    const tempId = uuidv4();
    const threadId = getConversationKey(user.username, request.seller);
    const declineMessage = `❌ Declined custom request: ${request.title}`;
    
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      _tempId: tempId,
      _optimistic: true,
      sender: user.username,
      receiver: request.seller,
      content: declineMessage,
      date: new Date().toISOString(),
      isRead: false,
      read: false,
      type: 'normal'
    };
    
    setOptimisticMessages(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), optimisticMsg]
    }));
    
    // Send actual message in background
    sendMessage(user.username, request.seller, declineMessage, { type: 'normal', _optimisticId: tempId });
    
    // Force update
    setMessageUpdateCounter(prev => prev + 1);
  }, [user, sendMessage, respondToRequest]);
  
  const handleEditRequest = useCallback((request: any) => {
    setEditRequestId(request.id);
    setEditPrice(request.price.toString());
    setEditTitle(request.title);
    setEditTags(request.tags?.join(', ') || '');
    setEditMessage(request.description || '');
  }, []);
  
  // FIXED: Handle submitting edited request with optimistic updates
  const handleEditSubmit = useCallback(async () => {
    if (!editRequestId || !user || !activeThread) return;
    
    const request = buyerRequests.find(r => r.id === editRequestId);
    if (!request) return;
    
    // Update the request with edited info
    respondToRequest(
      editRequestId,
      'edited',
      editMessage.trim(),
      {
        title: editTitle.trim(),
        price: Number(editPrice),
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        description: editMessage.trim()
      },
      user.username // Mark buyer as the one who edited
    );
    
    // Send update message optimistically
    const tempId = uuidv4();
    const threadId = getConversationKey(user.username, activeThread);
    const updateMessage = `📝 Updated custom request: ${editTitle} - $${editPrice}`;
    
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      _tempId: tempId,
      _optimistic: true,
      sender: user.username,
      receiver: activeThread,
      content: updateMessage,
      date: new Date().toISOString(),
      isRead: false,
      read: false,
      type: 'customRequest',
      meta: {
        id: editRequestId,
        title: editTitle.trim(),
        price: Number(editPrice),
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        message: editMessage.trim()
      }
    };
    
    setOptimisticMessages(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), optimisticMsg]
    }));
    
    // Send actual message in background
    sendMessage(
      user.username,
      activeThread,
      updateMessage,
      {
        type: 'customRequest',
        meta: optimisticMsg.meta,
        _optimisticId: tempId
      }
    );
    
    // Reset edit state
    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
    
    // Force update
    setMessageUpdateCounter(prev => prev + 1);
    
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [editRequestId, user, activeThread, editTitle, editPrice, editTags, editMessage, buyerRequests, sendMessage, respondToRequest]);
  
  // Handle pay now with better error handling and debugging
  const handlePayNow = useCallback(async (request: any) => {
    console.log('handlePayNow called with request:', request);
    
    try {
      // Set the request first to ensure we have it
      setPayingRequest(request);
      
      // Try to refresh wallet data if possible
      if (walletContext && walletContext.reloadData) {
        console.log('Attempting to reload wallet data...');
        try {
          await walletContext.reloadData();
          console.log('Wallet data reloaded successfully');
        } catch (error) {
          console.error('Error reloading wallet data:', error);
          // Continue anyway - don't block showing the modal
        }
      }
      
      // Now show the modal
      console.log('Setting showPayModal to true');
      setShowPayModal(true);
    } catch (error) {
      console.error('Error in handlePayNow:', error);
      // Even if there's an error, try to show the modal
      setPayingRequest(request);
      setShowPayModal(true);
    }
  }, [walletContext]);
  
  // Handle confirm payment
  const handleConfirmPay = useCallback(async () => {
    console.log('handleConfirmPay called');
    console.log('Current state:', {
      isProcessingPayment,
      hasPayingRequest: !!payingRequest,
      hasUser: !!user,
      hasWalletContext: !!walletContext,
      payingRequest
    });
    
    // Prevent double-clicks and ensure we have all required data
    if (isProcessingPayment || !payingRequest || !user || !walletContext) {
      console.log('Payment blocked - missing requirements');
      return;
    }
    
    // Set processing flag
    setIsProcessingPayment(true);
    
    try {
      // Refresh wallet data first to ensure we have the latest balance
      console.log('Refreshing wallet data...');
      if (walletContext.reloadData) {
        await walletContext.reloadData();
      }
      
      const markupPrice = payingRequest.price * 1.1;
      const currentBalance = getBuyerBalance(user.username);
      
      console.log('Payment attempt:', {
        currentBalance,
        markupPrice,
        canPay: currentBalance >= markupPrice,
        request: payingRequest
      });
      
      if (currentBalance < markupPrice) {
        alert(`Insufficient balance. You have $${currentBalance.toFixed(2)} but need $${markupPrice.toFixed(2)}.`);
        setIsProcessingPayment(false);
        return;
      }
      
      // Process the actual payment
      const customRequest = {
        requestId: payingRequest.id,
        buyer: user.username,
        seller: payingRequest.seller,
        amount: payingRequest.price,
        description: payingRequest.title,
        metadata: payingRequest
      };
      
      console.log('Processing payment...', customRequest);
      const success = await walletContext.purchaseCustomRequest(customRequest);
      
      if (success) {
        console.log('Payment successful, updating request status...');
        
        // Mark as paid
        await markRequestAsPaid(payingRequest.id);
        
        // Send notification to seller
        addSellerNotification(
          payingRequest.seller,
          `💰 Custom request "${payingRequest.title}" has been paid! Check your orders to fulfill.`
        );
        
        // Send payment confirmation message optimistically
        const tempId = uuidv4();
        const threadId = getConversationKey(user.username, payingRequest.seller);
        const paymentMessage = `💰 Paid for custom request: ${payingRequest.title} - $${payingRequest.price}`;
        
        const optimisticMsg: OptimisticMessage = {
          id: tempId,
          _tempId: tempId,
          _optimistic: true,
          sender: user.username,
          receiver: payingRequest.seller,
          content: paymentMessage,
          date: new Date().toISOString(),
          isRead: false,
          read: false,
          type: 'normal'
        };
        
        setOptimisticMessages(prev => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), optimisticMsg]
        }));
        
        // Send actual message in background
        sendMessage(user.username, payingRequest.seller, paymentMessage, { type: 'normal', _optimisticId: tempId });
        
        // Close modal and clear state
        console.log('Closing modal...');
        setShowPayModal(false);
        setPayingRequest(null);
        
        // Force update
        setMessageUpdateCounter(prev => prev + 1);
        
        // Scroll to bottom to show the new message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        console.log('Payment completed successfully');
      } else {
        console.error('Payment failed');
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred while processing payment. Please try again.');
    } finally {
      // Always reset processing state
      setIsProcessingPayment(false);
    }
  }, [payingRequest, user, walletContext, getBuyerBalance, markRequestAsPaid, addSellerNotification, sendMessage, isProcessingPayment]);
  
  // Handle image selection with Cloudinary upload
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImageLoading(true);
    setImageError(null);
    
    try {
      // Validate file first
      const validation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }
      
      // Upload to Cloudinary instead of just reading as base64
      console.log('Uploading image to Cloudinary...');
      const uploadResult = await uploadToCloudinary(file);
      
      // Set the Cloudinary URL, not base64 data
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
  }, []);
  
  const handleEmojiClick = useCallback((emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    const newRecentEmojis = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 8);
    setRecentEmojis(newRecentEmojis);
    saveRecentEmojis(newRecentEmojis);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, [recentEmojis, setRecentEmojis]);
  
  // FIXED: handleSendTip now just handles UI updates after tip is sent
  // The actual tip sending is done entirely by the TipModal component
  const handleSendTip = useCallback(async () => {
    if (!activeThread || !user) return;
    
    // This function is now just a callback for after the tip is sent
    // The TipModal handles all the actual tip sending logic
    
    // Send a message about the tip (optimistically)
    const amount = parseFloat(tipAmount);
    if (!isNaN(amount) && amount > 0) {
      const tempId = uuidv4();
      const threadId = getConversationKey(user.username, activeThread);
      const tipMessage = `💝 I just sent you a $${amount.toFixed(2)} tip! Thank you!`;
      
      const optimisticMsg: OptimisticMessage = {
        id: tempId,
        _tempId: tempId,
        _optimistic: true,
        sender: user.username,
        receiver: activeThread,
        content: tipMessage,
        date: new Date().toISOString(),
        isRead: false,
        read: false,
        type: 'normal'
      };
      
      setOptimisticMessages(prev => ({
        ...prev,
        [threadId]: [...(prev[threadId] || []), optimisticMsg]
      }));
      
      // Send actual message in background
      sendMessage(user.username, activeThread, tipMessage, { type: 'normal', _optimisticId: tempId });
      
      // Force update
      setMessageUpdateCounter(prev => prev + 1);
    }
  }, [activeThread, tipAmount, user, sendMessage]);
  
  const validateCustomRequest = useCallback((): boolean => {
    const errors: Partial<CustomRequestForm> = {};
    
    if (!customRequestForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!customRequestForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    const price = parseFloat(customRequestForm.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'Please enter a valid price';
    }
    
    setCustomRequestErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customRequestForm]);
  
  const handleCustomRequestSubmit = useCallback(async () => {
    if (!validateCustomRequest() || !activeThread || !user) return;
    
    setIsSubmittingRequest(true);
    
    const requestData = {
      id: `req_${Date.now()}_${uuidv4().slice(0, 8)}`,
      buyer: user.username,
      seller: activeThread,
      title: customRequestForm.title.trim(),
      description: customRequestForm.description.trim(),
      price: parseFloat(customRequestForm.price),
      tags: customRequestForm.tags.trim().split(',').map(t => t.trim()).filter(Boolean),
      status: 'pending' as const,
      date: new Date().toISOString(),
      lastEditedBy: user.username,
      pendingWith: activeThread
    };
    
    await addRequest(requestData);
    
    // Send custom request message optimistically
    const tempId = uuidv4();
    const threadId = getConversationKey(user.username, activeThread);
    const requestMessage = `📦 Custom Request: ${customRequestForm.title} - $${customRequestForm.price}`;
    
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      _tempId: tempId,
      _optimistic: true,
      sender: user.username,
      receiver: activeThread,
      content: requestMessage,
      date: new Date().toISOString(),
      isRead: false,
      read: false,
      type: 'customRequest',
      meta: {
        id: requestData.id,
        title: requestData.title,
        price: requestData.price,
        tags: requestData.tags,
        message: requestData.description
      }
    };
    
    setOptimisticMessages(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), optimisticMsg]
    }));
    
    // Send actual message in background
    sendMessage(user.username, activeThread, requestMessage, {
      type: 'customRequest',
      meta: optimisticMsg.meta,
      _optimisticId: tempId
    });
    
    closeCustomRequestModal();
    
    // Force update
    setMessageUpdateCounter(prev => prev + 1);
    
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsSubmittingRequest(false);
  }, [validateCustomRequest, activeThread, user, customRequestForm, addRequest, sendMessage]);
  
  const closeCustomRequestModal = useCallback(() => {
    setShowCustomRequestModal(false);
    setCustomRequestForm({
      title: '',
      description: '',
      price: '',
      tags: '',
      hoursWorn: '24'
    });
    setCustomRequestErrors({});
  }, []);
  
  // Status checks
  const isUserBlocked = useCallback((username: string) => {
    return user ? blockedUsers[user.username]?.includes(username) || false : false;
  }, [user, blockedUsers]);
  
  const isUserReported = useCallback((username: string) => {
    return user ? reportedUsers[user.username]?.includes(username) || false : false;
  }, [user, reportedUsers]);
  
  // Return proper state regardless of initialization status
  // This allows the component to render with loading state
  if (!mounted || !user) {
    return {
      // Auth & context
      user: null,
      users: {},
      wallet: {},
      isAdmin: false,
      
      // Messages & threads
      threads: {},
      unreadCounts: {},
      uiUnreadCounts: {},
      lastMessages: {},
      sellerProfiles: {},
      totalUnreadCount: 0,
      activeThread: null,
      setActiveThread: () => {},
      buyerRequests: [],
      
      // UI State
      mounted: false,
      searchQuery: '',
      setSearchQuery: () => {},
      activeTab: 'messages' as const,
      setActiveTab: () => {},
      filterBy: 'all' as const,
      setFilterBy: () => {},
      previewImage: null,
      setPreviewImage: () => {},
      showEmojiPicker: false,
      setShowEmojiPicker: () => {},
      recentEmojis: [],
      observerReadMessages: new Set(),
      setObserverReadMessages: () => {},
      
      // Message input
      replyMessage: '',
      setReplyMessage: () => {},
      selectedImage: null,
      setSelectedImage: () => {},
      isImageLoading: false,
      setIsImageLoading: () => {},
      imageError: null,
      setImageError: () => {},
      
      // Custom requests
      showCustomRequestModal: false,
      setShowCustomRequestModal: () => {},
      customRequestForm: {
        title: '',
        description: '',
        price: '',
        tags: '',
        hoursWorn: '24'
      },
      setCustomRequestForm: () => {},
      customRequestErrors: {},
      isSubmittingRequest: false,
      editRequestId: null,
      setEditRequestId: () => {},
      editPrice: '',
      setEditPrice: () => {},
      editTitle: '',
      setEditTitle: () => {},
      editTags: '',
      setEditTags: () => {},
      editMessage: '',
      setEditMessage: () => {},
      
      // Payment
      showPayModal: false,
      setShowPayModal: () => {},
      payingRequest: null,
      setPayingRequest: () => {},
      
      // Tips
      showTipModal: false,
      setShowTipModal: () => {},
      tipAmount: '',
      setTipAmount: () => {},
      tipResult: null,
      setTipResult: () => {},
      
      // Refs
      fileInputRef,
      emojiPickerRef,
      messagesEndRef,
      messagesContainerRef,
      inputRef,
      lastManualScrollTime,
      
      // Actions
      handleReply: () => {},
      handleBlockToggle: () => {},
      handleReport: () => {},
      handleAccept: () => {},
      handleDecline: () => {},
      handleEditRequest: () => {},
      handleEditSubmit: () => {},
      handlePayNow: () => {},
      handleConfirmPay: () => {},
      handleImageSelect: () => {},
      handleMessageVisible: () => {},
      handleEmojiClick: () => {},
      handleSendTip: () => {},
      handleCustomRequestSubmit: () => {},
      closeCustomRequestModal: () => {},
      validateCustomRequest: () => false,
      
      // Status checks
      isUserBlocked: () => false,
      isUserReported: () => false,
    };
  }
  
  return {
    // Auth & context
    user,
    users,
    wallet,
    isAdmin,
    
    // Messages & threads
    threads,
    unreadCounts,
    uiUnreadCounts,
    lastMessages,
    sellerProfiles, // THIS NOW HAS RESOLVED URLS FROM CONTEXT!
    totalUnreadCount,
    activeThread,
    setActiveThread,
    buyerRequests,
    
    // UI State
    mounted,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    filterBy,
    setFilterBy,
    previewImage,
    setPreviewImage,
    showEmojiPicker,
    setShowEmojiPicker,
    recentEmojis,
    observerReadMessages,
    setObserverReadMessages,
    
    // Message input
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    isImageLoading,
    setIsImageLoading,
    imageError,
    setImageError,
    
    // Custom requests
    showCustomRequestModal,
    setShowCustomRequestModal,
    customRequestForm,
    setCustomRequestForm,
    customRequestErrors,
    isSubmittingRequest,
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editTags,
    setEditTags,
    editMessage,
    setEditMessage,
    
    // Payment
    showPayModal,
    setShowPayModal,
    payingRequest,
    setPayingRequest,
    
    // Tips
    showTipModal,
    setShowTipModal,
    tipAmount,
    setTipAmount,
    tipResult,
    setTipResult,
    
    // Refs
    fileInputRef,
    emojiPickerRef,
    messagesEndRef,
    messagesContainerRef,
    inputRef,
    lastManualScrollTime,
    
    // Actions
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handlePayNow,
    handleConfirmPay,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,
    handleSendTip,
    handleCustomRequestSubmit,
    closeCustomRequestModal,
    validateCustomRequest,
    
    // Status checks
    isUserBlocked,
    isUserReported,
  };
};
