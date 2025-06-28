// src/hooks/useSellerMessages.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { storageService } from '@/services';
import { v4 as uuidv4 } from 'uuid';

// Helper function
const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

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
    clearMessageNotifications // NEW: Import this
  } = useMessages();
  const { requests, addRequest, getRequestsForUser, respondToRequest } = useRequests();
  const { wallet } = useWallet();
  
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
  
  const readThreadsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedEmojis = useRef(false);
  const lastActiveThread = useRef<string | null>(null);
  
  const isAdmin = !!user && (user.username === 'oakley' || user.username === 'gerome');
  
  // Load previously read threads from localStorage
  useEffect(() => {
    if (!user) return;
    
    const loadReadThreads = async () => {
      try {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        const readThreads = await storageService.getItem<string[]>(readThreadsKey, []);
        if (Array.isArray(readThreads)) {
          readThreadsRef.current = new Set(readThreads);
        }
      } catch (e) {
        console.error('Failed to load read threads', e);
      }
    };
    
    loadReadThreads();
  }, [user?.username]);
  
  // Save read threads to localStorage
  useEffect(() => {
    if (!user || readThreadsRef.current.size === 0) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        const threadsArray = Array.from(readThreadsRef.current);
        await storageService.setItem(readThreadsKey, threadsArray);
        
        const event = new CustomEvent('readThreadsUpdated', { 
          detail: { threads: threadsArray, username: user.username }
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.error('Failed to save read threads', e);
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [user?.username, activeThread]); // Update when activeThread changes
  
  // Load recent emojis from localStorage
  useEffect(() => {
    if (hasLoadedEmojis.current) return;
    hasLoadedEmojis.current = true;
    
    const loadRecentEmojis = async () => {
      try {
        const storedRecentEmojis = await storageService.getItem<string[]>('panty_recent_emojis', []);
        if (Array.isArray(storedRecentEmojis)) {
          setRecentEmojis(storedRecentEmojis.slice(0, 30));
        }
      } catch (e) {
        console.error('Failed to load recent emojis', e);
      }
    };
    
    loadRecentEmojis();
  }, []);
  
  // Save recent emojis to localStorage
  useEffect(() => {
    if (recentEmojis.length === 0) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        await storageService.setItem('panty_recent_emojis', recentEmojis);
      } catch (error) {
        console.error('Failed to save recent emojis:', error);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [recentEmojis]);
  
  // Process messages into threads
  const { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount } = useMemo(() => {
    const threads: { [buyer: string]: Message[] } = {};
    const unreadCounts: { [buyer: string]: number } = {};
    const lastMessages: { [buyer: string]: Message } = {};
    const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (!user) return { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
    
    // Get all messages for the seller
    Object.values(messages).forEach((msgs) => {
      msgs.forEach((msg) => {
        // Only include messages where the current user is the seller (receiver) or sender
        if (msg.sender === user.username || msg.receiver === user.username) {
          const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
          
          // Skip if other party is also a seller/admin (seller-to-seller messages)
          const otherUser = users?.[otherParty];
          if (otherUser?.role === 'seller' || otherUser?.role === 'admin') {
            return;
          }
          
          if (!threads[otherParty]) threads[otherParty] = [];
          threads[otherParty].push(msg);
        }
      });
    });
    
    // Sort messages in each thread by date
    Object.values(threads).forEach((thread) =>
      thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    
    // Get last message and unread count for each thread
    Object.entries(threads).forEach(([buyer, msgs]) => {
      lastMessages[buyer] = msgs[msgs.length - 1];
      
      // Get buyer profile picture and verification status
      // Note: Profile pics should come from users context or be loaded async
      const buyerInfo = users?.[buyer];
      const isVerified = buyerInfo?.verified || buyerInfo?.verificationStatus === 'verified';
      
      buyerProfiles[buyer] = { 
        pic: null, // Profile pics should be loaded through proper channels
        verified: isVerified
      };
      
      // Count only messages FROM buyer TO seller as unread
      const threadUnreadCount = msgs.filter(
        (msg) => !msg.read && msg.sender === buyer && msg.receiver === user?.username
      ).length;
      
      unreadCounts[buyer] = threadUnreadCount;
      
      // Only add to total if not in readThreadsRef
      if (!readThreadsRef.current.has(buyer) && threadUnreadCount > 0) {
        totalUnreadCount += threadUnreadCount;
      }
    });
    
    return { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
  }, [user?.username, messages, users]);
  
  // Get seller's requests
  const sellerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'seller') : [];
  }, [user, getRequestsForUser]);
  
  // Calculate UI unread counts (considering read threads)
  const uiUnreadCounts = useMemo(() => {
    const counts: { [buyer: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(buyer => {
        counts[buyer] = readThreadsRef.current.has(buyer) ? 0 : unreadCounts[buyer];
      });
    }
    return counts;
  }, [threads, unreadCounts]);
  
  // Mark messages as read when thread is selected AND clear notifications - FIXED
  useEffect(() => {
    if (!activeThread || !user || activeThread === lastActiveThread.current) {
      return; // Explicit return
    }
    
    // Update the last active thread
    lastActiveThread.current = activeThread;
    
    // NEW: Clear message notifications for this buyer
    clearMessageNotifications(user.username, activeThread);
    
    // Check if there are unread messages
    const conversationKey = getConversationKey(user.username, activeThread);
    const threadMessages = messages[conversationKey] || [];
    
    const hasUnread = threadMessages.some(
      msg => msg.receiver === user.username && msg.sender === activeThread && !msg.read
    );
    
    if (hasUnread) {
      // Use a small delay to prevent render loops
      const timer = setTimeout(() => {
        markMessagesAsRead(user.username, activeThread);
        
        // Update read threads ref
        if (!readThreadsRef.current.has(activeThread)) {
          readThreadsRef.current.add(activeThread);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    return; // Add explicit return for else case
  }, [activeThread, user?.username, markMessagesAsRead, messages, clearMessageNotifications]);
  
  // Handle message visibility for marking as read
  const handleMessageVisible = useCallback((msg: any) => {
    if (!user || msg.sender === user.username || msg.read) return;
    
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
      const conversationKey = getConversationKey(user.username, msg.sender);
      const threadMessages = messages[conversationKey] || [];
      
      const remainingUnread = threadMessages.filter(
        m => !m.read && m.sender === msg.sender && m.receiver === user.username && 
        `${m.sender}-${m.receiver}-${m.date}` !== messageId
      ).length;
      
      if (remainingUnread === 0 && !readThreadsRef.current.has(msg.sender)) {
        readThreadsRef.current.add(msg.sender);
      }
    });
  }, [user, markMessagesAsRead, messages]);
  
  // Handle sending reply
  const handleReply = useCallback(() => {
    if (!activeThread || !user || (!replyMessage.trim() && !selectedImage)) return;

    sendMessage(user.username, activeThread, replyMessage.trim(), {
      type: selectedImage ? 'image' : 'normal',
      meta: selectedImage ? { imageUrl: selectedImage } : undefined,
    });
    
    setReplyMessage('');
    setSelectedImage(null);
    setImageError(null);
    setShowEmojiPicker(false);
  }, [activeThread, user, replyMessage, selectedImage, sendMessage]);
  
  // Handle block toggle
  const handleBlockToggle = useCallback(() => {
    if (!activeThread || !user) return;
    
    if (isBlocked(user.username, activeThread)) {
      unblockUser(user.username, activeThread);
    } else {
      blockUser(user.username, activeThread);
    }
  }, [activeThread, user, isBlocked, unblockUser, blockUser]);
  
  // Handle report
  const handleReport = useCallback(() => {
    if (!activeThread || !user) return;
    
    if (!hasReported(user.username, activeThread)) {
      reportUser(user.username, activeThread);
    }
  }, [activeThread, user, hasReported, reportUser]);
  
  // Handle accepting custom request
  const handleAccept = useCallback((customRequestId: string) => {
    if (!user) return;
    
    respondToRequest(customRequestId, 'accepted', undefined, undefined, user.username);
    
    const request = requests.find(r => r.id === customRequestId);
    if (request) {
      addSellerNotification(user.username, `Custom request "${request.title}" accepted! Buyer will be notified.`);
      
      sendMessage(user.username, request.buyer, `Your custom request "${request.title}" has been accepted!`, {
        type: 'normal'
      });
    }
  }, [user, respondToRequest, requests, addSellerNotification, sendMessage]);
  
  // Handle declining custom request
  const handleDecline = useCallback((customRequestId: string) => {
    if (!user) return;
    
    respondToRequest(customRequestId, 'rejected', undefined, undefined, user.username);
    
    const request = requests.find(r => r.id === customRequestId);
    if (request) {
      sendMessage(user.username, request.buyer, `Your custom request "${request.title}" has been declined.`, {
        type: 'normal'
      });
    }
  }, [user, respondToRequest, requests, sendMessage]);
  
  // Handle custom request editing
  const handleEditRequest = useCallback((requestId: string, title: string, price: number, message: string) => {
    setEditRequestId(requestId);
    setEditTitle(title);
    setEditPrice(price);
    setEditMessage(message);
  }, []);
  
  // Handle submitting edited request
  const handleEditSubmit = useCallback(() => {
    if (!editRequestId || !user || editTitle.trim() === '' || editPrice === '' || editPrice <= 0) return;
    
    const request = requests.find(r => r.id === editRequestId);
    if (!request) return;
    
    // Update the request
    respondToRequest(
      editRequestId, 
      'edited',
      editMessage.trim(),
      {
        title: editTitle.trim(),
        price: Number(editPrice),
        description: editMessage.trim()
      },
      user.username
    );
    
    // Send message about the edit
    sendMessage(
      user.username,
      request.buyer,
      `I've modified your custom request "${editTitle.trim()}"`,
      {
        type: 'customRequest',
        meta: {
          id: editRequestId,
          title: editTitle.trim(),
          price: Number(editPrice),
          message: editMessage.trim(),
        }
      }
    );
    
    // Reset edit state
    setEditRequestId(null);
    setEditTitle('');
    setEditPrice('');
    setEditMessage('');
    
    addSellerNotification(user.username, `Custom request modified and sent to buyer!`);
  }, [editRequestId, editTitle, editPrice, editMessage, user, requests, respondToRequest, sendMessage, addSellerNotification]);
  
  // Handle emoji click
  const handleEmojiClick = useCallback((emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 30);
    });
    
    setShowEmojiPicker(false);
  }, []);
  
  // Handle image selection
  const handleImageSelect = useCallback(async (file: File) => {
    if (!file) return;
    
    setIsImageLoading(true);
    setImageError(null);
    
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }
      
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsImageLoading(false);
      };
      reader.onerror = () => {
        setImageError('Failed to read image');
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Failed to load image');
      setIsImageLoading(false);
    }
  }, []);
  
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
    setSearchQuery,
    filterBy,
    setFilterBy,
    observerReadMessages,
    setObserverReadMessages,
    messagesEndRef,
    
    // Message input
    replyMessage,
    setReplyMessage,
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
    setEditPrice,
    editTitle,
    setEditTitle,
    editMessage,
    setEditMessage,
    
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
