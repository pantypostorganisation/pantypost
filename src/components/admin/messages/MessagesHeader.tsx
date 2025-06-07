'use client';

import { MessageCircle, Filter, User, BellRing, Users, Search } from 'lucide-react';

interface MessagesHeaderProps {
  filterBy: 'all' | 'buyers' | 'sellers';
  setFilterBy: (filter: 'all' | 'buyers' | 'sellers') => void;
  totalUnreadCount: number;
  showUserDirectory: boolean;
  setShowUserDirectory: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  directorySearchQuery: string;
  setDirectorySearchQuery: (query: string) => void;
}

export default function MessagesHeader({
  filterBy,
  setFilterBy,
  totalUnreadCount,
  showUserDirectory,
  setShowUserDirectory,
  searchQuery,
  setSearchQuery,
  directorySearchQuery,
  setDirectorySearchQuery
}: MessagesHeaderProps) {
  return (
    <>
      {/* Admin header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-2xl font-bold text-[#ff950e] mb-2 flex items-center">
          <MessageCircle size={24} className="mr-2 text-[#ff950e]" />
          Admin Messages
        </h2>
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
            All Users
          </button>
          <button 
            onClick={() => setFilterBy('buyers')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
              filterBy === 'buyers' 
                ? 'bg-[#ff950e] text-black' 
                : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
            }`}
          >
            <User size={14} className="mr-1" />
            Buyers
          </button>
          <button 
            onClick={() => setFilterBy('sellers')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center ${
              filterBy === 'sellers' 
                ? 'bg-[#ff950e] text-black' 
                : 'bg-[#1a1a1a] text-white hover:bg-[#222]'
            }`}
          >
            <BellRing size={14} className="mr-1" />
            Sellers
            {totalUnreadCount > 0 && (
              <span className="ml-1 bg-[#ff950e] text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border border-black">
                {totalUnreadCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Toggle between conversations and user directory */}
        <div className="flex space-x-1 mb-3 bg-[#222] p-1 rounded-lg">
          <button
            onClick={() => setShowUserDirectory(false)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              !showUserDirectory 
                ? 'bg-[#ff950e] text-black shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-[#333]'
            }`}
          >
            <MessageCircle size={16} className="mr-2 inline" />
            Conversations
          </button>
          <button
            onClick={() => setShowUserDirectory(true)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              showUserDirectory 
                ? 'bg-[#ff950e] text-black shadow-lg' 
                : 'text-gray-300 hover:text-white hover:bg-[#333]'
            }`}
          >
            <Users size={16} className="mr-2 inline" />
            All Users
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <input
            type="text"
            placeholder={showUserDirectory ? "Search all users..." : "Search conversations..."}
            value={showUserDirectory ? directorySearchQuery : searchQuery}
            onChange={(e) => showUserDirectory ? setDirectorySearchQuery(e.target.value) : setSearchQuery(e.target.value)}
            className="w-full py-2 px-4 pr-10 rounded-full bg-[#222] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent"
          />
          <div className="absolute right-3 top-2.5 text-gray-400">
            <Search size={18} />
          </div>
        </div>
      </div>
    </>
  );
}