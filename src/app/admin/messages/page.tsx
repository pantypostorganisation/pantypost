// src/app/admin/messages/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import {
  Search,
  ArrowRightCircle,
  CheckCheck,
  X,
  MessageCircle,
  Paperclip,
  User,
  BadgeCheck,
  Smile,
  Image,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Filter,
  BellRing,
  Users,
  MessageSquarePlus,
  ChevronRight
} from 'lucide-react';

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Define the Message type
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

export default function AdminMessagesPage() {
  const { user, users } = useListings();
  const { messages, sendMessage, markMessagesAsRead, blockUser, unblockUser, reportUser, isBlocked, hasReported } = useMessages();
  
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'buyers' | 'sellers'>('all');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewsData, setViewsData] = useState<Record<string, number>>({});
  const [messageUpdate, setMessageUpdate] = useState(0);
  const [showUserDirectory, setShowUserDirectory] = useState(false);
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readThreadsRef = useRef<Set<string>>(new Set());

  // Check if user is admin
  const isAdmin = !!user && (user.username === 'oakley' || user.username === 'gerome');
  const username = user?.username || '';

  // Load views data with error handling
  const loadViews = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('listing_views');
        const parsedData = data ? JSON.parse(data) : {};
        setViewsData(parsedData);
      }
    } catch (error) {
      console.error('Failed to load views data:', error);
      setViewsData({});
    }
  }, []);

  // Load views and handle localStorage events
  useEffect(() => {
    loadViews();
    
    const handleStorageChange = () => loadViews();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [loadViews]);

  // Load recent emojis and read threads
  useEffect(() => {
    try {
      // Load recent emojis
      const storedRecentEmojis = localStorage.getItem('panty_recent_emojis');
      if (storedRecentEmojis) {
        const parsed = JSON.parse(storedRecentEmojis);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed.slice(0, 30));
        }
      }
      
      // Load previously read threads from localStorage
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
    } catch (error) {
      console.error('Failed to load localStorage data:', error);
    }
  }, [user]);

  // Save recent emojis
  useEffect(() => {
    if (recentEmojis.length === 0) return;
    
    try {
      localStorage.setItem('panty_recent_emojis', JSON.stringify(recentEmojis));
    } catch (error) {
      console.error('Failed to save recent emojis:', error);
    }
  }, [recentEmojis]);

  // Handle clicks outside emoji picker
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread, messages]);

  // Prepare threads and messages
  const { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount } = useMemo(() => {
    const threads: { [user: string]: Message[] } = {};
    const unreadCounts: { [user: string]: number } = {};
    const lastMessages: { [user: string]: Message } = {};
    const userProfiles: { [user: string]: { pic: string | null, verified: boolean, role: string } } = {};
    let totalUnreadCount = 0;
    
    let activeMessages: Message[] = [];

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
      Object.entries(threads).forEach(([userKey, msgs]) => {
        lastMessages[userKey] = msgs[msgs.length - 1];
        
        // Get user profile picture and verification status
        try {
          const storedPic = sessionStorage.getItem(`profile_pic_${userKey}`);
          const userInfo = users?.[userKey];
          const isVerified = userInfo?.verified || userInfo?.verificationStatus === 'verified';
          const role = userInfo?.role || 'unknown';
          
          userProfiles[userKey] = { 
            pic: storedPic, 
            verified: isVerified,
            role: role
          };
        } catch (error) {
          console.error(`Error processing user profile for ${userKey}:`, error);
          userProfiles[userKey] = { pic: null, verified: false, role: 'unknown' };
        }
        
        // Count only messages FROM other user TO admin as unread
        const threadUnreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === userKey && msg.receiver === user?.username
        ).length;
        
        unreadCounts[userKey] = threadUnreadCount;
        
        // Only add to total if not in readThreadsRef
        if (!readThreadsRef.current.has(userKey) && threadUnreadCount > 0) {
          totalUnreadCount += 1;
        }
      });
    }

    if (activeThread) {
      activeMessages = threads[activeThread] || [];
    }

    return { threads, unreadCounts, lastMessages, userProfiles, activeMessages, totalUnreadCount };
  }, [messages, username, activeThread, users, messageUpdate]);

  // Get all users for directory
  const allUsers = useMemo(() => {
    const allUsersList = Object.entries(users || {})
      .filter(([username, userInfo]) => 
        username !== user?.username && // Exclude current admin user
        username !== 'oakley' && username !== 'gerome' // Exclude other admins
      )
      .map(([username, userInfo]) => {
        const storedPic = sessionStorage.getItem(`profile_pic_${username}`);
        const isVerified = userInfo?.verified || userInfo?.verificationStatus === 'verified';
        
        return {
          username,
          role: userInfo?.role || 'unknown',
          verified: isVerified,
          pic: storedPic
        };
      });
    
    return allUsersList;
  }, [users, user]);

  // Filter users for directory
  const filteredDirectoryUsers = useMemo(() => {
    return allUsers.filter(userInfo => {
      const matchesSearch = directorySearchQuery ? 
        userInfo.username.toLowerCase().includes(directorySearchQuery.toLowerCase()) : true;
      
      if (!matchesSearch) return false;
      
      if (filterBy === 'buyers' && userInfo.role !== 'buyer') return false;
      if (filterBy === 'sellers' && userInfo.role !== 'seller') return false;
      
      return true;
    }).sort((a, b) => a.username.localeCompare(b.username));
  }, [allUsers, directorySearchQuery, filterBy]);

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
          
          if (typeof window !== 'undefined') {
            const readThreadsKey = `panty_read_threads_${user.username}`;
            localStorage.setItem(readThreadsKey, JSON.stringify(Array.from(readThreadsRef.current)));
            
            const event = new CustomEvent('readThreadsUpdated', { 
              detail: { threads: Array.from(readThreadsRef.current), username: user.username }
            });
            window.dispatchEvent(event);
          }
          
          setMessageUpdate(prev => prev + 1);
        }
      }
      
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('threadSelected', { 
          detail: { thread: activeThread, username: user.username }
        });
        window.dispatchEvent(event);
      }
    }
  }, [activeThread, user, threads, markMessagesAsRead]);

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

  // Handle image file selection
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleEmojiClick = useCallback((emoji: string) => {
    setContent(prev => prev + emoji);
    
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

  const handleSend = useCallback(() => {
    if (!activeThread || (!content.trim() && !selectedImage)) {
      alert('Please enter a message.');
      return;
    }

    sendMessage(username, activeThread, content.trim(), {
      type: selectedImage ? 'image' : 'normal',
      meta: selectedImage ? { imageUrl: selectedImage } : undefined,
    });
    
    setContent('');
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
  }, [activeThread, content, selectedImage, username, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleBlockToggle = useCallback(() => {
    if (!activeThread) return;
    if (isBlocked(username, activeThread)) {
      unblockUser(username, activeThread);
    } else {
      blockUser(username, activeThread);
    }
  }, [activeThread, username, isBlocked, unblockUser, blockUser]);

  const handleReport = useCallback(() => {
    if (activeThread && !hasReported(username, activeThread)) {
      reportUser(username, activeThread);
    }
  }, [activeThread, username, hasReported, reportUser]);

  const handleThreadSelect = useCallback((userId: string) => {
    if (activeThread === userId) return;
    setActiveThread(userId);
    setShowUserDirectory(false);
  }, [activeThread]);

  const handleStartConversation = useCallback((targetUsername: string) => {
    setActiveThread(targetUsername);
    setShowUserDirectory(false);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (selectedUser && !activeThread) {
      setActiveThread(selectedUser);
    }
  }, [selectedUser, activeThread]);

  const isUserBlocked = !!(activeThread && isBlocked(username, activeThread));
  const isUserReported = !!(activeThread && hasReported(username, activeThread));

  // Filter threads by search query and role
  const filteredAndSortedThreads = useMemo(() => {
    const filteredThreads = Object.keys(threads).filter(userKey => {
      const matchesSearch = searchQuery ? userKey.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      
      if (!matchesSearch) return false;
      
      const userRole = userProfiles[userKey]?.role;
      if (filterBy === 'buyers' && userRole !== 'buyer') return false;
      if (filterBy === 'sellers' && userRole !== 'seller') return false;
      
      return true;
    });
    
    return filteredThreads.sort((a, b) => {
      const dateA = new Date(lastMessages[a]?.date || 0).getTime();
      const dateB = new Date(lastMessages[b]?.date || 0).getTime();
      return dateB - dateA;
    });
  }, [threads, lastMessages, searchQuery, filterBy, userProfiles]);

  // Check if content is a single emoji
  const isSingleEmoji = (content: string) => {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
    return emojiRegex.test(content);
  };

  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

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

  // UserListItem component for the directory
  const UserListItem = ({ userInfo }: { userInfo: { username: string; role: string; verified: boolean; pic: string | null } }) => (
    <div 
      onClick={() => handleStartConversation(userInfo.username)}
      className="flex items-center p-3 cursor-pointer hover:bg-[#222] transition-all duration-200 border-b border-gray-800 group"
    >
      {/* User Avatar */}
      <div className="relative mr-3">
        <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md border-2 border-gray-700 group-hover:border-[#ff950e]/50 transition-colors">
          {userInfo.pic ? (
            <img src={userInfo.pic} alt={userInfo.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{getInitial(userInfo.username)}</span>
          )}
        </div>
        
        {/* Role indicator */}
        <div className={`absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg ${
          userInfo.role === 'buyer' 
            ? 'bg-blue-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {userInfo.role === 'buyer' ? 'B' : 'S'}
        </div>
      </div>
      
      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-white truncate group-hover:text-[#ff950e] transition-colors">
            {userInfo.username}
          </h4>
          {userInfo.verified && (
            <BadgeCheck size={14} className="text-[#ff950e] flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-400">
          {userInfo.role === 'buyer' ? 'Buyer Account' : 'Seller Account'}
        </p>
      </div>
      
      {/* Arrow Indicator */}
      <ChevronRight size={16} className="text-gray-500 group-hover:text-[#ff950e] transition-colors flex-shrink-0" />
    </div>
  );

  // Render access denied if not admin
  if (!isAdmin) {
    return (
      <RequireAuth role="admin">
        <div className="h-screen flex items-center justify-center bg-black">
          <div className="bg-[#121212] rounded-lg shadow-lg p-8 max-w-md">
            <h1 className="text-2xl font-bold text-[#ff950e] mb-4">Access Denied</h1>
            <p className="text-gray-300">Only admin users can access this page.</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <div className="py-3 bg-black"></div>
      
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
          {/* Left column - Message threads and User Directory */}
          <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
            {/* Admin header */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-2xl font-bold text-[#ff950e] mb-2 flex items-center">
                <MessageCircle size={24} className="mr-2 text-[#ff950e]" />
                Admin Messages
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
                  All Users
                </button>
                <button 
                  onClick={() => setFilterBy('buyers')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
                    filterBy === 'buyers' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  <User size={14} className="mr-1" />
                  Buyers
                </button>
                <button 
                  onClick={() => setFilterBy('sellers')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
                    filterBy === 'sellers' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  <BellRing size={14} className="mr-1" />
                  Sellers
                  {totalUnreadCount > 0 && (
                    <span className="ml-1 bg-[#ff950e] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-black">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Toggle between conversations and user directory */}
              <div className="flex space-x-1 mb-3 bg-[#222] p-1 rounded-lg">
                <button
                  onClick={() => setShowUserDirectory(false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    !showUserDirectory 
                      ? 'bg-[#ff950e] text-black shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-[#333]'
                  }`}
                >
                  <MessageCircle size={16} className="mr-2 inline" />
                  Conversations
                </button>
                <button
                  onClick={() => setShowUserDirectory(true)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    showUserDirectory 
                      ? 'bg-[#ff950e] text-black shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-[#333]'
                  }`}
                >
                  <Users size={16} className="mr-2 inline" />
                  All Users
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder={showUserDirectory ? "Search all users..." : "Search conversations..."}
                  value={showUserDirectory ? directorySearchQuery : searchQuery}
                  onChange={(e) => showUserDirectory ? setDirectorySearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                  className="w-full py-2 px-4 pr-10 rounded-full bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <Search size={18} />
                </div>
              </div>
            </div>
            
            {/* Content Area - Either Conversations or User Directory */}
            <div className="flex-1 overflow-y-auto bg-[#121212]">
              {showUserDirectory ? (
                /* User Directory */
                <div>
                  {/* User count header */}
                  <div className="px-4 py-2 border-b border-gray-800 bg-[#1a1a1a]">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-400">
                        {filteredDirectoryUsers.length} user{filteredDirectoryUsers.length !== 1 ? 's' : ''} available
                      </p>
                      {(directorySearchQuery || filterBy !== 'all') && (
                        <button 
                          onClick={() => {
                            setDirectorySearchQuery('');
                            setFilterBy('all');
                          }}
                          className="text-xs text-[#ff950e] hover:text-[#ffb04e] transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* User List */}
                  {filteredDirectoryUsers.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <Users size={48} className="mx-auto mb-3 text-gray-600" />
                      <p className="text-lg mb-1">No users found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  ) : (
                    <div>
                      {/* Group users by role if showing all */}
                      {filterBy === 'all' ? (
                        <>
                          {/* Buyers Section */}
                          {filteredDirectoryUsers.filter(u => u.role === 'buyer').length > 0 && (
                            <>
                              <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
                                <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                                  <User size={14} />
                                  Buyers ({filteredDirectoryUsers.filter(u => u.role === 'buyer').length})
                                </h3>
                              </div>
                              {filteredDirectoryUsers
                                .filter(u => u.role === 'buyer')
                                .sort((a, b) => a.username.localeCompare(b.username))
                                .map((userInfo) => (
                                  <UserListItem key={`buyer-${userInfo.username}`} userInfo={userInfo} />
                                ))}
                            </>
                          )}
                          
                          {/* Sellers Section */}
                          {filteredDirectoryUsers.filter(u => u.role === 'seller').length > 0 && (
                            <>
                              <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
                                <h3 className="text-sm font-medium text-green-400 flex items-center gap-2">
                                  <BellRing size={14} />
                                  Sellers ({filteredDirectoryUsers.filter(u => u.role === 'seller').length})
                                </h3>
                              </div>
                              {filteredDirectoryUsers
                                .filter(u => u.role === 'seller')
                                .sort((a, b) => a.username.localeCompare(b.username))
                                .map((userInfo) => (
                                  <UserListItem key={`seller-${userInfo.username}`} userInfo={userInfo} />
                                ))}
                            </>
                          )}
                        </>
                      ) : (
                        /* Filtered view */
                        filteredDirectoryUsers
                          .sort((a, b) => a.username.localeCompare(b.username))
                          .map((userInfo) => (
                            <UserListItem key={userInfo.username} userInfo={userInfo} />
                          ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Existing Conversations */
                <div>
                  {filteredAndSortedThreads.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      <div className="mb-4">
                        <MessageCircle size={48} className="mx-auto text-gray-600 mb-2" />
                        <p className="text-lg mb-2">No conversations found</p>
                        <p className="text-sm mb-4">Switch to "All Users" to start new conversations</p>
                        <button
                          onClick={() => setShowUserDirectory(true)}
                          className="px-4 py-2 bg-[#ff950e] text-black font-medium rounded-lg hover:bg-[#e88800] transition-colors flex items-center justify-center mx-auto"
                        >
                          <Users size={16} className="mr-2" />
                          Browse Users
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredAndSortedThreads.map((userKey) => {
                      const lastMessage = lastMessages[userKey];
                      const isActive = activeThread === userKey;
                      const userProfile = userProfiles[userKey];
                      
                      return (
                        <div 
                          key={userKey}
                          onClick={() => handleThreadSelect(userKey)}
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
                              {userProfile?.pic ? (
                                <img src={userProfile.pic} alt={userKey} className="w-full h-full object-cover" />
                              ) : (
                                getInitial(userKey)
                              )}
                              
                              {/* Role indicator */}
                              <div className="absolute bottom-0 right-0 text-[8px] bg-black px-1 rounded text-[#ff950e] border border-[#ff950e]">
                                {userProfile?.role === 'buyer' ? 'B' : userProfile?.role === 'seller' ? 'S' : '?'}
                              </div>
                            </div>
                            
                            {/* Unread indicator */}
                            {unreadCounts[userKey] > 0 && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212] shadow-lg">
                                {unreadCounts[userKey]}
                              </div>
                            )}
                          </div>
                          
                          {/* Message preview */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h3 className="font-bold text-white truncate">{userKey}</h3>
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
                      {userProfiles[activeThread]?.pic ? (
                        <img src={userProfiles[activeThread].pic} alt={activeThread} className="w-full h-full object-cover" />
                      ) : (
                        getInitial(activeThread)
                      )}
                      
                      {/* Verified badge if applicable */}
                      {userProfiles[activeThread]?.verified && (
                        <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
                          <BadgeCheck size={12} className="text-[#ff950e]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h2 className="font-bold text-lg text-white">{activeThread}</h2>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#333] text-gray-300">
                          {userProfiles[activeThread]?.role === 'buyer' ? 'Buyer' : 
                           userProfiles[activeThread]?.role === 'seller' ? 'Seller' : 'User'}
                        </span>
                      </div>
                      <p className="text-xs text-[#ff950e] flex items-center">
                        <Clock size={12} className="mr-1 text-[#ff950e]" />
                        Admin conversation
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
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#121212]">
                  <div className="max-w-3xl mx-auto space-y-4">
                    {activeMessages.map((msg, index) => {
                      const isFromMe = msg.sender === username;
                      const time = new Date(msg.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      const isSingleEmojiMsg = msg.content && isSingleEmoji(msg.content);
                      
                      return (
                        <div key={index} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-lg p-3 max-w-[75%] ${
                            isFromMe 
                              ? 'bg-[#ff950e] text-white shadow-lg' 
                              : 'bg-[#333] text-white shadow-md'
                          }`}>
                            {/* Message header */}
                            <div className="flex items-center text-xs mb-1">
                              <span className={isFromMe ? 'text-white opacity-75' : 'text-gray-300'}>
                                {isFromMe ? 'You' : msg.sender} • {time}
                              </span>
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
                                    e.stopPropagation();
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
                                  <Paperclip size={16} className="mr-1" />
                                  Custom Request
                                </p>
                                <p><b>Title:</b> {msg.meta.title}</p>
                                <p><b>Price:</b> ${msg.meta.price?.toFixed(2)}</p>
                                <p><b>Tags:</b> {msg.meta.tags?.join(', ')}</p>
                                {msg.meta.message && <p><b>Message:</b> {msg.meta.message}</p>}
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
                    {/* Emoji Picker */}
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
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={selectedImage ? "Add a caption..." : "Type a message"}
                          className="w-full p-3 pr-12 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-[#ff950e] min-h-[40px] max-h-20 resize-none overflow-auto leading-tight"
                          rows={1}
                          maxLength={250}
                        />
                        
                        {/* Emoji button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEmojiPicker(!showEmojiPicker);
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
                      {content.length > 0 && (
                        <div className="text-xs text-gray-400 mb-2 text-right">
                          {content.length}/250
                        </div>
                      )}
                      
                      {/* Bottom row with attachment and send buttons */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          {/* Attachment button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerFileInput();
                            }}
                            disabled={isImageLoading}
                            className={`w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-md ${
                              isImageLoading 
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                                : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                            } transition-colors duration-150`}
                            title="Attach Image"
                            aria-label="Attach Image"
                          >
                            <Image size={26} />
                          </button>
                          
                          {/* Emoji button (mobile) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmojiPicker(!showEmojiPicker);
                            }}
                            className={`md:hidden w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-md text-black text-2xl ${
                              showEmojiPicker 
                                ? 'bg-[#e88800]' 
                                : 'bg-[#ff950e] hover:bg-[#e88800]'
                            } transition-colors duration-150`}
                            title="Emoji"
                            aria-label="Emoji"
                          >
                            <Smile size={26} />
                          </button>
                          
                          {/* Hidden file input */}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageSelect}
                          />
                        </div>
                        
                        {/* Send Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSend();
                          }}
                          disabled={(!content.trim() && !selectedImage) || isImageLoading}
                          className={`flex items-center justify-center px-5 py-2 rounded-full ${
                            (!content.trim() && !selectedImage) || isImageLoading
                              ? 'bg-[#c17200] cursor-not-allowed text-gray-300'
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
                    You have blocked this user
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
                  <p className="text-sm mb-4">Your messages will appear here</p>
                  <button
                    onClick={() => setShowUserDirectory(true)}
                    className="px-4 py-2 bg-[#ff950e] text-black font-medium rounded-lg hover:bg-[#e88800] transition-colors flex items-center justify-center mx-auto"
                  >
                    <MessageSquarePlus size={16} className="mr-2" />
                    Start New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Padding */}
        <div className="py-6 bg-black"></div>
        
        {/* Image Preview Modal */}
        <ImagePreviewModal
          imageUrl={previewImage || ''}
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
        />
        
        <style jsx global>{`
          .emoji-button {
            position: relative;
            z-index: 1;
          }
        `}</style>
      </div>
    </RequireAuth>
  );
}
