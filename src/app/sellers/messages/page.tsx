// src/app/sellers/messages/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/context/MessageContext';
import MessagesHeader from '@/components/sellers/messages/MessagesHeader';
import ConversationsList from '@/components/sellers/messages/ConversationsList';
import ChatWindow from '@/components/sellers/messages/ChatWindow';
import EmptyState from '@/components/sellers/messages/EmptyState';
import LoadingState from '@/components/sellers/messages/LoadingState';
import MobileNavigation from '@/components/sellers/messages/MobileNavigation';
import { Message } from '@/types/seller-message';
import { useMessageData } from '@/hooks/useMessageData';
import { useMessageFilters } from '@/hooks/useMessageFilters';
import { useMessageActions } from '@/hooks/useMessageActions';

import BanCheck from '@/components/BanCheck';

export default function SellerMessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { messages, markMessagesAsRead } = useMessages();
  
  // State management
  const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  
  // Custom hooks for data management
  const { conversations, userProfiles, stats } = useMessageData(user?.username || '', messages);
  const { searchTerm, setSearchTerm, filterType, setFilterType, filteredConversations } = useMessageFilters(conversations);
  const { handleSendMessage, handleBlockUser, handleReportUser } = useMessageActions(user?.username || '');
  
  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Initialize loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Mark messages as read when buyer is selected
  useEffect(() => {
    if (selectedBuyer && user?.username) {
      markMessagesAsRead(user.username, selectedBuyer);
    }
  }, [selectedBuyer, user?.username, markMessagesAsRead]);
  
  // Handle conversation selection
  const handleSelectBuyer = useCallback((buyer: string) => {
    setSelectedBuyer(buyer);
    if (isMobileView) {
      setShowChatOnMobile(true);
    }
  }, [isMobileView]);
  
  // Handle mobile back navigation
  const handleMobileBack = useCallback(() => {
    setShowChatOnMobile(false);
    setSelectedBuyer(null);
  }, []);
  
  // Get messages for selected buyer
  const selectedBuyerMessages = useMemo(() => {
    if (!selectedBuyer || !user?.username) return [];
    return messages[user.username]?.filter(
      msg => msg.sender === selectedBuyer || msg.receiver === selectedBuyer
    ) || [];
  }, [selectedBuyer, user?.username, messages]);
  
  if (isLoading) {
    return (
      <RequireAuth role="seller">
        <LoadingState />
      </RequireAuth>
    );
  }
  
  return (
    <RequireAuth role="seller">
      <BanCheck>
        <main className="min-h-screen bg-black text-white">
          <MessagesHeader stats={stats} />
          
          <div className="flex h-[calc(100vh-64px)]">
            {/* Conversations List - Hidden on mobile when chat is shown */}
            <AnimatePresence mode="wait">
              {(!isMobileView || !showChatOnMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`${isMobileView ? 'w-full' : 'w-96'} border-r border-gray-800 flex flex-col`}
                >
                  <ConversationsList
                    conversations={filteredConversations}
                    selectedBuyer={selectedBuyer}
                    searchTerm={searchTerm}
                    filterType={filterType}
                    userProfiles={userProfiles}
                    onSelectBuyer={handleSelectBuyer}
                    onSearchChange={setSearchTerm}
                    onFilterChange={setFilterType}
                    isMobileView={isMobileView}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Chat Window - Full screen on mobile when shown */}
            <AnimatePresence mode="wait">
              {(selectedBuyer || !isMobileView) && (!isMobileView || showChatOnMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col bg-[#0a0a0a]"
                >
                  {selectedBuyer ? (
                    <ChatWindow
                      buyer={selectedBuyer}
                      messages={selectedBuyerMessages}
                      userProfile={userProfiles[selectedBuyer]}
                      onSendMessage={handleSendMessage}
                      onBlock={() => handleBlockUser(selectedBuyer)}
                      onReport={() => handleReportUser(selectedBuyer)}
                      onBack={isMobileView ? handleMobileBack : undefined}
                      isMobileView={isMobileView}
                    />
                  ) : (
                    <EmptyState />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Mobile Navigation */}
          {isMobileView && (
            <MobileNavigation
              showChat={showChatOnMobile}
              hasUnread={stats.totalUnreadMessages > 0}
              onNavigate={setShowChatOnMobile}
            />
          )}
        </main>
      </BanCheck>
    </RequireAuth>
  );
}
