// src/components/buyers/messages/ConversationView.tsx
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { WalletContext } from '@/context/WalletContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';
import {
  BadgeCheck,
  AlertTriangle,
  ShieldAlert,
  X,
  Smile,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  ShoppingBag,
  Package,
  ChevronLeft,
  User,
  MoreVertical,
  Ban,
  Flag,
  ArrowUp
} from 'lucide-react';
import MessageItem from './MessageItem';
import TypingIndicator from '@/components/messaging/TypingIndicator';
import { getLatestCustomRequestMessages, Message, CustomRequest, getInitial } from '@/utils/messageUtils';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { formatActivityStatus } from '@/utils/format';
import { ALL_EMOJIS } from '@/constants/emojis';

// Helper to get conversation key (use sanitized usernames)
const getConversationKey = (userA: string, userB: string): string => {
  const a = sanitizeUsername(userA);
  const b = sanitizeUsername(userB);
  return [a, b].sort().join('-');
};

// Helper function to resolve profile picture URLs properly
const resolveProfilePicUrl = (pic: string | null | undefined): string | null => {
  if (!pic) return null;
  
  // If it's already a full URL, return as-is
  if (pic.startsWith('http://') || pic.startsWith('https://')) {
    // Replace http with https for production API
    if (pic.includes('api.pantypost.com') && pic.startsWith('http://')) {
      return pic.replace('http://', 'https://');
    }
    return pic;
  }
  
  // If it starts with /uploads/, prepend the API URL
  if (pic.startsWith('/uploads/')) {
    // Use HTTPS for production
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com';
    return `${apiUrl}${pic}`;
  }
  
  // If it's just a filename or relative path, prepend /uploads/ and API URL
  if (!pic.startsWith('/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com';
    return `${apiUrl}/uploads/${pic}`;
  }
  
  // Default: prepend API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com';
  return `${apiUrl}${pic}`;
};

// Create a status badge component
export function statusBadge(status: string): React.ReactElement {
  let color = 'bg-yellow-400 text-black';
  let label = status.toUpperCase();
  let icon = <Clock size={12} className="mr-1" />;

  if (status === 'accepted') {
    color = 'bg-green-500 text-white';
    icon = <CheckCircle2 size={12} className="mr-1" />;
  } else if (status === 'rejected') {
    color = 'bg-red-500 text-white';
    icon = <XCircle size={12} className="mr-1" />;
  } else if (status === 'edited') {
    color = 'bg-blue-500 text-white';
    icon = <Edit3 size={12} className="mr-1" />;
  } else if (status === 'paid') {
    color = 'bg-green-600 text-white';
    icon = <ShoppingBag size={12} className="mr-1" />;
  } else if (status === 'pending') {
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

interface ConversationViewProps {
  activeThread: string;
  threads: { [seller: string]: Message[] };
  user: any;
  sellerProfiles: { [seller: string]: { profilePic: string | null; isVerified: boolean } };
  buyerRequests: CustomRequest[];
  wallet: { [username: string]: number };
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  recentEmojis: string[];
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isImageLoading: boolean;
  imageError: string | null;
  editRequestId: string | null;
  setEditRequestId: (id: string | null) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editTags: string;
  setEditTags: (tags: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  handleReply: () => void;
  handleBlockToggle: () => void;
  handleReport: () => void;
  handleAccept: (req: CustomRequest) => void;
  handleDecline: (req: CustomRequest) => void;
  handleEditRequest: (req: CustomRequest) => void;
  handleEditSubmit: () => void;
  handlePayNow: (req: CustomRequest) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMessageVisible: (msg: Message) => void;
  handleEmojiClick: (emoji: string) => void;
  isUserBlocked: boolean;
  isUserReported: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  lastManualScrollTime: React.RefObject<number>;
  setShowCustomRequestModal: (show: boolean) => void;
  setShowTipModal: (show: boolean) => void;
  isMobile?: boolean;
  onBack?: () => void;
}

export default function ConversationView(props: ConversationViewProps) {
  const {
    activeThread,
    threads,
    user,
    sellerProfiles,
    buyerRequests,
    wallet,
    previewImage,
    setPreviewImage,
    showEmojiPicker,
    setShowEmojiPicker,
    recentEmojis,
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    isImageLoading,
    imageError,
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
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handlePayNow,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,
    isUserBlocked,
    isUserReported,
    messagesEndRef,
    messagesContainerRef,
    fileInputRef,
    emojiPickerRef,
    inputRef,
    lastManualScrollTime,
    setShowCustomRequestModal,
    setShowTipModal,
    isMobile = false,
    onBack,
  } = props;

  const walletContext = useContext(WalletContext);
  const wsContext = useWebSocket();
  const composerRef = useRef<HTMLDivElement>(null);

  const [isSellerTyping, setIsSellerTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasScrolledForTypingRef = useRef(false);
  const userHasScrolledRef = useRef(false);

  // Use the REAL WebSocket activity status hook
  const { activityStatus, loading: activityLoading } = useUserActivityStatus(activeThread);

  const threadMessages = getLatestCustomRequestMessages(threads[activeThread] || [], buyerRequests);

  // Use profilePic instead of pic
  const resolvedSellerPic = resolveProfilePicUrl(sellerProfiles[activeThread]?.profilePic);

  // Prevent scroll outside messages container on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleTouchMove = (e: TouchEvent) => {
      // Check if the touch target is within the messages container
      if (!messagesContainerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      // Check if the wheel event target is within the messages container  
      if (!messagesContainerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    // Add listeners with passive: false to allow preventDefault
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isMobile, messagesContainerRef]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback((behavior: 'instant' | 'smooth' = 'instant') => {
    if (!messagesContainerRef.current) return;
    
    const scroller = messagesContainerRef.current;
    const isNearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 100;
    
    // Only auto-scroll if user is near bottom or it's a new conversation
    if (isNearBottom || !userHasScrolledRef.current) {
      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior: behavior
      });
    }
  }, [messagesContainerRef]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom('instant');
  }, [threadMessages.length, scrollToBottom]);

  // Thread focus/blur
  useEffect(() => {
    if (!activeThread || !user || !wsContext?.sendMessage) return;

    const threadId = getConversationKey(user.username, activeThread);
    wsContext.sendMessage('thread:focus', { threadId, otherUser: sanitizeUsername(activeThread) });

    return () => {
      wsContext.sendMessage('thread:blur', { threadId, otherUser: sanitizeUsername(activeThread) });
    };
  }, [activeThread, user, wsContext]);

  // Track manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (!isAtBottom) {
        userHasScrolledRef.current = true;
        lastManualScrollTime.current = Date.now();
      } else {
        userHasScrolledRef.current = false;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messagesContainerRef, lastManualScrollTime]);

  // Handle typing events
  useEffect(() => {
    if (!wsContext || !activeThread || !user) return;

    const conversationId = getConversationKey(user.username, activeThread);
    const handleTypingEvent = (data: any) => {
      if (data.conversationId === conversationId && data.username === sanitizeUsername(activeThread)) {
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = null;
        }
        setIsSellerTyping(!!data.isTyping);
        if (data.isTyping) {
          scrollToBottom('smooth');
        }
        if (data.isTyping) {
          autoHideTimeoutRef.current = setTimeout(() => {
            setIsSellerTyping(false);
            autoHideTimeoutRef.current = null;
          }, 5000);
        }
      }
    };

    const unsubscribe = wsContext?.subscribe('message:typing', handleTypingEvent);
    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = null;
      }
      unsubscribe?.();
    };
  }, [activeThread, user, wsContext, scrollToBottom]);

  const handleTypingChange = useCallback(
    (value: string) => {
      setReplyMessage(value);
      if (wsContext && activeThread && user) {
        const conversationId = getConversationKey(user.username, activeThread);
        const now = Date.now();

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (value.trim()) {
          if (!isTypingRef.current || now - lastTypingEmitRef.current > 1000) {
            wsContext.sendMessage('message:typing', { conversationId, isTyping: true });
            lastTypingEmitRef.current = now;
            isTypingRef.current = true;
          }
          typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            wsContext.sendMessage('message:typing', { conversationId, isTyping: false });
          }, 3000);
        } else if (isTypingRef.current) {
          isTypingRef.current = false;
          wsContext.sendMessage('message:typing', { conversationId, isTyping: false });
        }
      }
    },
    [activeThread, setReplyMessage, user, wsContext]
  );

  const stopTyping = useCallback(() => {
    if (wsContext && activeThread && user && isTypingRef.current) {
      const conversationId = getConversationKey(user.username, activeThread);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isTypingRef.current = false;
      wsContext.sendMessage('message:typing', { conversationId, isTyping: false });
    }
  }, [activeThread, user, wsContext]);

  const messageSanitizer = (value: string): string => value.replace(/<[^>]*>/g, '').slice(0, 250);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleReply();
        scrollToBottom('instant');
      }
    },
    [handleReply, scrollToBottom]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const stableHandleReply = useCallback(() => {
    stopTyping();
    handleReply();
    
    // Scroll to bottom after sending
    setTimeout(() => {
      scrollToBottom('instant');
      // Refocus input without scrolling
      if (inputRef.current) {
        (inputRef.current as any).focus({ preventScroll: true });
      }
    }, 50);
  }, [handleReply, stopTyping, scrollToBottom, inputRef]);

  const stableHandleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e);
  }, [handleImageSelect]);

  const getActivityDisplay = () => {
    if (isUserBlocked) return 'Blocked';
    if (activityLoading) return '...';
    return formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
  };

  function isLastEditor(customReq: CustomRequest | undefined) {
    if (!customReq) return false;
    const lastMsg = threadMessages
      .filter((msg: Message) => msg.type === 'customRequest' && msg.meta && msg.meta.id === customReq.id)
      .slice(-1)[0];
    return !!lastMsg && lastMsg.sender === user?.username;
  }

  // Mobile Header Component - NO verification badge
  const renderMobileHeader = () => (
    <div className="flex-shrink-0 bg-[#1a1a1a] border-b border-gray-800 shadow-lg safe-top z-50 sticky top-0">
      <div className="flex items-center justify-between p-4 min-h-[60px]">
        {/* Left section with back button */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 mr-3 hover:bg-[#222] rounded-lg transition-colors"
              aria-label="Back to messages"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          
          {/* Seller Avatar with online indicator */}
          <div className="relative mr-3 flex-shrink-0">
            {resolvedSellerPic ? (
              <SecureImage
                src={resolvedSellerPic}
                alt={sanitizeStrict(activeThread)}
                className="w-10 h-10 rounded-full object-cover"
                fallbackSrc="/default-avatar.png"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {sanitizeStrict(activeThread).charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Online indicator - Messenger style with #ff950e */}
            {activityStatus.isOnline && !isUserBlocked && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#ff950e] rounded-full border-2 border-[#1a1a1a]" />
            )}
          </div>
          
          {/* Seller Name and Status */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate text-lg">
              {sanitizeStrict(activeThread)}
            </div>
            <div className={`text-sm ${
              activityStatus.isOnline && !isUserBlocked ? 'text-[#ff950e]' : 'text-gray-400'
            }`}>
              {getActivityDisplay()}
            </div>
          </div>
        </div>
        
        {/* Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 hover:bg-[#222] rounded-lg transition-colors"
            aria-haspopup="menu"
            aria-expanded={showDropdown}
            aria-label="More options"
          >
            <MoreVertical className="w-6 h-6 text-gray-400" />
          </button>
          
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowDropdown(false)} 
              />
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 bg-[#222] border border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50"
              >
                <button
                  onClick={() => {
                    window.location.href = `/sellers/${sanitizeStrict(activeThread)}`;
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <User className="w-4 h-4" />
                  Visit Profile
                </button>
                
                <div className="my-1 border-t border-gray-700" />
                
                {!isUserReported && (
                  <button
                    onClick={() => {
                      handleReport();
                      setShowDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                    role="menuitem"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                )}
                
                <button
                  onClick={() => {
                    handleBlockToggle();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <Ban className="w-4 h-4" />
                  {isUserBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Desktop Header Component - NO verification badge
  const renderDesktopHeader = () => (
    <div className="flex items-center justify-between p-3">
      {/* Left section */}
      <div className="flex items-center flex-1 min-w-0">
        {/* Seller Avatar with online indicator */}
        <div className="relative mr-3 flex-shrink-0">
          {resolvedSellerPic ? (
            <SecureImage
              src={resolvedSellerPic}
              alt={sanitizeStrict(activeThread)}
              className="w-10 h-10 rounded-full object-cover"
              fallbackSrc="/default-avatar.png"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {sanitizeStrict(activeThread).charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Online indicator - Messenger style with #ff950e */}
          {activityStatus.isOnline && !isUserBlocked && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#ff950e] rounded-full border-2 border-[#1a1a1a]" />
          )}
        </div>
        
        {/* Seller Name and Status */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">
            {sanitizeStrict(activeThread)}
          </div>
          <div className={`text-xs ${
            activityStatus.isOnline && !isUserBlocked ? 'text-[#ff950e]' : 'text-gray-400'
          }`}>
            {getActivityDisplay()}
          </div>
        </div>
      </div>
      
      {/* Actions Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 hover:bg-[#222] rounded-lg transition-colors"
          aria-haspopup="menu"
          aria-expanded={showDropdown}
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
        
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)} 
            />
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 bg-[#222] border border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50"
            >
              <button
                onClick={() => {
                  window.location.href = `/sellers/${sanitizeStrict(activeThread)}`;
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                role="menuitem"
              >
                <User className="w-4 h-4" />
                Visit Profile
              </button>
              
              <div className="my-1 border-t border-gray-700" />
              
              {!isUserReported && (
                <button
                  onClick={() => {
                    handleReport();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              )}
              
              <button
                onClick={() => {
                  handleBlockToggle();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                role="menuitem"
              >
                <Ban className="w-4 h-4" />
                {isUserBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Render messages list
  const renderMessagesList = () => (
    <>
      {threadMessages.map((msg: Message, index: number) => {
        const isFromMe = msg.sender === user?.username;

        let customReq: CustomRequest | undefined;
        if (msg.type === 'customRequest' && msg.meta && typeof msg.meta.id === 'string') {
          customReq = buyerRequests.find((r: CustomRequest) => r.id === msg.meta?.id);
        }

        const isLatestCustom =
          !!customReq &&
          (customReq.status === 'pending' || customReq.status === 'edited' || customReq.status === 'accepted') &&
          msg.type === 'customRequest';

        const showPayNow = !!customReq && customReq.status === 'accepted' && !customReq.paid && msg.type === 'customRequest';

        const markupPrice = customReq ? Math.round(customReq.price * 1.1 * 100) / 100 : 0;
        const currentBalance = user && walletContext ? walletContext.getBuyerBalance(user.username) : 0;
        const canPay = !!(customReq && currentBalance >= markupPrice);
        const isPaid = !!(customReq && (customReq.paid || customReq.status === 'paid'));

        const stableKey = msg.id ?? `${sanitizeUsername(msg.sender || 'unknown')}-${msg.date}-${index}`;

        return (
          <MessageItem
            key={stableKey}
            msg={msg}
            index={index}
            isFromMe={isFromMe}
            user={user}
            activeThread={activeThread}
            onMessageVisible={handleMessageVisible}
            customReq={customReq}
            isLatestCustom={isLatestCustom}
            isPaid={isPaid}
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

      <TypingIndicator username={activeThread} isTyping={isSellerTyping} userPic={resolvedSellerPic} />

      <div ref={messagesEndRef} />
    </>
  );

  const canSend = (!!replyMessage.trim() || !!selectedImage) && !isImageLoading;

  // Render composer
  const renderComposer = () => (
    <>
      {/* Selected image preview */}
      {selectedImage && (
        <div className="px-4 pt-3 pb-2">
          <div className="relative inline-block">
            <SecureImage src={selectedImage} alt="Selected preview" className="max-h-20 rounded shadow-md" />
            <button
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs shadow-md transform transition-transform hover:scale-110"
              style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Remove attached image"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {isImageLoading && <div className="px-4 pt-3 pb-0 text-sm text-gray-400">Loading image...</div>}

      {imageError && (
        <div className="px-4 pt-3 pb-0 text-sm text-red-400 flex items-center">
          <AlertTriangle size={14} className="mr-1" />
          {sanitizeStrict(imageError)}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3">
        <div className="relative mb-2">
          <SecureTextarea
            ref={inputRef}
            value={replyMessage}
            onChange={handleTypingChange}
            onKeyPress={handleKeyDown}
            onFocus={(e) => {
              e.preventDefault();
            }}
            placeholder={selectedImage ? 'Add a caption...' : 'Type a message'}
            className="w-full p-3 pr-28 !bg-[#222] !border-gray-700 !text-white focus:!outline-none focus:!ring-1 focus:!ring-[#ff950e] min-h-[40px] max-h-20 !resize-none overflow-auto leading-tight"
            rows={1}
            maxLength={250}
            sanitizer={messageSanitizer}
            characterCount={false}
            aria-label="Message"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-[-4px] flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className={`flex items-center justify-center h-8 w-8 rounded-full ${
                showEmojiPicker ? 'bg-[#ff950e] text-black' : 'text-[#ff950e] hover:bg-[#333]'
              } transition-colors duration-150`}
              title="Emoji"
              type="button"
              aria-label="Toggle emoji picker"
            >
              <Smile size={20} className="flex-shrink-0" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!canSend) return;
                setShowEmojiPicker(false);
                stableHandleReply();
              }}
              className={`flex items-center justify-center px-3.5 py-1.5 rounded-2xl transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#222] ${
                canSend
                  ? 'bg-[#ff950e] text-black hover:bg-[#e88800] focus:ring-[#ff950e]'
                  : 'bg-[#2b2b2b] text-gray-500 cursor-not-allowed focus:ring-[#2b2b2b]'
              }`}
              aria-label="Send message"
              disabled={!canSend}
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {replyMessage.length > 0 && (
          <div className="text-xs text-gray-400 mb-2 text-right">{replyMessage.length}/250</div>
        )}

        <div className="flex items-center gap-0">
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

            <img
              src="/Custom_Request_Icon.png"
              alt="Custom Request"
              className="w-14 h-14 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setShowCustomRequestModal(true);
              }}
              title="Send Custom Request"
            />

            {/* Hidden file input with strict types */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={stableHandleImageSelect}
            />
        </div>
      </div>

      {/* Inline emoji picker (grid) */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute left-0 right-0 mx-4 bottom-full mb-2 bg-black border border-gray-800 shadow-lg z-50 rounded-lg overflow-hidden"
        >
          {/* Recent */}
          {recentEmojis.length > 0 && (
            <div className="px-3 pt-3">
              <div className="text-xs text-gray-400 mb-2">Recent</div>
              <div className="grid grid-cols-8 gap-1 mb-3">
                {recentEmojis.slice(0, 16).map((emoji: string, idx: number) => (
                  <span
                    key={`recent-${idx}`}
                    onClick={() => handleEmojiClick(emoji)}
                    className="emoji-button flex items-center justify-center text-xl rounded-full w-10 h-10 cursor-pointer bg-black hover:bg-[#222] transition-colors duration-150"
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All emojis (shared constant) */}
          <div className="px-3 pt-2 pb-3">
            {recentEmojis.length > 0 && <div className="text-xs text-gray-400 mb-2">All Emojis</div>}
            <div className="grid grid-cols-8 gap-1 p-0 overflow-auto" style={{ maxHeight: '200px' }}>
              {ALL_EMOJIS.map((emoji, idx) => (
                <span
                  key={`emoji-${idx}`}
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
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-[#121212] flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {renderMobileHeader()}

        {/* Messages container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2"
          style={{ 
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="max-w-3xl mx-auto space-y-3">
            {renderMessagesList()}
          </div>
        </div>

        {/* Composer with safe bottom */}
        <div 
          ref={composerRef}
          className="bg-[#111111] border-t border-gray-800 shadow-sm flex-shrink-0 safe-bottom"
        >
          {!isUserBlocked ? (
            <div className="relative">
              {renderComposer()}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-red-400 flex items-center justify-center">
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
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-full flex flex-col bg-[#121212]">
      {/* Desktop Header */}
      <div className="flex-shrink-0 bg-[#1a1a1a] border-b border-gray-800 shadow-sm">
        {renderDesktopHeader()}
      </div>

      {/* Desktop Messages */}
      <div 
        className="flex-1 overflow-y-auto bg-[#121212]" 
        ref={messagesContainerRef}
      >
        <div className="max-w-3xl mx-auto space-y-4 p-4">
          {renderMessagesList()}
        </div>
      </div>

      {/* Desktop Composer */}
      {!isUserBlocked ? (
        <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
          {renderComposer()}
        </div>
      ) : (
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

      <style jsx global>{`
        .emoji-button::before {
          content: '';
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
        
        /* Prevent overscroll on mobile */
        @media (max-width: 767px) {
          body {
            overscroll-behavior: none;
          }
        }
      `}</style>
    </div>
  );
}
