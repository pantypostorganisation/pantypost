// src/components/buyers/messages/ThreadsSidebar.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MessageSquare, Search, Star, Package, Bell, X, Filter, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';

// Helper function to resolve image URLs
const resolveProfilePicUrl = (pic: string | null | undefined): string | null => {
  if (!pic) return null;
  
  // If it's already a full URL, return as-is
  if (pic.startsWith('http://') || pic.startsWith('https://')) {
    // Replace http with https for production API
    if (pic.includes('api.pantypost.com') && pic.startsWith('http://')) {
      return pic.replace('http://', 'https://');
    }
    return pic;
  }
  
  // If it starts with /uploads/, prepend the API URL
  if (pic.startsWith('/uploads/')) {
    // Use HTTPS for production
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com';
    return `${apiUrl}${pic}`;
  }
  
  // If it's just a filename or relative path, prepend /uploads/ and API URL
  if (!pic.startsWith('/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com';
    return `${apiUrl}/uploads/${pic}`;
  }
  
  // Default: prepend API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com';
  return `${apiUrl}${pic}`;
};

interface ThreadsSidebarProps {
  threads: { [seller: string]: any[] };
  lastMessages: { [seller: string]: any };
  sellerProfiles: { [seller: string]: any };
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
  buyerRequests?: any[];
  setObserverReadMessages?: (messages: Set<string>) => void;
}

// Component to handle individual thread item with online status
function ThreadItem({ 
  seller, 
  lastMessage, 
  unreadCount, 
  profile, 
  isActive, 
  isFavorite,
  pendingRequests,
  onThreadClick,
  onToggleFavorite 
}: {
  seller: string;
  lastMessage: any;
  unreadCount: number;
  profile: { profilePic: string | null; isVerified: boolean };
  isActive: boolean;
  isFavorite: boolean;
  pendingRequests: number;
  onThreadClick: (seller: string) => void;
  onToggleFavorite: (e: React.MouseEvent, seller: string) => void;
}) {
  // Get activity status for this seller
  const { activityStatus, loading } = useUserActivityStatus(seller);
  const resolvedProfilePic = resolveProfilePicUrl(profile.profilePic);
  
  // Format last message preview
  const formatMessagePreview = (message: any) => {
    if (!message) return '';
    
    if (message.type === 'customRequest' && message.meta) {
      return `📦 Custom Request: ${message.meta.title}`;
    }
    
    if (message.type === 'image') {
      return '🖼️ Image';
    }
    
    return message.content || '';
  };
  
  return (
    <div
      onClick={() => onThreadClick(seller)}
      className={`relative px-4 py-3 border-b border-gray-800 cursor-pointer transition-all hover:bg-[#222] ${
        isActive ? 'bg-[#222]' : ''
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]" />
      )}
      
      <div className="flex items-start gap-3">
        {/* Avatar with online indicator */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
            {resolvedProfilePic ? (
              <img 
                src={resolvedProfilePic} 
                alt={seller}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for ${seller}:`, resolvedProfilePic);
                  // Fallback to placeholder on error
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-purple-500 to-pink-500">
                      ${seller.charAt(0).toUpperCase()}
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-purple-500 to-pink-500">
                {seller.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Online indicator - Messenger style */}
          {activityStatus.isOnline && !loading && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#ff950e] rounded-full border-2 border-[#1a1a1a]" />
          )}
          
          {/* Verification badge */}
          {profile.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
        </div>
        
        {/* Thread info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-white truncate">
              {seller}
            </span>
            
            <div className="flex items-center gap-2">
              {/* Pending requests indicator */}
              {pendingRequests > 0 && (
                <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                  {pendingRequests} pending
                </span>
              )}
              
              {/* Unread count */}
              {unreadCount > 0 && (
                <span className="text-xs bg-[#ff950e] text-black px-2 py-1 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
              
              {/* Favorite button */}
              <button
                onClick={(e) => onToggleFavorite(e, seller)}
                className="text-gray-400 hover:text-yellow-500 transition-colors"
              >
                <Star 
                  size={16} 
                  className={isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}
                />
              </button>
            </div>
          </div>
          
          {/* Last message preview */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400 truncate">
              {lastMessage ? formatMessagePreview(lastMessage) : 'No messages yet'}
            </p>
            {lastMessage && (
              <span className="text-xs text-gray-500 ml-2">
                {formatDistanceToNow(new Date(lastMessage.date), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
  buyerRequests = [],
  setObserverReadMessages
}: ThreadsSidebarProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Extract thread list
  const threadList = useMemo(() => Object.keys(threads), [threads]);
  
  // Filter threads based on search query, favorites, and filter
  const filteredThreads = useMemo(() => {
    let filtered = threadList;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(seller => 
        seller.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply tab filter
    if (activeTab === 'favorites') {
      filtered = filtered.filter(seller => favorites.includes(seller));
    }
    
    // Apply unread filter
    if (filterBy === 'unread') {
      filtered = filtered.filter(seller => (uiUnreadCounts[seller] || 0) > 0);
    }
    
    // Sort by last message date
    filtered.sort((a, b) => {
      const lastMessageA = lastMessages[a];
      const lastMessageB = lastMessages[b];
      
      if (!lastMessageA) return 1;
      if (!lastMessageB) return -1;
      
      return new Date(lastMessageB.date).getTime() - new Date(lastMessageA.date).getTime();
    });
    
    return filtered;
  }, [threadList, searchQuery, activeTab, favorites, filterBy, uiUnreadCounts, lastMessages]);
  
  // Toggle favorite
  const toggleFavorite = useCallback((e: React.MouseEvent, seller: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(seller) 
        ? prev.filter(s => s !== seller)
        : [...prev, seller]
    );
  }, []);
  
  // Handle thread click
  const handleThreadClick = useCallback((seller: string) => {
    setActiveThread(seller);
    
    // Clear unread messages for this thread
    if (setObserverReadMessages) {
      setObserverReadMessages(new Set());
    }
  }, [setActiveThread, setObserverReadMessages]);
  
  // Get pending requests for sellers
  const pendingRequestsCount = useMemo(() => {
    const counts: { [seller: string]: number } = {};
    
    buyerRequests.forEach(request => {
      if (request.status === 'pending' || request.status === 'edited') {
        counts[request.seller] = (counts[request.seller] || 0) + 1;
      }
    });
    
    return counts;
  }, [buyerRequests]);
  
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#222] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'messages'
                ? 'bg-[#ff950e] text-black'
                : 'bg-[#222] text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare size={16} className="inline mr-1" />
            All
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'favorites'
                ? 'bg-[#ff950e] text-black'
                : 'bg-[#222] text-gray-400 hover:text-white'
            }`}
          >
            <Star size={16} className="inline mr-1" />
            Starred
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-[#ff950e] text-black'
                : 'bg-[#222] text-gray-400 hover:text-white'
            }`}
          >
            <Package size={16} className="inline mr-1" />
            Requests
          </button>
        </div>
        
        {/* Filter */}
        {activeTab === 'messages' && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterBy(filterBy === 'all' ? 'unread' : 'all')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filterBy === 'unread'
                    ? 'bg-[#ff950e] text-black'
                    : 'bg-[#222] text-gray-400 hover:text-white'
                }`}
              >
                <Bell size={10} />
                Unread ({totalUnreadCount})
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
                <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm">{searchQuery ? 'No sellers found' : filterBy === 'unread' ? 'No unread messages' : 'No conversations yet'}</p>
              </div>
            ) : (
              filteredThreads.map((seller) => (
                <ThreadItem
                  key={seller}
                  seller={seller}
                  lastMessage={lastMessages[seller]}
                  unreadCount={uiUnreadCounts[seller] || 0}
                  profile={sellerProfiles[seller] || { profilePic: null, isVerified: false }}
                  isActive={activeThread === seller}
                  isFavorite={favorites.includes(seller)}
                  pendingRequests={pendingRequestsCount[seller] || 0}
                  onThreadClick={handleThreadClick}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
          </>
        )}
        
        {activeTab === 'favorites' && (
          <div className="p-4">
            {favorites.length === 0 ? (
              <div className="text-center text-gray-400">
                <Star className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm">No starred conversations</p>
                <p className="text-xs mt-2">Star conversations to access them quickly</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favorites.map(seller => (
                  <div
                    key={seller}
                    onClick={() => handleThreadClick(seller)}
                    className="p-3 bg-[#222] rounded-lg hover:bg-[#2a2a2a] cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-white">{seller}</span>
                    <button
                      onClick={(e) => toggleFavorite(e, seller)}
                      className="text-yellow-500"
                    >
                      <Star size={16} className="fill-yellow-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'requests' && (
          <div className="p-4">
            {buyerRequests.filter(r => r.status === 'pending' || r.status === 'edited').length === 0 ? (
              <div className="text-center text-gray-400">
                <Package className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {buyerRequests
                  .filter(r => r.status === 'pending' || r.status === 'edited')
                  .map(request => (
                    <div
                      key={request.id}
                      onClick={() => handleThreadClick(request.seller)}
                      className="p-3 bg-[#222] rounded-lg hover:bg-[#2a2a2a] cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{request.title}</span>
                        <span className="text-[#ff950e] font-bold">${request.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">From: {request.seller}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          request.status === 'edited' 
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {request.status === 'edited' ? 'Edited' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
