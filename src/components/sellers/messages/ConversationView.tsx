// src/components/sellers/messages/ConversationView.tsx
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInputContainer from './MessageInputContainer';
import { useSellerMessages } from '@/hooks/useSellerMessages';
import { useMessages } from '@/context/MessageContext';

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
  
  // Get the actual messages using the MessageContext helper
  const { getMessagesForUsers, messages } = useMessages();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Debug: Log what we have
  useEffect(() => {
    console.log('=== DEBUG ConversationView ===');
    console.log('activeThread:', activeThread);
    console.log('user:', user);
    console.log('user.username:', user?.username);
    console.log('All messages in context:', messages);
    console.log('Threads from useSellerMessages:', threads);
    
    if (user && activeThread) {
      // Try to get messages
      const retrievedMessages = getMessagesForUsers(user.username, activeThread);
      console.log('Retrieved messages for conversation:', retrievedMessages);
      
      // Check all possible conversation keys
      const possibleKeys = [
        `${user.username}-${activeThread}`,
        `${activeThread}-${user.username}`,
        [user.username, activeThread].sort().join('-')
      ];
      console.log('Checking possible conversation keys:', possibleKeys);
      possibleKeys.forEach(key => {
        console.log(`messages[${key}]:`, messages[key]);
      });
    }
    console.log('=== END DEBUG ===');
  }, [activeThread, user, messages, threads, getMessagesForUsers]);
  
  // Get messages for active thread using the proper conversation key
  const threadMessages = useMemo(() => {
    if (!activeThread || !user) {
      console.log('No activeThread or user, returning empty array');
      return [];
    }
    
    // Use the helper function that handles conversation keys properly
    const messages = getMessagesForUsers(user.username, activeThread);
    console.log('threadMessages from getMessagesForUsers:', messages);
    
    // Process custom request messages
    const processed = getLatestCustomRequestMessages(messages, sellerRequests);
    console.log('Processed messages:', processed);
    return processed;
  }, [activeThread, user, sellerRequests, getMessagesForUsers]);
  
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
          {/* Debug info */}
          <div className="text-white bg-red-900 p-2 rounded">
            DEBUG: activeThread={activeThread}, messages count={threadMessages.length}
          </div>
          
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
