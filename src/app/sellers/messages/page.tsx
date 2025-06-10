// src/app/sellers/messages/page.tsx
'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  MessageCircle,
  Filter,
  BellRing,
  Clock,
  CheckCircle2,
  XCircle,
  Edit3,
  ShoppingBag
} from 'lucide-react';
import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import ImagePreviewModal from '@/components/messaging/ImagePreviewModal';
import ThreadListItem from '@/components/sellers/messages/ThreadListItem';
import ChatHeader from '@/components/sellers/messages/ChatHeader';
import MessageInputContainer from '@/components/sellers/messages/MessageInputContainer';
import EmptyState from '@/components/sellers/messages/EmptyState';
import MessagesList from '@/components/sellers/messages/MessagesList';
import { useMessageData } from '@/hooks/useMessageData';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import { useSellerMessages } from '@/hooks/useSellerMessages';

export default function SellerMessagesPage() {
  const { user } = useAuth();
  const { addSellerNotification, users } = useListings();
  const { messages } = useMessages();
  const { requests } = useRequests();
  const { wallet } = useWallet();
  
  const searchParams = useSearchParams();
  const messageData = useMessageData();
  const sellerMessagesHook = useSellerMessages();
  
  const {
    threads,
    lastMessages,
    buyerProfiles,
    totalUnreadCount,
    sellerRequests,
    uiUnreadCounts,
    activeThread,
    setActiveThread,
    isUserBlocked,
    isUserReported,
    handleMessageVisible,
    handleSendMessage,
    handleBlockToggle,
    handleReport,
    respondToRequest,
    setObserverReadMessages,
    messageUpdate,
    setMessageUpdate
  } = messageData;

  // Use state from sellerMessagesHook
  const {
    previewImage,
    setPreviewImage,
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
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
    editRequestId,
    setEditRequestId,
    editPrice,
    setEditPrice,
    editTitle,
    setEditTitle,
    editMessage,
    setEditMessage,
    handleEmojiClick,
    handleReply,
    handleEditRequest,
    handleEditSubmit,
    handleAccept,
    handleDecline
  } = sellerMessagesHook;

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get messages for active thread FIRST (before using in useEffect)
  const threadMessages = useMemo(() => {
    if (!activeThread || !threads[activeThread]) return [];
    return threads[activeThread];
  }, [activeThread, threads]);

  // Update UI when messages change
  useEffect(() => {
    console.log('Messages context updated:', messages);
    setMessageUpdate(prev => prev + 1);
  }, [messages, setMessageUpdate]);

  // Initialize thread from URL parameter
  const threadParam = searchParams?.get('thread');
  useEffect(() => {
    if (threadParam && user) {
      setActiveThread(threadParam);
    }
  }, [threadParam, user, setActiveThread]);

  // Filter and sort threads
  const filteredAndSortedThreads = useMemo(() => {
    const filteredThreads = Object.keys(threads).filter(buyer => {
      const matchesSearch = searchQuery ? buyer.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      
      if (!matchesSearch) return false;
      
      if (filterBy === 'unread') {
        const hasUnread = uiUnreadCounts[buyer] > 0;
        if (!hasUnread) return false;
      }
      
      return true;
    });
    
    return filteredThreads.sort((a, b) => {
      const dateA = new Date(lastMessages[a]?.date || 0).getTime();
      const dateB = new Date(lastMessages[b]?.date || 0).getTime();
      return dateB - dateA;
    });
  }, [threads, lastMessages, uiUnreadCounts, searchQuery, filterBy]);

  // Handle thread selection
  const handleThreadSelect = useCallback((buyerId: string) => {
    if (activeThread === buyerId) return;
    
    setActiveThread(buyerId);
    setObserverReadMessages(new Set());
  }, [activeThread, setActiveThread, setObserverReadMessages]);

  // Override handleReply to use messageData's handleSendMessage
  const handleReplyOverride = useCallback(() => {
    const textContent = replyMessage.trim();

    if (!textContent && !selectedImage) {
      return;
    }

    console.log('Sending message:', {
      sender: user?.username,
      receiver: activeThread,
      content: textContent,
      type: selectedImage ? 'image' : 'normal'
    });

    if (selectedImage) {
      handleSendMessage(textContent || 'Image', 'image', selectedImage);
    } else {
      handleSendMessage(textContent);
    }

    setReplyMessage('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
    
    // Force immediate scroll to bottom after sending
    const forceScroll = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
      }
    };
    
    // Multiple attempts to ensure scroll
    forceScroll();
    setTimeout(forceScroll, 10);
    setTimeout(forceScroll, 50);
    setTimeout(forceScroll, 100);
  }, [replyMessage, selectedImage, handleSendMessage, setReplyMessage, setSelectedImage, setShowEmojiPicker, user, activeThread]);

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      // Find the scrollable container - it might be the parent of messagesContainerRef
      const container = messagesContainerRef.current;
      if (container) {
        // Force scroll to bottom immediately
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'instant'
        });
        
        // Then smooth scroll if it's a new message (not just thread change)
        if (threadMessages.length > 0) {
          setTimeout(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          }, 10);
        }
      }
      
      // Backup method using the anchor
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: threadMessages.length > 0 ? 'smooth' : 'instant',
          block: 'end'
        });
      }
    };

    // Use multiple methods to ensure it works
    scrollToBottom();
    
    // Delayed scroll for safety
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [threadMessages.length, activeThread]);

  console.log('Active thread:', activeThread);
  console.log('Thread messages:', threadMessages);

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <div className="py-3 bg-black"></div>
        
        <div className="h-screen bg-black flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full bg-[#121212] rounded-lg shadow-lg overflow-hidden">
            {/* Left column - Message threads */}
            <div className="w-full md:w-1/3 border-r border-gray-800 flex flex-col bg-[#121212]">
              {/* Header */}
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-2xl font-bold text-[#ff950e] mb-2 flex items-center">
                  <MessageCircle size={24} className="mr-2 text-[#ff950e]" />
                  {isAdmin ? 'Admin Messages' : 'My Messages'}
                </h2>
                
                {/* Filter buttons */}
                <div className="flex space-x-2 mb-3">
                  <button 
                    onClick={() => setFilterBy('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
                      filterBy === 'all' 
                        ? 'bg-[#ff950e] text-black' 
                        : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                    }`}
                  >
                    <Filter size={14} className="mr-1" />
                    All Messages
                  </button>
                  <button 
                    onClick={() => setFilterBy('unread')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
                      filterBy === 'unread' 
                        ? 'bg-[#ff950e] text-black' 
                        : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                    }`}
                  >
                    <BellRing size={14} className="mr-1" />
                    Unread
                    {totalUnreadCount > 0 && (
                      <span className="ml-1 bg-[#ff950e] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-black">
                        {totalUnreadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Buyers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 px-4 pr-10 rounded-full bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    <Search size={18} />
                  </div>
                </div>
              </div>
              
              {/* Thread list */}
              <div className="flex-1 overflow-y-auto bg-[#121212]">
                {filteredAndSortedThreads.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No conversations found
                  </div>
                ) : (
                  filteredAndSortedThreads.map((buyer) => (
                    <ThreadListItem
                      key={buyer}
                      buyer={buyer}
                      lastMessage={lastMessages[buyer]}
                      isActive={activeThread === buyer}
                      buyerProfile={buyerProfiles[buyer]}
                      unreadCount={uiUnreadCounts[buyer]}
                      onClick={() => handleThreadSelect(buyer)}
                    />
                  ))
                )}
              </div>
            </div>
            
            {/* Right column - Active conversation */}
            <div className="w-full md:w-2/3 flex flex-col bg-[#121212]">
              {activeThread ? (
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
                      {threadMessages.length > 0 ? (
                        <>
                          <MessagesList 
                            threadMessages={threadMessages}
                            sellerRequests={sellerRequests}
                            user={user}
                            activeThread={activeThread}
                            handleMessageVisible={handleMessageVisible}
                            handleAccept={handleAccept}
                            handleDecline={handleDecline}
                            handleEditRequest={handleEditRequest}
                            editRequestId={editRequestId}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            editPrice={editPrice}
                            setEditPrice={setEditPrice}
                            editMessage={editMessage}
                            setEditMessage={setEditMessage}
                            handleEditSubmit={handleEditSubmit}
                            setEditRequestId={setEditRequestId}
                            setPreviewImage={setPreviewImage}
                          />
                          {/* Auto-scroll anchor */}
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          No messages in this conversation yet
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Message input */}
                  <MessageInputContainer 
                    isUserBlocked={isUserBlocked}
                    onBlockToggle={handleBlockToggle}
                    replyMessage={replyMessage}
                    setReplyMessage={setReplyMessage}
                    selectedImage={selectedImage}
                    setSelectedImage={setSelectedImage}
                    imageError={imageError}
                    setImageError={setImageError}
                    isImageLoading={isImageLoading}
                    setIsImageLoading={setIsImageLoading}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={setShowEmojiPicker}
                    recentEmojis={recentEmojis}
                    handleEmojiClick={handleEmojiClick}
                    handleReply={handleReplyOverride}
                  />
                </>
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
