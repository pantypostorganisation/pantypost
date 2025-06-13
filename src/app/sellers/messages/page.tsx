// src/app/sellers/messages/page.tsx
'use client';

import React from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useSellerMessages } from '@/hooks/useSellerMessages';
import ThreadsSidebar from '@/components/sellers/messages/ThreadsSidebar';
import ConversationView from '@/components/sellers/messages/ConversationView';
import EmptyState from '@/components/sellers/messages/EmptyState';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';

export default function SellerMessagesPage() {
  const {
    // Auth
    user,
    isAdmin,
    
    // Messages & threads
    threads,
    unreadCounts,
    uiUnreadCounts,
    lastMessages,
    buyerProfiles,
    totalUnreadCount,
    activeThread,
    setActiveThread,
    
    // UI State
    previewImage,
    setPreviewImage,
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
    observerReadMessages,
    setObserverReadMessages,
    
    // Message input
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
    
    // Custom requests
    sellerRequests,
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editMessage,
    setEditMessage,
    
    // Actions
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,
    
    // Status
    isUserBlocked,
    isUserReported,
  } = useSellerMessages();

  if (!user) {
    return (
      <RequireAuth role="seller">
        <div className="h-screen bg-black flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <div className="py-3 bg-black"></div>
        
        <div className="h-screen bg-black flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
            {/* Left column - Message threads */}
            <ThreadsSidebar
              isAdmin={isAdmin}
              threads={threads}
              lastMessages={lastMessages}
              buyerProfiles={buyerProfiles}
              totalUnreadCount={totalUnreadCount}
              uiUnreadCounts={uiUnreadCounts}
              activeThread={activeThread}
              setActiveThread={setActiveThread}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterBy={filterBy}
              setFilterBy={setFilterBy}
              setObserverReadMessages={setObserverReadMessages}
            />
            
            {/* Right column - Active conversation */}
            <div className="w-full md:w-2/3 flex flex-col bg-[#121212]">
              {activeThread ? (
                <ConversationView
                  activeThread={activeThread}
                  threads={threads}
                  buyerProfiles={buyerProfiles}
                  sellerRequests={sellerRequests}
                  isUserBlocked={isUserBlocked}
                  isUserReported={isUserReported}
                  handleReport={handleReport}
                  handleBlockToggle={handleBlockToggle}
                  user={user}
                  // Pass all the props needed by MessageInputContainer
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
                  // Pass message handlers
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
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
          
          {/* Bottom Padding */}
          <div className="py-6 bg-black"></div>
          
          {/* Image Preview Modal */}
          <ImagePreviewModal
            imageUrl={previewImage || ''}
            isOpen={!!previewImage}
            onClose={() => setPreviewImage(null)}
          />
        </div>
      </RequireAuth>
    </BanCheck>
  );
}
