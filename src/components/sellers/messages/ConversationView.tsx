// src/components/sellers/messages/ConversationView.tsx
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInputContainer from './MessageInputContainer';
import { useSellerMessages } from '@/hooks/useSellerMessages';

interface ConversationViewProps {
  activeThread: string;
}

export default function ConversationView({ activeThread }: ConversationViewProps) {
  const {
    user,
    threads,
    buyerProfiles,
    sellerRequests,
    isUserBlocked,
    isUserReported,
    handleReport,
    handleBlockToggle
  } = useSellerMessages();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get messages for active thread
  const threadMessages = useMemo(() => {
    return activeThread
      ? getLatestCustomRequestMessages(threads[activeThread] || [], sellerRequests)
      : [];
  }, [activeThread, threads, sellerRequests]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, threadMessages.length]);
  
  return (
    <>
      {/* Conversation header */}
      <ChatHeader
        activeThread={activeThread}
        buyerProfile={buyerProfiles[activeThread]}
        isUserReported={isUserReported}
        isUserBlocked={isUserBlocked}
        onReport={handleReport}
        onBlockToggle={handleBlockToggle}
      />
      
      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-[#121212]">
        <div className="max-w-3xl mx-auto space-y-4">
          <MessagesList 
            threadMessages={threadMessages}
            sellerRequests={sellerRequests}
            user={user}
            activeThread={activeThread}
          />
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      {(
        <MessageInputContainer 
          isUserBlocked={isUserBlocked}
          onBlockToggle={handleBlockToggle}
        />
      ) as any}
    </>
  );
}

// Helper function to process custom request messages
function getLatestCustomRequestMessages(messages: any[], requests: any[]) {
  const seen = new Set();
  const result: any[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === 'customRequest' && msg.meta && msg.meta.id) {
      if (!seen.has(msg.meta.id)) {
        seen.add(msg.meta.id);
        result.unshift(msg);
      }
    } else {
      result.unshift(msg);
    }
  }
  return result;
}