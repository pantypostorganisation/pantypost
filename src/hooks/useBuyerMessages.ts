// src/hooks/useBuyerMessages.ts

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { useWallet } from '@/context/WalletContext';
import { useRequests } from '@/context/RequestContext';
import { useListings } from '@/context/ListingContext';
import { getUserProfileData } from '@/utils/profileUtils';
import { useLocalStorage } from '@/utils/safeStorage';
import { 
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
  const [recentEmojis, setRecentEmojis] = useLocalStorage<string[]>('recent_emojis', []);
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
  const [customRequestErrors, setCustomRequestErrors] = useState<{
    title?: string;
    description?: string;
    price?: string;
  }>({});
  
  // Tip states
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [tipError, setTipError] = useState<string | null>(null);
  const [isSendingTip, setIsSendingTip] = useState(false);
  
  // Read status tracking
  const readThreadsRef = useRef<Set<string>>(new Set());
  const [messageUpdate, setMessageUpdate] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize component
  useEffect(() => {
    setMounted(true);
    if (threadParam) {
      setActiveThread(threadParam);
    }
  }, [threadParam]);
  
  // Process messages into threads
  const { threads, lastMessages, sellerProfiles, totalUnreadCount } = useMemo(() => {
    const threads: { [seller: string]: Message[] } = {};
    const lastMessages: { [seller: string]: Message } = {};
    const sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (!user) return { threads, lastMessages, sellerProfiles, totalUnreadCount };
    
    // Get all messages for the buyer
    Object.values(messages).forEach((msgs) => {
      msgs.forEach((msg) => {
        // Only include messages where the current user is involved
        if (msg.sender === user.username || msg.receiver === user.username) {
          const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
          
          // Skip if other party is a buyer (buyer-to-buyer messages)
          const otherUser = users?.[otherParty];
          if (otherUser?.role === 'buyer') {
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
    
    // Get last message and seller info for each thread
    Object.entries(threads).forEach(([seller, msgs]) => {
      lastMessages[seller] = msgs[msgs.length - 1];
      
      // Get seller profile data
      const profileData = getUserProfileData(seller);
      const sellerInfo = users?.[seller];
      const isVerified = sellerInfo?.verified || sellerInfo?.verificationStatus === 'verified';
      
      sellerProfiles[seller] = { 
        pic: profileData?.profilePic || null, 
        verified: isVerified
      };
      
      // Count unread messages FROM seller TO buyer
      const threadUnreadCount = msgs.filter(
        (msg) => !msg.read && msg.sender === seller && msg.receiver === user?.username
      ).length;
      
      if (threadUnreadCount > 0 && !readThreadsRef.current.has(seller)) {
        totalUnreadCount += threadUnreadCount;
      }
    });
    
    return { threads, lastMessages, sellerProfiles, totalUnreadCount };
  }, [user, messages, users, messageUpdate]);

  // Get buyer's requests
  const buyerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'buyer') : [];
  }, [user, getRequestsForUser]);

  // Filter threads based on search and filter
  const filteredThreads = useMemo(() => {
    if (!threads) return [];
    
    let filtered = Object.entries(threads);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(([seller]) => 
        seller.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply unread filter
    if (filterBy === 'unread') {
      filtered = filtered.filter(([seller, msgs]) => {
        const unreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === seller && msg.receiver === user?.username
        ).length;
        return unreadCount > 0;
      });
    }
    
    // Sort by last message date (newest first)
    filtered.sort(([, aMsgs], [, bMsgs]) => {
      const aLastMsg = aMsgs[aMsgs.length - 1];
      const bLastMsg = bMsgs[bMsgs.length - 1];
      return new Date(bLastMsg.date).getTime() - new Date(aLastMsg.date).getTime();
    });
    
    return filtered;
  }, [threads, searchQuery, filterBy, user]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      setImageError(null);
      
      const sizeError = validateImageSize(file);
      if (sizeError) {
        setImageError(sizeError);
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

  // Send reply
  const sendReply = useCallback(() => {
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
  }, [user, activeThread, replyMessage, selectedImage, sendMessage]);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    // Add to recent emojis
    setRecentEmojis(prev => {
      const updated = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 30);
      return updated;
    });
  };

  // Mark thread as read
  const markThreadAsRead = useCallback((seller: string) => {
    if (!user) return;
    
    // Mark messages as read in context
    markMessagesAsRead(seller, user.username);
    
    // Update local ref
    readThreadsRef.current.add(seller);
    setMessageUpdate(prev => prev + 1);
  }, [user, markMessagesAsRead]);

  // Navigate to thread
  const navigateToThread = (seller: string) => {
    setActiveThread(seller);
    router.push(`/buyer/messages?thread=${seller}`);
    markThreadAsRead(seller);
  };

  // Custom request validation
  const validateCustomRequest = (): boolean => {
    const errors: typeof customRequestErrors = {};
    
    if (!customRequestForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!customRequestForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    const price = parseFloat(customRequestForm.price);
    if (!customRequestForm.price || isNaN(price) || price <= 0) {
      errors.price = 'Valid price is required';
    }
    
    setCustomRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit custom request
  const submitCustomRequest = () => {
    if (!user || !activeThread || !validateCustomRequest()) return;
    
    const requestId = `req_${Date.now()}`;
    const tags = customRequestForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    const request = {
      id: requestId,
      buyer: user.username,
      seller: activeThread,
      title: customRequestForm.title,
      description: customRequestForm.description,
      price: parseFloat(customRequestForm.price),
      tags,
      status: 'pending' as const,
      date: new Date().toISOString(),
      paid: false
    };
    
    addRequest(request);
    
    // Send as message
    sendMessage(
      user.username,
      activeThread,
      `Custom request: ${customRequestForm.title}`,
      {
        type: 'customRequest',
        meta: {
          id: requestId,
          title: customRequestForm.title,
          price: parseFloat(customRequestForm.price),
          tags,
          message: customRequestForm.description
        }
      }
    );
    
    // Reset form
    setCustomRequestForm({
      title: '',
      description: '',
      price: '',
      tags: '',
      hoursWorn: '24'
    });
    setShowCustomRequestModal(false);
  };

  // Send tip
  const handleSendTip = async () => {
    if (!user || !activeThread || !tipAmount || isSendingTip) return;
    
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipError('Please enter a valid amount');
      return;
    }
    
    const balance = getBuyerBalance(user.username);
    if (amount > balance) {
      setTipError('Insufficient balance');
      return;
    }
    
    setIsSendingTip(true);
    setTipError(null);
    
    try {
      const success = sendTip(user.username, activeThread, amount);
      
      if (success) {
        // Send tip as message
        sendMessage(
          user.username,
          activeThread,
          tipMessage || `Sent you a ${amount} tip! 💰`,
          {
            type: 'normal'
          }
        );
        
        // Reset and close
        setTipAmount('');
        setTipMessage('');
        setShowTipModal(false);
      } else {
        setTipError('Failed to send tip');
      }
    } catch (error) {
      setTipError('An error occurred');
    } finally {
      setIsSendingTip(false);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread, threads]);

  return {
    // User data
    user,
    
    // Thread data
    threads,
    filteredThreads,
    activeThread,
    setActiveThread,
    sellerProfiles,
    lastMessages,
    totalUnreadCount,
    navigateToThread,
    
    // Message states
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    isImageLoading,
    imageError,
    handleImageSelect,
    sendReply,
    
    // UI states
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
    handleEmojiSelect,
    observerReadMessages,
    setObserverReadMessages,
    uiUnreadCounts,
    markThreadAsRead,
    
    // Custom request
    showCustomRequestModal,
    setShowCustomRequestModal,
    customRequestForm,
    setCustomRequestForm,
    customRequestErrors,
    submitCustomRequest,
    
    // Tips
    showTipModal,
    setShowTipModal,
    tipAmount,
    setTipAmount,
    tipMessage,
    setTipMessage,
    tipError,
    isSendingTip,
    handleSendTip,
    
    // Requests
    buyerRequests,
    markRequestAsPaid,
    
    // Context functions
    blockUser,
    unblockUser,
    reportUser,
    blockedUsers,
    reportedUsers,
    
    // Refs
    messagesEndRef,
    mounted
  };
};