'use client';

import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCheck,
  Send,
  MessageSquare,
  Paperclip,
  X,
  BadgeCheck,
  Smile,
  User,
  Image,
  Heart,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  ArrowRightCircle,
  ShoppingBag,
  Package,
  Filter,
  MessageCircle,
  BellRing
} from 'lucide-react';

// Constants
const ADMIN_ACCOUNTS = ['oakley', 'gerome'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// All emojis in a single flat array
const ALL_EMOJIS = [
  // Smileys and people
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕',
  // Animals and nature
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦆', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃',
  // Food and drink
  '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚',
  // Activities and sports
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤',
  // Travel and places
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '🪝', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿',
  // Objects 
  '⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠',
  // Symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑',
  // Flags
  '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️'
];

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

export default function SellerMessagesPage() {
  const { user, addSellerNotification, users } = useListings();
  const {
    getMessagesForSeller,
    markMessagesAsRead,
    sendMessage,
    blockUser,
    unblockUser,
    reportUser,
    isBlocked,
    hasReported,
    messages,
  } = useMessages();
  const { getRequestsForUser, respondToRequest, requests } = useRequests();
  const { wallet } = useWallet();
  const searchParams = useSearchParams();

  // State
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [messageUpdate, setMessageUpdate] = useState(0); // Force update for message read status
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readThreadsRef = useRef<Set<string>>(new Set());

  // Load recent emojis from localStorage on component mount
  useEffect(() => {
    const storedRecentEmojis = localStorage.getItem('panty_recent_emojis');
    if (storedRecentEmojis) {
      try {
        const parsed = JSON.parse(storedRecentEmojis);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed.slice(0, 30)); // Limit to 30 recent emojis
        }
      } catch (e) {
        console.error('Failed to parse recent emojis', e);
      }
    }
    
    // Load previously read threads from localStorage
    try {
      // Get read threads from localStorage only if user exists
      if (user) {
        const readThreadsKey = `panty_read_threads_${user.username}`;
        const readThreads = localStorage.getItem(readThreadsKey);
        if (readThreads) {
          const threads = JSON.parse(readThreads);
          if (Array.isArray(threads)) {
            readThreadsRef.current = new Set(threads);
            setMessageUpdate(prev => prev + 1); // Force UI update
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
  const threadParam = searchParams?.get('thread');

  // Set active thread from URL parameter
  useEffect(() => {
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user]);

  // Memoize messages data to improve performance
  const { 
    sellerMessages, 
    threads, 
    unreadCounts, 
    lastMessages, 
    buyerProfiles, 
    totalUnreadCount 
  } = useMemo(() => {
    let sellerMessages: Message[] = [];
    const threads: { [buyer: string]: Message[] } = {};
    const unreadCounts: { [buyer: string]: number } = {};
    const lastMessages: { [buyer: string]: Message } = {};
    const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
    if (user) {
      // Get all messages for the seller
      sellerMessages = Object.values(messages)
        .flat()
        .filter(
          (msg: Message) =>
            msg.sender === user.username || msg.receiver === user.username
        );
        
      // Organize messages into threads by buyer
      sellerMessages.forEach((msg) => {
        const otherParty =
          msg.sender === user.username ? msg.receiver : msg.sender;
        if (!threads[otherParty]) threads[otherParty] = [];
        threads[otherParty].push(msg);
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
        
        // Count only messages FROM buyer TO seller as unread (fix for notification issue)
        const threadUnreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === buyer && msg.receiver === user?.username
        ).length;
        
        unreadCounts[buyer] = threadUnreadCount;
        
        // Only add to total if not in readThreadsRef
        if (!readThreadsRef.current.has(buyer) && threadUnreadCount > 0) {
          totalUnreadCount += threadUnreadCount;
        }
      });
    }
    
    return { sellerMessages, threads, unreadCounts, lastMessages, buyerProfiles, totalUnreadCount };
  }, [user, messages, users, messageUpdate]);

  // Memoize sellerRequests to avoid recalculation
  const sellerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'seller') : [];
  }, [user, getRequestsForUser]);

  // Process messages to handle custom requests correctly
  function getLatestCustomRequestMessages(messages: any[], requests: any[]) {
    const seen = new Set();
    const result: any[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
        if (!seen.has(msg.meta.id)) {
          seen.add(msg.meta.id);
          result.unshift(msg);
        }
      } else {
        result.unshift(msg);
      }
    }
    return result;
  }

  // Get the messages for the active thread
  const threadMessages = useMemo(() => {
    return activeThread
      ? getLatestCustomRequestMessages(threads[activeThread] || [], sellerRequests)
      : [];
  }, [activeThread, threads, sellerRequests]);

  // Update UI when messages change
  useEffect(() => {
    // When messages change, update the UI to reflect message read status
    setMessageUpdate(prev => prev + 1);
  }, [messages]);
  
  // Reset the readThreadsRef when logging in/out
  useEffect(() => {
    // When user changes, reset the readThreadsRef
    readThreadsRef.current = new Set();
    setMessageUpdate(prev => prev + 1);
  }, [user?.username]);
  
  // Calculate UI unread count indicators for the sidebar threads
  const uiUnreadCounts = useMemo(() => {
    const counts: { [buyer: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(buyer => {
        // If thread is in readThreadsRef, show 0 in the UI regardless of actual message read status
        counts[buyer] = readThreadsRef.current.has(buyer) ? 0 : unreadCounts[buyer];
      });
    }
    return counts;
  }, [threads, unreadCounts, messageUpdate]);
  
  // Debug helper - log counts
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Total unread count:', totalUnreadCount);
      console.log('UI unread counts:', uiUnreadCounts);
      console.log('Read threads ref:', Array.from(readThreadsRef.current));
    }
  }, [totalUnreadCount, uiUnreadCounts]);
  
  // Save read threads to localStorage
  useEffect(() => {
    if (user && readThreadsRef.current.size > 0 && typeof window !== 'undefined') {
      const readThreadsKey = `panty_read_threads_${user.username}`;
      const threadsArray = Array.from(readThreadsRef.current);
      localStorage.setItem(readThreadsKey, JSON.stringify(threadsArray));
      
      // Dispatch a custom event to notify other components about the update
      const event = new CustomEvent('readThreadsUpdated', { 
        detail: { threads: threadsArray, username: user.username }
      });
      window.dispatchEvent(event);
    }
  }, [messageUpdate, user]);

  // Set up UI tracking for active thread
  useEffect(() => {
    if (activeThread && user) {
      // Add to readThreadsRef if there are unread messages
      if (unreadCounts[activeThread] > 0) {
        if (!readThreadsRef.current.has(activeThread)) {
          // Only add to readThreadsRef if there are actual unread messages
          readThreadsRef.current.add(activeThread);
          
          // Save to localStorage immediately when thread is selected
          if (typeof window !== 'undefined') {
            const readThreadsKey = `panty_read_threads_${user.username}`;
            localStorage.setItem(readThreadsKey, JSON.stringify(Array.from(readThreadsRef.current)));
          }
          
          setMessageUpdate(prev => prev + 1); // Force UI update only once
        }
      }
      
      // Create a custom event to notify other components about thread selection
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('threadSelected', { 
          detail: { thread: activeThread, username: user.username }
        });
        window.dispatchEvent(event);
      }
    }
  }, [activeThread, user, unreadCounts]);

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

  // Auto-scroll to bottom when new messages arrive or thread changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, threadMessages.length]);

  // Handle image file selection with validation and error handling
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImageError(null);
    
    if (!file) return;
    
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }
    
    // Validate file size
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

  // Trigger hidden file input click
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle emoji selection
  const handleEmojiClick = useCallback((emoji: string) => {
    setReplyMessage(prev => prev + emoji);
    
    // Update recent emojis
    setRecentEmojis(prev => {
      // Remove if already exists to prevent duplicates
      const filtered = prev.filter(e => e !== emoji);
      // Add to the front and return limited array
      return [emoji, ...filtered].slice(0, 30);
    });
    
    // Focus back on the input after inserting emoji
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, []);

  // Handle sending replies
  const handleReply = useCallback(() => {
    if (!activeThread || !user) return;

    const textContent = replyMessage.trim();

    if (!textContent && !selectedImage) {
      // Don't send empty messages
      return;
    }

    // Sellers cannot send custom requests from this page, only normal or image messages
    sendMessage(user.username, activeThread, textContent, {
      type: selectedImage ? 'image' : 'normal', // Set type based on image presence
      meta: selectedImage ? { imageUrl: selectedImage } : undefined, // Include image URL in meta
    });

    // Don't add notification for seller's own message - this is handled in MessageContext now

    setReplyMessage('');
    setSelectedImage(null); // Clear selected image after sending
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    
    // Close emoji picker if open
    setShowEmojiPicker(false);
    
    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [activeThread, user, replyMessage, selectedImage, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  }, [handleReply]);

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

  // Track which threads have been explicitly viewed and mark as read
  const [viewedThreads, setViewedThreads] = useState<Set<string>>(new Set());

  // Mark messages as read when explicitly viewed by user
  const markAsRead = useCallback(() => {
    if (!activeThread || !user) return;
    
    // Remember that this thread has been viewed
    setViewedThreads(prev => {
      const newSet = new Set(prev);
      newSet.add(activeThread);
      return newSet;
    });
    
    const hasUnreadMessages = threads[activeThread]?.some(
      msg => !msg.read && msg.sender === activeThread && msg.receiver === user.username
    );
    
    if (hasUnreadMessages) {
      // Mark messages as read in the context
      markMessagesAsRead(activeThread, user.username);
      
      // Make sure we update readThreadsRef for UI consistency
      if (!readThreadsRef.current.has(activeThread)) {
        readThreadsRef.current.add(activeThread);
        
        // Save to localStorage immediately when messages are read
        if (typeof window !== 'undefined') {
          const readThreadsKey = `panty_read_threads_${user.username}`;
          localStorage.setItem(readThreadsKey, JSON.stringify(Array.from(readThreadsRef.current)));
          
          // Dispatch custom event to notify other components
          const event = new CustomEvent('readThreadsUpdated', { 
            detail: { threads: Array.from(readThreadsRef.current), username: user.username }
          });
          window.dispatchEvent(event);
        }
        
        setMessageUpdate(prev => prev + 1);
      }
    }
  }, [activeThread, user, threads, markMessagesAsRead]);

  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));

  // Handle thread selection without marking as read immediately
  const handleThreadSelect = useCallback((buyerId: string) => {
    if (activeThread === buyerId) return; // Prevent unnecessary state updates
    
    setActiveThread(buyerId);
    
    // Don't set messageUpdate here - it will be handled in the useEffect
  }, [activeThread]);

  // Filter and sort threads
  const filteredAndSortedThreads = useMemo(() => {
    // Filter threads by search query and unread status
    const filteredThreads = Object.keys(threads).filter(buyer => {
      const matchesSearch = searchQuery ? buyer.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      
      if (!matchesSearch) return false;
      
      // For 'unread' filter, consider thread as unread if it has unread messages AND is not in readThreadsRef
      if (filterBy === 'unread') {
        const hasUnread = unreadCounts[buyer] > 0 && !readThreadsRef.current.has(buyer);
        if (!hasUnread) return false;
      }
      
      return true;
    });
    
    // Sort threads by most recent message first
    return filteredThreads.sort((a, b) => {
      const dateA = new Date(lastMessages[a]?.date || 0).getTime();
      const dateB = new Date(lastMessages[b]?.date || 0).getTime();
      return dateB - dateA;
    });
  }, [threads, lastMessages, unreadCounts, searchQuery, filterBy]);

  // Create a status badge component
  function statusBadge(status: string) {
    let color = 'bg-yellow-500 text-white';
    let label = status.toUpperCase();
    let icon = <Clock size={12} className="mr-1" />;
    
    if (status === 'accepted') {
      color = 'bg-green-600 text-white';
      icon = <CheckCircle2 size={12} className="mr-1" />;
    }
    else if (status === 'rejected') {
      color = 'bg-red-600 text-white';
      icon = <XCircle size={12} className="mr-1" />;
    }
    else if (status === 'edited') {
      color = 'bg-blue-600 text-white';
      icon = <Edit3 size={12} className="mr-1" />;
    }
    else if (status === 'paid') {
      color = 'bg-green-800 text-white';
      icon = <ShoppingBag size={12} className="mr-1" />;
    }
    else if (status === 'pending') {
      color = 'bg-yellow-500 text-white';
      icon = <Clock size={12} className="mr-1" />;
    }
    
    return (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold flex items-center ${color}`}>
        {icon}
        {label}
      </span>
    );
  }

  // Handle editing requests
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
    
    // Validate inputs
    if (!editTitle.trim() || editPrice === '' || isNaN(Number(editPrice)) || Number(editPrice) <= 0) {
      alert('Please enter a valid title and price for your edit.');
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
      }
    );

    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
  }, [
    user, 
    activeThread, 
    editRequestId, 
    editTitle, 
    editPrice, 
    editTags, 
    editMessage, 
    respondToRequest
  ]);

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

  // Determine if the user is the last editor of a custom request
  function isLastEditor(customReq: any) {
    if (!customReq) return false;
    const lastMsg = threadMessages
      .filter(
        (msg) =>
          msg.type === 'customRequest' &&
          msg.meta &&
          msg.meta.id === customReq.id
      )
      .slice(-1)[0];
    return lastMsg && lastMsg.sender === user?.username;
  }

  // Get the initial for avatar placeholder
  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // Format time function
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return diffDays === 1 ? '1d ago' : `${diffDays}d ago`;
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) {
      return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 0) {
      return diffMinutes === 1 ? '1m ago' : `${diffMinutes}m ago`;
    }
    
    return 'Just now';
  };

  // Check if content is a single emoji
  const isSingleEmoji = (content: string) => {
    // Regex to match a single emoji (including compound emojis with ZWJ)
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
    return emojiRegex.test(content);
  };

  // Check if user is admin
  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  return (
    <RequireAuth role="seller">
      {/* Top Padding */}
      <div className="py-3 bg-black"></div>
      
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
          {/* Left column - Message threads */}
          <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
            {/* Seller header */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-2xl font-bold text-[#ff950e] mb-2 flex items-center">
                <MessageCircle size={24} className="mr-2 text-[#ff950e]" />
                {isAdmin ? 'Admin Messages' : 'My Messages'}
              </h2>
              <div className="flex space-x-2 mb-3">
                <button 
                  onClick={() => setFilterBy('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
                    filterBy === 'all' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  <Filter size={14} className="mr-1" />
                  All Messages
                </button>
                <button 
                  onClick={() => setFilterBy('unread')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
                    filterBy === 'unread' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  <BellRing size={14} className="mr-1" />
                  Unread
                  {totalUnreadCount > 0 && (
                    <span className="ml-1 bg-[#ff950e] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-black">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Buyers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 px-4 pr-10 rounded-full bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <Search size={18} />
                </div>
              </div>
            </div>
            
            {/* Thread list */}
            <div className="flex-1 overflow-y-auto bg-[#121212]">
              {filteredAndSortedThreads.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No conversations found
                </div>
              ) : (
                filteredAndSortedThreads.map((buyer) => {
                  const thread = threads[buyer];
                  const lastMessage = lastMessages[buyer];
                  const isActive = activeThread === buyer;
                  const buyerProfile = buyerProfiles[buyer];
                  
                  return (
                    <div 
                      key={buyer}
                      onClick={() => handleThreadSelect(buyer)}
                      className={`flex items-center p-3 cursor-pointer relative border-b border-gray-800 ${
                        isActive ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'
                      } transition-colors duration-150 ease-in-out`}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]"></div>
                      )}
                      
                      {/* Avatar with unread indicator */}
                      <div className="relative mr-3">
                        <div className="relative w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
                          {buyerProfile?.pic ? (
                            <img src={buyerProfile.pic} alt={buyer} className="w-full h-full object-cover" />
                          ) : (
                            getInitial(buyer)
                          )}
                          
                          {/* Verified badge if applicable */}
                          {buyerProfile?.verified && (
                            <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
                              <BadgeCheck size={12} className="text-[#ff950e]" />
                            </div>
                          )}
                        </div>
                        
                        {/* Unread indicator - only show when there are unread messages */}
                        {uiUnreadCounts[buyer] > 0 && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212] shadow-lg">
                            {uiUnreadCounts[buyer]}
                          </div>
                        )}
                      </div>
                      
                      {/* Message preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-white truncate">{buyer}</h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-1 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {lastMessage ? formatTimeAgo(lastMessage.date) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">
                          {lastMessage ? (
                            lastMessage.type === 'customRequest' 
                              ? '🛠️ Custom Request'
                              : lastMessage.type === 'image'
                                ? '📷 Image'
                                : lastMessage.content
                          ) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Right column - Active conversation */}
          <div className="w-full md:w-2/3 flex flex-col bg-[#121212]">
            {activeThread ? (
              <>
                {/* Conversation header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800 bg-[#1a1a1a]">
                  <div className="flex items-center">
                    <div className="relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden shadow-md">
                      {buyerProfiles[activeThread]?.pic ? (
                        <img src={buyerProfiles[activeThread].pic} alt={activeThread} className="w-full h-full object-cover" />
                      ) : (
                        getInitial(activeThread)
                      )}
                      
                      {/* Verified badge if applicable */}
                      {buyerProfiles[activeThread]?.verified && (
                        <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
                          <BadgeCheck size={12} className="text-[#ff950e]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-white">{activeThread}</h2>
                      <p className="text-xs text-[#ff950e] flex items-center">
                        <Sparkles size={12} className="mr-1 text-[#ff950e]" />
                        Active now
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 text-white">
                    <button 
                      onClick={handleReport}
                      disabled={isUserReported}
                      className={`px-3 py-1 text-xs border rounded flex items-center ${
                        isUserReported ? 'text-gray-400 border-gray-500' : 'text-red-500 border-red-500 hover:bg-red-500/10'
                      } transition-colors duration-150`}
                    >
                      <AlertTriangle size={12} className="mr-1" />
                      {isUserReported ? 'Reported' : 'Report'}
                    </button>
                    <button
                      onClick={handleBlockToggle}
                      className={`px-3 py-1 text-xs border rounded flex items-center ${
                        isUserBlocked ? 'text-green-500 border-green-500 hover:bg-green-500/10' : 'text-red-500 border-red-500 hover:bg-red-500/10'
                      } transition-colors duration-150`}
                    >
                      <ShieldAlert size={12} className="mr-1" />
                      {isUserBlocked ? 'Unblock' : 'Block'}
                    </button>
                  </div>
                </div>
                
                {/* Messages - This div now has onClick to mark messages as read */}
                <div 
                  className="flex-1 overflow-y-auto p-4 bg-[#121212]"
                  onClick={() => {
                    if (!viewedThreads.has(activeThread || '')) {
                      markAsRead(); // Mark as read only when first interacting with messages
                    }
                  }}
                >
                  <div className="max-w-3xl mx-auto space-y-4">
                    {threadMessages.map((msg, index) => {
                      const isFromMe = msg.sender === user?.username;
                      const time = new Date(msg.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      // Check if message contains only a single emoji
                      const isSingleEmojiMsg = msg.content && isSingleEmoji(msg.content);
                      
                      let customReq: any = undefined;
                      let metaId: string | undefined = undefined;
                      if (
                        msg.type === 'customRequest' &&
                        typeof msg.meta === 'object' &&
                        msg.meta !== null &&
                        'id' in msg.meta &&
                        typeof (msg.meta as any).id === 'string'
                      ) {
                        metaId = (msg.meta as any).id as string;
                        customReq = sellerRequests.find((r) => r.id === metaId);
                      }

                      const isLatestCustom =
                        !!customReq &&
                        (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
                        index === (threadMessages.length - 1) &&
                        msg.type === 'customRequest';

                      const isPaid = customReq && (customReq.paid || customReq.status === 'paid');

                      const showActionButtons =
                        !!customReq &&
                        isLatestCustom &&
                        customReq.status === 'pending' &&
                        !isLastEditor(customReq);
                      
                      return (
                        <div key={index} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-lg p-3 max-w-[75%] ${
                            isFromMe 
                              ? 'bg-[#ff950e] text-white shadow-lg' 
                              : 'bg-[#333] text-white shadow-md'
                          }`}
                          >
                            {/* Message header */}
                            <div className="flex items-center text-xs mb-1">
                              <span className={isFromMe ? 'text-white opacity-75' : 'text-gray-300'}>
                                {isFromMe ? 'You' : msg.sender} • {time}
                              </span>
                              {/* Only show Read/Sent for messages that the seller sends, not messages they receive */}
                              {isFromMe && (
                                <span className="ml-2 text-[10px]">
                                  {msg.read ? (
                                    <span className={`flex items-center ${isFromMe ? 'text-white opacity-75' : 'text-gray-400'}`}>
                                      <CheckCheck size={12} className="mr-1" /> Read
                                    </span>
                                  ) : (
                                    <span className={isFromMe ? 'text-white opacity-50' : 'text-gray-400'}>Sent</span>
                                  )}
                                </span>
                              )}
                            </div>
                            
                            {/* Image message */}
                            {msg.type === 'image' && msg.meta?.imageUrl && (
                              <div className="mt-1 mb-2">
                                <img 
                                  src={msg.meta.imageUrl} 
                                  alt="Shared image" 
                                  className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering the container's onClick
                                    setPreviewImage(msg.meta?.imageUrl || null);
                                  }}
                                />
                                {msg.content && (
                                  <p className={`text-white mt-2 ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                                    {msg.content}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Text content */}
                            {msg.type !== 'image' && msg.type !== 'customRequest' && (
                              <p className={`text-white ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                                {msg.content}
                              </p>
                            )}
                            
                            {/* Custom request content */}
                            {msg.type === 'customRequest' && msg.meta && (
                              <div className="mt-2 text-sm text-orange-400 space-y-1 border-t border-white/20 pt-2">
                                <p className="font-semibold flex items-center">
                                  <Package size={16} className="mr-1" />
                                  Custom Request
                                </p>
                                <p><b>Title:</b> {customReq ? customReq.title : msg.meta.title}</p>
                                <p><b>Price:</b> {customReq ? `$${customReq.price.toFixed(2)}` : `$${msg.meta.price?.toFixed(2)}`}</p>
                                <p><b>Tags:</b> {customReq ? customReq.tags?.join(', ') : msg.meta.tags?.join(', ')}</p>
                                {(customReq ? customReq.description : msg.meta.message) && (
                                  <p><b>Message:</b> {customReq ? customReq.description : msg.meta.message}</p>
                                )}
                                {customReq && (
                                  <p className="flex items-center">
                                    <b>Status:</b>
                                    {statusBadge(customReq.status)}
                                  </p>
                                )}
                                {isPaid && (
                                  <span className="text-green-400 font-bold flex items-center">
                                    <ShoppingBag size={14} className="mr-1" />
                                    Paid ✅
                                  </span>
                                )}
                                {showActionButtons && !isPaid && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the container's onClick
                                        customReq && handleAccept(customReq);
                                      }}
                                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-800 flex items-center transition-colors duration-150"
                                    >
                                      <CheckCircle2 size={12} className="mr-1" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the container's onClick
                                        customReq && handleDecline(customReq);
                                      }}
                                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-800 flex items-center transition-colors duration-150"
                                    >
                                      <XCircle size={12} className="mr-1" />
                                      Decline
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the container's onClick
                                        customReq && handleEditRequest(customReq);
                                      }}
                                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-800 flex items-center transition-colors duration-150"
                                    >
                                      <Edit3 size={12} className="mr-1" />
                                      Edit
                                    </button>
                                  </div>
                                )}
                                {editRequestId === customReq?.id && customReq && (
                                  <div className="mt-2 space-y-2 bg-black/30 p-2 rounded">
                                    <input
                                      type="text"
                                      placeholder="Title"
                                      value={editTitle}
                                      onChange={e => setEditTitle(e.target.value)}
                                      className="w-full p-2 border rounded bg-black border-gray-700 text-white"
                                      onClick={(e) => e.stopPropagation()} // Prevent triggering the container's onClick
                                    />
                                    <input
                                      type="number"
                                      placeholder="Price (USD)"
                                      value={editPrice}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setEditPrice(val === '' ? '' : Number(val));
                                      }}
                                      min="0.01"
                                      step="0.01"
                                      className="w-full p-2 border rounded bg-black border-gray-700 text-white"
                                      onClick={(e) => e.stopPropagation()} // Prevent triggering the container's onClick
                                    />
                                    <input
                                      type="text"
                                      placeholder="Tags (comma-separated)"
                                      value={editTags}
                                      onChange={e => setEditTags(e.target.value)}
                                      className="w-full p-2 border rounded bg-black border-gray-700 text-white"
                                      onClick={(e) => e.stopPropagation()} // Prevent triggering the container's onClick
                                    />
                                    <textarea
                                      placeholder="Message"
                                      value={editMessage}
                                      onChange={e => setEditMessage(e.target.value)}
                                      className="w-full p-2 border rounded bg-black border-gray-700 text-white"
                                      onClick={(e) => e.stopPropagation()} // Prevent triggering the container's onClick
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent triggering the container's onClick
                                          handleEditSubmit();
                                        }}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-800 flex items-center transition-colors duration-150"
                                      >
                                        <Edit3 size={12} className="mr-1" />
                                        Submit Edit
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent triggering the container's onClick
                                          setEditRequestId(null);
                                        }}
                                        className="bg-gray-700 text-white px-3 py-1 rounded text-xs hover:bg-gray-600 flex items-center transition-colors duration-150"
                                      >
                                        <X size={12} className="mr-1" />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Message input and emoji picker */}
                {!isUserBlocked && (
                  <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
                    {/* Emoji Picker - position ABOVE the input */}
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden"
                      >
                        {/* Recent Emojis Section */}
                        {recentEmojis.length > 0 && (
                          <div className="px-3 pt-3">
                            <div className="text-xs text-gray-400 mb-2">Recent</div>
                            <div className="grid grid-cols-8 gap-1 mb-3">
                              {recentEmojis.slice(0, 16).map((emoji, index) => (
                                <span
                                  key={`recent-${index}`}
                                  onClick={() => handleEmojiClick(emoji)}
                                  className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
                                >
                                  {emoji}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* All Emojis */}
                        <div className="px-3 pt-2 pb-3">
                          {recentEmojis.length > 0 && (
                            <div className="text-xs text-gray-400 mb-2">All Emojis</div>
                          )}
                          <div className="grid grid-cols-8 gap-1 p-0 overflow-auto" style={{ maxHeight: '200px' }}>
                            {ALL_EMOJIS.map((emoji, index) => (
                              <span
                                key={`emoji-${index}`}
                                onClick={() => handleEmojiClick(emoji)}
                                className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
                              >
                                {emoji}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Selected image preview */}
                    {selectedImage && (
                      <div className="px-4 pt-3 pb-2">
                        <div className="relative inline-block">
                          <img src={selectedImage} alt="Preview" className="max-h-20 rounded shadow-md" />
                          <button
                            onClick={() => {
                              setSelectedImage(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110"
                            style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Image loading and error states */}
                    {isImageLoading && (
                      <div className="px-4 pt-3 pb-0 text-sm text-gray-400">
                        Loading image...
                      </div>
                    )}
                    
                    {imageError && (
                      <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center">
                        <AlertTriangle size={14} className="mr-1" />
                        {imageError}
                      </div>
                    )}
                    
                    {/* Message input */}
                    <div className="px-4 py-3">
                      <div className="relative mb-2">
                        <textarea
                          ref={inputRef}
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={selectedImage ? "Add a caption..." : "Type a message"}
                          className="w-full p-3 pr-12 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] min-h-[40px] max-h-20 resize-none overflow-auto leading-tight"
                          rows={1}
                          maxLength={250}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering message container's onClick for marking as read
                            markAsRead(); // But still mark messages as read when focusing the input
                          }}
                        />
                        
                        {/* Fixed emoji button position */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering message container's onClick
                            setShowEmojiPicker(!showEmojiPicker);
                            markAsRead(); // Mark messages as read when interacting with emoji button
                          }}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 mt-[-4px] flex items-center justify-center h-8 w-8 rounded-full ${
                            showEmojiPicker 
                              ? 'bg-[#ff950e] text-black' 
                              : 'text-[#ff950e] hover:bg-[#333]'
                          } transition-colors duration-150`}
                          title="Emoji"
                          type="button"
                        >
                          <Smile size={20} className="flex-shrink-0" />
                        </button>
                      </div>
                      
                      {/* Character count */}
                      {replyMessage.length > 0 && (
                        <div className="text-xs text-gray-400 mb-2 text-right">
                          {replyMessage.length}/250
                        </div>
                      )}
                      
                      {/* Bottom row with attachment and send buttons */}
                      <div className="flex justify-between items-center">
                        {/* Attachment button - Left aligned with vertical adjustment */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering message container's onClick
                            triggerFileInput();
                            markAsRead(); // Mark messages as read when interacting with attachment button
                          }}
                          disabled={isImageLoading}
                          className={`flex items-center justify-center h-10 w-10 rounded-full mt-[-6px] ${
                            isImageLoading 
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                              : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                          } transition-colors duration-150 shadow-md`}
                          title="Attach Image"
                        >
                          <Image size={20} className="flex-shrink-0" />
                        </button>
                        
                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleImageSelect}
                        />
                        
                        {/* Send Button - Right aligned */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering message container's onClick
                            handleReply();
                            markAsRead(); // Mark messages as read when sending a message
                          }}
                          disabled={(!replyMessage.trim() && !selectedImage) || isImageLoading}
                          className={`flex items-center justify-center px-5 py-2 rounded-full ${
                            (!replyMessage.trim() && !selectedImage) || isImageLoading
                              ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                              : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                          } transition-colors duration-150 shadow-md`}
                        >
                          <span className="mr-1">Send</span>
                          <ArrowRightCircle size={16} className="flex-shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {isUserBlocked && (
                  <div className="p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center">
                    <ShieldAlert size={16} className="mr-2" />
                    You have blocked this buyer
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlockToggle();
                      }}
                      className="ml-2 underline text-gray-400 hover:text-white transition-colors duration-150"
                    >
                      Unblock
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center p-4">
                  <div className="flex justify-center mb-4">
                    <MessageCircle size={64} className="text-gray-600" />
                  </div>
                  <p className="text-xl mb-2">Select a conversation to view messages</p>
                  <p className="text-sm">Your messages will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Padding */}
        <div className="py-6 bg-black"></div>
        
        <style jsx global>{`
          .emoji-button::before {
            content: "";
            display: block;
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: black;
            z-index: -1;
          }
          .emoji-button {
            position: relative;
            z-index: 1;
          }
        `}</style>
        
        {/* Image Preview Modal */}
        <ImagePreviewModal
          imageUrl={previewImage || ''}
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
        />
      </div>
    </RequireAuth>
  );
}
