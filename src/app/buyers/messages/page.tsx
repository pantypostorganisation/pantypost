// src/app/buyers/messages/page.tsx
'use client';

import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCheck,
  ArrowRightCircle,
  MessageCircle,
  X,
  BadgeCheck,
  Smile,
  Image,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  ShoppingBag,
  Filter,
  BellRing,
  Settings,
  DollarSign,
  Package
} from 'lucide-react';

// Constants
const ADMIN_ACCOUNTS = ['oakley', 'gerome'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// All emojis in a single flat array - ordered by likely usage for this platform
const ALL_EMOJIS = [
  // ❤️ MOST LIKELY TO BE USED - Love, flirty, suggestive
  '❤️', '💕', '💖', '💗', '💓', '💞', '💝', '😍', '🥰', '😘', '😗', '😙', '😚', '💋', '😋', '😛', '😜', '😝', '🤤', '🥵', '🔥', '💦', '🍑', '🍆', '🌶', '🍯', '🍒', '🍓', '🥥', '🍌', '🍭', '🍰', '🧁', '🍪', '🥛', '☕', '🍷', '🥂', '🍾', '💎', '🎁', '🌹', '🌺', '🌸', '💐', '🦋', '✨', '💫', '⭐', '🌟', '💯', 
  
  // 😊 COMMON POSITIVE EMOTIONS
  '😊', '🙂', '😁', '😄', '😃', '😀', '😆', '😅', '😂', '🤣', '🥳', '😇', '🤗', '🤭', '😉', '😌', '🥺', '🥹', '😏', '🤩', '😎', '🤓', '🧐', '🤔', '🤫', '🤐', '😌',
  
  // 💜 MORE HEARTS & LOVE
  '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💘', '💟',
  
  // 😢 EMOTIONS & EXPRESSIONS  
  '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '😱', '😨', '😰', '😥', '😓', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😪', '😴', '🤤', '😵', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🥶',
  
  // 🎉 CELEBRATION & FUN
  '🎉', '🎊', '🎈', '🎂', '🎀', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🎗', '🎫', '🎟', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻', '🥁',
  
  // 💰 MONEY & SHOPPING
  '💰', '💵', '💴', '💶', '💷', '🪙', '💳', '💸', '🛍', '🛒', '🛁', '👑', '💍', '👄', '💄', '👗', '👙', '👠', '🩱', '🧿',
  
  // 🍕 FOOD & DRINKS (selective favorites)
  '🍕', '🍔', '🍟', '🌮', '🌯', '🥪', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🍙', '🍚', '🥟', '🍤', '🦪', '🥘', '🫕', '🥫', '🍳', '🥚', '🧀', '🥓', '🥩', '🍗', '🍖', '🥞', '🧇', '🥐', '🥯', '🍞', '🥖', '🥨', '🧈',
  
  // 🍎 FRUITS (keeping sexy ones at front)
  '🍎', '🍐', '🍊', '🍋', '🍉', '🍇', '🫐', '🍈', '🍑', '🥭', '🍍', '🥝', '🍅',
  
  // 🐱 CUTE ANIMALS
  '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐰', '🐹', '🐭', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🦆', '🦉', '🦇', '🐺', '🐴', '🦄', '🐝', '🦋', '🐌', '🐞', '🐜', '🕷', '🦂', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃',
  
  // ⚽ ACTIVITIES & SPORTS
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🤹',
  
  // 🚗 TRAVEL & PLACES  
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚁', '✈️', '🛫', '🛬', '🛩', '🚀', '🛸', '⛵', '🚤', '🛥', '🛳', '⚴', '🚢', '🏖', '🏝', '🏕', '🗻', '🏔', '❄️', '☀️', '🌤', '⛅', '🌦', '🌧', '⛈', '🌩', '🌨', '☁️', '🌪', '🌈', '☂️', '☔',
  
  // 📱 OBJECTS & TECH
  '📱', '💻', '⌨️', '🖥', '🖨', '🖱', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📺', '📻', '🎙', '⌚', '⏰', '⏲', '⏱', '🕰', '⌛', '⏳', '🔋', '🔌', '💡', '🔦', '🕯', '🧯', '💽', '💾', '💿', '📀', '📼', '📡',
  
  // 🎯 SYMBOLS & MISC
  '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑',
  
  // 🏁 FLAGS (minimal selection)
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

// Custom hook for Intersection Observer
function useIntersectionObserver(
  targetRef: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit & { onIntersect: () => void }
) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            options.onIntersect();
          }
        });
      },
      {
        root: options.root,
        rootMargin: options.rootMargin || '0px',
        threshold: options.threshold || 0.5
      }
    );

    const target = targetRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [targetRef, options.root, options.rootMargin, options.threshold, options.onIntersect]);
}

