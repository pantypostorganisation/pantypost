// src/hooks/useSellerMessages.ts - COMPLETE FIXED VERSION
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
  date: z.string().datetime(),
  read: z.boolean().optional(),
  type: z.enum(['normal', 'customRequest', 'image', 'tip']).optional(),
  meta: z.object({
    id: z.string().uuid().optional(),
    title: z.string().max(200).optional(),
    price: z.number().min(0).max(10000).optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    message: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    tipAmount: z.number().min(1).max(500).optional(),
  }).optional(),
});

type Message = z.infer<typeof MessageSchema>;

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
    getMessagesForUsers
  } = useMessages();
  const { requests, addRequest, getRequestsForUser, respondToRequest, markRequestAsPaid, getRequestById } = useRequests();
  const { getBuyerBalance, purchaseCustomRequest } = useWallet();
  const searchParams = useSearchParams();
  
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
    if (threadParam && !activeThread && user) {
      // Sanitize and validate thread parameter
      const sanitizedThread = sanitizeStrict(threadParam);
      if (sanitizedThread && sanitizedThread.length <= 100) {
        setActiveThread(sanitizedThread);
      }
    }
  }, [searchParams, user]);
  
  // Process messages into threads with validation
  const { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount } = useMemo(() => {
    const threads: { [buyer: string]: Message[] } = {};
    const unreadCounts: { [buyer: string]: number } = {};
    const lastMessages: { [buyer: string]: Message } = {};
    const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (!user) {
      return { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
    }
    
    // Process all messages to find conversations where the seller is involved
    Object.entries(messages).forEach(([conversationKey, msgs]) => {
      if (!Array.isArray(msgs) || msgs.length === 0) return;
      
      // Validate and sanitize messages
      const validMessages = msgs.filter(msg => {
        try {
          // Validate message structure
          MessageSchema.parse(msg);
          return true;
        } catch (error) {
          console.warn('Invalid message skipped:', error);
          return false;
        }
      });
      
      // Check each message to see if our seller is involved
      validMessages.forEach((msg) => {
        // Only process if the current user (seller) is either sender or receiver
        if (msg.sender === user.username || msg.receiver === user.username) {
          // Determine the other party
          const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
          
          // Skip if other party is also a seller/admin
          const otherUser = users?.[otherParty];
          if (otherUser?.role === 'seller' || otherUser?.role === 'admin') {
            return;
          }
          
          // Initialize thread if not exists
          if (!threads[otherParty]) {
            threads[otherParty] = [];
            
            // Get buyer profile
            const buyerInfo = users?.[otherParty];
            const isVerified = buyerInfo?.verified || buyerInfo?.verificationStatus === 'verified';
            
            buyerProfiles[otherParty] = { 
              pic: null,
              verified: isVerified
            };
          }
        }
      });
    });
    
    // Now populate the threads with actual messages
    Object.keys(threads).forEach(buyer => {
      const conversationKey = getConversationKey(user.username, buyer);
      const conversationMessages = messages[conversationKey] || [];
      
      if (conversationMessages.length > 0) {
        // Validate and sort messages by date
        const validMessages = conversationMessages.filter(msg => {
          try {
            MessageSchema.parse(msg);
            return true;
          } catch {
            return false;
          }
        });
        
        threads[buyer] = validMessages.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Get last message
        if (threads[buyer].length > 0) {
          lastMessages[buyer] = threads[buyer][threads[buyer].length - 1];
        }
        
        // Count unread messages (messages FROM buyer TO seller)
        const threadUnreadCount = threads[buyer].filter(
          (msg) => !msg.read && msg.sender === buyer && msg.receiver === user.username
        ).length;
        
        unreadCounts[buyer] = threadUnreadCount;
        
        // Add to total if not already marked as read
        if (!readThreadsRef.current.has(buyer) && threadUnreadCount > 0) {
          totalUnreadCount += threadUnreadCount;
        }
      }
    });
    
    return { threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
  }, [user?.username, messages, users]);
  
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
  }, [user?.username, getRequestsForUser]);
  
  // Compute UI unread counts
  const uiUnreadCounts = useMemo(() => {
    const counts: { [buyer: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(buyer => {
        counts[buyer] = readThreadsRef.current.has(buyer) ? 0 : unreadCounts[buyer];
      });
    }
    return counts;
  }, [threads, unreadCounts]);
  
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
    
    return;
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
  
  // Handle sending reply with validation and rate limiting
  const handleReply = useCallback(() => {
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
      
      if (!validationResult.success) {
        setValidationErrors({ message: validationResult.error.errors[0].message });
        return;
      }

      const sanitizedContent = sanitizeHtml(validationResult.data);

      // For image messages, validate URL
      if (selectedImage) {
        const urlValidation = z.string().url().safeParse(selectedImage);
        if (!urlValidation.success) {
          setValidationErrors({ image: 'Invalid image URL' });
          return;
        }
      }

      console.log('Sending message:', {
        text: sanitizedContent,
        imageUrl: selectedImage,
        receiver: activeThread
      });

      // For image messages, ensure we have content even if text is empty
      const messageContent = sanitizedContent || (selectedImage ? '' : '');

      sendMessage(user.username, activeThread, messageContent, {
        type: selectedImage ? 'image' : 'normal',
        meta: selectedImage ? { imageUrl: selectedImage } : undefined,
      });
      
      setReplyMessage('');
      setSelectedImage(null);
      setImageError(null);
      setShowEmojiPicker(false);
      setValidationErrors({});
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
  }, [activeThread, user, isBlocked, unblockUser, blockUser]);
  
  // Handle report
  const handleReport = useCallback(() => {
    if (!activeThread || !user) return;
    
    if (!hasReported(user.username, activeThread)) {
      reportUser(user.username, activeThread);
    }
  }, [activeThread, user, hasReported, reportUser]);
  
  // Handle accepting custom request with validation
  const handleAccept = useCallback(async (customRequestId: string) => {
    if (!user) return;
    
    // Validate request ID
    if (!z.string().uuid().safeParse(customRequestId).success) {
      console.error('Invalid request ID');
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
  }, [user, requests, getBuyerBalance, purchaseCustomRequest, markRequestAsPaid, addSellerNotification, sendMessage, respondToRequest, checkRequestLimit]);
  
  // Handle declining custom request
  const handleDecline = useCallback((customRequestId: string) => {
    if (!user) return;
    
    // Validate request ID
    if (!z.string().uuid().safeParse(customRequestId).success) {
      console.error('Invalid request ID');
      return;
    }
    
    respondToRequest(customRequestId, 'rejected', undefined, undefined, user.username);
    
    const request = requests.find(r => r.id === customRequestId);
    if (request) {
      sendMessage(user.username, request.buyer, `Your custom request "${sanitizeStrict(request.title)}" has been declined.`, {
        type: 'normal'
      });
    }
  }, [user, respondToRequest, requests, sendMessage]);
  
  // Handle custom request editing with validation
  const handleEditRequest = useCallback((requestId: string, title: string, price: number, message: string) => {
    // Validate inputs
    if (!z.string().uuid().safeParse(requestId).success) {
      console.error('Invalid request ID');
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
      
      // Additional security check for file content
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          
          // Check if it's actually an image
          if (!dataUrl.startsWith('data:image/')) {
            throw new Error('File is not a valid image');
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
          console.error('Image validation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to validate image';
          setImageError(errorMessage);
          setSelectedImage(null);
        } finally {
          setIsImageLoading(false);
        }
      };
      
      reader.onerror = () => {
        setImageError('Failed to read file');
        setIsImageLoading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      setImageError(errorMessage);
      setSelectedImage(null);
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
