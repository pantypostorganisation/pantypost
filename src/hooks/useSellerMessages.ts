// src/hooks/useSellerMessages.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { v4 as uuidv4 } from 'uuid';

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
    getThreadsForUser,
    getAllThreadsInfo
  } = useMessages();
  const { requests, addRequest, getRequestsForUser, respondToRequest } = useRequests();
  const { wallet } = useWallet();
  
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
  
  const isAdmin = !!user && (user.username === 'oakley' || user.username === 'gerome');
  
  // DEBUG: Track activeThread changes
  useEffect(() => {
    console.log('=== useSellerMessages activeThread changed ===');
    console.log('New activeThread value:', activeThread);
    console.log('Stack trace:', new Error().stack);
  }, [activeThread]);
  
  // Reset when user changes
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
  
  // Update UI when messages change
  useEffect(() => {
    setMessageUpdate(prev => prev + 1);
  }, [messages]);
  
  // Load recent emojis from localStorage
  useEffect(() => {
    const storedRecentEmojis = localStorage.getItem('panty_recent_emojis');
    if (storedRecentEmojis) {
      try {
        const parsed = JSON.parse(storedRecentEmojis);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed.slice(0, 30));
        }
      } catch (e) {
        console.error('Failed to parse recent emojis', e);
      }
    }
  }, []);
  
  // Save recent emojis to localStorage
  useEffect(() => {
    if (recentEmojis.length > 0) {
      localStorage.setItem('panty_recent_emojis', JSON.stringify(recentEmojis));
    }
  }, [recentEmojis]);
  
  // UPDATED: Use new helper functions from MessageContext
  const { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount } = useMemo(() => {
    if (!user) return { 
      threads: {}, 
      unreadCounts: {}, 
      lastMessages: {}, 
      buyerProfiles: {}, 
      totalUnreadCount: 0 
    };
    
    // Use the new helper functions
    const threads = getThreadsForUser(user.username, 'seller');
    const threadInfos = getAllThreadsInfo(user.username, 'seller');
    
    const unreadCounts: { [buyer: string]: number } = {};
    const lastMessages: { [buyer: string]: any } = {};
    const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    Object.entries(threadInfos).forEach(([buyer, info]) => {
      unreadCounts[buyer] = info.unreadCount;
      lastMessages[buyer] = info.lastMessage;
      
      // Get buyer profile picture and verification status
      const storedPic = sessionStorage.getItem(`profile_pic_${buyer}`);
      const buyerInfo = users?.[buyer];
      const isVerified = buyerInfo?.verified || buyerInfo?.verificationStatus === 'verified';
      
      buyerProfiles[buyer] = { 
        pic: storedPic, 
        verified: isVerified
      };
      
      // Only add to total if not in readThreadsRef
      if (!readThreadsRef.current.has(buyer) && info.unreadCount > 0) {
        totalUnreadCount += info.unreadCount;
      }
    });
    
    return { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
  }, [user, messages, users, messageUpdate, getThreadsForUser, getAllThreadsInfo]);
  
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
  }, [threads, unreadCounts, messageUpdate]);
  
  // Mark messages as read when thread is selected
  useEffect(() => {
    if (activeThread && user) {
      const hasUnreadMessages = threads[activeThread]?.some(
        msg => !msg.read && msg.sender === activeThread && msg.receiver === user.username
      );
      
      if (hasUnreadMessages) {
        markMessagesAsRead(user.username, activeThread);
        
        if (!readThreadsRef.current.has(activeThread)) {
          readThreadsRef.current.add(activeThread);
          setMessageUpdate(prev => prev + 1);
        }
      }
    }
  }, [activeThread, user, threads, markMessagesAsRead]);
  
  // Handle message visibility for marking as read
  const handleMessageVisible = useCallback((msg: any) => {
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
    messageUpdate,
    setMessageUpdate,
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
