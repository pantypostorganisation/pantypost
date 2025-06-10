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

  // Initialize thread from URL parameter
  const threadParam = searchParams?.get('thread');
  useEffect(() => {
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user, setActiveThread]);

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <div className="py-3 bg-black"></div>
        
        <div className="h-screen bg-black flex flex-col overflow-hidden">
          <MessagesLayout isAdmin={isAdmin}>
            {activeThread ? (
              <ConversationView activeThread={activeThread} />
            ) : (
              <EmptyState />
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