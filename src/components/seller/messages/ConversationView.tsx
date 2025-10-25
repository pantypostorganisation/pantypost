// src/components/seller/messages/ConversationView.tsx
'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import MessagesList from './MessagesList';
import MessageInputContainer from './MessageInputContainer';
import TypingIndicator from '@/components/messaging/TypingIndicator';
import { 
  ChevronLeft, 
  User, 
  MoreVertical, 
  Ban, 
  Flag, 
  CheckCircle,
  ShieldAlert 
} from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { formatActivityStatus } from '@/utils/format';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';

// Import existing types
import type { Message } from '@/utils/messageUtils';
import type { CustomRequest } from '@/context/RequestContext';

interface BuyerProfile {
  pic: string | null;
  verified: boolean;
}

interface User {
  id: string;
  username: string;
  role: 'buyer' | 'seller' | 'admin';
}

interface Threads {
  [key: string]: Message[];
}

// Helper to get conversation key
const getConversationKey = (userA: string, userB: string): string => {
  return [userA, userB].sort().join('-');
};

interface EditRequestControls {
  editRequestId: string | null;
  setEditRequestId: (id: string | null) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  handleEditSubmit: () => void;
}

interface MessageInputControls {
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isImageLoading: boolean;
  setIsImageLoading: (loading: boolean) => void;
  imageError: string | null;
  setImageError: (error: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  recentEmojis: string[];
  handleReply: () => void;
  handleEmojiClick: (emoji: string) => void;
  handleImageSelect: (file: File) => void;
}

interface ConversationViewProps {
  activeThread: string;
  threads: Threads;
  buyerProfiles: Record<string, BuyerProfile>;
  sellerRequests: CustomRequest[];
  isUserBlocked: boolean;
  isUserReported: boolean;
  handleReport: () => void;
  handleBlockToggle: () => void;
  user: User;
  messageInputControls: MessageInputControls;
  editRequestControls: EditRequestControls;
  handleAccept: (requestId: string) => void;
  handleDecline: (requestId: string) => void;
  handleEditRequest: (requestId: string, title: string, price: number, message: string) => void;
  handleMessageVisible: (msg: Message) => void;
  setPreviewImage: (url: string | null) => void;
  isMobile?: boolean;
  onBack?: () => void;
}

export default function ConversationView({
  activeThread,
  threads,
  buyerProfiles,
  sellerRequests,
  isUserBlocked,
  isUserReported,
  handleReport,
  handleBlockToggle,
  user,
  messageInputControls,
  editRequestControls,
  handleAccept,
  handleDecline,
  handleEditRequest,
  handleMessageVisible,
  setPreviewImage,
  isMobile = false,
  onBack,
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const lastManualScrollTime = useRef(Date.now());

  // Get WebSocket context
  const wsContext = useWebSocket();

  // State for typing indicator and dropdown
  const [isBuyerTyping, setIsBuyerTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Refs for typing management
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const autoHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScrolledForTypingRef = useRef(false);
  const userHasScrolledRef = useRef(false);

  const { activityStatus, loading: activityLoading } = useUserActivityStatus(activeThread);

  // Get thread messages
  const threadMessages = useMemo(() => {
    if (!activeThread || !threads[activeThread]) return [];
    return getLatestCustomRequestMessages(threads[activeThread], sellerRequests);
  }, [activeThread, threads, sellerRequests]);

  // Prevent scroll outside messages container on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!messagesContainerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      if (!messagesContainerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [isMobile]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const scroller = messagesContainerRef.current;
    if (!scroller) return;

    const isNearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 100;

    if (isNearBottom || !userHasScrolledRef.current) {
      requestAnimationFrame(() => {
        scroller.scrollTo({
          top: scroller.scrollHeight,
          behavior,
        });

        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
        }
      });
    }
  }, [messagesEndRef]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom('smooth');
  }, [threadMessages.length, scrollToBottom]);

  // Thread focus/blur
  useEffect(() => {
    if (!activeThread || !user || !wsContext?.sendMessage) return;

    const threadId = getConversationKey(user.username, activeThread);
    wsContext.sendMessage('thread:focus', { threadId, otherUser: activeThread });

    return () => {
      wsContext.sendMessage?.('thread:blur', { threadId, otherUser: activeThread });
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
  }, []);

  // Listen for buyer typing events
  useEffect(() => {
    if (!wsContext || !activeThread || !user) return;

    const conversationId = getConversationKey(user.username, activeThread);

    const handleTypingEvent = (data: any) => {
      if (data.conversationId === conversationId && data.username === activeThread) {
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = null;
        }

        setIsBuyerTyping(!!data.isTyping);
        
        if (data.isTyping) {
          scrollToBottom('smooth');
          autoHideTimeoutRef.current = setTimeout(() => {
            setIsBuyerTyping(false);
            autoHideTimeoutRef.current = null;
          }, 5000);
        }
      }
    };

    const handleNewMessage = (data: any) => {
      if (data.sender === activeThread && data.receiver === user.username) {
        setIsBuyerTyping(false);
        hasScrolledForTypingRef.current = false;
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = null;
        }
      }
    };

    const unsubscribeTyping = wsContext?.subscribe('message:typing', handleTypingEvent);
    const unsubscribeMessage = wsContext?.subscribe('message:new', handleNewMessage);

    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
        autoHideTimeoutRef.current = null;
      }
      unsubscribeTyping?.();
      unsubscribeMessage?.();
    };
  }, [activeThread, user, wsContext, scrollToBottom]);

  // Enhanced message input controls with typing events
  const enhancedMessageInputControls = useMemo(() => {
    const handleTypingChange = (value: string) => {
      messageInputControls.setReplyMessage(value);

      if (wsContext && activeThread && user) {
        const conversationId = getConversationKey(user.username, activeThread);
        const now = Date.now();

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        if (value.trim()) {
          if (!isTypingRef.current || now - lastTypingEmitRef.current > 1000) {
            wsContext.sendMessage('message:typing', {
              conversationId,
              isTyping: true,
            });
            lastTypingEmitRef.current = now;
            isTypingRef.current = true;
          }

          typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            wsContext.sendMessage('message:typing', {
              conversationId,
              isTyping: false,
            });
          }, 3000);
        } else {
          if (isTypingRef.current) {
            isTypingRef.current = false;
            wsContext.sendMessage('message:typing', {
              conversationId,
              isTyping: false,
            });
          }
        }
      }
    };

    const stopTyping = () => {
      if (wsContext && activeThread && user && isTypingRef.current) {
        const conversationId = getConversationKey(user.username, activeThread);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        isTypingRef.current = false;
        wsContext.sendMessage('message:typing', {
          conversationId,
          isTyping: false,
        });
      }
    };

    const handleReplyWithStopTyping = () => {
      stopTyping();
      messageInputControls.handleReply();
      
      setTimeout(() => {
        scrollToBottom('auto');
        if (inputRef.current) {
          (inputRef.current as any).focus({ preventScroll: true });
        }
      }, 50);
    };

    return {
      ...messageInputControls,
      setReplyMessage: handleTypingChange,
      handleReply: handleReplyWithStopTyping,
    };
  }, [messageInputControls, activeThread, user, wsContext, scrollToBottom]);

  const getActivityDisplay = () => {
    if (isUserBlocked) return 'Blocked';
    if (activityLoading) return '...';
    return formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
  };

  const safeBuyerProfile: BuyerProfile = buyerProfiles[activeThread] ?? { pic: null, verified: false };

  // Mobile Header Component
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
          
          {/* Buyer Avatar */}
          <div className="relative mr-3 flex-shrink-0">
            {safeBuyerProfile.pic ? (
              <SecureImage
                src={safeBuyerProfile.pic}
                alt={sanitizeStrict(activeThread)}
                className="w-10 h-10 rounded-full object-cover"
                fallbackSrc="/placeholder-avatar.png"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {sanitizeStrict(activeThread).charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Online indicator */}
            {activityStatus.isOnline && !isUserBlocked && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
            )}
            
            {/* Verified badge */}
            {safeBuyerProfile.verified && (
              <div className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full">
                <CheckCircle className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </div>
          
          {/* Buyer Name and Status */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white truncate text-lg">
              {sanitizeStrict(activeThread)}
            </div>
            <div className={`text-sm ${
              activityStatus.isOnline && !isUserBlocked ? 'text-green-400' : 'text-gray-400'
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
                    window.location.href = `/buyers/${sanitizeStrict(activeThread)}`;
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                  role="menuitem"
                >
                  <User className="w-4 h-4" />
                  View Profile
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

  // Desktop Header Component
  const renderDesktopHeader = () => (
    <div className="flex items-center justify-between p-3">
      {/* Left section */}
      <div className="flex items-center flex-1 min-w-0">
        {/* Buyer Avatar */}
        <div className="relative mr-3 flex-shrink-0">
          {safeBuyerProfile.pic ? (
            <SecureImage
              src={safeBuyerProfile.pic}
              alt={sanitizeStrict(activeThread)}
              className="w-10 h-10 rounded-full object-cover"
              fallbackSrc="/placeholder-avatar.png"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {sanitizeStrict(activeThread).charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Online indicator */}
          {activityStatus.isOnline && !isUserBlocked && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
          )}
          
          {/* Verified badge */}
          {safeBuyerProfile.verified && (
            <div className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full">
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
          )}
        </div>
        
        {/* Buyer Name and Status */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">
            {sanitizeStrict(activeThread)}
          </div>
          <div className={`text-xs ${
            activityStatus.isOnline && !isUserBlocked ? 'text-green-400' : 'text-gray-400'
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
                  window.location.href = `/buyers/${sanitizeStrict(activeThread)}`;
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#333] hover:text-white transition-colors flex items-center gap-2"
                role="menuitem"
              >
                <User className="w-4 h-4" />
                View Profile
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-[#121212] flex flex-col overflow-hidden min-h-0">
        {/* Mobile Header */}
        {renderMobileHeader()}

        {/* Messages container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2 min-h-0 scroll-smooth scrollbar-thin scrollbar-thumb-[#ff950e]/40 scrollbar-track-[#1a1a1a]"
          style={{
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="max-w-3xl mx-auto space-y-3">
            <MessagesList
              threadMessages={threadMessages}
              sellerRequests={sellerRequests}
              user={user}
              activeThread={activeThread}
              handleAccept={handleAccept}
              handleDecline={handleDecline}
              handleEditRequest={handleEditRequest}
              handleEditSubmit={editRequestControls.handleEditSubmit}
              handleMessageVisible={handleMessageVisible}
              editRequestId={editRequestControls.editRequestId}
              setEditRequestId={editRequestControls.setEditRequestId}
              editPrice={editRequestControls.editPrice}
              setEditPrice={editRequestControls.setEditPrice}
              editTitle={editRequestControls.editTitle}
              setEditTitle={editRequestControls.setEditTitle}
              editMessage={editRequestControls.editMessage}
              setEditMessage={editRequestControls.setEditMessage}
              setPreviewImage={setPreviewImage}
            />

            {/* Typing Indicator */}
            <TypingIndicator
              username={activeThread}
              isTyping={isBuyerTyping}
              userPic={safeBuyerProfile.pic}
            />

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer with safe bottom */}
        <div
          ref={composerRef}
          className="bg-[#111111] border-t border-gray-800 shadow-sm flex-shrink-0 safe-bottom"
        >
          {!isUserBlocked ? (
            <MessageInputContainer
              isUserBlocked={isUserBlocked}
              onBlockToggle={handleBlockToggle}
              activeThread={activeThread}
              inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              emojiPickerRef={emojiPickerRef as React.RefObject<HTMLDivElement>}
              lastManualScrollTime={lastManualScrollTime}
              {...enhancedMessageInputControls}
            />
          ) : (
            <div className="p-4 text-center text-sm text-red-400 flex items-center justify-center">
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
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-full flex flex-col bg-[#121212] min-h-0 overflow-hidden">
      {/* Desktop Header */}
      <div className="flex-shrink-0 bg-[#1a1a1a] border-b border-gray-800 shadow-sm">
        {renderDesktopHeader()}
      </div>

      {/* Desktop Messages */}
      <div
        className="flex-1 overflow-y-auto bg-[#121212] min-h-0 scroll-smooth scrollbar-thin scrollbar-thumb-[#ff950e]/40 scrollbar-track-[#1a1a1a]"
        ref={messagesContainerRef}
      >
        <div className="max-w-3xl mx-auto space-y-3 p-4">
          <MessagesList
            threadMessages={threadMessages}
            sellerRequests={sellerRequests}
            user={user}
            activeThread={activeThread}
            handleAccept={handleAccept}
            handleDecline={handleDecline}
            handleEditRequest={handleEditRequest}
            handleEditSubmit={editRequestControls.handleEditSubmit}
            handleMessageVisible={handleMessageVisible}
            editRequestId={editRequestControls.editRequestId}
            setEditRequestId={editRequestControls.setEditRequestId}
            editPrice={editRequestControls.editPrice}
            setEditPrice={editRequestControls.setEditPrice}
            editTitle={editRequestControls.editTitle}
            setEditTitle={editRequestControls.setEditTitle}
            editMessage={editRequestControls.editMessage}
            setEditMessage={editRequestControls.setEditMessage}
            setPreviewImage={setPreviewImage}
          />

          {/* Typing Indicator */}
          <TypingIndicator
            username={activeThread}
            isTyping={isBuyerTyping}
            userPic={safeBuyerProfile.pic}
          />

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Desktop Composer */}
      {!isUserBlocked ? (
        <div className="relative border-t border-gray-800 bg-[#1a1a1a]">
          <MessageInputContainer
            isUserBlocked={isUserBlocked}
            onBlockToggle={handleBlockToggle}
            activeThread={activeThread}
            inputRef={inputRef as React.RefObject<HTMLTextAreaElement>}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            emojiPickerRef={emojiPickerRef as React.RefObject<HTMLDivElement>}
            lastManualScrollTime={lastManualScrollTime}
            {...enhancedMessageInputControls}
          />
        </div>
      ) : (
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

// Helper function
function getLatestCustomRequestMessages(messages: Message[], requests: CustomRequest[]): Message[] {
  if (!Array.isArray(messages)) return [];

  const seen = new Set<string>();
  const result: Message[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') continue;

    if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
      const requestId = String(msg.meta.id);
      if (!seen.has(requestId)) {
        seen.add(requestId);
        result.unshift(msg);
      }
    } else {
      result.unshift(msg);
    }
  }

  return result;
}
