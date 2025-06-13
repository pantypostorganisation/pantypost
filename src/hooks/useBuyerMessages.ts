// src/hooks/useBuyerMessages.ts
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// Constants
const ADMIN_ACCOUNTS = ['oakley', 'gerome'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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
  
  // State hooks
  const [mounted, setMounted] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // Custom Request Modal State
  const [showCustomRequestModal, setShowCustomRequestModal] = useState(false);
  const [customRequestForm, setCustomRequestForm] = useState({
    title: '',
    price: '',
    description: ''
  });
  const [customRequestErrors, setCustomRequestErrors] = useState<Record<string, string>>({});
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTags, setEditTags] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRequest, setPayingRequest] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'favorites' | 'requests'>('messages');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [tipResult, setTipResult] = useState<{success: boolean, message: string} | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [messageUpdate, setMessageUpdate] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [observerReadMessages, setObserverReadMessages] = useState<Set<string>>(new Set());
  
  // Ref hooks
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readThreadsRef = useRef<Set<string>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastManualScrollTime = useRef<number>(0);
  
  // Get URL parameter
  const threadParam = searchParams?.get('thread');
  
  // Basic derived values
  const username = user?.username || '';
  const isAdmin = user?.username && ADMIN_ACCOUNTS.includes(user.username);

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load recent emojis from localStorage on component mount
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
    
    // Load previously read threads from localStorage
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

  // Save recent emojis to localStorage when they change
  useEffect(() => {
    if (recentEmojis.length > 0) {
      localStorage.setItem('panty_recent_emojis', JSON.stringify(recentEmojis));
    }
  }, [recentEmojis]);

  // Initialize the thread based on URL thread parameter
  useEffect(() => {
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user]);

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const timeSinceManualScroll = Date.now() - lastManualScrollTime.current;
    if (timeSinceManualScroll > 1000) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread, messages]);

  // Memoize messages data
  const { 
    threads, 
    unreadCounts, 
    lastMessages, 
    sellerProfiles, 
    totalUnreadCount 
  } = useMemo(() => {
    const threads: { [seller: string]: any[] } = {};
    const unreadCounts: { [seller: string]: number } = {};
    const lastMessages: { [seller: string]: any } = {};
    const sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (user) {
      // Get all messages for the user
      Object.values(messages).forEach((msgs) => {
        msgs.forEach((msg) => {
          if (msg.sender === user.username || msg.receiver === user.username) {
            const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
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
      Object.entries(threads).forEach(([seller, msgs]) => {
        lastMessages[seller] = msgs[msgs.length - 1];
        
        // Get seller profile picture and verification status
        const storedPic = sessionStorage.getItem(`profile_pic_${seller}`);
        const sellerUser = users?.[seller];
        const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
        
        sellerProfiles[seller] = { 
          pic: storedPic, 
          verified: isVerified
        };
        
        // Count only messages FROM seller TO buyer as unread
        const threadUnreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === seller && msg.receiver === user?.username
        ).length;
        
        unreadCounts[seller] = threadUnreadCount;
        
        // Only add to total if not in readThreadsRef
        if (!readThreadsRef.current.has(seller) && threadUnreadCount > 0) {
          totalUnreadCount += threadUnreadCount;
        }
      });
    }
    
    return { threads, unreadCounts, lastMessages, sellerProfiles, totalUnreadCount };
  }, [user, messages, users, messageUpdate]);

  // Memoize buyerRequests
  const buyerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'buyer') : [];
  }, [user, getRequestsForUser]);

  // Calculate UI unread count indicators
  const uiUnreadCounts = useMemo(() => {
    const counts: { [seller: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(seller => {
        counts[seller] = readThreadsRef.current.has(seller) ? 0 : unreadCounts[seller];
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

  // Image handling with validation
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target) return;
    
    const file = event.target.files?.[0];
    setImageError(null);
    
    if (!file) return;
    
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`Image too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    setIsImageLoading(true);
    
    const reader = new FileReader();
    
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsImageLoading(false);
    };
    
    reader.onerror = () => {
      setImageError("Failed to read the image file. Please try again.");
      setIsImageLoading(false);
    };
    
    reader.readAsDataURL(file);
  }, []);

  // Handle emoji selection
  const handleEmojiClick = useCallback((emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 30);
    });
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, []);

  // Custom Request Modal Functions
  const openCustomRequestModal = useCallback(() => {
    setShowCustomRequestModal(true);
    setCustomRequestForm({
      title: '',
      price: '',
      description: ''
    });
    setCustomRequestErrors({});
  }, []);

  const closeCustomRequestModal = useCallback(() => {
    setShowCustomRequestModal(false);
    setCustomRequestForm({
      title: '',
      price: '',
      description: ''
    });
    setCustomRequestErrors({});
    setIsSubmittingRequest(false);
  }, []);

  const validateCustomRequest = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!customRequestForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!customRequestForm.price.trim()) {
      errors.price = 'Price is required';
    } else {
      const price = parseFloat(customRequestForm.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'Price must be a valid number greater than 0';
      }
    }
    
    if (!customRequestForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setCustomRequestErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customRequestForm]);

  const handleCustomRequestSubmit = useCallback(async () => {
    if (!activeThread || !user || !validateCustomRequest()) return;
    
    setIsSubmittingRequest(true);
    
    try {
      const priceValue = parseFloat(customRequestForm.price);
      const tagsArray: string[] = [];
      const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

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
  }, [activeThread, user, customRequestForm, validateCustomRequest, addRequest, sendMessage, closeCustomRequestModal]);

  // Message sending function
  const handleReply = useCallback(() => {
    if (!activeThread || !user) return;

    const textContent = replyMessage.trim();

    if (!textContent && !selectedImage) {
      return;
    }

    sendMessage(user.username, activeThread, textContent, {
      type: selectedImage ? 'image' : 'normal',
      meta: selectedImage ? { imageUrl: selectedImage } : undefined,
    });

    setReplyMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setShowEmojiPicker(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [activeThread, user, replyMessage, selectedImage, sendMessage]);

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

  const handleEditRequest = useCallback((req: any) => {
    if (!req || typeof req !== 'object') return;
    
    setEditRequestId(req.id || null);
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

    const customRequestPurchase = {
      requestId: payingRequest.id,
      title: payingRequest.title,
      description: payingRequest.description,
      price: payingRequest.price,
      seller: payingRequest.seller,
      buyer: buyer,
      tags: payingRequest.tags
    };

    const success = purchaseCustomRequest(customRequestPurchase);
    
    if (success) {
      markRequestAsPaid(payingRequest.id);
      
      setRequests((prev) =>
        prev.map((r) =>
          r.id === payingRequest.id ? { ...r, paid: true, status: 'paid' } : r
        )
      );
      
      alert(`Payment successful! You paid ${markupPrice.toFixed(2)} for "${payingRequest.title}"`);
    } else {
      alert("Payment failed. Please check your balance and try again.");
    }

    setShowPayModal(false);
    setPayingRequest(null);
  }, [user, payingRequest, wallet, purchaseCustomRequest, markRequestAsPaid, setRequests]);

  const handleSendTip = useCallback(() => {
    if (!activeThread || !user) return;
    
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipResult({
        success: false,
        message: "Please enter a valid amount."
      });
      return;
    }
    
    if (wallet[user.username] === undefined || wallet[user.username] < amount) {
      setTipResult({
        success: false,
        message: "Insufficient balance to send this tip."
      });
      return;
    }
    
    const success = sendTip(user.username, activeThread, amount);
    if (success) {
      sendMessage(
        user.username,
        activeThread,
        `💰 I sent you a tip of ${amount.toFixed(2)}!`
      );
      setTipAmount('');
      setTipResult({
        success: true,
        message: `Successfully sent ${amount.toFixed(2)} tip to ${activeThread}!`
      });
      setTimeout(() => {
        setShowTipModal(false);
        setTipResult(null);
      }, 1500);
    } else {
      setTipResult({
        success: false,
        message: "Failed to send tip. Please check your wallet balance."
      });
    }
  }, [activeThread, user, tipAmount, wallet, sendTip, sendMessage]);

  // Handle scroll tracking for auto-scroll behavior
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      lastManualScrollTime.current = Date.now();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Derived values
  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));

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
    handleCustomRequestSubmit: handleCustomRequestSubmit,
    closeCustomRequestModal,
    validateCustomRequest,
    
    // Status checks
    isUserBlocked,
    isUserReported,
  };
}
