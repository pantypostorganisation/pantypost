// src/app/buyers/messages/page.tsx
'use client';

import React from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useBuyerMessages } from '@/hooks/useBuyerMessages';
import ThreadsSidebar from '@/components/buyers/messages/ThreadsSidebar';
import ConversationView from '@/components/buyers/messages/ConversationView';
import EmptyState from '@/components/buyers/messages/EmptyState';
import CustomRequestModal from '@/components/buyers/messages/CustomRequestModal';
import PaymentModal from '@/components/buyers/messages/PaymentModal';
import TipModal from '@/components/buyers/messages/TipModal';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';

export default function BuyerMessagesPage() {
  const {
    // Auth & context
    user,
    users,
    wallet,
    isAdmin,
    
    // Messages & threads
    threads,
    unreadCounts,
    uiUnreadCounts,
    lastMessages,
    sellerProfiles,
    totalUnreadCount,
    activeThread,
    setActiveThread,
    buyerRequests,
    
    // UI State
    mounted,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    filterBy,
    setFilterBy,
    previewImage,
    setPreviewImage,
    showEmojiPicker,
    setShowEmojiPicker,
    recentEmojis,
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
    
    // Custom requests
    showCustomRequestModal,
    setShowCustomRequestModal,
    customRequestForm,
    setCustomRequestForm,
    customRequestErrors,
    isSubmittingRequest,
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
    
    // Payment
    showPayModal,
    setShowPayModal,
    payingRequest,
    setPayingRequest,
    
    // Tips
    showTipModal,
    setShowTipModal,
    tipAmount,
    setTipAmount,
    tipResult,
    setTipResult,
    
    // Refs
    fileInputRef,
    emojiPickerRef,
    messagesEndRef,
    messagesContainerRef,
    inputRef,
    lastManualScrollTime,
    
    // Actions
    handleReply,
    handleBlockToggle,
    handleReport,
    handleAccept,
    handleDecline,
    handleEditRequest,
    handleEditSubmit,
    handlePayNow,
    handleConfirmPay,
    handleImageSelect,
    handleMessageVisible,
    handleEmojiClick,
    handleSendTip,
    handleCustomRequestSubmit,
    closeCustomRequestModal,
    validateCustomRequest,
    
    // Status checks
    isUserBlocked,
    isUserReported,
  } = useBuyerMessages();

  if (!mounted || !user) {
    return (
      <BanCheck>
        <RequireAuth role="buyer">
          <div className="py-3 bg-black"></div>
          <div className="h-screen bg-black flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        {/* Top Padding */}
        <div className="py-3 bg-black"></div>
        
        <div className="h-screen bg-black flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
            {/* Left column - Message threads */}
            <ThreadsSidebar
              threads={threads}
              lastMessages={lastMessages}
              sellerProfiles={sellerProfiles}
              uiUnreadCounts={uiUnreadCounts}
              activeThread={activeThread}
              setActiveThread={setActiveThread}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              filterBy={filterBy}
              setFilterBy={setFilterBy}
              totalUnreadCount={totalUnreadCount}
              buyerRequests={buyerRequests}
              setObserverReadMessages={setObserverReadMessages}
            />
            
            {/* Right column - Active conversation or empty state */}
            <div className="w-full md:w-2/3 flex flex-col bg-[#121212]">
              {activeThread ? (
                <ConversationView
                  activeThread={activeThread}
                  threads={threads}
                  user={user}
                  sellerProfiles={sellerProfiles}
                  buyerRequests={buyerRequests}
                  wallet={wallet}
                  previewImage={previewImage}
                  setPreviewImage={setPreviewImage}
                  showEmojiPicker={showEmojiPicker}
                  setShowEmojiPicker={setShowEmojiPicker}
                  recentEmojis={recentEmojis}
                  replyMessage={replyMessage}
                  setReplyMessage={setReplyMessage}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  isImageLoading={isImageLoading}
                  imageError={imageError}
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
                  handleReply={handleReply}
                  handleBlockToggle={handleBlockToggle}
                  handleReport={handleReport}
                  handleAccept={handleAccept}
                  handleDecline={handleDecline}
                  handleEditRequest={handleEditRequest}
                  handleEditSubmit={handleEditSubmit}
                  handlePayNow={handlePayNow}
                  handleImageSelect={handleImageSelect}
                  handleMessageVisible={handleMessageVisible}
                  handleEmojiClick={handleEmojiClick}
                  isUserBlocked={isUserBlocked}
                  isUserReported={isUserReported}
                  messagesEndRef={messagesEndRef}
                  messagesContainerRef={messagesContainerRef}
                  fileInputRef={fileInputRef}
                  emojiPickerRef={emojiPickerRef}
                  inputRef={inputRef}
                  lastManualScrollTime={lastManualScrollTime}
                  setShowCustomRequestModal={setShowCustomRequestModal}
                  setShowTipModal={setShowTipModal}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
          
          {/* Bottom Padding */}
          <div className="py-6 bg-black"></div>
          
          {/* Modals */}
          <CustomRequestModal
            show={showCustomRequestModal}
            onClose={closeCustomRequestModal}
            activeThread={activeThread || ''}
            customRequestForm={customRequestForm}
            setCustomRequestForm={setCustomRequestForm}
            customRequestErrors={customRequestErrors}
            isSubmittingRequest={isSubmittingRequest}
            onSubmit={handleCustomRequestSubmit}
            wallet={wallet}
            user={user}
          />
          
          <PaymentModal
            show={showPayModal}
            onClose={() => {
              setShowPayModal(false);
              setPayingRequest(null);
            }}
            payingRequest={payingRequest}
            wallet={wallet}
            user={user}
            onConfirmPay={handleConfirmPay}
          />
          
          <TipModal
            show={showTipModal}
            onClose={() => {
              setShowTipModal(false);
              setTipResult(null);
              setTipAmount('');
            }}
            activeThread={activeThread || ''}
            tipAmount={tipAmount}
            setTipAmount={setTipAmount}
            tipResult={tipResult}
            wallet={wallet}
            user={user}
            onSendTip={handleSendTip}
          />
          
          {/* Image Preview Modal - Using shared component */}
          <ImagePreviewModal
            imageUrl={previewImage || ''}
            isOpen={!!previewImage}
            onClose={() => setPreviewImage(null)}
          />
          
          {/* Global styles for emoji picker */}
          <style jsx global>{`
            .emoji-button::before {
              content: "";
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
          `}</style>
        </div>
      </RequireAuth>
    </BanCheck>
  );
}
