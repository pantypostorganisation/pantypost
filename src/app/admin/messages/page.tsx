'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import {
  Search,
  Send,
  CheckCheck,
  X,
  MessageSquare,
  Paperclip,
  User,
  BadgeCheck,
  Smile
} from 'lucide-react';

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Emoji picker categories and default emojis
const EMOJI_CATEGORIES = {
  recent: '🕒',
  smileys: '😀 😊 😍 🥰 😎 🤗 🤔 🙄 😴 😜',
  people: '👋 👍 👎 👏 🙏 💪 👨 👩 👶 👮',
  nature: '🐶 🐱 🐭 🦊 🐻 🐼 🐨 🦁 🐮 🐷',
  food: '🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍒',
  activities: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🎯',
  travel: '🚗 🚕 🚙 🚌 🚎 🏎 🚓 🚑 🚒 🚐',
  objects: '⌚ 📱 💻 ⌨ 🖥 🖨 🖱 🖲 🕹 🗜',
  symbols: '❤ 🧡 💛 💚 💙 💜 🖤 💔 ❣ 💕',
  flags: '🏳 🏴 🏁 🚩 🏳️‍🌈 🏴‍☠️ 🇦🇨 🇦🇩 🇦🇪 🇦🇫',
};

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
  
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [_, forceRerender] = useState(0);
  const markedThreadsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load recent emojis from localStorage on component mount
  useEffect(() => {
    const storedRecentEmojis = localStorage.getItem('panty_recent_emojis');
    if (storedRecentEmojis) {
      try {
        const parsed = JSON.parse(storedRecentEmojis);
        if (Array.isArray(parsed)) {
          setRecentEmojis(parsed.slice(0, 20)); // Limit to 20 recent emojis
        }
      } catch (e) {
        console.error('Failed to parse recent emojis', e);
      }
    }
  }, []);

  // Save recent emojis to localStorage when they change
  useEffect(() => {
    if (recentEmojis.length > 0) {
      localStorage.setItem('panty_recent_emojis', JSON.stringify(recentEmojis));
    }
  }, [recentEmojis]);

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

  // Check if user is admin - do this after all hooks are defined
  const isAdmin = !!user && (user.username === 'oakley' || user.username === 'gerome');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, messages]);

  const username = user?.username || '';

  // Prepare threads and messages using useMemo
  const { threads, unreadCounts, lastMessages, userProfiles, activeMessages } = useMemo(() => {
    const threads: { [user: string]: Message[] } = {};
    const unreadCounts: { [user: string]: number } = {};
    const lastMessages: { [user: string]: Message } = {};
    const userProfiles: { [user: string]: { pic: string | null, verified: boolean, role: string } } = {};
    
    let activeMessages: Message[] = [];

    Object.values(messages).flat().forEach((msg: Message) => {
      if (msg.sender === username || msg.receiver === username) {
        const otherParty = msg.sender === username ? msg.receiver : msg.sender;
        if (!threads[otherParty]) threads[otherParty] = [];
        threads[otherParty].push(msg);
      }
    });

    Object.entries(threads).forEach(([userKey, msgs]) => {
      msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      lastMessages[userKey] = msgs[msgs.length - 1];
      
      // Get user profile picture, verification status, and role
      const storedPic = sessionStorage.getItem(`profile_pic_${userKey}`);
      const userInfo = users?.[userKey];
      const isVerified = userInfo?.verified || userInfo?.verificationStatus === 'verified';
      const role = userInfo?.role || 'unknown';
      
      userProfiles[userKey] = { 
        pic: storedPic, 
        verified: isVerified,
        role: role
      };
    });

    Object.entries(threads).forEach(([userKey, msgs]) => {
      unreadCounts[userKey] = msgs.filter(
        (msg) => !msg.read && msg.receiver === username
      ).length;
    });

    if (activeThread) {
      activeMessages = threads[activeThread] || [];
    }

    return { threads, unreadCounts, lastMessages, userProfiles, activeMessages };
  }, [messages, username, activeThread, users]);

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
    
    // Sort threads by most recent message first
    return filteredThreads.sort((a, b) => {
      const dateA = new Date(lastMessages[a]?.date || 0).getTime();
      const dateB = new Date(lastMessages[b]?.date || 0).getTime();
      return dateB - dateA;
    });
  }, [threads, lastMessages, searchQuery, filterBy, userProfiles]);

  useEffect(() => {
    if (selectedUser && !activeThread) {
      setActiveThread(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (user && activeThread && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(username, activeThread);
      markMessagesAsRead(activeThread, username);
      markedThreadsRef.current.add(activeThread);
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  }, [activeThread, username, markMessagesAsRead, user]);

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
    setContent(prev => prev + emoji);
    
    // Update recent emojis
    setRecentEmojis(prev => {
      // Remove if already exists to prevent duplicates
      const filtered = prev.filter(e => e !== emoji);
      // Add to the front and return limited array
      return [emoji, ...filtered].slice(0, 20);
    });
    
    // Focus back on the input after inserting emoji
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
    
    // Close emoji picker if open
    setShowEmojiPicker(false);
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
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

  const isUserBlocked = !!(activeThread && isBlocked(username, activeThread));
  const isUserReported = !!(activeThread && hasReported(username, activeThread));

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

  // Render the component only if user is admin
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
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
          {/* Left column - Message threads */}
          <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
            {/* Admin header */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-2xl font-bold text-[#ff950e] mb-2">Admin Messages</h2>
              <div className="flex space-x-2 mb-3">
                <button 
                  onClick={() => setFilterBy('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterBy === 'all' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  All Users
                </button>
                <button 
                  onClick={() => setFilterBy('buyers')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterBy === 'buyers' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  Buyers
                </button>
                <button 
                  onClick={() => setFilterBy('sellers')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterBy === 'sellers' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  Sellers
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Users..."
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
                filteredAndSortedThreads.map((userKey) => {
                  const thread = threads[userKey];
                  const lastMessage = lastMessages[userKey];
                  const unreadCount = unreadCounts[userKey] || 0;
                  const isActive = activeThread === userKey;
                  const userProfile = userProfiles[userKey];
                  
                  return (
                    <div 
                      key={userKey}
                      onClick={() => setActiveThread(userKey)}
                      className={`flex items-center p-3 cursor-pointer relative border-b border-gray-800 ${
                        isActive ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'
                      }`}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]"></div>
                      )}
                      
                      {/* Avatar with unread indicator */}
                      <div className="relative mr-3">
                        <div className="relative w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden">
                          {userProfile?.pic ? (
                            <img src={userProfile.pic} alt={userKey} className="w-full h-full object-cover" />
                          ) : (
                            getInitial(userKey)
                          )}
                          
                          {/* Role indicator */}
                          <div className="absolute bottom-0 right-0 text-[8px] bg-black px-1 rounded text-[#ff950e] border border-[#ff950e]">
                            {userProfile.role === 'buyer' ? 'B' : userProfile.role === 'seller' ? 'S' : '?'}
                          </div>
                        </div>
                        
                        {/* Unread indicator */}
                        {unreadCount > 0 && (
                          <div className="absolute top-0 right-0 w-5 h-5 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212]">
                            {unreadCount}
                          </div>
                        )}
                      </div>
                      
                      {/* Message preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h3 className="font-bold text-white truncate">{userKey}</h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-1">
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
                    <div className="relative w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-white font-bold mr-3 overflow-hidden">
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
                      <p className="text-xs text-[#ff950e]">Active now</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 text-white">
                    <button 
                      onClick={handleReport}
                      disabled={isUserReported}
                      className={`px-3 py-1 text-xs border rounded ${
                        isUserReported ? 'text-gray-400 border-gray-500' : 'text-red-500 border-red-500 hover:bg-red-500/10'
                      }`}
                    >
                      {isUserReported ? 'Reported' : 'Report'}
                    </button>
                    <button
                      onClick={handleBlockToggle}
                      className={`px-3 py-1 text-xs border rounded ${
                        isUserBlocked ? 'text-green-500 border-green-500 hover:bg-green-500/10' : 'text-red-500 border-red-500 hover:bg-red-500/10'
                      }`}
                    >
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
                      
                      return (
                        <div key={index} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-lg p-3 max-w-[75%] ${
                            isFromMe 
                              ? 'bg-[#ff950e] text-white' 
                              : 'bg-[#333] text-white'
                          }`}
                          >
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
                                  className="max-w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setPreviewImage(msg.meta?.imageUrl || null)}
                                />
                                {msg.content && (
                                  <p className="text-white mt-2">{msg.content}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Text content */}
                            {(msg.type !== 'image' || msg.content) && (
                              <p className="text-white">
                                {msg.content}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Message input */}
                {!isUserBlocked && (
                  <div className="px-4 py-3 border-t border-gray-800 bg-[#1a1a1a]">
                    {/* Selected image preview */}
                    {selectedImage && (
                      <div className="mb-2">
                        <div className="relative inline-block">
                          <img src={selectedImage} alt="Preview" className="max-h-20 rounded" />
                          <button
                            onClick={() => {
                              setSelectedImage(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                            style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Image loading and error states */}
                    {isImageLoading && (
                      <div className="mb-2 text-sm text-gray-400">
                        Loading image...
                      </div>
                    )}
                    
                    {imageError && (
                      <div className="mb-2 text-sm text-red-400">
                        {imageError}
                      </div>
                    )}
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div 
                        ref={emojiPickerRef}
                        className="absolute bottom-[105px] left-4 bg-[#222] border border-gray-700 rounded-lg shadow-lg p-2 z-50"
                        style={{ maxWidth: '320px' }}
                      >
                        {/* Emoji Categories */}
                        <div className="flex mb-2 border-b border-gray-700 pb-2">
                          {Object.entries(EMOJI_CATEGORIES).map(([category, _]) => (
                            <button
                              key={category}
                              onClick={() => setActiveEmojiCategory(category as any)}
                              className={`p-2 rounded-full text-lg ${
                                activeEmojiCategory === category ? 'bg-[#333]' : ''
                              }`}
                              title={category.charAt(0).toUpperCase() + category.slice(1)}
                            >
                              {category === 'recent' ? '🕒' : 
                               category === 'smileys' ? '😊' :
                               category === 'people' ? '👋' :
                               category === 'nature' ? '🐱' :
                               category === 'food' ? '🍎' :
                               category === 'activities' ? '⚽' :
                               category === 'travel' ? '🚗' :
                               category === 'objects' ? '💻' :
                               category === 'symbols' ? '❤️' : '🏁'}
                            </button>
                          ))}
                        </div>
                        
                        {/* Emoji Grid */}
                        <div className="grid grid-cols-8 gap-1">
                          {activeEmojiCategory === 'recent' ? (
                            recentEmojis.length > 0 ? (
                              recentEmojis.map((emoji, index) => (
                                <button
                                  key={`recent-${index}`}
                                  onClick={() => handleEmojiClick(emoji)}
                                  className="p-1 text-xl hover:bg-[#333] rounded cursor-pointer transition"
                                >
                                  {emoji}
                                </button>
                              ))
                            ) : (
                              <p className="col-span-8 text-center text-gray-400 py-3 text-sm">
                                No recent emojis
                              </p>
                            )
                          ) : (
                            EMOJI_CATEGORIES[activeEmojiCategory].split(' ').map((emoji, index) => (
                              <button
                                key={`${activeEmojiCategory}-${index}`}
                                onClick={() => handleEmojiClick(emoji)}
                                className="p-1 text-xl hover:bg-[#333] rounded cursor-pointer transition"
                              >
                                {emoji}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      {/* Message input */}
                      <div className="relative">
                        <textarea
                          ref={inputRef}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={selectedImage ? "Add a caption..." : "Type a message"}
                          className="w-full p-3 pr-10 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] min-h-[60px] max-h-28 resize-none"
                          rows={2}
                          maxLength={250}
                        />
                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs text-gray-400">{content.length}/250</span>
                        </div>
                      </div>
                      
                      {/* Input actions */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          {/* Attachment button */}
                          <button
                            onClick={triggerFileInput}
                            disabled={isImageLoading}
                            className={`p-2 rounded-full ${isImageLoading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-[#ff950e] text-black hover:bg-[#e88800]'}`}
                            title="Attach Image"
                          >
                            <Paperclip size={20} />
                          </button>
                          
                          {/* Emoji button */}
                          <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 rounded-full bg-[#ff950e] text-black hover:bg-[#e88800]"
                            title="Emoji"
                          >
                            <Smile size={20} />
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
                        
                        {/* Send button */}
                        <button
                          onClick={handleSend}
                          disabled={(!content.trim() && !selectedImage) || isImageLoading}
                          className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                            (!content.trim() && !selectedImage) || isImageLoading
                              ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                              : 'bg-[#ff950e] text-black hover:bg-[#e88800]'
                          }`}
                        >
                          <Send size={18} /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {isUserBlocked && (
                  <div className="p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a]">
                    You have blocked this user
                    <button 
                      onClick={handleBlockToggle}
                      className="ml-2 underline text-gray-400 hover:text-white"
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
                    <MessageSquare size={64} className="text-gray-600" />
                  </div>
                  <p className="text-xl mb-2">Select a conversation to view messages</p>
                  <p className="text-sm">Your messages will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Image Preview Modal */}
        {previewImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <div className="max-w-4xl max-h-[90vh] p-2">
              <img 
                src={previewImage} 
                alt="Full size preview" 
                className="max-w-full max-h-[85vh] object-contain"
              />
              <button 
                className="absolute top-4 right-4 bg-[#333] text-white p-2 rounded-full hover:bg-[#444]"
                onClick={() => setPreviewImage(null)}
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
