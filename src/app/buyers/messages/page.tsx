'use client';

import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import VirtualMessageList from '@/components/messaging/VirtualMessageList';
import MessageInput from '@/components/messaging/MessageInput';
import { 
  Search, 
  DollarSign, 
  Paperclip, 
  Send, 
  Mic, 
  Smile, 
  Star, 
  Flag, 
  MoreVertical, 
  CheckCheck, 
  PlusCircle,
  X,
  AlertTriangle,
  BadgeCheck,
  MessageSquare
} from 'lucide-react';

const ADMIN_ACCOUNTS = ['oakley', 'gerome'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function BuyerMessagesPage() {
  const { user, users } = useListings();
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
  const { addRequest, getRequestsForUser, respondToRequest, requests, setRequests } = useRequests();
  const { wallet, updateWallet, sendTip } = useWallet();

  const searchParams = useSearchParams();
  const threadParam = searchParams?.get('thread');

  // State
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showCustomRequestForm, setShowCustomRequestForm] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestPrice, setRequestPrice] = useState<number | ''>('');
  const [requestTags, setRequestTags] = useState('');
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
  const [filterBy, setFilterBy] = useState<'all' | 'online'>('all');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [tipResult, setTipResult] = useState<{success: boolean, message: string} | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [_, forceRerender] = useState(0);
  const markedThreadsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Forces rerender when requests or wallet updates
  useEffect(() => {
    forceRerender((v) => v + 1);
  }, [requests, wallet]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, messages]);

  const username = user?.username || '';

  // This function is memoized to avoid unnecessary recalculations
  const { threads, unreadCounts, lastMessages, sellerProfiles } = useMemo(() => {
    const threads: { [seller: string]: any[] } = {};
    const unreadCounts: { [seller: string]: number } = {};
    const lastMessages: { [seller: string]: any } = {};
    const sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
    
    if (user) {
      // Build threads
      Object.values(messages).forEach((msgs) => {
        msgs.forEach((msg) => {
          if (msg.sender === user.username || msg.receiver === user.username) {
            const otherParty = msg.sender === user.username ? msg.receiver : msg.sender;
            if (!threads[otherParty]) threads[otherParty] = [];
            threads[otherParty].push(msg);
          }
        });
      });

      // Sort messages and get last message for each thread
      Object.entries(threads).forEach(([seller, msgs]) => {
        // Sort messages by date ascending
        msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        lastMessages[seller] = msgs[msgs.length - 1];
        
        // Get seller profile picture and verification status
        const storedPic = sessionStorage.getItem(`profile_pic_${seller}`);
        const sellerUser = users?.[seller];
        const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
        
        sellerProfiles[seller] = { 
          pic: storedPic, 
          verified: isVerified
        };
      });

      // Count unread messages
      Object.entries(threads).forEach(([seller, msgs]) => {
        unreadCounts[seller] = msgs.filter(
          (msg) => !msg.read && msg.receiver === user.username
        ).length;
      });
    }
    
    return { threads, unreadCounts, lastMessages, sellerProfiles };
  }, [user, messages, users]);

  // Get active messages for current thread
  const activeMessages = activeThread ? threads[activeThread] || [] : [];

  // Filter threads by search query and apply sorting
  const filteredAndSortedThreads = useMemo(() => {
    const filteredThreads = Object.keys(threads).filter(seller => 
      searchQuery ? seller.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );
    
    // Sort threads by most recent message first
    return filteredThreads.sort((a, b) => {
      const dateA = new Date(lastMessages[a]?.date || 0).getTime();
      const dateB = new Date(lastMessages[b]?.date || 0).getTime();
      return dateB - dateA;
    });
  }, [threads, lastMessages, searchQuery]);

  // Set active thread based on URL param
  useEffect(() => {
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user]);

  // Mark messages as read when thread becomes active
  useEffect(() => {
    if (user && activeThread && !markedThreadsRef.current.has(activeThread)) {
      // Only mark messages FROM seller TO buyer as read (fix for bidirectional marking)
      markMessagesAsRead(activeThread, user.username);
      markedThreadsRef.current.add(activeThread);
      forceRerender((v) => v + 1);
    }
  }, [activeThread, user, markMessagesAsRead]);

  // Image handling with validation and error handling
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

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Message sending function - fixed validation logic
  const handleReply = useCallback(() => {
    if (!activeThread || !user) return;

    const textContent = replyMessage.trim();

    if (!textContent && !selectedImage) {
      // Don't send empty messages
      return;
    }

    if (showCustomRequestForm) {
      if (!requestTitle.trim() || requestPrice === '' || isNaN(Number(requestPrice)) || Number(requestPrice) <= 0) {
        alert('Please enter a valid title and price for your custom request.');
        return;
      }
      
      const priceValue = Number(requestPrice);
      const tagsArray = requestTags.split(',').map(tag => tag.trim()).filter(Boolean);
      const requestId = uuidv4();

      addRequest({
        id: requestId,
        buyer: user.username,
        seller: activeThread,
        title: requestTitle.trim(),
        description: textContent,
        price: priceValue,
        tags: tagsArray,
        status: 'pending',
        date: new Date().toISOString(),
      });

      sendMessage(
        user.username,
        activeThread,
        `[PantyPost Custom Request] ${requestTitle.trim()}`,
        {
          type: 'customRequest',
          meta: {
            id: requestId,
            title: requestTitle.trim(),
            price: priceValue,
            tags: tagsArray,
            message: textContent,
            imageUrl: selectedImage || undefined,
          }
        }
      );
      setRequestTitle('');
      setRequestPrice('');
      setRequestTags('');
      setShowCustomRequestForm(false);
    } else {
      // Send normal message or image message
      sendMessage(user.username, activeThread, textContent, {
        type: selectedImage ? 'image' : 'normal',
        meta: selectedImage ? { imageUrl: selectedImage } : undefined,
      });
    }

    setReplyMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [
    activeThread, 
    user, 
    replyMessage, 
    showCustomRequestForm, 
    requestTitle, 
    requestPrice, 
    requestTags, 
    selectedImage, 
    addRequest, 
    sendMessage
  ]);

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

  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));

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
      }
    );

    setEditRequestId(null);
    setEditPrice('');
    setEditTitle('');
    setEditTags('');
    setEditMessage('');
    forceRerender((v) => v + 1);
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
      forceRerender((v) => v + 1);
    }
  }, [respondToRequest]);
  
  const handleDecline = useCallback((req: any) => {
    if (req && req.status === 'pending') {
      respondToRequest(req.id, 'rejected');
      forceRerender((v) => v + 1);
    }
  }, [respondToRequest]);

  const handlePayNow = useCallback((req: any) => {
    setPayingRequest(req);
    setShowPayModal(true);
  }, []);

  // Payment handling with improved validation
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
    const buyer = payingRequest.buyer;

    if (!seller || !buyer) {
      alert('Missing seller or buyer information.');
      setShowPayModal(false);
      setPayingRequest(null);
      return;
    }

    const sellerShare = Math.round(basePrice * 0.9 * 100) / 100;
    const adminCut = Math.round((markupPrice - sellerShare) * 100) / 100;

    if (wallet[buyer] === undefined || wallet[buyer] < markupPrice) {
      setShowPayModal(false);
      setPayingRequest(null);
      alert("Insufficient balance to complete this transaction.");
      return;
    }

    // Process the payment
    updateWallet(buyer, -markupPrice);
    updateWallet('oakley', adminCut);

    updateWallet(
      seller,
      sellerShare,
      {
        id: payingRequest.id,
        title: payingRequest.title,
        description: payingRequest.description,
        price: payingRequest.price,
        markedUpPrice: markupPrice,
        date: new Date().toISOString(),
        seller: payingRequest.seller,
        buyer: payingRequest.buyer,
        tags: payingRequest.tags,
      }
    );

    setRequests((prev) =>
      prev.map((r) =>
        r.id === payingRequest.id ? { ...r, paid: true, status: 'paid' } : r
      )
    );

    setShowPayModal(false);
    setPayingRequest(null);
    forceRerender((v) => v + 1);
  }, [user, payingRequest, wallet, updateWallet, setRequests]);

  const handleCancelPay = useCallback(() => {
    setShowPayModal(false);
    setPayingRequest(null);
  }, []);

  // Tip functionality with improved validation
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
    
    // Validate user has enough balance
    if (wallet[user.username] === undefined || wallet[user.username] < amount) {
      setTipResult({
        success: false,
        message: "Insufficient balance to send this tip."
      });
      return;
    }
    
    const success = sendTip(user.username, activeThread, amount);
    if (success) {
      // Send a message indicating the tip
      sendMessage(
        user.username,
        activeThread,
        `💰 I sent you a tip of $${amount.toFixed(2)}!`
      );
      setTipAmount('');
      setTipResult({
        success: true,
        message: `Successfully sent $${amount.toFixed(2)} tip to ${activeThread}!`
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
  }, [
    activeThread,
    user,
    tipAmount,
    wallet,
    sendTip,
    sendMessage
  ]);

  // Calculate buyerRequests outside the render cycle
  const buyerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'buyer') : [];
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

  const threadMessages = useMemo(() => {
    return activeThread
      ? getLatestCustomRequestMessages(threads[activeThread] || [], buyerRequests)
      : [];
  }, [activeThread, threads, buyerRequests]);

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

  // Helper functions
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

  // Status badge component
  function StatusBadge({ status }: { status: string }) {
    let color = 'bg-yellow-500 text-black';
    let label = status.toUpperCase();
    
    if (status === 'accepted') color = 'bg-green-600 text-white';
    else if (status === 'rejected') color = 'bg-red-600 text-white';
    else if (status === 'edited') color = 'bg-blue-600 text-white';
    else if (status === 'paid') color = 'bg-green-800 text-white';
    else if (status === 'pending') color = 'bg-yellow-500 text-black';
    
    return (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
        {label}
      </span>
    );
  }

  // Get the initial for avatar placeholder
  const getInitial = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  // Main UI rendering
  return (
    <RequireAuth role="buyer">
      <div className="h-screen bg-black flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
          {/* Left column - Message threads */}
          <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
            {/* Tab Navigation */}
            <div className="flex space-x-2 px-4 pt-4 pb-2">
              <button 
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'messages' 
                    ? 'bg-[#ff950e] text-black' 
                    : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                }`}
              >
                Messages
              </button>
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'favorites' 
                    ? 'bg-[#ff950e] text-black' 
                    : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                }`}
              >
                Favorites
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === 'requests' 
                    ? 'bg-[#ff950e] text-black' 
                    : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                }`}
              >
                Requests
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 px-4 pr-10 rounded-full bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <Search size={18} />
                </div>
              </div>
            </div>

            {/* Filter Options */}
            <div className="flex space-x-2 px-4 pb-3">
              <button 
                onClick={() => setFilterBy('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filterBy === 'all' 
                    ? 'bg-[#ff950e] text-black' 
                    : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                }`}
              >
                All Users
              </button>
              <button 
                onClick={() => setFilterBy('online')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  filterBy === 'online' 
                    ? 'bg-[#ff950e] text-black' 
                    : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                }`}
              >
                Online Users
              </button>
            </div>
            
            {/* Thread list */}
            <div className="flex-1 overflow-y-auto bg-[#121212]">
              {filteredAndSortedThreads.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  No conversations found
                </div>
              ) : (
                filteredAndSortedThreads.map((seller) => {
                  const thread = threads[seller];
                  const lastMessage = lastMessages[seller];
                  const unreadCount = unreadCounts[seller] || 0;
                  const isActive = activeThread === seller;
                  const sellerProfile = sellerProfiles[seller];
                  
                  return (
                    <div 
                      key={seller}
                      onClick={() => setActiveThread(seller)}
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
                          {sellerProfile?.pic ? (
                            <img src={sellerProfile.pic} alt={seller} className="w-full h-full object-cover" />
                          ) : (
                            getInitial(seller)
                          )}
                          
                          {/* Verified badge if applicable */}
                          {sellerProfile?.verified && (
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
                          <h3 className="font-bold text-white truncate">{seller}</h3>
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
                      {sellerProfiles[activeThread]?.pic ? (
                        <img src={sellerProfiles[activeThread].pic} alt={activeThread} className="w-full h-full object-cover" />
                      ) : (
                        getInitial(activeThread)
                      )}
                      
                      {/* Verified badge if applicable */}
                      {sellerProfiles[activeThread]?.verified && (
                        <div className="absolute bottom-0 right-0 bg-[#1a1a1a] p-0.5 rounded-full border border-[#ff950e] shadow-sm">
                          <BadgeCheck size={10} className="text-[#ff950e]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-white">{activeThread}</h2>
                      <p className="text-xs text-[#ff950e]">Active now</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 text-white">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333] transition">
                      <Star size={18} className="text-gray-400 hover:text-[#ff950e]" />
                    </button>
                    <button 
                      onClick={handleReport}
                      disabled={isUserReported}
                      className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333] transition ${
                        isUserReported ? 'text-red-500' : 'text-gray-400 hover:text-[#ff950e]'
                      }`}
                    >
                      <Flag size={18} />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={handleBlockToggle}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#333] transition"
                      >
                        <MoreVertical size={18} className="text-gray-400 hover:text-[#ff950e]" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Messages - use either direct implementation or VirtualMessageList */}
                {activeThread ? (
                  <div className="flex-1 overflow-y-auto p-4 bg-[#121212]">
                    <div className="max-w-3xl mx-auto space-y-4">
                      {threadMessages.map((msg, index) => {
                        const isFromMe = msg.sender === user?.username;
                        const time = new Date(msg.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        // Get custom request info if available
                        let customReq: any = undefined;
                        if (
                          msg.type === 'customRequest' &&
                          msg.meta &&
                          typeof msg.meta.id === 'string'
                        ) {
                          customReq = buyerRequests.find((r) => r.id === msg.meta?.id);
                        }
                        
                        const isLatestCustom =
                          !!customReq &&
                          (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
                          index === (threadMessages.length - 1) &&
                          msg.type === 'customRequest';
                        
                        const showPayNow =
                          !!customReq &&
                          customReq.status === 'accepted' &&
                          index === (threadMessages.length - 1) &&
                          msg.type === 'customRequest';
                        
                        const markupPrice = customReq ? Math.round(customReq.price * 1.1 * 100) / 100 : 0;
                        const buyerBalance = user ? wallet[user.username] ?? 0 : 0;
                        const canPay = customReq && buyerBalance >= markupPrice;
                        const isPaid = customReq && customReq.paid;
                        
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
                              
                              {/* Custom request */}
                              {msg.type === 'customRequest' && msg.meta && (
                                <div className="mt-2 text-sm border-t border-white border-opacity-20 pt-2">
                                  <p><strong>⚙️ Custom Request</strong></p>
                                  <p>📌 Title: {customReq ? customReq.title : msg.meta.title}</p>
                                  <p>💰 Price: {customReq ? `$${customReq.price.toFixed(2)}` : `$${msg.meta.price?.toFixed(2)}`}</p>
                                  <p>🏷️ Tags: {customReq ? customReq.tags.join(', ') : msg.meta.tags?.join(', ')}</p>
                                  {(customReq ? customReq.description : msg.meta.message) && (
                                    <p>📝 {customReq ? customReq.description : msg.meta.message}</p>
                                  )}
                                  {customReq && (
                                    <div className="mt-1">
                                      <span className={isFromMe ? 'text-white opacity-75' : 'text-gray-300'}>Status:</span>
                                      <StatusBadge status={customReq.status} />
                                    </div>
                                  )}
                                  
                                  {/* Action buttons for custom requests */}
                                  {showActionButtons && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      <button
                                        onClick={() => customReq && handleAccept(customReq)}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => customReq && handleDecline(customReq)}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                                      >
                                        Decline
                                      </button>
                                      <button
                                        onClick={() => customReq && handleEditRequest(customReq)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* Pay now button */}
                                  {showPayNow && (
                                    <div className="flex flex-col gap-2 pt-2">
                                      {isPaid ? (
                                        <span className="text-green-400 font-bold">Paid ✅</span>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => customReq && canPay && handlePayNow(customReq)}
                                            className={`bg-black text-white px-3 py-1 rounded text-xs hover:bg-[#ff950e] ${
                                              !canPay ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                            disabled={!canPay}
                                          >
                                            Pay {customReq ? `$${markupPrice.toFixed(2)}` : ''} Now
                                          </button>
                                          {!canPay && (
                                            <span className="text-xs text-red-400">
                                              Insufficient balance to pay ${markupPrice.toFixed(2)}
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Edit form */}
                                  {editRequestId === customReq?.id && customReq && (
                                    <div className="mt-2 space-y-2">
                                      <input
                                        type="text"
                                        placeholder="Title"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="w-full p-2 border rounded bg-[#222] border-gray-700 text-white"
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
                                        className="w-full p-2 border rounded bg-[#222] border-gray-700 text-white"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Tags (comma-separated)"
                                        value={editTags}
                                        onChange={e => setEditTags(e.target.value)}
                                        className="w-full p-2 border rounded bg-[#222] border-gray-700 text-white"
                                      />
                                      <textarea
                                        placeholder="Message"
                                        value={editMessage}
                                        onChange={e => setEditMessage(e.target.value)}
                                        className="w-full p-2 border rounded bg-[#222] border-gray-700 text-white"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleEditSubmit}
                                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
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
                ) : null}
                
                {/* Message input - either traditional or using MessageInput component */}
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
                    
                    {/* Custom request form */}
                    {showCustomRequestForm && (
                      <div className="space-y-2 mb-3 p-3 bg-[#222] rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-white">Custom Request</h3>
                          <button 
                            onClick={() => setShowCustomRequestForm(false)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Title"
                          value={requestTitle}
                          onChange={(e) => setRequestTitle(e.target.value)}
                          className="w-full p-2 border rounded bg-[#222] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Price (USD)"
                            value={requestPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRequestPrice(val === '' ? '' : Number(val));
                            }}
                            min="0.01"
                            step="0.01"
                            className="flex-1 p-2 border rounded bg-[#222] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                          />
                          <input
                            type="text"
                            placeholder="Tags (comma-separated)"
                            value={requestTags}
                            onChange={(e) => setRequestTags(e.target.value)}
                            className="flex-1 p-2 border rounded bg-[#222] border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                          />
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
                          maxLength={250}
                        />
                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs text-gray-400">{replyMessage.length}/250</span>
                        </div>
                      </div>
                      
                      {/* Input actions */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4">
                          {/* Tip button */}
                          <button
                            onClick={() => setShowTipModal(true)}
                            className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#ff950e] hover:bg-[#e88800] text-black text-2xl font-bold"
                            title="Send Tip"
                            aria-label="Send Tip"
                          >
                            $
                          </button>
                          
                          {/* Attachment button */}
                          <button
                            onClick={triggerFileInput}
                            className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#ff950e] hover:bg-[#e88800] text-black text-2xl font-bold"
                            disabled={showCustomRequestForm || isImageLoading}
                            title="Attach Image"
                            aria-label="Attach Image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                            </svg>
                          </button>
                          
                          {/* Custom Request button */}
                          <button
                            onClick={() => {
                              setShowCustomRequestForm(!showCustomRequestForm);
                              if (selectedImage) {
                                setSelectedImage(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }
                            }}
                            className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#ff950e] hover:bg-[#e88800] text-black text-2xl font-bold"
                            title="Custom Request"
                            aria-label="Custom Request"
                          >
                            +
                          </button>
                          
                          {/* Voice Message button */}
                          <button 
                            className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#ff950e] hover:bg-[#e88800] text-black text-2xl"
                            title="Voice Message"
                            aria-label="Voice Message"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                              <line x1="12" y1="19" x2="12" y2="23"></line>
                              <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
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
                          onClick={handleReply}
                          disabled={(!replyMessage.trim() && !selectedImage) || isImageLoading}
                          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-black text-2xl ${
                            (!replyMessage.trim() && !selectedImage) || isImageLoading
                              ? 'bg-[#c17200] cursor-not-allowed'
                              : 'bg-[#ff950e] hover:bg-[#e88800]'
                          }`}
                          title="Send Message"
                          aria-label="Send Message"
                        >
                          ➤
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
        
        {/* Payment confirmation modal */}
        {showPayModal && payingRequest && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
            <div className="bg-[#222] rounded-lg p-6 max-w-sm w-full shadow-lg border border-gray-700">
              <h3 className="text-lg font-bold mb-4 text-white">Confirm Payment</h3>
              <p className="text-gray-300">
                Are you sure you want to pay{' '}
                <span className="font-bold text-[#ff950e]">
                  ${payingRequest ? (Math.round(payingRequest.price * 1.1 * 100) / 100).toFixed(2) : ''}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleCancelPay}
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPay}
                  className="px-4 py-2 rounded bg-[#ff950e] text-white hover:bg-[#ff8500]"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tip Modal */}
        {showTipModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
            <div className="bg-[#222] rounded-lg p-6 max-w-sm w-full shadow-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Send a Tip</h3>
                <button 
                  onClick={() => {
                    setShowTipModal(false);
                    setTipResult(null);
                    setTipAmount('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              {tipResult ? (
                <div className={`p-4 rounded-lg mb-4 ${tipResult.success ? 'bg-green-600 bg-opacity-20 text-green-400' : 'bg-red-600 bg-opacity-20 text-red-400'}`}>
                  {tipResult.message}
                </div>
              ) : (
                <>
                  <p className="text-gray-300 mb-4">
                    Show your appreciation by sending a tip to {activeThread}
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">$</span>
                      </div>
                      <input
                        type="number"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="bg-[#333] text-white border-gray-700 focus:ring-[#ff950e] focus:border-[#ff950e] block w-full pl-7 pr-12 rounded-md"
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowTipModal(false);
                        setTipAmount('');
                      }}
                      className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendTip}
                      className="px-4 py-2 rounded bg-[#ff950e] text-white hover:bg-[#ff8500]"
                      disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                    >
                      Send Tip
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
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