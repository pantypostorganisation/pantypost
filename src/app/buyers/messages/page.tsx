// src/app/buyers/messages/page.tsx
'use client';

import React, { useEffect, useCallback, useState } from 'react';
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
    wallet,

    // Messages & threads
    threads,
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
    setObserverReadMessages,
    
    // Message input
    replyMessage,
    setReplyMessage,
    selectedImage,
    setSelectedImage,
    isImageLoading,
    imageError,
    
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
    handleConfirmPay,
    
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

  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force re-render when mobile state changes
  useEffect(() => {
    console.log('Mobile state changed:', isMobile);
  }, [isMobile]);

  // Ensure wallet is in the correct format
  const walletData = wallet || {};
  
  // Handle edit price conversion properly
  const handleEditPriceChange = useCallback((value: string | number) => {
    const str = String(value);
    // Only accept numbers and a single dot; avoid passing NaN later
    const cleaned = str.replace(/[^\d.]/g, '');
    setEditPrice(cleaned);
  }, [setEditPrice]);

  // Get numeric edit price for component props (never NaN)
  const numericEditPrice =
    editPrice !== undefined &&
    editPrice !== null &&
    editPrice !== '' &&
    !Number.isNaN(Number(editPrice))
      ? Number(editPrice)
      : '';

  // Safer custom request form setter (preserve 0/'' with nullish coalescing)
  const handleCustomRequestFormChange = useCallback((update: any) => {
    if (typeof update === 'function') {
      setCustomRequestForm(prev => {
        const newForm = update(prev) || {};
        return {
          title: newForm.title ?? prev.title ?? '',
          price: newForm.price ?? prev.price ?? '',
          description: newForm.description ?? prev.description ?? '',
          tags: newForm.tags ?? prev.tags ?? [],
          hoursWorn: newForm.hoursWorn ?? prev.hoursWorn ?? 0
        };
      });
    } else {
      setCustomRequestForm(prev => ({
        title: update.title ?? prev.title ?? '',
        price: update.price ?? prev.price ?? '',
        description: update.description ?? prev.description ?? '',
        tags: update.tags ?? prev.tags ?? [],
        hoursWorn: update.hoursWorn ?? prev.hoursWorn ?? 0
      }));
    }
  }, [setCustomRequestForm]);

  // Mobile back navigation handler
  const handleMobileBack = useCallback(() => {
    setActiveThread(null);
  }, [setActiveThread]);

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
        {/* Desktop padding - hide on mobile */}
        <div className="hidden md:block py-3 bg-black"></div>
        
        {/* Main container - FIXED for mobile */}
        <div className={`${isMobile ? 'fixed inset-0 pt-0' : 'h-screen bg-black flex flex-col'}`}>
          <div className={`${isMobile ? 'w-full h-full flex flex-col' : 'flex-1 max-w-6xl mx-auto w-full rounded-lg shadow-lg'} bg-[#121212] ${isMobile ? '' : 'flex flex-col md:flex-row'} overflow-hidden`}>
            
            {/* Mobile: Only show ThreadsSidebar when no active thread */}
            <div className={`${activeThread && isMobile ? 'hidden' : 'block'} ${isMobile ? 'w-full h-full' : 'w-full md:w-1/3'}`}>
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
            </div>
            
            {/* Mobile: Only show conversation when thread is active */}
            {/* Desktop: Always show conversation area */}
            <div className={`${!activeThread && isMobile ? 'hidden' : 'flex'} ${isMobile ? 'w-full h-full' : 'w-full md:w-2/3'} flex-col bg-[#121212]`}>
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
                  isMobile={isMobile}
                  onBack={handleMobileBack}
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
          
          {/* Desktop bottom padding */}
          <div className="hidden md:block py-3 bg-black"></div>
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
              title: customRequestForm.title ?? '',
              price: customRequestForm.price ?? '',
              description: customRequestForm.description ?? ''
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
