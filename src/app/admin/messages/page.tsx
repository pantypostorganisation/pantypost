'use client';

import { useState, useEffect, useRef } from 'react';
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
  BadgeCheck
} from 'lucide-react';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_, forceRerender] = useState(0);
  const markedThreadsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (!user || (user.username !== 'oakley' && user.username !== 'gerome')) return null;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, messages]);

  const username = user.username;

  // Prepare threads and messages
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

  // Filter threads by search query and role
  const filteredThreads = Object.keys(threads).filter(userKey => {
    const matchesSearch = searchQuery ? userKey.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    if (!matchesSearch) return false;
    
    const userRole = userProfiles[userKey]?.role;
    if (filterBy === 'buyers' && userRole !== 'buyer') return false;
    if (filterBy === 'sellers' && userRole !== 'seller') return false;
    
    return true;
  });
  
  // Sort threads by most recent message first
  const sortedThreads = filteredThreads.sort((a, b) => {
    const dateA = new Date(lastMessages[a]?.date || 0).getTime();
    const dateB = new Date(lastMessages[b]?.date || 0).getTime();
    return dateB - dateA;
  });

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
  }, [activeThread, username, markMessagesAsRead]);

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger hidden file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSend = () => {
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
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlockToggle = () => {
    if (!activeThread) return;
    if (isBlocked(username, activeThread)) {
      unblockUser(username, activeThread);
    } else {
      blockUser(username, activeThread);
    }
  };

  const handleReport = () => {
    if (activeThread && !hasReported(username, activeThread)) {
      reportUser(username, activeThread);
    }
  };

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
              {sortedThreads.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No conversations found
                </div>
              ) : (
                sortedThreads.map((userKey) => {
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
                                  className="max-w-full rounded"
                                />
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
                        />
                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs text-gray-400">{content.length}/250</span>
                        </div>
                      </div>
                      
                      {/* Input actions */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {/* Attachment button */}
                          <button
                            onClick={triggerFileInput}
                            className="p-2 rounded-full bg-[#ff950e] text-black hover:bg-[#e88800]"
                            title="Attach Image"
                          >
                            <Paperclip size={20} />
                          </button>
                          
                          {/* Hidden file input */}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageSelect}
                          />
                        </div>
                        
                        {/* Send button */}
                        <button
                          onClick={handleSend}
                          disabled={!content.trim() && !selectedImage}
                          className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                            (!content.trim() && !selectedImage)
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
      </div>
    </RequireAuth>
  );
}
