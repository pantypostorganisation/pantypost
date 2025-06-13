// src/components/buyers/messages/ConversationView.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';

interface ConversationViewProps {
  activeThread: string;
  threads: { [seller: string]: any[] };
  user: any;
  sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } };
  buyerRequests: any[];
  wallet: { [username: string]: number };
  
  // UI State
  previewImage: string | null;
  setPreviewImage: (image: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  recentEmojis: string[];
  
  // Message input
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isImageLoading: boolean;
  imageError: string | null;
  
  // Edit state
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
  
  // Actions
  handleReply: () => void;
  handleBlockToggle: (username: string) => void;
  handleReport: (username: string) => void;
  handleAccept: (req: any) => void;
  handleDecline: (req: any) => void;
  handleEditRequest: (req: any) => void;
  handleEditSubmit: () => void;
  handlePayNow: (req: any) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMessageVisible: (msg: any) => void;
  handleEmojiClick: (emoji: string) => void;
  
  // Status
  isUserBlocked: (username: string) => boolean;
  isUserReported: (username: string) => boolean;
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  lastManualScrollTime: React.MutableRefObject<number>;
  
  // Modal triggers
  setShowCustomRequestModal: (show: boolean) => void;
  setShowTipModal: (show: boolean) => void;
}

export default function ConversationView({
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
  lastManualScrollTime,
  setShowCustomRequestModal,
  setShowTipModal
}: ConversationViewProps) {
  // Get thread messages
  const threadMessages = useMemo(() => {
    return threads[activeThread] || [];
  }, [activeThread, threads]);
  
  // Get related custom requests
  const threadRequests = useMemo(() => {
    return buyerRequests.filter(req => req.seller === activeThread);
  }, [buyerRequests, activeThread]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (Date.now() - lastManualScrollTime.current > 1000) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages.length, lastManualScrollTime]);
  
  return (
    <>
      {/* Conversation header */}
      <ChatHeader
        activeThread={activeThread}
        sellerProfile={sellerProfiles[activeThread]}
        isUserReported={isUserReported(activeThread)}
        isUserBlocked={isUserBlocked(activeThread)}
        onReport={() => handleReport(activeThread)}
        onBlockToggle={() => handleBlockToggle(activeThread)}
        onSendTip={() => setShowTipModal(true)}
      />
      
      {/* Messages */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-4 bg-[#121212]"
        onScroll={() => {
          lastManualScrollTime.current = Date.now();
        }}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          <MessagesList 
            threadMessages={threadMessages}
            threadRequests={threadRequests}
            user={user}
            activeThread={activeThread}
            wallet={wallet}
            handleAccept={handleAccept}
            handleDecline={handleDecline}
            handleEditRequest={handleEditRequest}
            handleEditSubmit={handleEditSubmit}
            handlePayNow={handlePayNow}
            handleMessageVisible={handleMessageVisible}
            editRequestId={editRequestId}
            setEditRequestId={setEditRequestId}
            editPrice={editPrice}
            setEditPrice={setEditPrice}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editTags={editTags}
            setEditTags={setEditTags}
            editMessage={editMessage}
            setEditMessage={setEditMessage}
            setPreviewImage={setPreviewImage}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <MessageInput
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        isImageLoading={isImageLoading}
        imageError={imageError}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        recentEmojis={recentEmojis}
        handleReply={handleReply}
        handleImageSelect={handleImageSelect}
        handleEmojiClick={handleEmojiClick}
        fileInputRef={fileInputRef}
        emojiPickerRef={emojiPickerRef}
        isBlocked={isUserBlocked(activeThread)}
        onCustomRequest={() => setShowCustomRequestModal(true)}
      />
    </>
  );
}
