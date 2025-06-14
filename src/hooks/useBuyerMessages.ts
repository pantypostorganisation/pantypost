// src/hooks/useBuyerMessages.ts

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { useWallet } from '@/context/WalletContext';
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
  const { sendTip, getBuyerBalance } = useWallet();
  const { getRequestsForUser, markRequestAsPaid, addRequest } = useRequests();
  const { users } = useListings();
  
  // Initialize thread from URL or localStorage
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
  
  const isAdmin = user?.role === 'admin';
  const wallet = { buyerBalance: user ? getBuyerBalance(user.username) : 0 };
  const buyerRequests = getRequestsForUser(user?.username || '', 'buyer');

  // Mark messages as read and update UI
  const markMessageAsReadAndUpdateUI = useCallback((message: Message) => {
    if (message.id) {
      setObserverReadMessages(prev => new Set([...prev, message.id!]));
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

  // Unread counts calculation
  useEffect(() => {
    if (!user) return;

    const newUiUnreadCounts: { [key: string]: number } = {};
    
    Object.entries(threads).forEach(([seller, msgs]) => {
      const unreadMessages = msgs.filter(msg => 
        !msg.isRead && 
        msg.receiver === user.username &&
        (!msg.id || !observerReadMessages.has(msg.id))
      );
      newUiUnreadCounts[seller] = unreadMessages.length;
    });
    
    setUiUnreadCounts(newUiUnreadCounts);
  }, [user, threads, observerReadMessages]);

  // Update read status in backend when observerReadMessages changes
  useEffect(() => {
    if (!activeThread || !user || observerReadMessages.size === 0) return;

    const timer = setTimeout(() => {
      markMessagesAsRead(user.username, activeThread);
      setObserverReadMessages(new Set());
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeThread, user, observerReadMessages, markMessagesAsRead]);

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
    if (timeSinceManualScroll > 1000) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread, messages]);

  // Calculate other message data
  const { unreadCounts, lastMessages, sellerProfiles, totalUnreadCount } = useMemo(() => {
    const unreadCounts: { [seller: string]: number } = {};
    const lastMessages: { [seller: string]: Message } = {};
    const sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    Object.entries(threads).forEach(([seller, msgs]) => {
      lastMessages[seller] = msgs[msgs.length - 1];
      
      // Get seller profile using the new utility
      const profileData = getUserProfileData(seller);
      const sellerUser = users?.[seller];
      
      sellerProfiles[seller] = {
        pic: profileData?.profilePic || null,
        verified: sellerUser?.isVerified || sellerUser?.verificationStatus === 'verified' || false
      };
      
      // Count unread messages
      const unread = msgs.filter(msg => !msg.isRead && msg.receiver === user?.username).length;
      unreadCounts[seller] = unread;
      totalUnreadCount += unread;
    });
    
    return { unreadCounts, lastMessages, sellerProfiles, totalUnreadCount };
  }, [threads, users, user?.username]);

  // Listen for storage changes to update profiles in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_profiles' && e.newValue) {
        // Force re-calculation of memoized data by updating a dependency
        setMounted(prev => !prev);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const handleBlockToggle = () => {
    if (!activeThread || !user) return;
    
    const isBlocked = blockedUsers[user.username]?.includes(activeThread);
    if (isBlocked) {
      unblockUser(user.username, activeThread);
    } else {
      blockUser(user.username, activeThread);
    }
  };

  const handleReport = () => {
    if (!activeThread || !user) return;
    reportUser(user.username, activeThread);
  };

  const handleAccept = async (request: any) => {
    if (!user || !request) return;
    
    // For now, just mark the request as accepted in messages
    const acceptMessage: Message = {
      id: `accept_${Date.now()}`,
      sender: user.username,
      receiver: request.seller,
      content: `✅ Accepted custom request: ${request.title}`,
      date: new Date().toISOString(),
      isRead: false
    };
    
    await sendMessage(
      acceptMessage.sender,
      acceptMessage.receiver,
      acceptMessage.content
    );
  };

  const handleDecline = async (request: any) => {
    if (!user || !request) return;
    
    // For now, just mark the request as declined in messages
    const declineMessage: Message = {
      id: `decline_${Date.now()}`,
      sender: user.username,
      receiver: request.seller,
      content: `❌ Declined custom request: ${request.title}`,
      date: new Date().toISOString(),
      isRead: false
    };
    
    await sendMessage(
      declineMessage.sender,
      declineMessage.receiver,
      declineMessage.content
    );
  };

  const handleEditRequest = (request: any) => {
    setEditRequestId(request.id);
    setEditPrice(request.price.toString());
    setEditTitle(request.title);
    setEditTags(request.tags || '');
    setEditMessage(request.notes || '');
  };

  const handleEditSubmit = async () => {
    if (!editRequestId || !user) return;
    
    // For now, just send an update message
    const editMessage: Message = {
      id: `edit_${Date.now()}`,
      sender: user.username,
      receiver: activeThread!,
      content: `📝 Updated custom request: ${editTitle} - $${editPrice}`,
      date: new Date().toISOString(),
      isRead: false
    };
    
    await sendMessage(
      editMessage.sender,
      editMessage.receiver,
      editMessage.content
    );
    
    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
  };

  const handlePayNow = (request: any) => {
    setPayingRequest(request);
    setShowPayModal(true);
  };

  const handleConfirmPay = async () => {
    if (!payingRequest || !user) return;
    
    const currentBalance = getBuyerBalance(user.username);
    if (currentBalance < payingRequest.price) {
      alert('Insufficient balance. Please add funds to your wallet.');
      setShowPayModal(false);
      return;
    }
    
    await markRequestAsPaid(payingRequest.id);
    setShowPayModal(false);
    setPayingRequest(null);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleEmojiClick = (emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    const newRecentEmojis = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 8);
    setRecentEmojis(newRecentEmojis);
    saveRecentEmojis(newRecentEmojis);
    
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleSendTip = async () => {
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
  };

  const validateCustomRequest = (): boolean => {
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
  };

  const handleCustomRequestSubmit = async () => {
    if (!validateCustomRequest() || !activeThread || !user) return;
    
    setIsSubmittingRequest(true);
    
    const requestData = {
      id: `req_${Date.now()}`,
      buyer: user.username,
      seller: activeThread,
      title: customRequestForm.title.trim(),
      description: customRequestForm.description.trim(),
      price: parseFloat(customRequestForm.price),
      tags: customRequestForm.tags.trim().split(',').map(t => t.trim()).filter(Boolean),
      status: 'pending' as const,
      date: new Date().toISOString()
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
  };

  const closeCustomRequestModal = () => {
    setShowCustomRequestModal(false);
    setCustomRequestForm({
      title: '',
      description: '',
      price: '',
      tags: '',
      hoursWorn: '24'
    });
    setCustomRequestErrors({});
  };

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