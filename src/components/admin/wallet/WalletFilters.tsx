// src/components/admin/wallet/WalletFilters.tsx
'use client';

import { Search, Eye, EyeOff, X } from 'lucide-react';

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
  selectedUsers,
  setSelectedUsers,
  displayedUsers,
  handleSelectAll,
  setShowBulkModal
}: WalletFiltersProps) {
  return (
    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 shadow-lg mb-8">
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e]"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ff950e]"
        >
          <option value="all">All Roles</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
        </select>

        {/* Balance Filter */}
        <select
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value as any)}
          className="px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ff950e]"
        >
          <option value="all">All Balances</option>
          <option value="positive">Positive</option>
          <option value="zero">Zero</option>
          <option value="negative">Negative</option>
        </select>

        {/* Toggle Balance Visibility */}
        <button
          onClick={() => setShowBalances(!showBalances)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors flex items-center gap-2"
        >
          {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showBalances ? 'Hide' : 'Show'} Balances
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center justify-between bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {selectedUsers.length} users selected
            </span>
            <button
              onClick={() => setSelectedUsers([])}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-[#ff950e] hover:bg-[#ff6b00] text-black rounded-lg text-sm font-medium transition-colors"
          >
            Bulk Action
          </button>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing {displayedUsers.length} users
        </span>
        {displayedUsers.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="text-[#ff950e] hover:text-[#ff6b00] transition-colors"
          >
            {selectedUsers.length === displayedUsers.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>
    </div>
  );
}
