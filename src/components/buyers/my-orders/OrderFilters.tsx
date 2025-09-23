// src/components/buyers/my-orders/OrderFilters.tsx
'use client';

import React from 'react';
import { Search, Filter, Calendar, DollarSign, Package, ChevronDown } from 'lucide-react';
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
    <div className="bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a] rounded-2xl p-4 md:p-5 border border-white/5 backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
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
              className="w-full pl-11 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#ff950e]/50 focus:bg-black/80 focus:outline-none transition-all text-sm md:text-base"
              maxLength={100}
            />
          </div>
        </div>

        {/* Status Filter - Enhanced dropdown */}
        <div className="relative">
          <select
            className="appearance-none px-4 py-3 pr-10 bg-black/60 border border-white/10 rounded-xl text-white focus:border-[#ff950e]/50 focus:outline-none transition-all cursor-pointer hover:bg-black/80 text-sm md:text-base min-w-[140px]"
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as any)}
          >
            <option value="all">📦 All Orders</option>
            <option value="pending">⏳ Pending</option>
            <option value="processing">🔄 Processing</option>
            <option value="shipped">✈️ Shipped</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>

        {/* Sort Options - Improved button group */}
        <div className="flex bg-black/60 rounded-xl p-1 border border-white/10">
          <button
            onClick={() => onToggleSort('date')}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              sortBy === 'date' 
                ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Date</span>
          </button>

          <button
            onClick={() => onToggleSort('price')}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              sortBy === 'price' 
                ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Price</span>
          </button>

          <button
            onClick={() => onToggleSort('status')}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              sortBy === 'status' 
                ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Status</span>
          </button>
        </div>

        {/* Sort Direction Indicator */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => onToggleSort(sortBy)}
            className="p-2 rounded-lg bg-black/60 border border-white/10 hover:bg-black/80 transition-all group"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            <svg 
              className={`w-4 h-4 text-gray-400 group-hover:text-[#ff950e] transition-all ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
