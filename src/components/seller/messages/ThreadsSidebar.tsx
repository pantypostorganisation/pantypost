// src/components/seller/messages/ThreadsSidebar.tsx
'use client';

import React, { useMemo } from 'react';
import { 
  MessageSquare, 
  Search, 
  Bell,
  Filter,
  User,
  CheckCircle
} from 'lucide-react';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';

interface ThreadsSidebarProps {
  isAdmin: boolean;
  threads: any;
  lastMessages: any;
  buyerProfiles: any;
  totalUnreadCount: number;
  uiUnreadCounts: any;
  activeThread: string | null;
  setActiveThread: (thread: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterBy: 'all' | 'unread';
  setFilterBy: (filter: 'all' | 'unread') => void;
  setObserverReadMessages: (messages: Set<string>) => void;
}

export default function ThreadsSidebar({ 
  isAdmin,
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
}: ThreadsSidebarProps) {

  // Filter and sort threads
  const filteredThreads = useMemo(() => {
    const sanitizedSearchQuery = sanitizeSearchQuery(searchQuery);
    return Object.keys(threads)
      .filter(buyer => {
        if (sanitizedSearchQuery && !buyer.toLowerCase().includes(sanitizedSearchQuery.toLowerCase())) {
          return false;
        }
        if (filterBy === 'unread' && uiUnreadCounts[buyer] === 0) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = lastMessages[a] ? new Date(lastMessages[a].date).getTime() : 0;
        const dateB = lastMessages[b] ? new Date(lastMessages[b].date).getTime() : 0;
        return dateB - dateA;
      });
  }, [threads, searchQuery, filterBy, uiUnreadCounts, lastMessages]);

  const handleThreadClick = (buyer: string) => {
    setActiveThread(buyer);
    setObserverReadMessages(new Set());
  };

  return (
    <div className="h-full bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-3 flex items-center">
          <MessageSquare className="mr-2 text-[#ff950e]" size={20} />
          {isAdmin ? 'Admin Messages' : 'Messages'}
        </h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <SecureInput
            type="text"
            placeholder="Search buyers..."
            value={searchQuery}
            onChange={(value: string) => setSearchQuery(value)}
            sanitizer={sanitizeSearchQuery}
            className="w-full bg-[#222] text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] border-0"
            maxLength={100}
          />
        </div>
        
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterBy('all')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs transition-all ${
              filterBy === 'all'
                ? 'bg-[#ff950e] text-black'
                : 'bg-[#222] text-gray-400 hover:text-white'
            }`}
          >
            <Filter size={10} />
            All
          </button>
          <button
            onClick={() => setFilterBy('unread')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md text-xs transition-all ${
              filterBy === 'unread'
                ? 'bg-[#ff950e] text-black'
                : 'bg-[#222] text-gray-400 hover:text-white'
            }`}
          >
            <Bell size={10} />
            Unread ({totalUnreadCount})
          </button>
        </div>
      </div>
      
      {/* Thread List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
            <p className="text-sm">{searchQuery ? 'No buyers found' : filterBy === 'unread' ? 'No unread messages' : 'No conversations yet'}</p>
          </div>
        ) : (
          filteredThreads.map((buyer) => {
            const lastMessage = lastMessages[buyer];
            const unreadCount = uiUnreadCounts[buyer] || 0;
            const profile = buyerProfiles[buyer] || { pic: null, verified: false };
            const isActive = activeThread === buyer;
            
            return (
              <div
                key={buyer}
                onClick={() => handleThreadClick(buyer)}
                className={`relative px-4 py-3 border-b border-gray-800 cursor-pointer transition-all hover:bg-[#222] ${
                  isActive ? 'bg-[#222]' : ''
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]" />
                )}
                
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {profile.pic ? (
                      <SecureImage
                        src={profile.pic}
                        alt={buyer}
                        className="w-12 h-12 rounded-full object-cover"
                        fallbackSrc="/placeholder-avatar.png"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {buyer.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {profile.verified && (
                      <CheckCircle className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-[#1a1a1a] rounded-full" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-white truncate">
                        <SecureMessageDisplay 
                          content={buyer}
                          allowBasicFormatting={false}
                          className="inline"
                          as="span"
                        />
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(lastMessage.date).toLocaleDateString() === new Date().toLocaleDateString()
                            ? new Date(lastMessage.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(lastMessage.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          }
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {lastMessage && (
                        <div className="text-sm text-gray-400 truncate flex-1">
                          {lastMessage.type === 'customRequest' ? (
                            <span className="flex items-center gap-1">
                              📦 Custom Request
                            </span>
                          ) : lastMessage.type === 'image' ? (
                            <span className="italic">📷 Image</span>
                          ) : (
                            <SecureMessageDisplay 
                              content={lastMessage.content || ''}
                              allowBasicFormatting={false}
                              maxLength={50}
                              as="span"
                            />
                          )}
                        </div>
                      )}
                      
                      {unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center bg-[#ff950e] text-black text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
