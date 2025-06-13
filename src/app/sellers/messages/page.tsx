// src/app/sellers/messages/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import ThreadsSidebar from '@/components/sellers/messages/ThreadsSidebar';
import ConversationView from '@/components/sellers/messages/ConversationView';
import EmptyState from '@/components/sellers/messages/EmptyState';
import { useSellerMessages } from '@/hooks/useSellerMessages';

export default function SellerMessagesPage() {
  const searchParams = useSearchParams();
  const {
    user,
    activeThread,
    setActiveThread,
    previewImage,
    setPreviewImage,
    isAdmin,
    threads,
    lastMessages,
    buyerProfiles,
    totalUnreadCount,
    uiUnreadCounts,
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
    setObserverReadMessages,
    isUserBlocked,
    isUserReported,
    handleReport,
    handleBlockToggle,
    sellerRequests
  } = useSellerMessages();

  // Debug
  useEffect(() => {
    console.log('=== SellerMessagesPage ===');
    console.log('activeThread:', activeThread);
    console.log('threads:', Object.keys(threads));
  }, [activeThread, threads]);

  // Initialize thread from URL parameter
  const threadParam = searchParams?.get('thread');
  useEffect(() => {
    if (threadParam && user) {
      console.log('Setting activeThread from URL param:', threadParam);
      setActiveThread(threadParam);
    }
  }, [threadParam, user, setActiveThread]);

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <div className="py-3 bg-black"></div>
        
        <div className="h-screen bg-black flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
            {/* Pass all props to MessagesLayout children */}
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
            
            {/* Right column - Active conversation or empty state */}
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
                />
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
          
          <div className="py-6 bg-black"></div>
          
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
