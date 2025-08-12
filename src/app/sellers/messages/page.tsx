// src/app/sellers/messages/page.tsx
'use client';

import React from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useSellerMessages } from '@/hooks/useSellerMessages';
import ThreadsSidebar from '@/components/seller/messages/ThreadsSidebar';
import ConversationView from '@/components/seller/messages/ConversationView';
import EmptyState from '@/components/seller/messages/EmptyState';
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
      <BanCheck>
        <RequireAuth role="seller">
          <div className="h-screen bg-black flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="seller">
        {/* Top Padding */}
        <div className="py-3 bg-black" />

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
                  messageInputControls={{
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
                  }}
                  editRequestControls={{
                    editRequestId,
                    setEditRequestId,
                    editPrice,
                    setEditPrice,
                    editTitle,
                    setEditTitle,
                    editMessage,
                    setEditMessage,
                    handleEditSubmit,
                  }}
                  handleAccept={handleAccept}
                  handleDecline={handleDecline}
                  handleEditRequest={handleEditRequest}
                  handleMessageVisible={handleMessageVisible}
                  setPreviewImage={setPreviewImage}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          {/* Bottom Padding */}
          <div className="py-6 bg-black" />

          {/* Image Preview Modal */}
          {previewImage && (
            <ImagePreviewModal
              imageUrl={previewImage}
              isOpen={true}
              onClose={() => setPreviewImage(null)}
            />
          )}
        </div>
      </RequireAuth>
    </BanCheck>
  );
}
