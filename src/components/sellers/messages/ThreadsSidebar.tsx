// src/components/sellers/messages/ThreadsSidebar.tsx
'use client';

import React, { useMemo } from 'react';
import { MessageCircle, Filter, BellRing, Search } from 'lucide-react';
import ThreadListItem from './ThreadListItem';
import { useSellerMessages } from '@/hooks/useSellerMessages';

interface ThreadsSidebarProps {
  isAdmin: boolean;
}

export default function ThreadsSidebar({ isAdmin }: ThreadsSidebarProps) {
  const {
    threads,
    lastMessages,
    buyerProfiles,
    totalUnreadCount,
    uiUnreadCounts,
    activeThread,
    setActiveThread,
    searchQuery,
    setSearchQuery,
    filterBy,
    setFilterBy,
    setObserverReadMessages
  } = useSellerMessages();

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
  const handleThreadSelect = (buyerId: string) => {
    console.log('=== ThreadsSidebar handleThreadSelect ===');
    console.log('Trying to select buyer:', buyerId);
    console.log('Current activeThread:', activeThread);
    console.log('setActiveThread function exists:', !!setActiveThread);
    
    if (activeThread === buyerId) {
      console.log('Same thread already active, returning');
      return;
    }
    
    console.log('Calling setActiveThread with:', buyerId);
    setActiveThread(buyerId);
    setObserverReadMessages(new Set());
    console.log('setActiveThread called');
  };

  return (
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
            <div key={buyer}>
              {/* Debug: Direct click handler */}
              <div 
                onClick={() => {
                  console.log('Direct div clicked for buyer:', buyer);
                  handleThreadSelect(buyer);
                }}
                style={{ cursor: 'pointer', padding: '2px', background: '#ff950e20' }}
              >
                <small style={{ color: '#ff950e' }}>Debug: Click here to select {buyer}</small>
              </div>
              
              <ThreadListItem
                buyer={buyer}
                lastMessage={lastMessages[buyer]}
                isActive={activeThread === buyer}
                buyerProfile={buyerProfiles[buyer]}
                unreadCount={uiUnreadCounts[buyer]}
                onClick={() => handleThreadSelect(buyer)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
