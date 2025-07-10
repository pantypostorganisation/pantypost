// src/components/buyers/my-orders/OrderFilters.tsx
'use client';

import React from 'react';
import { Search, Calendar, DollarSign, ArrowUpDown } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: 'all' | 'pending' | 'processing' | 'shipped';
  onFilterStatusChange: (value: 'all' | 'pending' | 'processing' | 'shipped') => void;
  sortBy: 'date' | 'price' | 'status';
  sortOrder: 'asc' | 'desc';
  onToggleSort: (field: 'date' | 'price' | 'status') => void;
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
  const handleSearchChange = (value: string) => {
    // Sanitize search input
    const sanitizedValue = sanitizeSearchQuery(value);
    onSearchChange(sanitizedValue);
  };

  return (
    <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4 z-10" />
          <SecureInput
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent focus:shadow-lg focus:shadow-[#ff950e]/20"
            maxLength={100}
            sanitize={true}
            sanitizer={sanitizeSearchQuery}
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as any)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:shadow-lg focus:shadow-[#ff950e]/20"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
          </select>
          
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