// Message component with intersection observer
function MessageItem({ 
  msg, 
  index, 
  isFromMe, 
  user,
  activeThread,
  onMessageVisible,
  customReq,
  isLatestCustom,
  isPaid,
  showActionButtons,
  handleAccept,
  handleDecline,
  handleEditRequest,
  editRequestId,
  editTitle,
  setEditTitle,
  editPrice,
  setEditPrice,
  editMessage,
  setEditMessage,
  handleEditSubmit,
  setEditRequestId,
  statusBadge,
  setPreviewImage,
  showPayNow,
  handlePayNow,
  markupPrice,
  canPay
}: any) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  // Use Intersection Observer to track when message becomes visible
  useIntersectionObserver(messageRef, {
    threshold: 0.8, // Message is considered "read" when 80% visible
    onIntersect: () => {
      if (!hasBeenVisible && !isFromMe && !msg.read) {
        setHasBeenVisible(true);
        onMessageVisible(msg);
      }
    }
  });

  const time = new Date(msg.date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if message contains only a single emoji
  const isSingleEmojiMsg = msg.content && isSingleEmoji(msg.content);

  return (
    <div ref={messageRef} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`rounded-lg p-3 max-w-[75%] ${
        isFromMe 
          ? 'bg-[#ff950e] text-black shadow-lg' 
          : 'bg-[#303030] text-[#fefefe] shadow-md'
      }`}>
        {/* Message header */}
        <div className="flex items-center text-xs mb-1">
          <span className={isFromMe ? 'text-black opacity-75' : 'text-[#fefefe] opacity-75'}>
            {isFromMe ? 'You' : msg.sender} • {time}
          </span>
          {/* Only show Read/Sent for messages that the buyer sends */}
          {isFromMe && (
            <span className="ml-2 text-[10px]">
              {msg.read ? (
                <span className={`flex items-center ${isFromMe ? 'text-black opacity-60' : 'text-[#fefefe] opacity-60'}`}>
                  <CheckCheck size={12} className="mr-1" /> Read
                </span>
              ) : (
                <span className={isFromMe ? 'text-black opacity-50' : 'text-[#fefefe] opacity-50'}>Sent</span>
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
              <p className={`${isFromMe ? 'text-black' : 'text-[#fefefe]'} mt-2 ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
                {msg.content}
              </p>
            )}
          </div>
        )}
        
        {/* Text content - Different colors for sent vs received */}
        {msg.type !== 'image' && msg.type !== 'customRequest' && (
          <p className={`${isFromMe ? 'text-black' : 'text-[#fefefe]'} ${isSingleEmojiMsg ? 'text-3xl' : ''}`}>
            {msg.content}
          </p>
        )}
        
        {/* Custom request content - ADAPTIVE TEXT COLOR */}
        {msg.type === 'customRequest' && msg.meta && (
          <div className={`mt-2 text-sm space-y-1 border-t ${isFromMe ? 'border-black/20' : 'border-white/20'} pt-2`}>
            <div className={`font-semibold flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
              <div className="relative mr-2 flex items-center justify-center">
                <div className="bg-white w-6 h-6 rounded-full absolute"></div>
                <img src="/Custom_Request_Icon.png" alt="Custom Request" className="w-8 h-8 relative z-10" />
              </div>
              Custom Request
            </div>
            <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Title:</b> {customReq ? customReq.title : msg.meta.title}</p>
            <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Price:</b> ${customReq ? customReq.price.toFixed(2) : msg.meta.price?.toFixed(2)}</p>
            {(customReq ? customReq.description : msg.meta.message) && (
              <p className={isFromMe ? 'text-black' : 'text-[#fefefe]'}><b>Message:</b> {customReq ? customReq.description : msg.meta.message}</p>
            )}
            {customReq && (
              <p className={`flex items-center ${isFromMe ? 'text-black' : 'text-[#fefefe]'}`}>
                <b>Status:</b>
                {statusBadge(customReq.status)}
              </p>
            )}
            
            {/* Edit form */}
            {editRequestId === customReq?.id && customReq && (
              <div className="mt-3 space-y-2 bg-white/90 p-3 rounded border border-black/20 shadow-sm">
                <input
                  type="text"
                  placeholder="Title"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e]"
                  onClick={(e) => e.stopPropagation()}
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
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e]"
                  onClick={(e) => e.stopPropagation()}
                />
                <textarea
                  placeholder="Message"
                  value={editMessage}
                  onChange={e => setEditMessage(e.target.value)}
                  className="w-full p-2 border rounded bg-white border-gray-300 text-black placeholder-gray-500 focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e]"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSubmit();
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                  >
                    <Edit3 size={12} className="mr-1" />
                    Submit Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditRequestId(null);
                    }}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                  >
                    <X size={12} className="mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Action buttons for custom requests */}
            {showActionButtons && !isPaid && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    customReq && handleAccept(customReq);
                  }}
                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <CheckCircle2 size={12} className="mr-1" />
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    customReq && handleDecline(customReq);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <XCircle size={12} className="mr-1" />
                  Decline
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    customReq && handleEditRequest(customReq);
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center transition-colors duration-150 font-medium shadow-sm"
                >
                  <Edit3 size={12} className="mr-1" />
                  Edit
                </button>
              </div>
            )}
            
            {/* Pay now button */}
            {showPayNow && (
              <div className="flex flex-col gap-2 pt-2">
                {isPaid ? (
                  <span className="text-green-400 font-bold flex items-center">
                    <ShoppingBag size={14} className="mr-1" />
                    Paid ✅
                  </span>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        customReq && canPay && handlePayNow(customReq);
                      }}
                      className={`bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 ${
                        !canPay ? 'opacity-50 cursor-not-allowed' : ''
                      } transition-colors duration-150 flex items-center w-fit font-medium shadow-sm`}
                      disabled={!canPay}
                    >
                      <ShoppingBag size={12} className="mr-1" />
                      Pay ${customReq ? `${markupPrice.toFixed(2)}` : ''} Now
                    </button>
                    {!canPay && (
                      <span className="text-xs text-red-400 flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        Insufficient balance to pay ${markupPrice.toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to check if content is a single emoji
const isSingleEmoji = (content: string) => {
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200d(\p{Emoji_Presentation}|\p{Extended_Pictographic}))*$/u;
  return emojiRegex.test(content);
};

export default function BuyerMessagesPage() {
  // ⚠️ CRITICAL FIX: ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  // Move ALL hooks before any early returns or conditional logic
  
  // Context hooks - ALWAYS called first
  const { user } = useAuth();
  const { users } = useListings();
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
  const { addRequest, getRequestsForUser, respondToRequest, requests, setRequests, markRequestAsPaid } = useRequests();
  const { wallet, purchaseCustomRequest, sendTip } = useWallet();
  const searchParams = useSearchParams();
  
  // State hooks - ALWAYS called
  const [mounted, setMounted] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  // NEW: Custom Request Modal State (separate from message input)
  const [showCustomRequestModal, setShowCustomRequestModal] = useState(false);
  const [customRequestForm, setCustomRequestForm] = useState({
    title: '',
    price: '',
    description: ''
  });
  const [customRequestErrors, setCustomRequestErrors] = useState<Record<string, string>>({});
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
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
  const [filterBy, setFilterBy] = useState<'all' | 'unread'>('all');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('');
  const [tipResult, setTipResult] = useState<{success: boolean, message: string} | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [messageUpdate, setMessageUpdate] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [observerReadMessages, setObserverReadMessages] = useState<Set<string>>(new Set());
  
  // Ref hooks - ALWAYS called
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readThreadsRef = useRef<Set<string>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get URL parameter - ALWAYS called
  const threadParam = searchParams?.get('thread');
  
  // Basic derived values - ALWAYS calculated
  const username = user?.username || '';

  // Set mounted to true after component mounts to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

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
  useEffect(() => {
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, messages]);

  // 🔥 MOVED: All useMemo hooks must be called AFTER all useState/useRef/useEffect hooks
  // This is the CRITICAL fix - useMemo was being called conditionally before
  
  // Memoize messages data to improve performance
  const { 
    threads, 
    unreadCounts, 
    lastMessages, 
    sellerProfiles, 
    totalUnreadCount 
  } = useMemo(() => {
    const threads: { [seller: string]: any[] } = {};
    const unreadCounts: { [seller: string]: number } = {};
    const lastMessages: { [seller: string]: any } = {};
    const sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } } = {};
    let totalUnreadCount = 0;
    
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
      Object.entries(threads).forEach(([seller, msgs]) => {
        lastMessages[seller] = msgs[msgs.length - 1];
        
        // Get seller profile picture and verification status
        const storedPic = sessionStorage.getItem(`profile_pic_${seller}`);
        const sellerUser = users?.[seller];
        const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
        
        sellerProfiles[seller] = { 
          pic: storedPic, 
          verified: isVerified
        };
        
        // Count only messages FROM seller TO buyer as unread
        const threadUnreadCount = msgs.filter(
          (msg) => !msg.read && msg.sender === seller && msg.receiver === user?.username
        ).length;
        
        unreadCounts[seller] = threadUnreadCount;
        
        // Only add to total if not in readThreadsRef
        if (!readThreadsRef.current.has(seller) && threadUnreadCount > 0) {
          totalUnreadCount += threadUnreadCount;
        }
      });
    }
    
    return { threads, unreadCounts, lastMessages, sellerProfiles, totalUnreadCount };
  }, [user, messages, users, messageUpdate]);

  // Memoize buyerRequests to avoid recalculation
  const buyerRequests = useMemo(() => {
    return user ? getRequestsForUser(user.username, 'buyer') : [];
  }, [user, getRequestsForUser]);

  // Get the messages for the active thread
  const threadMessages = useMemo(() => {
    return activeThread
      ? getLatestCustomRequestMessages(threads[activeThread] || [], buyerRequests)
      : [];
  }, [activeThread, threads, buyerRequests]);

  // Filter threads by search query and apply sorting
  const filteredAndSortedThreads = useMemo(() => {
    const filteredThreads = Object.keys(threads).filter(seller => {
      const matchesSearch = searchQuery ? seller.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      
      if (!matchesSearch) return false;
      
      if (filterBy === 'unread') {
        const hasUnread = unreadCounts[seller] > 0 && !readThreadsRef.current.has(seller);
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

  // Calculate UI unread count indicators for the sidebar threads
  const uiUnreadCounts = useMemo(() => {
    const counts: { [seller: string]: number } = {};
    if (threads) {
      Object.keys(threads).forEach(seller => {
        counts[seller] = readThreadsRef.current.has(seller) ? 0 : unreadCounts[seller];
      });
    }
    return counts;
  }, [threads, unreadCounts, messageUpdate]);

  // Handle message visibility from Intersection Observer
  const handleMessageVisible = useCallback((msg: Message) => {
    if (!user || msg.sender === user.username || msg.read) return;
    
    // Create a unique ID for this message
    const messageId = `${msg.sender}-${msg.receiver}-${msg.date}`;
    
    // Check if we've already processed this message
    if (observerReadMessages.has(messageId)) return;
    
    // Mark message as read
    markMessagesAsRead(user.username, msg.sender);
    
    // Add to observer read messages set
    setObserverReadMessages(prev => new Set(prev).add(messageId));
    
    // Add thread to readThreadsRef if all messages are now read
    const threadUnreadCount = threads[msg.sender]?.filter(
      m => !m.read && m.sender === msg.sender && m.receiver === user.username
    ).length || 0;
    
    if (threadUnreadCount === 0 && !readThreadsRef.current.has(msg.sender)) {
      readThreadsRef.current.add(msg.sender);
      setMessageUpdate(prev => prev + 1);
    }
  }, [user, markMessagesAsRead, threads, observerReadMessages]);

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

  // ⚠️ ALL useCallback hooks MUST be called before any early returns
  // Image handling with validation and error handling
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: Added null check for event.target
    if (!event.target) return;
    
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

  // NEW: Custom Request Modal Functions
  const openCustomRequestModal = useCallback(() => {
    setShowCustomRequestModal(true);
    setCustomRequestForm({
      title: '',
      price: '',
      description: ''
    });
    setCustomRequestErrors({});
  }, []);

  const closeCustomRequestModal = useCallback(() => {
    setShowCustomRequestModal(false);
    setCustomRequestForm({
      title: '',
      price: '',
      description: ''
    });
    setCustomRequestErrors({});
    setIsSubmittingRequest(false);
  }, []);

  const validateCustomRequest = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!customRequestForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!customRequestForm.price.trim()) {
      errors.price = 'Price is required';
    } else {
      const price = parseFloat(customRequestForm.price);
      if (isNaN(price) || price <= 0) {
        errors.price = 'Price must be a valid number greater than 0';
      }
    }
    
    if (!customRequestForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setCustomRequestErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customRequestForm]);

  const handleSubmitCustomRequest = useCallback(async () => {
    if (!activeThread || !user || !validateCustomRequest()) return;
    
    setIsSubmittingRequest(true);
    
    try {
      const priceValue = parseFloat(customRequestForm.price);
      const tagsArray: string[] = []; // No tags anymore
      const requestId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      // Add request to the system
      addRequest({
        id: requestId,
        buyer: user.username,
        seller: activeThread,
        title: customRequestForm.title.trim(),
        description: customRequestForm.description.trim(),
        price: priceValue,
        tags: tagsArray,
        status: 'pending',
        date: new Date().toISOString(),
        messageThreadId: `${user.username}-${activeThread}`,
        lastModifiedBy: user.username,
        originalMessageId: requestId
      });

      // Send the custom request message
      sendMessage(
        user.username,
        activeThread,
        `[Custom Request] ${customRequestForm.title.trim()}`,
        {
          type: 'customRequest',
          meta: {
            id: requestId,
            title: customRequestForm.title.trim(),
            price: priceValue,
            message: customRequestForm.description.trim(),
          }
        }
      );

      // Close modal and show success
      closeCustomRequestModal();
      
      // Optional: Show success message
      setTimeout(() => {
        alert('Custom request sent successfully!');
      }, 500);
      
    } catch (error) {
      console.error('Error submitting custom request:', error);
      alert('Failed to send custom request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  }, [activeThread, user, customRequestForm, validateCustomRequest, addRequest, sendMessage, closeCustomRequestModal]);

  // Message sending function - fixed validation logic
  const handleReply = useCallback(() => {
    if (!activeThread || !user) return;

    const textContent = replyMessage.trim();

    if (!textContent && !selectedImage) {
      // Don't send empty messages
      return;
    }

    // Send normal message or image message
    sendMessage(user.username, activeThread, textContent, {
      type: selectedImage ? 'image' : 'normal',
      meta: selectedImage ? { imageUrl: selectedImage } : undefined,
    });

    setReplyMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Close emoji picker if open
    setShowEmojiPicker(false);
    
    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, [
    activeThread, 
    user, 
    replyMessage, 
    selectedImage, 
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
      },
      user.username // Track who made the edit
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

  const handlePayNow = useCallback((req: any) => {
    setPayingRequest(req);
    setShowPayModal(true);
  }, []);

  // Enhanced payment handling with custom request integration
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
    const buyer = user.username; // Use current user as buyer

    if (!seller || !buyer) {
      alert('Missing seller or buyer information.');
      setShowPayModal(false);
      setPayingRequest(null);
      return;
    }

    if (wallet[buyer] === undefined || wallet[buyer] < markupPrice) {
      setShowPayModal(false);
      setPayingRequest(null);
      alert("Insufficient balance to complete this transaction.");
      return;
    }

    // Use the enhanced custom request purchase function
    const customRequestPurchase = {
      requestId: payingRequest.id,
      title: payingRequest.title,
      description: payingRequest.description,
      price: payingRequest.price,
      seller: payingRequest.seller,
      buyer: buyer, // Use current user
      tags: payingRequest.tags
    };

    const success = purchaseCustomRequest(customRequestPurchase);
    
    if (success) {
      // Mark request as paid in the requests system
      markRequestAsPaid(payingRequest.id);
      
      // Update the local requests state to reflect payment
      setRequests((prev) =>
        prev.map((r) =>
          r.id === payingRequest.id ? { ...r, paid: true, status: 'paid' } : r
        )
      );
      
      alert(`Payment successful! You paid ${markupPrice.toFixed(2)} for "${payingRequest.title}"`);
    } else {
      alert("Payment failed. Please check your balance and try again.");
    }

    setShowPayModal(false);
    setPayingRequest(null);
  }, [user, payingRequest, wallet, purchaseCustomRequest, markRequestAsPaid, setRequests]);

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
        `💰 I sent you a tip of ${amount.toFixed(2)}!`
      );
      setTipAmount('');
      setTipResult({
        success: true,
        message: `Successfully sent ${amount.toFixed(2)} tip to ${activeThread}!`
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

  // Handle thread selection without marking as read immediately
  const handleThreadSelect = useCallback((sellerId: string) => {
    if (activeThread === sellerId) return; // Prevent unnecessary state updates
    
    setActiveThread(sellerId);
  }, [activeThread]);

  // ⚠️ EARLY RETURN: Only return early AFTER all hooks have been called
  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <BanCheck>
        <RequireAuth role="buyer">
          <div className="py-3 bg-black"></div>
          <div className="h-screen bg-black flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

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

  // Derived values and helper variables
  const isUserBlocked = !!(user && activeThread && isBlocked(user.username, activeThread));
  const isUserReported = !!(user && activeThread && hasReported(user.username, activeThread));

  // Create a status badge component - IMPROVED COLORS FOR READABILITY
  function statusBadge(status: string) {
    let color = 'bg-yellow-400 text-black';
    let label = status.toUpperCase();
    let icon = <Clock size={12} className="mr-1" />;
    
    if (status === 'accepted') {
      color = 'bg-green-500 text-white';
      icon = <CheckCircle2 size={12} className="mr-1" />;
    }
    else if (status === 'rejected') {
      color = 'bg-red-500 text-white';
      icon = <XCircle size={12} className="mr-1" />;
    }
    else if (status === 'edited') {
      color = 'bg-blue-500 text-white';
      icon = <Edit3 size={12} className="mr-1" />;
    }
    else if (status === 'paid') {
      color = 'bg-green-600 text-white';
      icon = <ShoppingBag size={12} className="mr-1" />;
    }
    else if (status === 'pending') {
      color = 'bg-yellow-400 text-black';
      icon = <Clock size={12} className="mr-1" />;
    }
    
    return (
      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold flex items-center ${color} shadow-sm`}>
        {icon}
        {label}
      </span>
    );
  }

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

  // Calculate the total cost with platform fee
  const calculateTotalCost = (basePrice: string) => {
    const price = parseFloat(basePrice);
    if (isNaN(price) || price <= 0) return 0;
    return Math.round(price * 1.1 * 100) / 100;
  };

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        {/* Top Padding */}
        <div className="py-3 bg-black"></div>
        
        <div className="h-screen bg-black flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
            {/* Left column - Message threads */}
            <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
              {/* Buyer header */}
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-2xl font-bold text-[#ff950e] mb-2 flex items-center">
                  <MessageCircle size={24} className="mr-2 text-[#ff950e]" />
                  My Messages
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
                    const isActive = activeThread === seller;
                    const sellerProfile = sellerProfiles[seller];
                    
                    return (
                      <div 
                        key={seller}
                        onClick={() => handleThreadSelect(seller)}
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
                          
                          {/* Unread indicator - FIXED: Always show actual unread count */}
                          {unreadCounts[seller] > 0 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212] shadow-lg">
                              {unreadCounts[seller]}
                            </div>
                          )}
                        </div>
                        
                        {/* Message preview */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h3 className="font-bold text-white truncate">{seller}</h3>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-1 flex items-center">
                              <Clock size={12} className="mr-1" />
                              {lastMessage ? formatTimeAgo(lastMessage.date) : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {lastMessage ? (
                              lastMessage.type === 'customRequest' 
                                ? '🛒 Custom Request'
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
                        {sellerProfiles[activeThread]?.pic ? (
                          <img src={sellerProfiles[activeThread].pic} alt={activeThread} className="w-full h-full object-cover" />
                        ) : (
                          getInitial(activeThread)
                        )}
                        
                        {/* Verified badge if applicable */}
                        {sellerProfiles[activeThread]?.verified && (
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
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-[#121212]" ref={messagesContainerRef}>
                    <div className="max-w-3xl mx-auto space-y-4">
                      {threadMessages.map((msg, index) => {
                        const isFromMe = msg.sender === user?.username;
                        
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
                        const isPaid = customReq && (customReq.paid || customReq.status === 'paid');
                        
                        const showActionButtons =
                          !!customReq &&
                          isLatestCustom &&
                          customReq.status === 'pending' &&
                          !isLastEditor(customReq);
                        
                        return (
                          <MessageItem
                            key={index}
                            msg={msg}
                            index={index}
                            isFromMe={isFromMe}
                            user={user}
                            activeThread={activeThread}
                            onMessageVisible={handleMessageVisible}
                            customReq={customReq}
                            isLatestCustom={isLatestCustom}
                            isPaid={isPaid}
                            showActionButtons={showActionButtons}
                            handleAccept={handleAccept}
                            handleDecline={handleDecline}
                            handleEditRequest={handleEditRequest}
                            editRequestId={editRequestId}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            editPrice={editPrice}
                            setEditPrice={setEditPrice}
                            editMessage={editMessage}
                            setEditMessage={setEditMessage}
                            handleEditSubmit={handleEditSubmit}
                            setEditRequestId={setEditRequestId}
                            statusBadge={statusBadge}
                            setPreviewImage={setPreviewImage}
                            showPayNow={showPayNow}
                            handlePayNow={handlePayNow}
                            markupPrice={markupPrice}
                            canPay={canPay}
                          />
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
                          />
                          
                          {/* Fixed emoji button position */}
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
                        {replyMessage.length > 0 && (
                          <div className="text-xs text-gray-400 mb-2 text-right">
                            {replyMessage.length}/250
                          </div>
                        )}
                        
                        {/* Bottom row with action buttons - RESTORED CUSTOM ICONS */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-0">
                            {/* Tip button */}
                            <img 
                              src="/Send_Tip_Icon.png" 
                              alt="Send Tip" 
                              className="w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTipModal(true);
                              }}
                              title="Send Tip"
                            />
                            
                            {/* Attachment button */}
                            <img 
                              src="/Attach_Image_Icon.png" 
                              alt="Attach Image" 
                              className={`w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity ${
                                isImageLoading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              onClick={(e) => {
                                if (isImageLoading) return;
                                e.stopPropagation();
                                triggerFileInput();
                              }}
                              title="Attach Image"
                            />
                            
                            {/* Emoji button (mobile) - keeping this one as a button since it's not a custom image */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiPicker(!showEmojiPicker);
                              }}
                              className="md:hidden border-none p-0 bg-transparent focus:outline-none"
                              title="Emoji"
                              aria-label="Emoji"
                            >
                              <Smile size={52} className="text-[#ff950e]" />
                            </button>
                            
                            {/* Custom Request button */}
                            <img 
                              src="/Custom_Request_Icon.png" 
                              alt="Custom Request" 
                              className="w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCustomRequestModal();
                              }}
                              title="Send Custom Request"
                            />
                            
                            {/* Hidden file input */}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              ref={fileInputRef}
                              style={{ display: 'none' }}
                              onChange={handleImageSelect}
                            />
                          </div>
                          
                          {/* Send Button - Replaced with image */}
                          <img
                            src="/Send_Button.png"
                            alt="Send"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReply();
                            }}
                            className={`cursor-pointer hover:opacity-90 transition-opacity h-11 ${
                              (!replyMessage.trim() && !selectedImage) || isImageLoading
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                            style={{ pointerEvents: (!replyMessage.trim() && !selectedImage) || isImageLoading ? 'none' : 'auto' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isUserBlocked && (
                    <div className="p-4 border-t border-gray-800 text-center text-sm text-red-400 bg-[#1a1a1a] flex items-center justify-center">
                      <ShieldAlert size={16} className="mr-2" />
                      You have blocked this seller
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
          
          {/* NEW: Enhanced Custom Request Modal */}
          {showCustomRequestModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4">
              <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800">
                  <div className="flex items-center">
                    <div className="relative mr-2 flex items-center justify-center">
                      <div className="bg-white w-6 h-6 rounded-full absolute"></div>
                      <img src="/Custom_Request_Icon.png" alt="Custom Request" className="w-8 h-8 relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Custom Request</h3>
                      <p className="text-sm text-gray-400">Send to {activeThread}</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeCustomRequestModal}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  {/* Title Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Request Title *
                    </label>
                    <input
                      type="text"
                      value={customRequestForm.title}
                      onChange={(e) => setCustomRequestForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Custom worn panties with special requests"
                      className={`w-full p-3 rounded-lg bg-[#222] border ${
                        customRequestErrors.title ? 'border-red-500' : 'border-gray-700'
                      } text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]`}
                      maxLength={100}
                    />
                    {customRequestErrors.title && (
                      <p className="text-red-400 text-xs mt-1 flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        {customRequestErrors.title}
                      </p>
                    )}
                  </div>
                  
                  {/* Price Field with Total Display */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Price *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        value={customRequestForm.price}
                        onChange={(e) => setCustomRequestForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        className={`w-full pl-10 pr-4 p-3 rounded-lg bg-[#222] border ${
                          customRequestErrors.price ? 'border-red-500' : 'border-gray-700'
                        } text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]`}
                      />
                    </div>
                    {customRequestErrors.price && (
                      <p className="text-red-400 text-xs mt-1 flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        {customRequestErrors.price}
                      </p>
                    )}
                    {/* Total cost display */}
                    {customRequestForm.price && !isNaN(parseFloat(customRequestForm.price)) && parseFloat(customRequestForm.price) > 0 && (
                      <div className="mt-2 p-3 bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Base Price:</span>
                          <span className="text-white">${parseFloat(customRequestForm.price).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Platform Fee (10%):</span>
                          <span className="text-white">${(parseFloat(customRequestForm.price) * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-[#ff950e]/30 pt-2 mt-2">
                          <span className="text-[#ff950e]">Total You'll Pay:</span>
                          <span className="text-[#ff950e]">${calculateTotalCost(customRequestForm.price).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Description Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Request Details *
                    </label>
                    <textarea
                      value={customRequestForm.description}
                      onChange={(e) => setCustomRequestForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe exactly what you're looking for, including any special requests, wearing time, activities, etc."
                      rows={4}
                      className={`w-full p-3 rounded-lg bg-[#222] border ${
                        customRequestErrors.description ? 'border-red-500' : 'border-gray-700'
                      } text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] resize-none`}
                      maxLength={500}
                    />
                    {customRequestErrors.description && (
                      <p className="text-red-400 text-xs mt-1 flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        {customRequestErrors.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {customRequestForm.description.length}/500 characters
                    </p>
                  </div>
                  
                  {/* Balance Check */}
                  {user && customRequestForm.price && !isNaN(parseFloat(customRequestForm.price)) && parseFloat(customRequestForm.price) > 0 && (
                    <div className="p-3 bg-[#222] rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Your Wallet Balance:</span>
                        <span className="text-white font-medium">${(wallet[user.username] || 0).toFixed(2)}</span>
                      </div>
                      {wallet[user.username] < calculateTotalCost(customRequestForm.price) && (
                        <p className="text-red-400 text-xs mt-2 flex items-center">
                          <AlertTriangle size={12} className="mr-1" />
                          Insufficient balance. You'll need ${(calculateTotalCost(customRequestForm.price) - (wallet[user.username] || 0)).toFixed(2)} more.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Modal Footer */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 border-t border-gray-800">
                  <button
                    onClick={closeCustomRequestModal}
                    disabled={isSubmittingRequest}
                    className="px-6 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitCustomRequest}
                    disabled={isSubmittingRequest || !customRequestForm.title.trim() || !customRequestForm.price.trim() || !customRequestForm.description.trim()}
                    className="px-6 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmittingRequest ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Package size={16} className="mr-2" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
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
                  {' '}for "{payingRequest?.title}"?
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  (Includes 10% platform fee)
                </p>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={handleCancelPay}
                    className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPay}
                    className="px-4 py-2 rounded bg-[#ff950e] text-black hover:bg-[#e88800] transition-colors duration-150"
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
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <DollarSign size={20} className="mr-2 text-[#ff950e]" />
                    Send a Tip
                  </h3>
                  <button 
                    onClick={() => {
                      setShowTipModal(false);
                      setTipResult(null);
                      setTipAmount('');
                    }}
                    className="text-gray-400 hover:text-white transition-colors duration-150"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {tipResult ? (
                  <div className={`p-4 rounded-lg mb-4 ${tipResult.success ? 'bg-green-600 bg-opacity-20 text-green-400' : 'bg-red-600 bg-opacity-20 text-red-400'} flex items-center`}>
                    {tipResult.success ? 
                      <CheckCircle2 size={16} className="mr-2" /> : 
                      <AlertTriangle size={16} className="mr-2" />
                    }
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
                          className="bg-[#333] text-white border-gray-700 focus:ring-[#ff950e] focus:border-[#ff950e] block w-full pl-7 pr-12 rounded-md p-2"
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
                        className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendTip}
                        className="px-4 py-2 rounded bg-[#ff950e] text-black hover:bg-[#e88800] flex items-center transition-colors duration-150"
                        disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                      >
                        <DollarSign size={16} className="mr-1" />
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
        </div>
      </RequireAuth>
    </BanCheck>
  );
}
