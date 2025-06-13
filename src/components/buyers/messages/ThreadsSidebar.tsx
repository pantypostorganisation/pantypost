// src/components/buyers/messages/ThreadsSidebar.tsx
'use client';

import React, { useMemo } from 'react';
import { 
  MessageSquare, 
  Search, 
  Bell,
  Filter,
  Package,
  Star,
  FileText,
  User,
  CheckCircle
} from 'lucide-react';

interface ThreadsSidebarProps {
  threads: { [seller: string]: any[] };
  lastMessages: { [seller: string]: any };
  sellerProfiles: { [seller: string]: { pic: string | null, verified: boolean } };
  uiUnreadCounts: { [seller: string]: number };
  activeThread: string | null;
  setActiveThread: (thread: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'messages' | 'favorites' | 'requests';
  setActiveTab: (tab: 'messages' | 'favorites' | 'requests') => void;
  filterBy: 'all' | 'unread';
  setFilterBy: (filter: 'all' | 'unread') => void;
  totalUnreadCount: number;
  buyerRequests: any[];
  setObserverReadMessages: (fn: (prev: Set<string>) => Set<string>) => void;
}

export default function ThreadsSidebar({
  threads,
  lastMessages,
  sellerProfiles,
  uiUnreadCounts,
  activeThread,
  setActiveThread,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  filterBy,
  setFilterBy,
  totalUnreadCount,
  buyerRequests,
  setObserverReadMessages
}: ThreadsSidebarProps) {
  // Filter threads based on search and filter
  const filteredThreads = useMemo(() => {
    return Object.keys(threads)
      .filter(seller => {
        if (searchQuery && !seller.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (filterBy === 'unread' && uiUnreadCounts[seller] === 0) {
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

  // Count pending requests
  const pendingRequestsCount = buyerRequests.filter(req => req.status === 'pending').length;

  const handleThreadClick = (seller: string) => {
    setActiveThread(seller);
    setObserverReadMessages((prev: Set<string>) => new Set(prev));
  };

  return (
    <div className="w-full md:w-1/3 bg-[#1a1a1a] border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-3 flex items-center">
          <MessageSquare className="mr-2 text-[#ff950e]" size={20} />
          Messages
        </h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-3 bg-[#222] p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'messages'
                ? 'bg-[#ff950e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#333]'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chats</span>
            {totalUnreadCount > 0 && (
              <span className="ml-1 bg-black/20 text-xs px-1.5 py-0.5 rounded-full">
                {totalUnreadCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-[#ff950e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#333]'
            }`}
          >
            <Star size={14} />
            <span>Favorites</span>
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === 'requests'
                ? 'bg-[#ff950e] text-black'
                : 'text-gray-400 hover:text-white hover:bg-[#333]'
            }`}
          >
            <FileText size={14} />
            <span>Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1 bg-black/20 text-xs px-1.5 py-0.5 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Search */}
        {activeTab === 'messages' && (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#222] text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
              />
            </div>
            
            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterBy('all')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-md text-sm transition-all ${
                  filterBy === 'all'
                    ? 'bg-[#ff950e] text-black'
                    : 'bg-[#222] text-gray-400 hover:text-white'
                }`}
              >
                <Filter size={12} />
                All
              </button>
              <button
                onClick={() => setFilterBy('unread')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-md text-sm transition-all ${
                  filterBy === 'unread'
                    ? 'bg-[#ff950e] text-black'
                    : 'bg-[#222] text-gray-400 hover:text-white'
                }`}
              >
                <Bell size={12} />
                Unread
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'messages' && (
          <>
            {filteredThreads.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <MessageSquare className="mx-auto mb-2 opacity-50" size={32} />
                <p>{searchQuery ? 'No sellers found' : 'No conversations yet'}</p>
              </div>
            ) : (
              filteredThreads.map((seller) => {
                const lastMessage = lastMessages[seller];
                const unreadCount = uiUnreadCounts[seller] || 0;
                const profile = sellerProfiles[seller];
                const isActive = activeThread === seller;
                
                return (
                  <div
                    key={seller}
                    onClick={() => handleThreadClick(seller)}
                    className={`p-4 border-b border-gray-800 cursor-pointer transition-all hover:bg-[#222] ${
                      isActive ? 'bg-[#222] border-l-4 border-l-[#ff950e]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {profile.pic ? (
                          <img
                            src={profile.pic}
                            alt={seller}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {seller.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {profile.verified && (
                          <CheckCircle className="absolute -bottom-1 -right-1 w-4 h-4 text-blue-500 bg-[#1a1a1a] rounded-full" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-white truncate flex items-center gap-1">
                            {seller}
                            {profile.verified && (
                              <span className="text-xs text-blue-500">(Verified)</span>
                            )}
                          </h3>
                          {lastMessage && (
                            <span className="text-xs text-gray-400">
                              {new Date(lastMessage.date).toLocaleDateString() === new Date().toLocaleDateString()
                                ? new Date(lastMessage.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date(lastMessage.date).toLocaleDateString()
                              }
                            </span>
                          )}
                        </div>
                        
                        {lastMessage && (
                          <p className="text-sm text-gray-400 truncate">
                            {lastMessage.type === 'customRequest' ? (
                              <span className="flex items-center gap-1">
                                <Package size={12} />
                                Custom Request
                              </span>
                            ) : lastMessage.type === 'image' ? (
                              <span className="italic">📷 Image</span>
                            ) : (
                              lastMessage.content
                            )}
                          </p>
                        )}
                        
                        {unreadCount > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center justify-center bg-[#ff950e] text-black text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px]">
                              {unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
        
        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="p-4 text-center text-gray-400">
            <Star className="mx-auto mb-2 opacity-50" size={32} />
            <p>Favorite sellers coming soon!</p>
            <p className="text-xs mt-1">Save your preferred sellers for quick access</p>
          </div>
        )}
        
        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {buyerRequests.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <FileText className="mx-auto mb-2 opacity-50" size={32} />
                <p>No custom requests yet</p>
                <p className="text-xs mt-1">Your sent requests will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {buyerRequests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => setActiveThread(request.seller)}
                    className="p-4 hover:bg-[#222] cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-white truncate">{request.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        request.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        request.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        request.status === 'paid' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">To: {request.seller}</p>
                    <p className="text-sm font-semibold text-[#ff950e]">${request.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
