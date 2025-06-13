// src/hooks/useBuyerMessages.ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { v4 as uuidv4 } from 'uuid';
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '@/constants/emojis';

// Types
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

type CustomRequestForm = {
  title: string;
  price: string;
  description: string;
};

export function useBuyerMessages() {
  // Context hooks
  const { user } = useAuth();
  const { users } = useListings();
  const {
    messages,
    sendMessage,
    markMessagesAsRead,
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
    hasReported,
  } = useMessages();
  const { addRequest, getRequestsForUser, respondToRequest, requests, setRequests, markRequestAsPaid } = useRequests();
  const { wallet, purchaseCustomRequest, sendTip } = useWallet();
  const searchParams = useSearchParams();
  
  // Component state
  const [mounted, setMounted] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // Custom Request Modal State
  const [showCustomRequestModal, setShowCustomRequestModal] = useState(false);
  const [customRequestForm, setCustomRequestForm] = useState<CustomRequestForm>({
    title: '',
    price: '',
    description: ''
  });
  const [customRequestErrors, setCustomRequestErrors] = useState<Record<string, string>>({});
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  // Edit request state
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTags, setEditTags] = useState('');
  const [editMessage, setEditMessage] = useState('');
  
  // Payment state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRequest, setPayingRequest] = useState<any>(null);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'favorites' | 'requests'>('messages');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [tipResult, setTipResult] = useState<{success: boolean, message: string} | null>(null);
  const [messageUpdate, setMessageUpdate] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [observerReadMessages, setObserverReadMessages] = useState<Set<string>>(new Set());
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const readThreadsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const lastManualScrollTime = useRef<number>(0);
  
  // Check if user is admin
  const isAdmin = user && (user.username === 'oakley' || user.username === 'gerome');
  
  // Initialize from URL params
  useEffect(() => {
    setMounted(true);
    const seller = searchParams.get('seller');
    if (seller) {
      setActiveThread(seller);
    }
  }, [searchParams]);
  
  // Clean up image on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);
  
  // Load read threads from localStorage
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
  
  // Load recent emojis
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
  
  // Save recent emojis
  useEffect(() => {
    if (recentEmojis.length > 0) {
      localStorage.setItem('panty_recent_emojis', JSON.stringify(recentEmojis));
    }
  }, [recentEmojis]);
  
  // Process messages to get threads
  const { threads, unreadCounts, lastMessages, sellerProfiles, totalUnreadCount, buyerRequests } = useMemo(() => {
    const threads: { [seller: string]: Message[] } = {};
    const unreadCounts: { [seller: string]: number } = {};
    const lastMessages: { [seller: string]: Message } = {};
    const sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (user) {
      Object.entries(messages).forEach(([conversationKey, msgs]) => {
        msgs.forEach((msg) => {
          if (msg.sender === user.username || msg.receiver === user.username) {
            const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
            
            if (!threads[otherParty]) {
              threads[otherParty] = [];
              unreadCounts[otherParty] = 0;
            }
            
            threads[otherParty].push(msg);
            
            if (msg.sender !== user.username && !msg.read && !observerReadMessages.has(`${msg.sender}-${msg.date}`)) {
              unreadCounts[otherParty]++;
              totalUnreadCount++;
            }
            
            if (!lastMessages[otherParty] || new Date(msg.date) > new Date(lastMessages[otherParty].date)) {
              lastMessages[otherParty] = msg;
            }
          }
        });
      });
      
      Object.keys(threads).forEach(seller => {
        threads[seller].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const sellerUser = users[seller];
        sellerProfiles[seller] = {
          pic: sellerUser?.profilePicture || null,
          verified: sellerUser?.verified || sellerUser?.verificationStatus === 'verified' || false
        };
      });
    }
    
    const buyerRequests = user ? getRequestsForUser(user.username, 'buyer') : [];
    
    return { threads, unreadCounts, lastMessages, sellerProfiles, totalUnreadCount, buyerRequests };
  }, [messages, user, users, getRequestsForUser, observerReadMessages]);
  
  // Get unread counts for UI
  const uiUnreadCounts = useMemo(() => {
    const counts: { [seller: string]: number } = {};
    
    Object.entries(threads).forEach(([seller, messages]) => {
      let unreadCount = 0;
      const isThreadRead = readThreadsRef.current.has(seller);
      
      messages.forEach(msg => {
        if (msg.sender !== user?.username && !msg.read && !isThreadRead) {
          unreadCount++;
        }
      });
      
      counts[seller] = unreadCount;
    });
    
    return counts;
  }, [threads, user, messageUpdate]);
  
  // Check if users are blocked
  const isUserBlocked = useCallback((otherUser: string) => {
    return user ? isBlocked(user.username, otherUser) : false;
  }, [user, isBlocked]);
  
  const isUserReported = useCallback((otherUser: string) => {
    return user ? hasReported(user.username, otherUser) : false;
  }, [user, hasReported]);
  
  // Handlers
  const handleBlock = useCallback((sellerUsername: string) => {
    if (!user) return;
    blockUser(user.username, sellerUsername);
    setActiveThread(null);
  }, [user, blockUser]);
  
  const handleUnblock = useCallback((sellerUsername: string) => {
    if (!user) return;
    unblockUser(user.username, sellerUsername);
  }, [user, unblockUser]);
  
  const handleReport = useCallback((sellerUsername: string) => {
    if (!user) return;
    reportUser(user.username, sellerUsername);
  }, [user, reportUser]);
  
  const handleBlockToggle = useCallback((sellerUsername: string) => {
    if (isUserBlocked(sellerUsername)) {
      handleUnblock(sellerUsername);
    } else {
      handleBlock(sellerUsername);
    }
  }, [isUserBlocked, handleBlock, handleUnblock]);
  
  // Message visibility handler
  const handleMessageVisible = useCallback((msg: Message) => {
    if (!user || msg.sender === user.username || msg.read) return;
    
    const messageKey = `${msg.sender}-${msg.date}`;
    setObserverReadMessages(prev => new Set(prev).add(messageKey));
    
    setTimeout(() => {
      markMessagesAsRead(msg.sender, user.username);
    }, 1000);
  }, [user, markMessagesAsRead]);
  
  // Handle image selection
  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image size should be less than 10MB');
      return;
    }
    
    setIsImageLoading(true);
    setImageError(null);
    
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setIsImageLoading(false);
        }
      };
      reader.onerror = () => {
        setImageError('Failed to load image');
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setImageError('Failed to process image');
      setIsImageLoading(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  // Custom request validation
  const validateCustomRequest = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!customRequestForm.title.trim()) {
      errors.title = 'Title is required';
    } else if (customRequestForm.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    
    if (!customRequestForm.price.trim()) {
      errors.price = 'Price is required';
    } else {
      const price = parseFloat(customRequestForm.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'Price must be a positive number';
      } else if (price > 10000) {
        errors.price = 'Price cannot exceed $10,000';
      }
    }
    
    if (!customRequestForm.description.trim()) {
      errors.description = 'Description is required';
    } else if (customRequestForm.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    
    setCustomRequestErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customRequestForm]);
  
  // Handle custom request submission
  const handleCustomRequestSubmit = useCallback(async () => {
    if (!activeThread || !user) return;
    
    if (!validateCustomRequest()) {
      return;
    }
    
    setIsSubmittingRequest(true);
    
    try {
      const priceValue = parseFloat(customRequestForm.price);
      const tagsArray: string[] = [];
      const requestId = 'req_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      addRequest({
        id: requestId,
        buyer: user.username,
        seller: activeThread,
        title: customRequestForm.title.trim(),
        description: customRequestForm.description.trim(),
        price: priceValue,
        tags: tagsArray,
        status: 'pending',
        date: new Date().toISOString(),
        messageThreadId: `${user.username}-${activeThread}`,
        lastModifiedBy: user.username,
        originalMessageId: requestId
      });
      
      sendMessage(
        user.username,
        activeThread,
        `[Custom Request] ${customRequestForm.title.trim()}`,
        {
          type: 'customRequest',
          meta: {
            id: requestId,
            title: customRequestForm.title.trim(),
            price: priceValue,
            message: customRequestForm.description.trim(),
          }
        }
      );
      
      closeCustomRequestModal();
      
      setTimeout(() => {
        alert('Custom request sent successfully!');
      }, 500);
      
    } catch (error) {
      console.error('Error submitting custom request:', error);
      alert('Failed to send custom request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  }, [activeThread, user, customRequestForm, validateCustomRequest, addRequest, sendMessage]);
  
  // Close custom request modal
  const closeCustomRequestModal = useCallback(() => {
    setShowCustomRequestModal(false);
    setCustomRequestForm({ title: '', price: '', description: '' });
    setCustomRequestErrors({});
    setIsSubmittingRequest(false);
  }, []);
  
  // Handle message reply
  const handleReply = useCallback(() => {
    if (!activeThread || !user) return;
    
    const textContent = replyMessage.trim();
    
    if (!textContent && !selectedImage) {
      return;
    }
    
    sendMessage(user.username, activeThread, textContent, {
      type: selectedImage ? 'image' : 'normal',
      meta: selectedImage ? { imageUrl: selectedImage } : undefined
    });
    
    setReplyMessage('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
  }, [activeThread, user, replyMessage, selectedImage, sendMessage]);
  
  // Edit request handlers
  const handleEditRequest = useCallback((req: any) => {
    setEditRequestId(req.id);
    setEditPrice(typeof req.price === 'number' ? req.price : '');
    setEditTitle(req.title || '');
    setEditTags(Array.isArray(req.tags) ? req.tags.join(', ') : '');
    setEditMessage(req.description || '');
  }, []);
  
  const handleEditSubmit = useCallback(() => {
    if (!user || !activeThread || !editRequestId) return;
    
    if (!editTitle.trim() || editPrice === '' || isNaN(Number(editPrice)) || Number(editPrice) <= 0) {
      alert('Please enter a valid title and price for your custom request.');
      return;
    }
    
    const priceValue = Number(editPrice);
    const tagsArray = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    
    respondToRequest(
      editRequestId,
      'pending',
      editMessage,
      {
        title: editTitle,
        price: priceValue,
        tags: tagsArray,
        description: editMessage,
      },
      user.username
    );
    
    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
  }, [user, activeThread, editRequestId, editTitle, editPrice, editTags, editMessage, respondToRequest]);
  
  // Request action handlers
  const handleAccept = useCallback((req: any) => {
    if (req && req.status === 'pending') {
      respondToRequest(req.id, 'accepted');
    }
  }, [respondToRequest]);
  
  const handleDecline = useCallback((req: any) => {
    if (req && req.status === 'pending') {
      respondToRequest(req.id, 'rejected');
    }
  }, [respondToRequest]);
  
  const handlePayNow = useCallback((req: any) => {
    setPayingRequest(req);
    setShowPayModal(true);
  }, []);
  
  // Payment confirmation
  const handleConfirmPay = useCallback(() => {
    if (!user || !payingRequest) return;
    
    const basePrice = payingRequest.price;
    if (typeof basePrice !== 'number' || isNaN(basePrice) || basePrice <= 0) {
      alert('Invalid price for this request.');
      setShowPayModal(false);
      setPayingRequest(null);
      return;
    }
    
    const markupPrice = Math.round(basePrice * 1.1 * 100) / 100;
    const seller = payingRequest.seller;
    const buyer = user.username;
    
    if (!seller || !buyer) {
      alert('Missing seller or buyer information.');
      setShowPayModal(false);
      setPayingRequest(null);
      return;
    }
    
    if (wallet[buyer] === undefined || wallet[buyer] < markupPrice) {
      setShowPayModal(false);
      setPayingRequest(null);
      alert("Insufficient balance to complete this transaction.");
      return;
    }
    
    const success = purchaseCustomRequest({
      requestId: payingRequest.id,
      title: payingRequest.title,
      description: payingRequest.description || '',
      price: basePrice,
      seller: seller,
      buyer: buyer,
      tags: payingRequest.tags || []
    });
    
    if (success) {
      markRequestAsPaid(payingRequest.id);
      setShowPayModal(false);
      setPayingRequest(null);
      alert('Payment successful! The seller has been notified.');
    } else {
      alert('Payment failed. Please try again.');
    }
  }, [user, payingRequest, wallet, purchaseCustomRequest, markRequestAsPaid]);
  
  // Tip handling
  const handleSendTip = useCallback(() => {
    if (!user || !activeThread || !tipAmount || isNaN(Number(tipAmount))) {
      setTipResult({ success: false, message: 'Invalid tip amount' });
      return;
    }
    
    const amount = Number(tipAmount);
    if (amount <= 0) {
      setTipResult({ success: false, message: 'Tip must be greater than 0' });
      return;
    }
    
    const success = sendTip(user.username, activeThread, amount);
    
    if (success) {
      setTipResult({ success: true, message: `Tip of $${amount.toFixed(2)} sent successfully!` });
      setTipAmount('');
      sendMessage(user.username, activeThread, `💝 Sent you a tip of $${amount.toFixed(2)}!`);
      setTimeout(() => {
        setShowTipModal(false);
        setTipResult(null);
      }, 2000);
    } else {
      setTipResult({ success: false, message: 'Insufficient balance or tip failed' });
    }
  }, [user, activeThread, tipAmount, sendTip, sendMessage]);
  
  // Emoji handling
  const handleEmojiClick = useCallback((emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 30);
    });
  }, []);
  
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
    sellerProfiles,
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
}
