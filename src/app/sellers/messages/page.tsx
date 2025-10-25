// src/app/sellers/messages/page.tsx
'use client';

import React, { useEffect, useCallback, useState } from 'react';
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

  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent layout about active thread state
  useEffect(() => {
    if (isMobile) {
      const event = new CustomEvent('threadStateChange', {
        detail: { hasActiveThread: !!activeThread },
      });
      window.dispatchEvent(event);
    }
  }, [activeThread, isMobile]);

  // Mobile back navigation handler
  const handleMobileBack = useCallback(() => {
    setActiveThread(null);
  }, [setActiveThread]);

  if (!user) {
    return (
      <BanCheck>
        <RequireAuth role="seller">
          <div className="py-3 bg-black" />
          <div className="h-full bg-black flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  // ----- className helpers (purely to keep JSX simple & error-proof) -----
  const outerWrap = isMobile && activeThread
    ? 'fixed inset-0 flex flex-col bg-black'
    : 'flex h-full min-h-0 flex-1 flex-col bg-black';

  const innerWrap = `${
    isMobile
      ? 'flex h-full min-h-0 flex-1 flex-col'
      : 'mx-auto flex h-full min-h-0 flex-1 w-full max-w-6xl flex-col overflow-hidden rounded-lg shadow-lg md:flex-row'
  } bg-[#121212]`;

  const sidebarWrap = `${
    activeThread && isMobile
      ? 'hidden'
      : isMobile
        ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
        : 'w-full md:max-w-xs md:flex md:flex-col md:overflow-hidden md:min-h-0'
  }`;

  const conversationWrap = `${
    !activeThread && isMobile ? 'hidden' : 'flex'
  } ${
    isMobile ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'w-full md:flex-1'
  } flex-col bg-[#121212] overflow-hidden min-h-0`;

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <div className="min-h-screen bg-black flex flex-col">
          {/* Desktop padding - hide on mobile */}
          <div className="hidden md:block py-3 bg-black flex-shrink-0" />

          {/* Main container - matching buyer's responsive layout */}
          <div className="flex-1 overflow-hidden relative">
            <div className={outerWrap}>
              <div className={innerWrap}>
                {/* Mobile: Only show ThreadsSidebar when no active thread */}
                <div className={sidebarWrap}>
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
                </div>

                {/* Mobile: Only show conversation when thread is active */}
                {/* Desktop: Always show conversation area */}
                <div className={conversationWrap}>
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
                      isMobile={isMobile}
                      onBack={handleMobileBack}
                    />
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>

              {/* Desktop bottom padding */}
              <div className="hidden md:block py-3 bg-black flex-shrink-0" />
            </div>
          </div>

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
