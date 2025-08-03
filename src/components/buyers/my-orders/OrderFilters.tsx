// src/components/buyers/my-orders/OrderFilters.tsx
'use client';

import React from 'react';
import { Search, Calendar, DollarSign, ArrowUpDown } from 'lucide-react';

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
    <div className="bg-[#1a1a1a] rounded-xl p-6 mb-8 border border-gray-800">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e] transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Status Filter */}
        <select
          className="px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e] transition-all min-w-[150px]"
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'pending' | 'processing' | 'shipped')}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
        </select>
        
        {/* Sort Options */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleSort('date')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              sortBy === 'date' ? 'bg-[#ff950e] text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Date
            <ArrowUpDown className="w-3 h-3" />
          </button>
          
          <button
            onClick={() => onToggleSort('price')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              sortBy === 'price' ? 'bg-[#ff950e] text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Price
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}