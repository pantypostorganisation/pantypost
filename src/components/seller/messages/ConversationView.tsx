// src/components/sellers/messages/ConversationView.tsx
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInputContainer from './MessageInputContainer';
import { sanitizeStrict } from '@/utils/security/sanitization';

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
  setPreviewImage
}: ConversationViewProps) {
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get messages for the active thread with validation
  const threadMessages = useMemo(() => {
    if (DEBUG) {
      console.log('=== ConversationView threadMessages calculation ===');
      console.log('activeThread:', activeThread);
      console.log('threads:', threads);
      console.log('threads keys:', Object.keys(threads));
    }
    
    // Validate activeThread
    if (!activeThread || typeof activeThread !== 'string') {
      if (DEBUG) console.log('Invalid activeThread');
      return [];
    }
    
    // Sanitize the thread key to prevent any potential issues
    const sanitizedThread = sanitizeStrict(activeThread);
    
    if (!threads || !threads[sanitizedThread]) {
      if (DEBUG) console.log('No threads object or no messages for thread');
      return [];
    }
    
    // Ensure threads[sanitizedThread] is an array
    const messages = Array.isArray(threads[sanitizedThread]) ? threads[sanitizedThread] : [];
    if (DEBUG) console.log('Thread messages for', sanitizedThread, ':', messages);
    
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
  
  return (
    <>
      {/* Conversation header */}
      <ChatHeader
        activeThread={activeThread}
        buyerProfile={buyerProfiles[activeThread]}
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
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <MessageInputContainer 
        isUserBlocked={isUserBlocked}
        onBlockToggle={handleBlockToggle}
        activeThread={activeThread}
        {...messageInputControls}
      />
    </>
  );
}

// Helper function to process custom request messages with validation
function getLatestCustomRequestMessages(messages: Message[], requests: CustomRequest[]): Message[] {
  // Validate inputs
  if (!Array.isArray(messages)) {
    if (DEBUG) console.warn('Invalid messages array provided to getLatestCustomRequestMessages');
    return [];
  }
  
  const seen = new Set<string>();
  const result: Message[] = [];
  
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    
    // Skip invalid messages
    if (!msg || typeof msg !== 'object') {
      continue;
    }
    
    if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
      // Ensure ID is a string
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
