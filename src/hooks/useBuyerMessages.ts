// src/hooks/useBuyerMessages.ts

import { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { WalletContext } from '@/context/WalletContext';
import { useRequests } from '@/context/RequestContext';
import { useListings } from '@/context/ListingContext';
import { getUserProfileData } from '@/utils/profileUtils';
import { useLocalStorage } from './useLocalStorage';
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

export const useBuyerMessages = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { messages, sendMessage, blockedUsers, reportedUsers, blockUser, unblockUser, reportUser, markMessagesAsRead } = useMessages();
  
  // Use useContext directly to check if wallet context is available
  const walletContext = useContext(WalletContext);
  
  const { getRequestsForUser, markRequestAsPaid, addRequest, respondToRequest, getRequestById } = useRequests();
  const { users, addSellerNotification } = useListings();
  
  // Initialize thread from URL
  const threadParam = searchParams.get('thread');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
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
  
  // Handle wallet context availability
  const getBuyerBalance = useCallback((username: string) => {
    if (!walletContext) return 0;
    return walletContext.getBuyerBalance(username);
  }, [walletContext]);
  
  const sendTip = useCallback(async (buyer: string, seller: string, amount: number) => {
    if (!walletContext) return false;
    return walletContext.sendTip(buyer, seller, amount);
  }, [walletContext]);
  
  const wallet = { buyerBalance: user && walletContext ? getBuyerBalance(user.username) : 0 };
  const buyerRequests = getRequestsForUser(user?.username || '', 'buyer');

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
    markMessageAsReadAndUpdateUI(message);
  }, [markMessageAsReadAndUpdateUI]);

  // Memoize threads to avoid circular dependency
  const threads = useMemo(() => {
    const result: { [seller: string]: Message[] } = {};
    
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

      // Sort messages in each thread by date
      Object.values(result).forEach((thread) =>
        thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    }
    
    return result;
  }, [messages, user]);

  // Calculate other message data with async profile loading
  const [sellerProfiles, setSellerProfiles] = useState<{ [seller: string]: { pic: string | null, verified: boolean } }>({});
  
  useEffect(() => {
    const loadSellerProfiles = async () => {
      const profiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
      
      for (const seller of Object.keys(threads)) {
        try {
          // Get seller profile using the new async utility
          const profileData = await getUserProfileData(seller);
          const sellerUser = users?.[seller];
          
          profiles[seller] = {
            pic: profileData?.profilePic || null,
            verified: sellerUser?.isVerified || sellerUser?.verificationStatus === 'verified' || false
          };
        } catch (error) {
          console.error(`Error loading profile for ${seller}:`, error);
          profiles[seller] = {
            pic: null,
            verified: false
          };
        }
      }
      
      setSellerProfiles(profiles);
    };
    
    loadSellerProfiles();
  }, [threads, users]);

  const { unreadCounts, lastMessages, totalUnreadCount } = useMemo(() => {
    const unreadCounts: { [seller: string]: number } = {};
    const lastMessages: { [seller: string]: Message } = {};
    let totalUnreadCount = 0;
    
    Object.entries(threads).forEach(([seller, msgs]) => {
      lastMessages[seller] = msgs[msgs.length - 1];
      
      // Count unread messages - use both isRead and read properties
      const unread = msgs.filter(msg => 
        msg.receiver === user?.username && !msg.isRead && !msg.read
      ).length;
      unreadCounts[seller] = unread;
      totalUnreadCount += unread;
    });
    
    return { unreadCounts, lastMessages, totalUnreadCount };
  }, [threads, user?.username]);

  // Update UI unread counts based on actual unread counts
  useEffect(() => {
    if (!user) return;

    const newUiUnreadCounts: { [key: string]: number } = {};
    
    Object.entries(threads).forEach(([seller, msgs]) => {
      // If this is the active thread, always show 0 unread
      if (seller === activeThread) {
        newUiUnreadCounts[seller] = 0;
      } else {
        // Otherwise, count unread messages
        const unreadMessages = msgs.filter(msg => 
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
  }, [user, threads, observerReadMessages, activeThread]);

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
    if (!mounted) return;
    
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user, mounted]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (timeSinceManualScroll > 1000 && activeThread && threads[activeThread]) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread, threads]);

  // Listen for storage changes to update profiles in real-time
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'user_profiles' && e.newValue) {
        // Re-load seller profiles when storage changes
        const profiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
        
        for (const seller of Object.keys(threads)) {
          try {
            const profileData = await getUserProfileData(seller);
            const sellerUser = users?.[seller];
            
            profiles[seller] = {
              pic: profileData?.profilePic || null,
              verified: sellerUser?.isVerified || sellerUser?.verificationStatus === 'verified' || false
            };
          } catch (error) {
            console.error(`Error loading profile for ${seller}:`, error);
            profiles[seller] = sellerProfiles[seller] || { pic: null, verified: false };
          }
        }
        
        setSellerProfiles(profiles);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [threads, users, sellerProfiles]);

  // Action handlers
  const handleReply = useCallback(async () => {
    if (!activeThread || (!replyMessage.trim() && !selectedImage) || !user) return;
    
    await sendMessage(
      user.username,
      activeThread,
      replyMessage.trim(),
      {
        type: selectedImage ? 'image' : 'normal',
        meta: selectedImage ? { imageUrl: selectedImage } : undefined
      }
    );
    
    setReplyMessage('');
    setSelectedImage(null);
    setImageError(null);
    
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleReport = useCallback(() => {
    if (!activeThread || !user) return;
    reportUser(user.username, activeThread);
  }, [activeThread, user, reportUser]);

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
        
        // Send confirmation message
        await sendMessage(
          user.username,
          request.seller,
          `✅ Accepted and paid for custom request: ${request.title}`,
          { type: 'normal' }
        );
      } else {
        alert('Payment failed. Please try again.');
      }
    } else {
      // Update status to accepted but not paid
      respondToRequest(request.id, 'accepted', undefined, undefined, user.username);
      
      // Send message
      await sendMessage(
        user.username,
        request.seller,
        `✅ Accepted custom request: ${request.title} (payment pending - insufficient balance)`,
        { type: 'normal' }
      );
    }
  }, [user, walletContext, getBuyerBalance, markRequestAsPaid, addSellerNotification, sendMessage, respondToRequest]);

  const handleDecline = useCallback(async (request: any) => {
    if (!user || !request) return;
    
    // Update status
    respondToRequest(request.id, 'rejected', undefined, undefined, user.username);
    
    // Send decline message
    await sendMessage(
      user.username,
      request.seller,
      `❌ Declined custom request: ${request.title}`,
      { type: 'normal' }
    );
  }, [user, sendMessage, respondToRequest]);

  const handleEditRequest = useCallback((request: any) => {
    setEditRequestId(request.id);
    setEditPrice(request.price.toString());
    setEditTitle(request.title);
    setEditTags(request.tags?.join(', ') || '');
    setEditMessage(request.description || '');
  }, []);

  // FIXED: Handle submitting edited request
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
    
    // Send update message
    await sendMessage(
      user.username,
      activeThread,
      `📝 Updated custom request: ${editTitle} - $${editPrice}`,
      {
        type: 'customRequest',
        meta: {
          id: editRequestId,
          title: editTitle.trim(),
          price: Number(editPrice),
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          message: editMessage.trim()
        }
      }
    );
    
    // Reset edit state
    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
  }, [editRequestId, user, activeThread, editTitle, editPrice, editTags, editMessage, buyerRequests, sendMessage, respondToRequest]);

  const handlePayNow = useCallback((request: any) => {
    setPayingRequest(request);
    setShowPayModal(true);
  }, []);

  // FIXED: Handle confirm payment properly
  const handleConfirmPay = useCallback(async () => {
    if (!payingRequest || !user || !walletContext) return;
    
    const markupPrice = payingRequest.price * 1.1;
    const currentBalance = getBuyerBalance(user.username);
    
    if (currentBalance < markupPrice) {
      alert('Insufficient balance. Please add funds to your wallet.');
      setShowPayModal(false);
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
    
    const success = await walletContext.purchaseCustomRequest(customRequest);
    
    if (success) {
      // Mark as paid
      await markRequestAsPaid(payingRequest.id);
      
      // Send notification to seller
      addSellerNotification(
        payingRequest.seller,
        `💰 Custom request "${payingRequest.title}" has been paid! Check your orders to fulfill.`
      );
      
      // Send payment confirmation message
      await sendMessage(
        user.username,
        payingRequest.seller,
        `💰 Paid for custom request: ${payingRequest.title} - $${payingRequest.price}`,
        { type: 'normal' }
      );
      
      setShowPayModal(false);
      setPayingRequest(null);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      alert('Payment failed. Please try again.');
    }
  }, [payingRequest, user, walletContext, getBuyerBalance, markRequestAsPaid, addSellerNotification, sendMessage]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageSize(file);
    if (error) {
      setImageError(error);
      return;
    }

    setIsImageLoading(true);
    setImageError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (checkImageExists(base64String)) {
        setSelectedImage(base64String);
      } else {
        setImageError('Failed to load image');
      }
      setIsImageLoading(false);
    };
    reader.onerror = () => {
      setImageError('Failed to read file');
      setIsImageLoading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleEmojiClick = useCallback((emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    const newRecentEmojis = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 8);
    setRecentEmojis(newRecentEmojis);
    saveRecentEmojis(newRecentEmojis);
    
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, [recentEmojis, setRecentEmojis]);

  const handleSendTip = useCallback(async () => {
    if (!activeThread || !tipAmount || !user) return;
    
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipResult({
        success: false,
        message: 'Please enter a valid amount'
      });
      return;
    }
    
    const currentBalance = getBuyerBalance(user.username);
    if (currentBalance < amount) {
      setTipResult({
        success: false,
        message: 'Insufficient balance. Please add funds to your wallet.'
      });
      return;
    }
    
    const success = await sendTip(user.username, activeThread, amount);
    
    if (success) {
      setTipResult({
        success: true,
        message: `$${amount.toFixed(2)} tip sent successfully!`
      });
      
      await sendMessage(
        user.username,
        activeThread,
        `💰 Sent a $${amount.toFixed(2)} tip`,
        {
          type: 'normal',
          meta: {
            id: `tip_${Date.now()}`,
            price: amount
          }
        }
      );
      
      setTimeout(() => {
        setShowTipModal(false);
        setTipAmount('');
        setTipResult(null);
      }, 2000);
    } else {
      setTipResult({
        success: false,
        message: 'Failed to send tip. Please try again.'
      });
    }
  }, [activeThread, tipAmount, user, getBuyerBalance, sendTip, sendMessage]);

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
    
    await sendMessage(
      user.username,
      activeThread,
      `📦 Custom Request: ${customRequestForm.title} - $${customRequestForm.price}`,
      {
        type: 'customRequest',
        meta: {
          id: requestData.id,
          title: requestData.title,
          price: requestData.price,
          tags: requestData.tags,
          message: requestData.description
        }
      }
    );
    
    closeCustomRequestModal();
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
    handleCustomRequestSubmit,
    closeCustomRequestModal,
    validateCustomRequest,
    
    // Status checks
    isUserBlocked,
    isUserReported,
  };
};
