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
import { ChevronLeft, User } from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';

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

  // Lock body scroll when viewing a conversation on mobile
  useEffect(() => {
    if (activeThread && isMobile) {
      const prevHtml = document.documentElement.style.overflow;
      const prevBody = document.body.style.overflow;
      const prevPosition = document.body.style.position;
      const prevTop = document.body.style.top;
      const prevTouchAction = document.body.style.touchAction;
      
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Lock scrolling completely
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
      
      return () => {
        // Restore scrolling
        document.documentElement.style.overflow = prevHtml || '';
        document.body.style.overflow = prevBody || '';
        document.body.style.position = prevPosition || '';
        document.body.style.top = prevTop || '';
        document.body.style.width = '';
        document.body.style.touchAction = prevTouchAction || '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
    // Return undefined when condition is false
    return undefined;
  }, [activeThread, isMobile]);

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
        {/* Top Padding - Hide on mobile when viewing conversation */}
        <div className={`py-3 bg-black ${activeThread && isMobile ? 'hidden' : 'block'}`}></div>
        
        <div className={`${activeThread && isMobile ? 'fixed inset-0 z-50' : 'h-screen'} bg-black flex flex-col overflow-hidden`}>
          <div className={`flex-1 flex flex-col md:flex-row ${activeThread && isMobile ? 'w-full h-full' : 'max-w-6xl mx-auto w-full'} md:max-w-6xl md:mx-auto bg-[#121212] ${activeThread && isMobile ? '' : 'rounded-lg'} md:rounded-lg shadow-lg overflow-hidden`}>
            
            {/* Mobile View: Show either ThreadsSidebar OR ConversationView */}
            {/* Desktop View: Show both side by side */}
            
            {/* Mobile: Only show ThreadsSidebar when no active thread */}
            <div className={`${activeThread ? 'hidden md:block' : 'block'} w-full md:w-1/3`}>
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
            <div className={`${!activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-[#121212]`}>
              {activeThread ? (
                <>
                  {/* Conversation View with Mobile Header */}
                  <ConversationView
                    mobileHeader={
                      <div className="flex items-center p-3">
                        <button
                          onClick={handleMobileBack}
                          className="p-2 -ml-2 mr-2 hover:bg-[#222] rounded-lg transition-colors"
                          aria-label="Back to messages"
                        >
                          <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        
                        <div className="flex items-center flex-1 min-w-0">
                          {/* Seller Avatar */}
                          <div className="relative mr-3 flex-shrink-0">
                            {sellerProfiles[activeThread]?.pic ? (
                              <SecureImage
                                src={sellerProfiles[activeThread].pic}
                                alt={sanitizeStrict(activeThread)}
                                className="w-10 h-10 rounded-full object-cover"
                                fallbackSrc="/placeholder-avatar.png"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {sanitizeStrict(activeThread).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          {/* Seller Name and Status */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">
                              {sanitizeStrict(activeThread)}
                            </div>
                            <div className="text-xs text-green-400">
                              Active now
                            </div>
                          </div>
                        </div>
                        
                        {/* View Profile Button */}
                        <button
                          onClick={() => window.open(`/sellers/${sanitizeStrict(activeThread)}`, '_blank', 'noopener,noreferrer')}
                          className="p-2 hover:bg-[#222] rounded-lg transition-colors"
                          aria-label="View seller profile"
                        >
                          <User className="w-5 h-5 text-gray-300" />
                        </button>
                      </div>
                    }
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
                  />
                </>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
          
          {/* Bottom Padding - Hide on mobile when viewing conversation */}
          <div className={`py-3 bg-black ${activeThread && isMobile ? 'hidden' : 'block'}`}></div>
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
