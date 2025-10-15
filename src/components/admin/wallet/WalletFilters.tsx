// src/components/admin/wallet/WalletFilters.tsx
'use client';

import { Search, Eye, EyeOff, X } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface WalletFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: 'all' | 'buyer' | 'seller';
  setRoleFilter: (filter: 'all' | 'buyer' | 'seller') => void;
  balanceFilter: 'all' | 'positive' | 'zero' | 'negative';
  setBalanceFilter: (filter: 'all' | 'positive' | 'zero' | 'negative') => void;
  showBalances: boolean;
  setShowBalances: (show: boolean) => void;
  selectedUsers: string[];
  setSelectedUsers: (users: string[]) => void;
  displayedUsers: any[];
  handleSelectAll: () => void;
  setShowBulkModal: (show: boolean) => void;
}

export default function WalletFilters({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  balanceFilter,
  setBalanceFilter,
  showBalances,
  setShowBalances,
  selectedUsers = [],
  setSelectedUsers,
  displayedUsers = [],
  handleSelectAll,
  setShowBulkModal
}: WalletFiltersProps) {
  const handleSearchChange = (value: string) => {
    const sanitizedValue = sanitizeSearchQuery(value);
    setSearchTerm(sanitizedValue);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <SecureInput
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by username, role, or balance"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur focus:border-[#ff950e] focus:outline-none"
            maxLength={100}
            sanitize={true}
            sanitizer={sanitizeSearchQuery}
            aria-label="Search users"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white backdrop-blur transition focus:border-[#ff950e] focus:outline-none"
          aria-label="Role filter"
        >
          <option value="all">All Roles</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
        </select>

        {/* Balance Filter */}
        <select
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white backdrop-blur transition focus:border-[#ff950e] focus:outline-none"
          aria-label="Balance filter"
        >
          <option value="all">All Balances</option>
          <option value="positive">Positive</option>
          <option value="zero">Zero</option>
          <option value="negative">Negative</option>
        </select>

        {/* Toggle Balance Visibility */}
        <button
          onClick={() => setShowBalances(!showBalances)}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white backdrop-blur transition hover:bg-white/10"
          aria-pressed={showBalances}
          aria-label="Toggle balance visibility"
        >
          {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showBalances ? 'Hide' : 'Show'} Balances
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#ff950e]/30 bg-[#ff950e]/10 p-4 text-sm text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">{selectedUsers.length} users selected</span>
            <button onClick={() => setSelectedUsers([])} className="text-gray-300 transition hover:text-white" aria-label="Clear selection">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden max-h-14 flex-1 items-center overflow-hidden sm:flex">
              <div className="flex flex-wrap gap-2 overflow-y-auto">
                {selectedUsers.map((u) => (
                  <span key={u} className="inline-flex items-center rounded-full border border-[#ff950e]/40 bg-[#ff950e]/20 px-2 py-1 text-xs text-[#ffb347]">
                    <SecureMessageDisplay content={u} allowBasicFormatting={false} className="inline" />
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowBulkModal(true)}
              className="rounded-xl bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ff6b00]"
            >
              Launch Bulk Action
            </button>
          </div>
        </div>
      )}

      {/* Selected users (mobile peek) */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:hidden">
          {selectedUsers.map((u) => (
            <span key={u} className="inline-flex items-center rounded-full border border-[#ff950e]/40 bg-[#ff950e]/20 px-2 py-1 text-xs text-[#ffb347]">
              <SecureMessageDisplay content={u} allowBasicFormatting={false} className="inline" />
            </span>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex flex-col gap-3 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Displaying {Array.isArray(displayedUsers) ? displayedUsers.length : 0} wallet
          {Array.isArray(displayedUsers) && displayedUsers.length !== 1 ? 's' : ''}
        </span>
        {Array.isArray(displayedUsers) && displayedUsers.length > 0 && (
          <button onClick={handleSelectAll} className="text-[#ffb347] transition hover:text-[#ffd79a]">
            {selectedUsers.length === displayedUsers.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>
    </div>
  );
}
