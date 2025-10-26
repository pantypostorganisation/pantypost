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
  const showSidebar = !isMobile || !activeThread;
  const showConversation = !isMobile || !!activeThread;

  const innerWrap = isMobile
    ? 'flex h-full w-full min-h-0 overflow-hidden bg-[#121212]'
    : 'mx-auto flex h-full w-full min-h-0 max-w-6xl overflow-hidden rounded-lg shadow-lg bg-[#121212]';

  const sidebarWrap = `${showSidebar ? 'flex' : 'hidden'} ${
    isMobile
      ? 'w-full'
      : 'w-[320px] border-r border-gray-800'
  } flex-shrink-0 flex-col bg-[#1a1a1a] min-h-0 h-full overflow-hidden`;

  const conversationWrap = `${showConversation ? 'flex' : 'hidden'} flex-1 flex h-full flex-col bg-[#121212] min-h-0 overflow-hidden`;

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <div className="min-h-[100dvh] overflow-hidden overscroll-contain bg-black">
          <main className="flex h-[calc(100dvh-64px)] w-full overscroll-contain">
            <div className={innerWrap}>
                <aside className={sidebarWrap}>
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
                </aside>

                <section className={conversationWrap}>
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
                </section>
              </div>
            </div>
          </main>

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
