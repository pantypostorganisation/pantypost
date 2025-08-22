'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInputContainer from './MessageInputContainer';
import TypingIndicator from '@/components/messaging/TypingIndicator';

// Import existing types instead of redefining
import type { Message } from '@/utils/messageUtils';
import type { CustomRequest } from '@/context/RequestContext';

// Match the actual shape of buyerProfiles from useSellerMessages
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

// Group edit-related props
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

// Group message input props
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
}

// Debug flag - set to false in production
const DEBUG = process.env.NODE_ENV === 'development';

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
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get WebSocket context for thread focus/blur and typing
  const wsContext = useWebSocket();

  // State for typing indicator
  const [isBuyerTyping, setIsBuyerTyping] = useState(false);

  // Refs for typing management
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingEmitRef = useRef(0);
  const autoHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScrolledForTypingRef = useRef(false); // Track if we've already scrolled for current typing session
  const userHasScrolledRef = useRef(false); // Track if user has manually scrolled

  // Track manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

      // If user scrolled up (not at bottom), mark as manually scrolled
      if (!isAtBottom) {
        userHasScrolledRef.current = true;
      } else {
        userHasScrolledRef.current = false;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeThread]); // Reset when thread changes

  // Handle thread focus/blur for auto-read functionality
  useEffect(() => {
    if (!activeThread || !user || !wsContext?.sendMessage) {
      return;
    }

    const threadId = getConversationKey(user.username, activeThread);

    // Notify backend that seller is viewing this thread
    wsContext.sendMessage('thread:focus', {
      threadId,
      otherUser: activeThread,
    });

    return () => {
      // Notify backend when seller leaves the thread
      wsContext.sendMessage?.('thread:blur', {
        threadId,
        otherUser: activeThread,
      });
    };
  }, [activeThread, user, wsContext]);

  // Listen for buyer typing events
  useEffect(() => {
    if (!wsContext || !activeThread || !user) return;

    const conversationId = getConversationKey(user.username, activeThread);

    const handleTypingEvent = (data: any) => {
      if (data.conversationId === conversationId && data.username === activeThread) {
        // Clear any existing auto-hide timeout
        if (autoHideTimeoutRef.current) {
          clearTimeout(autoHideTimeoutRef.current);
          autoHideTimeoutRef.current = null;
        }

        setIsBuyerTyping(data.isTyping);

        // Auto-hide after 5 seconds
        if (data.isTyping) {
          autoHideTimeoutRef.current = setTimeout(() => {
            setIsBuyerTyping(false);
            hasScrolledForTypingRef.current = false;
            autoHideTimeoutRef.current = null;
          }, 5000);
        } else {
          hasScrolledForTypingRef.current = false;
        }
      }
    };

    // Listen for new messages to clear typing indicator
    const handleNewMessage = (data: any) => {
      // If we receive a message from the buyer, clear their typing indicator immediately
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
  }, [activeThread, user, wsContext]);

  // Track typing state changes for scroll management
  useEffect(() => {
    // If typing just started, reset the scroll flag and scroll to bottom once
    if (isBuyerTyping && !isTypingRef.current) {
      hasScrolledForTypingRef.current = false;
      userHasScrolledRef.current = false; // Reset user scroll flag for new typing session

      // Auto-scroll to bottom once when typing starts
      setTimeout(() => {
        if (messagesContainerRef.current && !hasScrolledForTypingRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight - container.clientHeight;
          hasScrolledForTypingRef.current = true;
        }
      }, 350); // Wait for typing indicator to render
    }
    isTypingRef.current = isBuyerTyping;
  }, [isBuyerTyping]);

  // Enhanced message input controls with typing events
  const enhancedMessageInputControls = useMemo(() => {
    const handleTypingChange = (value: string) => {
      messageInputControls.setReplyMessage(value);

      // Emit typing event
      if (wsContext && activeThread && user) {
        const conversationId = getConversationKey(user.username, activeThread);
        const now = Date.now();

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Send typing indicator
        if (value.trim()) {
          // Only send typing event if we haven't sent one recently (debounce)
          // OR if we weren't typing before
          if (!isTypingRef.current || now - lastTypingEmitRef.current > 1000) {
            wsContext.sendMessage('message:typing', {
              conversationId,
              isTyping: true,
            });
            lastTypingEmitRef.current = now;
            isTypingRef.current = true;
          }

          // Stop typing after 3 seconds of inactivity
          typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            wsContext.sendMessage('message:typing', {
              conversationId,
              isTyping: false,
            });
          }, 3000);
        } else {
          // If input is empty, stop typing immediately
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

    // Stop typing when message is sent
    const stopTyping = () => {
      if (wsContext && activeThread && user && isTypingRef.current) {
        const conversationId = getConversationKey(user.username, activeThread);

        // Clear typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        // Send stop typing event
        isTypingRef.current = false;
        wsContext.sendMessage('message:typing', {
          conversationId,
          isTyping: false,
        });
      }
    };

    // Wrap the original handleReply to stop typing first
    const handleReplyWithStopTyping = () => {
      stopTyping();
      messageInputControls.handleReply();
    };

    return {
      ...messageInputControls,
      setReplyMessage: handleTypingChange,
      handleReply: handleReplyWithStopTyping,
    };
  }, [messageInputControls, activeThread, user, wsContext]);

  // Get messages for the active thread (use raw key for data access)
  const threadMessages = useMemo(() => {
    if (DEBUG) {
      console.log('=== ConversationView threadMessages calculation ===');
      console.log('activeThread:', activeThread);
      console.log('threads keys:', Object.keys(threads));
    }

    if (!activeThread || typeof activeThread !== 'string') {
      if (DEBUG) console.log('Invalid activeThread');
      return [];
    }

    if (!threads || !threads[activeThread]) {
      if (DEBUG) console.log('No threads object or no messages for thread');
      return [];
    }

    const messages = Array.isArray(threads[activeThread]) ? threads[activeThread] : [];
    if (DEBUG) console.log('Thread messages for', activeThread, ':', messages);

    // Process custom request messages with validation
    const processed = getLatestCustomRequestMessages(messages, sellerRequests);
    if (DEBUG) console.log('Processed messages:', processed);
    return processed;
  }, [activeThread, threads, sellerRequests]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread, threadMessages.length]);

  const safeBuyerProfile: BuyerProfile = buyerProfiles[activeThread] ?? { pic: null, verified: false };

  return (
    <>
      {/* Conversation header */}
      <ChatHeader
        activeThread={activeThread}
        buyerProfile={safeBuyerProfile}
        isUserReported={isUserReported}
        isUserBlocked={isUserBlocked}
        onReport={handleReport}
        onBlockToggle={handleBlockToggle}
      />

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-[#121212]">
        <div className="max-w-3xl mx-auto space-y-4">
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
            userPic={buyerProfiles[activeThread]?.pic}
          />

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <MessageInputContainer
        isUserBlocked={isUserBlocked}
        onBlockToggle={handleBlockToggle}
        activeThread={activeThread}
        {...enhancedMessageInputControls}
      />
    </>
  );
}

// Helper function to process custom request messages with validation
function getLatestCustomRequestMessages(messages: Message[], requests: CustomRequest[]): Message[] {
  if (!Array.isArray(messages)) {
    if (DEBUG) console.warn('Invalid messages array provided to getLatestCustomRequestMessages');
    return [];
  }

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
