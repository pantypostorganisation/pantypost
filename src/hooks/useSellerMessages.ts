// src/hooks/useSellerMessages.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { safeStorage } from '@/utils/safeStorage';
import { v4 as uuidv4 } from 'uuid';

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
    hasReported
  } = useMessages();
  const { requests, addRequest, getRequestsForUser, respondToRequest } = useRequests();
  const { } = useWallet(); // Remove unused wallet
  
  // State for UI
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messageUpdate, setMessageUpdate] = useState(0);
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
  
  const isAdmin = user && (user.username === 'oakley' || user.username === 'gerome');
  
  // Reset when user changes
  useEffect(() => {
    readThreadsRef.current = new Set();
    setMessageUpdate(prev => prev + 1);
  }, [user?.username]);
  
  // Load previously read threads from localStorage
  useEffect(() => {
    if (user) {
      const readThreadsKey = `panty_read_threads_${user.username}`;
      const threads = safeStorage.getItem<string[]>(readThreadsKey, []);
      if (threads && threads.length > 0) {
        readThreadsRef.current = new Set(threads);
        setMessageUpdate(prev => prev + 1);
      }
    }
  }, [user]);
  
  // Save read threads to localStorage
  useEffect(() => {
    if (user && readThreadsRef.current.size > 0 && typeof window !== 'undefined') {
      const readThreadsKey = `panty_read_threads_${user.username}`;
      const threadsArray = Array.from(readThreadsRef.current);
      safeStorage.setItem(readThreadsKey, threadsArray);
      
      const event = new CustomEvent('readThreadsUpdated', { 
        detail: { threads: threadsArray, username: user.username }
      });
      window.dispatchEvent(event);
    }
  }, [messageUpdate, user]);
  
  // Update UI when messages change
  useEffect(() => {
    setMessageUpdate(prev => prev + 1);
  }, [messages]);
  
  // Load recent emojis from localStorage
  useEffect(() => {
    const storedRecentEmojis = safeStorage.getItem<string[]>('panty_recent_emojis', []);
    if (storedRecentEmojis && storedRecentEmojis.length > 0) {
      setRecentEmojis(storedRecentEmojis.slice(0, 30));
    }
  }, []);
  
  // Save recent emojis to localStorage
  useEffect(() => {
    if (recentEmojis.length > 0) {
      safeStorage.setItem('panty_recent_emojis', recentEmojis);
    }
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
      const storedPic = sessionStorage.getItem(`profile_pic_${buyer}`);
      const buyerInfo = users?.[buyer];
      const isVerified = buyerInfo?.verified || buyerInfo?.verificationStatus === 'verified';
      
      buyerProfiles[buyer] = { 
        pic: storedPic, 
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
  }, [user, messages, users, messageUpdate]);
  
  // Get seller's requests
  const sellerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'seller') : [];
  }, [user, getRequestsForUser]);
  
  // Calculate unread counts per buyer
  const uiUnreadCounts = useMemo(() => {
    const counts: { [buyer: string]: number } = {};
    
    if (threads) {
      Object.keys(threads).forEach(buyer => {
        counts[buyer] = readThreadsRef.current.has(buyer) ? 0 : unreadCounts[buyer] || 0;
      });
    }
    
    return counts;
  }, [threads, unreadCounts, messageUpdate]);

  // Filter threads based on search and filter
  const filteredThreads = useMemo(() => {
    if (!threads) return [];
    
    let filtered = Object.entries(threads);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(([buyer]) => 
        buyer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply unread filter
    if (filterBy === 'unread') {
      filtered = filtered.filter(([buyer]) => unreadCounts[buyer] > 0);
    }
    
    // Sort by last message date (newest first)
    filtered.sort(([, aMsgs], [, bMsgs]) => {
      const aLastMsg = aMsgs[aMsgs.length - 1];
      const bLastMsg = bMsgs[bMsgs.length - 1];
      return new Date(bLastMsg.date).getTime() - new Date(aLastMsg.date).getTime();
    });
    
    return filtered;
  }, [threads, searchQuery, filterBy, unreadCounts]);

  // Function to handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      setImageError(null);
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setImageError('Image must be less than 5MB');
        setIsImageLoading(false);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setIsImageLoading(false);
      };
      reader.onerror = () => {
        setImageError('Failed to load image');
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to send a reply
  const sendReply = () => {
    if (!user || !activeThread) return;
    
    if (!replyMessage.trim() && !selectedImage) return;
    
    if (selectedImage) {
      sendMessage(user.username, activeThread, selectedImage, {
        type: 'image',
        meta: {
          imageUrl: selectedImage
        }
      });
      setSelectedImage(null);
    }
    
    if (replyMessage.trim()) {
      sendMessage(user.username, activeThread, replyMessage);
      setReplyMessage('');
    }
    
    // Notification for new message
    if (!isAdmin) {
      addSellerNotification(
        user.username,
        `💬 New message sent to ${activeThread}`
      );
    }
  };

  // Function to handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    // Add to recent emojis
    setRecentEmojis(prev => {
      const updated = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 30);
      return updated;
    });
  };

  // Mark thread as read when viewing it
  const markThreadAsRead = useCallback((buyer: string) => {
    if (!user) return;
    
    // Mark messages as read in context
    markMessagesAsRead(buyer, user.username);
    
    // Update local ref
    readThreadsRef.current.add(buyer);
    setMessageUpdate(prev => prev + 1);
  }, [user, markMessagesAsRead]);

  // Handle custom request actions
  const handleAcceptRequest = (requestId: string) => {
    respondToRequest(requestId, 'accepted');
    if (!isAdmin && user) {
      addSellerNotification(
        user.username,
        `✅ Custom request accepted`
      );
    }
  };

  const handleRejectRequest = (requestId: string) => {
    respondToRequest(requestId, 'rejected');
    if (!isAdmin && user) {
      addSellerNotification(
        user.username,
        `❌ Custom request rejected`
      );
    }
  };

  const handleEditRequest = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setEditRequestId(requestId);
      setEditPrice(request.price);
      setEditTitle(request.title);
      setEditMessage(request.description);
    }
  };

  const saveEditedRequest = () => {
    if (!editRequestId || !user) return;
    
    respondToRequest(
      editRequestId, 
      'edited',
      undefined,
      {
        title: editTitle,
        price: Number(editPrice),
        description: editMessage
      },
      user.username
    );
    
    // Send a message about the edit
    const request = requests.find(r => r.id === editRequestId);
    if (request) {
      sendMessage(
        user.username,
        request.buyer,
        `I've updated your custom request "${editTitle}" - Price: $${editPrice}`,
        {
          type: 'customRequest',
          meta: {
            id: editRequestId,
            title: editTitle,
            price: Number(editPrice),
            message: editMessage
          }
        }
      );
    }
    
    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditMessage('');
    
    if (!isAdmin) {
      addSellerNotification(
        user.username,
        `✏️ Custom request edited`
      );
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread, threads]);

  return {
    // User data
    user,
    isAdmin,
    
    // Thread data
    threads,
    filteredThreads,
    activeThread,
    setActiveThread,
    buyerProfiles,
    
    // Message data
    lastMessages,
    unreadCounts,
    uiUnreadCounts,
    totalUnreadCount,
    observerReadMessages,
    setObserverReadMessages,
    markThreadAsRead,
    
    // UI states
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
    previewImage,
    setPreviewImage,
    showEmojiPicker,
    setShowEmojiPicker,
    recentEmojis,
    
    // Message input
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    isImageLoading,
    imageError,
    handleImageSelect,
    sendReply,
    handleEmojiSelect,
    
    // Request management
    sellerRequests,
    editRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editMessage,
    setEditMessage,
    handleAcceptRequest,
    handleRejectRequest,
    handleEditRequest,
    saveEditedRequest,
    
    // Context functions
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
    hasReported,
    
    // Refs
    messagesEndRef,
    scrollToBottom
  };
}