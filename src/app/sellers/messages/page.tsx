// src/app/sellers/messages/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import MessagesLayout from '@/components/sellers/messages/MessagesLayout';
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
    isAdmin
  } = useSellerMessages();

  // Debug logging
  useEffect(() => {
    console.log('=== SellerMessagesPage Debug ===');
    console.log('Current activeThread:', activeThread);
    console.log('User:', user);
  }, [activeThread, user]);

  // Initialize thread from URL parameter
  const threadParam = searchParams?.get('thread');
  useEffect(() => {
    console.log('Thread param from URL:', threadParam);
    if (threadParam && user) {
      console.log('Setting activeThread to:', threadParam);
      setActiveThread(threadParam);
    }
  }, [threadParam, user, setActiveThread]);

  // Add click handler debugging
  const handleDebugClick = () => {
    console.log('Debug button clicked, current activeThread:', activeThread);
    console.log('Manually setting activeThread to "ab"');
    setActiveThread('ab');
  };

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <div className="py-3 bg-black"></div>
        
        <div className="h-screen bg-black flex flex-col overflow-hidden">
          {/* Debug button */}
          <button 
            onClick={handleDebugClick}
            className="fixed top-20 right-5 z-50 bg-red-600 text-white px-4 py-2 rounded"
          >
            Debug: Set activeThread to "ab"
          </button>
          
          <MessagesLayout isAdmin={isAdmin}>
            {activeThread ? (
              <>
                <div className="bg-yellow-600 text-black p-2">
                  DEBUG: activeThread is set to: {activeThread}
                </div>
                <ConversationView activeThread={activeThread} />
              </>
            ) : (
              <>
                <div className="bg-red-600 text-white p-2">
                  DEBUG: activeThread is NULL
                </div>
                <EmptyState />
              </>
            )}
          </MessagesLayout>
          
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
