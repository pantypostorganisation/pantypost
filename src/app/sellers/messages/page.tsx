'use client';

import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCheck,
  Send,
  MessageSquare,
  Paperclip,
  X,
  BadgeCheck,
  User
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

  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_, forceRerender] = useState(0);
  const markedThreadsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize the thread based on URL thread parameter
  const threadParam = searchParams?.get('thread');

  useEffect(() => {
    forceRerender((v) => v + 1);
  }, [requests, wallet]);

  useEffect(() => {
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user]);

  let sellerMessages: Message[] = [];
  if (user) {
    sellerMessages = Object.values(messages)
      .flat()
      .filter(
        (msg: Message) =>
          msg.sender === user.username || msg.receiver === user.username
      );
  }
  const sellerRequests = user ? getRequestsForUser(user.username, 'seller') : [];

  const threads: { [buyer: string]: Message[] } = {};
  if (user) {
    sellerMessages.forEach((msg) => {
      const otherParty =
        msg.sender === user.username ? msg.receiver : msg.sender;
      if (!threads[otherParty]) threads[otherParty] = [];
      threads[otherParty].push(msg);
    });
  }

  Object.values(threads).forEach((thread) =>
    thread.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  const unreadCounts: { [buyer: string]: number } = {};
  const lastMessages: { [buyer: string]: Message } = {};
  const buyerProfiles: { [buyer: string]: { pic: string | null, verified: boolean } } = {};

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
    
    unreadCounts[buyer] = msgs.filter(
      (msg) => !msg.read && msg.receiver === user?.username
    ).length;
  });

  useEffect(() => {
    if (activeThread && user && !markedThreadsRef.current.has(activeThread)) {
      markMessagesAsRead(user.username, activeThread);
      markMessagesAsRead(activeThread, user.username);
      markedThreadsRef.current.add(activeThread);
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  }, [activeThread, user, markMessagesAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, messages]);

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

  const handleReply = () => {
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

    addSellerNotification(user.username, `💌 You replied to buyer: ${activeThread}`);
    setReplyMessage('');
    setSelectedImage(null); // Clear selected image after sending
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  const handleBlockToggle = () => {
    if (!user || !activeThread) return;
    if (isBlocked(user.username, activeThread)) {
      unblockUser(user.username, activeThread);
    } else {
      blockUser(user.username, activeThread);
    }
  };

  const handleReport = () => {
    if (user && activeThread && !hasReported(user.username, activeThread)) {
      reportUser(user.username, activeThread);
    }
  };

  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));

  function statusBadge(status: string) {
    let color = 'bg-yellow-500 text-white';
    let label = status.toUpperCase();
    if (status === 'accepted') color = 'bg-green-600 text-white';
    else if (status === 'rejected') color = 'bg-red-600 text-white';
    else if (status === 'edited') color = 'bg-blue-600 text-white';
    else if (status === 'paid') color = 'bg-green-800 text-white';
    else if (status === 'pending') color = 'bg-yellow-500 text-white';
    return (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
        {label}
      </span>
    );
  }

  const handleEditRequest = (req: any) => {
    setEditRequestId(req.id);
    setEditPrice(req.price);
    setEditTitle(req.title);
    setEditTags(req.tags.join(', '));
    setEditMessage(req.description || '');
  };

  const handleEditSubmit = (req: any) => {
    if (!user || !activeThread || !editRequestId) return;
    respondToRequest(
      editRequestId,
      'pending',
      editMessage,
      {
        title: editTitle,
        price: Number(editPrice),
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        description: editMessage,
      }
    );

    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
    setTimeout(() => forceRerender((v) => v + 1), 0);
  };

  const handleAccept = (req: any) => {
    if (req.status === 'pending') {
      respondToRequest(req.id, 'accepted');
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  };
  
  const handleDecline = (req: any) => {
    if (req.status === 'pending') {
      respondToRequest(req.id, 'rejected');
      setTimeout(() => forceRerender((v) => v + 1), 0);
    }
  };

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

  // Filter threads by search query and unread status
  const filteredThreads = Object.keys(threads).filter(buyer => {
    const matchesSearch = searchQuery ? buyer.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    if (!matchesSearch) return false;
    
    if (filterBy === 'unread' && unreadCounts[buyer] === 0) return false;
    
    return true;
  });
  
  // Sort threads by most recent message first
  const sortedThreads = filteredThreads.sort((a, b) => {
    const dateA = new Date(lastMessages[a]?.date || 0).getTime();
    const dateB = new Date(lastMessages[b]?.date || 0).getTime();
    return dateB - dateA;
  });

  const threadMessages =
    activeThread
      ? getLatestCustomRequestMessages(threads[activeThread] || [], sellerRequests)
      : [];

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

  // Check if user is admin
  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  return (
    <RequireAuth role="seller">
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
          {/* Left column - Message threads */}
          <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
            {/* Seller header */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-2xl font-bold text-[#ff950e] mb-2">
                {isAdmin ? 'Admin Messages' : 'My Messages'}
              </h2>
              <div className="flex space-x-2 mb-3">
                <button 
                  onClick={() => setFilterBy('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterBy === 'all' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  All Messages
                </button>
                <button 
                  onClick={() => setFilterBy('unread')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    filterBy === 'unread' 
                      ? 'bg-[#ff950e] text-black' 
                      : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                  }`}
                >
                  Unread
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
              {sortedThreads.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No conversations found
                </div>
              ) : (
                sortedThreads.map((buyer) => {
                  const thread = threads[buyer];
                  const lastMessage = lastMessages[buyer];
                  const unreadCount = unreadCounts[buyer] || 0;
                  const isActive = activeThread === buyer;
                  const buyerProfile = buyerProfiles[buyer];
                  
                  return (
                    <div 
                      key={buyer}
                      onClick={() => setActiveThread(buyer)}
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
                          <h3 className="font-bold text-white truncate">{buyer}</h3>
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
                    {threadMessages.map((msg, index) => {
                      const isFromMe = msg.sender === user?.username;
                      const time = new Date(msg.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
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
                            
                            {/* Custom request content */}
                            {msg.type === 'customRequest' && msg.meta && (
                              <div className="mt-2 text-sm text-orange-400 space-y-1 border-t border-white/20 pt-2">
                                <p className="font-semibold">🛠️ Custom Request</p>
                                <p><b>Title:</b> {customReq ? customReq.title : msg.meta.title}</p>
                                <p><b>Price:</b> {customReq ? `$${customReq.price.toFixed(2)}` : `$${msg.meta.price?.toFixed(2)}`}</p>
                                <p><b>Tags:</b> {customReq ? customReq.tags?.join(', ') : msg.meta.tags?.join(', ')}</p>
                                {(customReq ? customReq.description : msg.meta.message) && (
                                  <p><b>Message:</b> {customReq ? customReq.description : msg.meta.message}</p>
                                )}
                                {customReq && (
                                  <p>
                                    <b>Status:</b>
                                    {statusBadge(customReq.status)}
                                  </p>
                                )}
                                {isPaid && (
                                  <span className="text-green-400 font-bold">Paid ✅</span>
                                )}
                                {showActionButtons && !isPaid && (
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      onClick={() => customReq && handleAccept(customReq)}
                                      className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-800"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => customReq && handleDecline(customReq)}
                                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-800"
                                    >
                                      Decline
                                    </button>
                                    <button
                                      onClick={() => customReq && handleEditRequest(customReq)}
                                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
                                    >
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
                                    />
                                    <input
                                      type="number"
                                      placeholder="Price (USD)"
                                      value={editPrice}
                                      onChange={e => setEditPrice(Number(e.target.value))}
                                      className="w-full p-2 border rounded bg-black border-gray-700 text-white"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Tags (comma-separated)"
                                      value={editTags}
                                      onChange={e => setEditTags(e.target.value)}
                                      className="w-full p-2 border rounded bg-black border-gray-700 text-white"
                                    />
                                    <textarea
                                      placeholder="Message"
                                      value={editMessage}
                                      onChange={e => setEditMessage(e.target.value)}
                                      className="w-full p-2 border rounded bg-black border-gray-700 text-white"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => customReq && handleEditSubmit(customReq)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-800"
                                      >
                                        Submit Edit
                                      </button>
                                      <button
                                        onClick={() => setEditRequestId(null)}
                                        className="bg-gray-700 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                                      >
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
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={selectedImage ? "Add a caption..." : "Type a message"}
                          className="w-full p-3 pr-10 rounded-lg bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] min-h-[60px] max-h-28 resize-none"
                          rows={2}
                        />
                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs text-gray-400">{replyMessage.length}/250</span>
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
                          onClick={handleReply}
                          disabled={!replyMessage.trim() && !selectedImage}
                          className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                            (!replyMessage.trim() && !selectedImage)
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
                    You have blocked this buyer
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
