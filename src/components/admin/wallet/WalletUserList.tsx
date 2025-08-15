// src/components/admin/wallet/WalletUserList.tsx
'use client';

import { Users, UserCheck, UserX, CheckCircle } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface User {
  username: string;
  role: string; // 'buyer' | 'seller' | 'admin' (fallback safe)
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
  displayedUsers = [],
  selectedUsers = [],
  selectedUser,
  showBalances,
  handleSelectUser,
  handleBulkSelect,
  getUserBalance,
  getRoleBadgeColor,
  getBalanceColor,
  formatRole
}: WalletUserListProps) {
  if (!Array.isArray(displayedUsers) || displayedUsers.length === 0) {
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

  const safeBalance = (u: string) => {
    const n = Number(getUserBalance(u));
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="lg:col-span-2 bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-[#ff950e]" />
          User List
        </h2>
      </div>

      <div className="max-h-96 overflow-y-auto" role="list" aria-label="Wallet users">
        <div className="space-y-1 p-2">
          {displayedUsers.map((user) => {
            const uname = user?.username ?? '';
            const role = user?.role ?? 'buyer';
            const isSelected = selectedUser === uname;
            const isBulkSelected = selectedUsers.includes(uname);
            const balance = safeBalance(uname);

            return (
              <div
                key={uname}
                role="listitem"
                aria-selected={isSelected}
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
                    onClick={() => handleSelectUser(uname, role)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectUser(uname, role);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${uname}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isBulkSelected}
                        onChange={() => handleBulkSelect(uname)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-0 bg-transparent"
                        aria-label={`Bulk select ${uname}`}
                      />
                      {role === 'buyer' ? (
                        <UserCheck className="h-4 w-4 text-blue-400" />
                      ) : (
                        <UserX className="h-4 w-4 text-green-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">
                          <SecureMessageDisplay content={uname} allowBasicFormatting={false} className="inline" />
                        </span>
                        <span className={`px-2 py-1 rounded text-xs border ${getRoleBadgeColor(role)}`}>
                          {formatRole(role)}
                        </span>
                      </div>
                      {showBalances && (
                        <div className="text-sm text-gray-400 mt-1">
                          Balance:{' '}
                          <span className={getBalanceColor(balance)}>
                            ${balance.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-[#ff950e]" aria-hidden="true">
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
