'use client';

import { useMemo } from 'react';
import { Users, User, BellRing, BadgeCheck, ChevronRight } from 'lucide-react';
import { sanitizeSearchQuery, sanitizeUrl } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface UserInfo {
  username: string;
  role: 'buyer' | 'seller' | string;
  verified: boolean;
  pic: string | null;
}

interface UserDirectoryContentProps {
  allUsers: UserInfo[];
  directorySearchQuery: string;
  filterBy: 'all' | 'buyers' | 'sellers';
  onStartConversation: (username: string) => void;
  onClearFilters: () => void;
}

export default function UserDirectoryContent({
  allUsers,
  directorySearchQuery,
  filterBy,
  onStartConversation,
  onClearFilters
}: UserDirectoryContentProps) {
  const getInitial = (username: string) => (username ? username.charAt(0).toUpperCase() : '?');

  const filteredDirectoryUsers = useMemo(() => {
    const sanitizedSearch = directorySearchQuery ? sanitizeSearchQuery(directorySearchQuery).toLowerCase() : '';

    return (allUsers || [])
      .filter((userInfo) => {
        const matchesSearch = sanitizedSearch ? userInfo.username.toLowerCase().includes(sanitizedSearch) : true;
        if (!matchesSearch) return false;

        if (filterBy === 'buyers' && userInfo.role !== 'buyer') return false;
        if (filterBy === 'sellers' && userInfo.role !== 'seller') return false;

        return true;
      })
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [allUsers, directorySearchQuery, filterBy]);

  const UserListItem = ({ userInfo }: { userInfo: UserInfo }) => (
    <div
      onClick={() => onStartConversation(userInfo.username)}
      className="flex items-center p-3 cursor-pointer hover:bg-[#222] transition-all duration-200 border-b border-gray-800 group"
      role="button"
      aria-label={`Start conversation with ${userInfo.username}`}
    >
      <div className="relative mr-3">
        <div className="w-12 h-12 rounded-full bg-[#333] flex items-center justify-center text-white font-bold overflow-hidden shadow-md border-2 border-gray-700 group-hover:border-[#ff950e]/50 transition-colors">
          {userInfo.pic ? (
            <img
              src={sanitizeUrl(userInfo.pic)}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-lg">{getInitial(userInfo.username)}</span>
          )}
        </div>

        <div
          className={`absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-lg ${
            userInfo.role === 'buyer' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
          }`}
        >
          {userInfo.role === 'buyer' ? 'B' : 'S'}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-white truncate group-hover:text-[#ff950e] transition-colors">
            <SecureMessageDisplay content={userInfo.username} allowBasicFormatting={false} />
          </h4>
          {userInfo.verified && <BadgeCheck size={14} className="text-[#ff950e] flex-shrink-0" />}
        </div>
        <p className="text-xs text-gray-400">{userInfo.role === 'buyer' ? 'Buyer Account' : 'Seller Account'}</p>
      </div>

      <ChevronRight size={16} className="text-gray-500 group-hover:text-[#ff950e] transition-colors flex-shrink-0" />
    </div>
  );

  return (
    <div>
      <div className="px-4 py-2 border-b border-gray-800 bg-[#1a1a1a]">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">
            {filteredDirectoryUsers.length} user{filteredDirectoryUsers.length !== 1 ? 's' : ''} available
          </p>
          {(directorySearchQuery || filterBy !== 'all') && (
            <button onClick={onClearFilters} className="text-xs text-[#ff950e] hover:text-[#ffb04e] transition-colors">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filteredDirectoryUsers.length === 0 ? (
        <div className="p-6 text-center text-gray-400">
          <Users size={48} className="mx-auto mb-3 text-gray-600" />
          <p className="text-lg mb-1">No users found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div>
          {filterBy === 'all' ? (
            <>
              {filteredDirectoryUsers.filter((u) => u.role === 'buyer').length > 0 && (
                <>
                  <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
                    <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                      <User size={14} />
                      Buyers ({filteredDirectoryUsers.filter((u) => u.role === 'buyer').length})
                    </h3>
                  </div>
                  {filteredDirectoryUsers
                    .filter((u) => u.role === 'buyer')
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((userInfo) => (
                      <UserListItem key={`buyer-${userInfo.username}`} userInfo={userInfo} />
                    ))}
                </>
              )}

              {filteredDirectoryUsers.filter((u) => u.role === 'seller').length > 0 && (
                <>
                  <div className="px-4 py-2 bg-[#1a1a1a] border-b border-gray-800">
                    <h3 className="text-sm font-medium text-green-400 flex items-center gap-2">
                      <BellRing size={14} />
                      Sellers ({filteredDirectoryUsers.filter((u) => u.role === 'seller').length})
                    </h3>
                  </div>
                  {filteredDirectoryUsers
                    .filter((u) => u.role === 'seller')
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((userInfo) => (
                      <UserListItem key={`seller-${userInfo.username}`} userInfo={userInfo} />
                    ))}
                </>
              )}
            </>
          ) : (
            filteredDirectoryUsers
              .sort((a, b) => a.username.localeCompare(b.username))
              .map((userInfo) => <UserListItem key={userInfo.username} userInfo={userInfo} />)
          )}
        </div>
      )}
    </div>
  );
}
