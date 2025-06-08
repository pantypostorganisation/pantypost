// src/components/admin/wallet/WalletUserList.tsx
'use client';

import { Users, UserCheck, UserX, CheckCircle } from 'lucide-react';

interface User {
  username: string;
  role: string;
}

interface WalletUserListProps {
  displayedUsers: User[];
  selectedUsers: string[];
  selectedUser: string | null;
  showBalances: boolean;
  handleSelectUser: (username: string, role: string) => void;
  handleBulkSelect: (username: string) => void;
  getUserBalance: (username: string) => number;
  getRoleBadgeColor: (role: string) => string;
  getBalanceColor: (balance: number) => string;
  formatRole: (role: string) => string;
}

export default function WalletUserList({
  displayedUsers,
  selectedUsers,
  selectedUser,
  showBalances,
  handleSelectUser,
  handleBulkSelect,
  getUserBalance,
  getRoleBadgeColor,
  getBalanceColor,
  formatRole
}: WalletUserListProps) {
  if (displayedUsers.length === 0) {
    return (
      <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#ff950e]" />
            User List
          </h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No users found matching your criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-[#ff950e]" />
          User List
        </h2>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-1 p-2">
          {displayedUsers.map((user) => {
            const isSelected = selectedUser === user.username;
            const isBulkSelected = selectedUsers.includes(user.username);
            const balance = getUserBalance(user.username);
            
            return (
              <div
                key={user.username}
                className={`p-3 rounded-lg transition-all cursor-pointer border ${
                  isSelected 
                    ? 'bg-[#ff950e]/10 border-[#ff950e]/50' 
                    : isBulkSelected
                      ? 'bg-blue-600/10 border-blue-600/50'
                      : 'bg-black/30 border-transparent hover:bg-black/50 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 flex-1"
                    onClick={() => handleSelectUser(user.username, user.role)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isBulkSelected}
                        onChange={() => handleBulkSelect(user.username)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-0 bg-transparent"
                      />
                      {user.role === 'buyer' ? (
                        <UserCheck className="h-4 w-4 text-blue-400" />
                      ) : (
                        <UserX className="h-4 w-4 text-green-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{user.username}</span>
                        <span className={`px-2 py-1 rounded text-xs border ${getRoleBadgeColor(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                      </div>
                      {showBalances && (
                        <div className="text-sm text-gray-400 mt-1">
                          Balance: <span className={getBalanceColor(balance)}>${balance.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="text-[#ff950e]">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
