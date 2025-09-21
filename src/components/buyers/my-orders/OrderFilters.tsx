// src/components/buyers/my-orders/OrderFilters.tsx
'use client';

import React from 'react';
import { Search, Filter, Calendar, DollarSign, Package } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: 'all' | 'pending' | 'processing' | 'shipped';
  onFilterStatusChange: (status: 'all' | 'pending' | 'processing' | 'shipped') => void;
  sortBy: 'date' | 'price' | 'status';
  sortOrder: 'asc' | 'desc';
  onToggleSort: (sortBy: 'date' | 'price' | 'status') => void;
}

export default function OrderFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  sortOrder,
  onToggleSort,
}: OrderFiltersProps) {
  return (
    <div className="bg-gradient-to-r from-[#1a1a1a] to-[#151515] rounded-2xl p-5 mb-6 border border-gray-800/50 backdrop-blur">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-[#ff950e] transition-colors" />
            <SecureInput
              type="text"
              placeholder="Search by title, seller, or tags..."
              value={searchQuery}
              onChange={(v) => onSearchChange(v)}
              sanitizer={sanitizeSearchQuery}
              className="w-full pl-11 pr-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:border-[#ff950e]/50 focus:bg-black/60 focus:outline-none transition-all"
              maxLength={100}
            />
          </div>
        </div>

        {/* Status Filter */}
        <select
          className="px-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-white focus:border-[#ff950e]/50 focus:outline-none transition-all cursor-pointer hover:bg-black/60"
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as any)}
        >
          <option value="all">📦 All Orders</option>
          <option value="pending">⏳ Pending</option>
          <option value="processing">🔄 Processing</option>
          <option value="shipped">✈️ Shipped</option>
        </select>

        {/* Sort Options */}
        <div className="flex bg-black/40 rounded-xl p-1 border border-gray-800">
          <button
            onClick={() => onToggleSort('date')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              sortBy === 'date' 
                ? 'bg-[#ff950e] text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Date
          </button>

          <button
            onClick={() => onToggleSort('price')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              sortBy === 'price' 
                ? 'bg-[#ff950e] text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Price
          </button>

          <button
            onClick={() => onToggleSort('status')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              sortBy === 'status' 
                ? 'bg-[#ff950e] text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Status
          </button>
        </div>
      </div>
    </div>
  );
}
