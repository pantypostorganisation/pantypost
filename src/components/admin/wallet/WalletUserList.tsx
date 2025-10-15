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
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#111111]/80 via-[#0c0c0c]/70 to-[#050505]/70 shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
        <div className="border-b border-white/5 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Users className="h-5 w-5 text-[#ff950e]" />
            User List
          </h2>
        </div>
        <div className="flex flex-col items-center gap-3 px-8 py-12 text-center text-gray-400">
          <Users className="h-12 w-12 opacity-40" />
          <p className="text-sm">No users found matching your criteria</p>
          <p className="text-xs text-gray-500">Try expanding your filters or clearing the search query.</p>
        </div>
      </div>
    );
  }

  const safeBalance = (u: string) => {
    const n = Number(getUserBalance(u));
    return Number.isFinite(n) ? n : 0;
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#111111]/80 via-[#0c0c0c]/70 to-[#050505]/70 shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Users className="h-5 w-5 text-[#ff950e]" />
          User List
        </h2>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
          {displayedUsers.length} results
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto" role="list" aria-label="Wallet users">
        <div className="space-y-2 p-3">
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
                className={`group relative cursor-pointer overflow-hidden rounded-xl border px-4 py-3 transition-all ${
                  isSelected
                    ? 'border-[#ff950e]/60 bg-[#ff950e]/15 shadow-[0_10px_30px_rgba(255,149,14,0.15)]'
                    : isBulkSelected
                    ? 'border-blue-500/40 bg-blue-500/10'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex flex-1 items-center gap-3"
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
                        className="rounded border-white/20 bg-transparent text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-0"
                        aria-label={`Bulk select ${uname}`}
                      />
                      {role === 'buyer' ? (
                        <UserCheck className="h-4 w-4 text-blue-400" />
                      ) : (
                        <UserX className="h-4 w-4 text-green-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-white">
                          <SecureMessageDisplay content={uname} allowBasicFormatting={false} className="inline" />
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${getRoleBadgeColor(role)}`}>
                          {formatRole(role)}
                        </span>
                      </div>
                      {showBalances && (
                        <div className="mt-1 text-sm text-gray-400">
                          Balance:{' '}
                          <span className={getBalanceColor(balance)}>
                            ${balance.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="text-[#ffb347]" aria-hidden="true">
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
