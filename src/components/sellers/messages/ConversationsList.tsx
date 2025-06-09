// src/components/sellers/messages/ConversationsList.tsx
'use client';

import React from 'react';
import { Search, Filter, User, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TierBadge from '@/components/TierBadge';

// Helper function to format relative time
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
};

interface Conversation {
  buyer: string;
  lastMessage: {
    content: string;
    date: string;
    type?: string;
  };
  unreadCount: number;
}

interface UserProfile {
  pic: string | null;
  verified: boolean;
  role: string;
  tierInfo?: {
    currentTier: string;
    displayName: string;
    nextTier?: string;
    currentSales?: number;
    salesNeeded?: number;
  };
}

interface ConversationsListProps {
  conversations: Conversation[];
  selectedBuyer: string | null;
  searchTerm: string;
  filterType: 'all' | 'unread' | 'custom';
  userProfiles: { [key: string]: UserProfile };
  onSelectBuyer: (buyer: string) => void;
  onSearchChange: (term: string) => void;
  onFilterChange: (filter: 'all' | 'unread' | 'custom') => void;
  isMobileView: boolean;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedBuyer,
  searchTerm,
  filterType,
  userProfiles,
  onSelectBuyer,
  onSearchChange,
  onFilterChange,
  isMobileView
}) => {
  const getMessagePreview = (message: string, type?: string) => {
    if (type === 'image') return '📷 Image';
    if (type === 'customRequest') return '🛍️ Custom Request';
    return message.length > 50 ? `${message.substring(0, 50)}...` : message;
  };
  
  const getInitial = (username: string) => username.charAt(0).toUpperCase();
  
  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Header */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('unread')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'unread'
                ? 'bg-purple-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => onFilterChange('custom')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'custom'
                ? 'bg-purple-500 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
          >
            Requests
          </button>
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <MessageCircle className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400">No conversations found</p>
              <p className="text-gray-500 text-sm mt-2">
                {filterType !== 'all' && 'Try changing your filter'}
              </p>
            </motion.div>
          ) : (
            conversations.map((conversation, index) => {
              const profile = userProfiles[conversation.buyer];
              const isSelected = selectedBuyer === conversation.buyer;
              
              return (
                <motion.div
                  key={conversation.buyer}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectBuyer(conversation.buyer)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-500/20 border-l-4 border-purple-500'
                      : 'hover:bg-[#1a1a1a] border-l-4 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {profile?.pic ? (
                      <img
                        src={profile.pic}
                        alt={conversation.buyer}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {getInitial(conversation.buyer)}
                      </div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  {/* Conversation Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${
                          conversation.unreadCount > 0 ? 'text-white' : 'text-gray-300'
                        }`}>
                          {conversation.buyer}
                        </h3>
                        {profile?.tierInfo && (
                          <TierBadge tier={profile.tierInfo.currentTier as any} size="sm" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastMessage.date))}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${
                      conversation.unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-400'
                    }`}>
                      {getMessagePreview(conversation.lastMessage.content, conversation.lastMessage.type)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConversationsList;