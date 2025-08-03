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
    <div className="bg-gray-800/50 rounded-2xl p-5 mb-8 border border-[#ff950e]/40">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4 group-focus-within:text-[#ff950e] transition-colors duration-300" />
            <input
              type="text"
              placeholder="Search orders..."
              className="w-full pl-11 pr-4 py-3 bg-black/30 border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#ff950e]/50 focus:bg-black/50 focus:outline-none focus:placeholder-gray-500 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Filters Group */}
        <div className="flex gap-2">
          {/* Status Filter - Sleek Dropdown */}
          <select
            className="px-4 py-3 bg-black/30 border border-gray-800/50 rounded-xl text-gray-300 focus:text-white focus:border-[#ff950e]/50 focus:outline-none transition-all duration-300 cursor-pointer hover:bg-black/50"
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'pending' | 'processing' | 'shipped')}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
          </select>
          
          {/* Sort Options - Minimal Style */}
          <div className="flex bg-black/30 rounded-xl p-1 border border-gray-800/50">
            <button
              onClick={() => onToggleSort('date')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                sortBy === 'date' 
                  ? 'bg-[#ff950e] text-black shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Date</span>
            </button>
            
            <button
              onClick={() => onToggleSort('price')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                sortBy === 'price' 
                  ? 'bg-[#ff950e] text-black shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Price</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}