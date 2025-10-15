// src/components/admin/messages/ConversationsContent.tsx
'use client';

import { useMemo } from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { Message } from '@/types/message';
import { sanitizeSearchQuery, sanitizeUrl } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface ConversationsContentProps {
  threads: { [user: string]: Message[] };
  lastMessages: { [user: string]: Message };
  unreadCounts: { [user: string]: number };
  userProfiles: { [user: string]: { pic: string | null; verified: boolean; role: string } };
  activeThread: string | null;
  searchQuery: string;
  filterBy: 'all' | 'buyers' | 'sellers';
  onThreadSelect: (userId: string) => void;
  onStartNewConversation: () => void;
}

export default function ConversationsContent({
  threads,
  lastMessages,
  unreadCounts,
  userProfiles,
  activeThread,
  searchQuery,
  filterBy,
  onThreadSelect,
  onStartNewConversation
}: ConversationsContentProps) {
  const getInitial = (username: string) => (username ? username.charAt(0).toUpperCase() : '?');

  const formatTimeAgo = (date: string) => {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diffMs = Math.max(0, now - then);

    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (d > 0) return d === 1 ? '1d ago' : `${d}d ago`;

    const h = Math.floor(diffMs / (1000 * 60 * 60));
    if (h > 0) return h === 1 ? '1h ago' : `${h}h ago`;

    const m = Math.floor(diffMs / (1000 * 60));
    if (m > 0) return m === 1 ? '1m ago' : `${m}m ago`;

    return 'Just now';
  };

  const filteredAndSortedThreads = useMemo(() => {
    const sanitizedSearch = searchQuery ? sanitizeSearchQuery(searchQuery).toLowerCase() : '';

    const filtered = Object.keys(threads).filter((userKey) => {
      const matchesSearch = sanitizedSearch ? userKey.toLowerCase().includes(sanitizedSearch) : true;
      if (!matchesSearch) return false;

      const role = userProfiles[userKey]?.role;
      if (filterBy === 'buyers' && role !== 'buyer') return false;
      if (filterBy === 'sellers' && role !== 'seller') return false;

      return true;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(lastMessages[a]?.date || 0).getTime();
      const dateB = new Date(lastMessages[b]?.date || 0).getTime();
      return dateB - dateA;
    });
  }, [threads, lastMessages, searchQuery, filterBy, userProfiles]);

  if (filteredAndSortedThreads.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <MessageCircle size={48} className="mx-auto text-gray-600 mb-2" />
        <p className="text-lg mb-2">No conversations found</p>
        <p className="text-sm mb-4">Switch to "All Users" to start new conversations</p>
        <button
          onClick={onStartNewConversation}
          className="px-4 py-2 bg-[#ff950e] text-black font-medium rounded-lg hover:bg-[#e88800] transition-colors inline-flex items-center justify-center"
        >
          Browse Users
        </button>
      </div>
    );
  }

  return (
    <div role="list">
      {filteredAndSortedThreads.map((userKey) => {
        const lastMessage = lastMessages[userKey];
        const isActive = activeThread === userKey;
        const userProfile = userProfiles[userKey];
        const unreadCount = unreadCounts[userKey] || 0;

        return (
          <div
            key={userKey}
            onClick={() => onThreadSelect(userKey)}
            className={`flex items-center p-3 cursor-pointer relative border-b border-gray-800 ${
              isActive ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'
            } transition-colors duration-150 ease-in-out`}
            role="listitem"
          >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff950e]" />}

            <div className="relative mr-3">
              <div className="relative w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
                {userProfile?.pic ? (
                  <img
                    src={sanitizeUrl(userProfile.pic)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  getInitial(userKey)
                )}

                <div className="absolute bottom-0 right-0 text-[8px] bg-black px-1 rounded text-[#ff950e] border border-[#ff950e]">
                  {userProfile?.role === 'buyer' ? 'B' : userProfile?.role === 'seller' ? 'S' : '?'}
                </div>
              </div>

              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff950e] text-black text-xs rounded-full flex items-center justify-center font-bold border-2 border-[#121212] shadow-lg">
                  {Math.min(unreadCount, 99)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <h3 className="font-bold text-white truncate">
                  <span>
                    <SecureMessageDisplay content={userKey} allowBasicFormatting={false} />
                  </span>
                </h3>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-1 flex items-center">
                  <Clock size={12} className="mr-1" />
                  {lastMessage ? formatTimeAgo(lastMessage.date) : ''}
                </span>
              </div>
              <div className="text-sm text-gray-400 truncate">
                {lastMessage ? (
                  lastMessage.type === 'customRequest' ? (
                    '🛠️ Custom Request'
                  ) : lastMessage.type === 'image' ? (
                    '📷 Image'
                  ) : (
                    <span>
                      <SecureMessageDisplay content={lastMessage.content} allowBasicFormatting={false} maxLength={50} />
                    </span>
                  )
                ) : (
                  ''
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
