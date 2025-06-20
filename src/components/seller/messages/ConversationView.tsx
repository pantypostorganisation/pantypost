// src/components/sellers/messages/ConversationView.tsx
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInputContainer from './MessageInputContainer';

interface ConversationViewProps {
  activeThread: string;
  threads: any;
  buyerProfiles: any;
  sellerRequests: any[];
  isUserBlocked: boolean;
  isUserReported: boolean;
  handleReport: () => void;
  handleBlockToggle: () => void;
  user: any;
  // Message input props
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
  // Message handlers
  handleAccept: (requestId: string) => void;
  handleDecline: (requestId: string) => void;
  handleEditRequest: (requestId: string, title: string, price: number, message: string) => void;
  handleEditSubmit: () => void;
  handleMessageVisible: (msg: any) => void;
  editRequestId: string | null;
  setEditRequestId: (id: string | null) => void;
  editPrice: number | '';
  setEditPrice: (price: number | '') => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editMessage: string;
  setEditMessage: (message: string) => void;
  setPreviewImage: (url: string | null) => void;
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
  // Message input props
  replyMessage,
  setReplyMessage,
  selectedImage,
  setSelectedImage,
  isImageLoading,
  setIsImageLoading,
  imageError,
  setImageError,
  showEmojiPicker,
  setShowEmojiPicker,
  recentEmojis,
  handleReply,
  handleEmojiClick,
  handleImageSelect,
  // Message handlers
  handleAccept,
  handleDecline,
  handleEditRequest,
  handleEditSubmit,
  handleMessageVisible,
  editRequestId,
  setEditRequestId,
  editPrice,
  setEditPrice,
  editTitle,
  setEditTitle,
  editMessage,
  setEditMessage,
  setPreviewImage
}: ConversationViewProps) {
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get messages for the active thread
  const threadMessages = useMemo(() => {
    console.log('=== ConversationView threadMessages calculation ===');
    console.log('activeThread:', activeThread);
    console.log('threads:', threads);
    console.log('threads keys:', Object.keys(threads));
    
    if (!activeThread || !threads[activeThread]) {
      console.log('No activeThread or no messages for thread');
      return [];
    }
    
    // Messages are already filtered by thread in useSellerMessages
    const messages = threads[activeThread] || [];
    console.log('Thread messages for', activeThread, ':', messages);
    
    // Process custom request messages
    const processed = getLatestCustomRequestMessages(messages, sellerRequests);
    console.log('Processed messages:', processed);
    return processed;
  }, [activeThread, threads, sellerRequests]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            handleEditSubmit={handleEditSubmit}
            handleMessageVisible={handleMessageVisible}
            editRequestId={editRequestId}
            setEditRequestId={setEditRequestId}
            editPrice={editPrice}
            setEditPrice={setEditPrice}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editMessage={editMessage}
            setEditMessage={setEditMessage}
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
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        isImageLoading={isImageLoading}
        setIsImageLoading={setIsImageLoading}
        imageError={imageError}
        setImageError={setImageError}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        recentEmojis={recentEmojis}
        handleReply={handleReply}
        handleEmojiClick={handleEmojiClick}
        handleImageSelect={handleImageSelect}
      />
    </>
  );
}

// Helper function to process custom request messages
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
