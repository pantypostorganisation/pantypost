// src/app/buyers/messages/page.tsx
'use client';

import React, { useEffect, useCallback } from 'react';
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

  // Ensure wallet is in the correct format
  const walletData = wallet || {};
  
  // Handle edit price conversion properly
  const handleEditPriceChange = useCallback((value: string | number) => {
    const numValue = typeof value === 'string' ? value : value.toString();
    setEditPrice(numValue);
  }, [setEditPrice]);

  // Get numeric edit price for component props
  const numericEditPrice = editPrice ? parseFloat(editPrice) : '';

  // Simplified custom request form setter
  const handleCustomRequestFormChange = useCallback((update: any) => {
    if (typeof update === 'function') {
      setCustomRequestForm(prev => {
        const newForm = update(prev);
        return {
          title: newForm.title || prev.title || '',
          price: newForm.price || prev.price || '',
          description: newForm.description || prev.description || '',
          tags: newForm.tags || prev.tags || [],
          hoursWorn: newForm.hoursWorn || prev.hoursWorn || 0
        };
      });
    } else {
      setCustomRequestForm(prev => ({
        title: update.title || prev.title || '',
        price: update.price || prev.price || '',
        description: update.description || prev.description || '',
        tags: update.tags || prev.tags || [],
        hoursWorn: update.hoursWorn || prev.hoursWorn || 0
      }));
    }
  }, [setCustomRequestForm]);

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
                  wallet={walletData}
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
                  editPrice={numericEditPrice}
                  setEditPrice={handleEditPriceChange}
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
                  isUserBlocked={isUserBlocked(activeThread)}
                  isUserReported={isUserReported(activeThread)}
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
          <div className="py-3 bg-black"></div>
        </div>

        {/* Modals */}
        {previewImage && (
          <ImagePreviewModal
            imageUrl={previewImage}
            isOpen={true}
            onClose={() => setPreviewImage(null)}
          />
        )}
        
        {showCustomRequestModal && activeThread && (
          <CustomRequestModal
            show={showCustomRequestModal}
            onClose={closeCustomRequestModal}
            activeThread={activeThread}
            onSubmit={handleCustomRequestSubmit}
            customRequestForm={{
              title: customRequestForm.title || '',
              price: customRequestForm.price || '',
              description: customRequestForm.description || ''
            }}
            setCustomRequestForm={handleCustomRequestFormChange}
            customRequestErrors={customRequestErrors}
            isSubmittingRequest={isSubmittingRequest}
            wallet={walletData}
            user={user}
          />
        )}
        
        {showPayModal && payingRequest && activeThread && (
          <PaymentModal
            show={showPayModal}
            onClose={() => {
              setShowPayModal(false);
              setPayingRequest(null);
            }}
            payingRequest={payingRequest}
            wallet={walletData}
            user={user}
            onConfirmPay={handleConfirmPay}
          />
        )}
        
        {showTipModal && activeThread && (
          <TipModal
            show={showTipModal}
            onClose={() => {
              setShowTipModal(false);
              setTipAmount('');
              setTipResult(null);
            }}
            activeThread={activeThread}
            tipAmount={tipAmount}
            setTipAmount={setTipAmount}
            tipResult={tipResult}
            wallet={walletData}
            user={user}
            onSendTip={handleSendTip}
          />
        )}
      </RequireAuth>
    </BanCheck>
  );
}