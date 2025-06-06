'use client';

import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { FilterOptions } from '@/types/ban';

interface BanFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  showTypeFilter?: boolean;
  isVisible?: boolean;
}

export default function BanFilters({ 
  filters, 
  onFiltersChange, 
  showTypeFilter = true,
  isVisible = true 
}: BanFiltersProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by username or reason..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] transition-all"
          />
        </div>

        {/* Type Filter */}
        {showTypeFilter && (
          <select
            value={filters.filterBy}
            onChange={(e) => onFiltersChange({ filterBy: e.target.value as any })}
            className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          >
            <option value="all">All Types</option>
            <option value="temporary">Temporary</option>
            <option value="permanent">Permanent</option>
          </select>
        )}

        {/* Sort Options */}
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          >
            <option value="date">Sort by Date</option>
            <option value="username">Sort by Username</option>
            <option value="duration">Sort by Duration</option>
          </select>
          <button
            onClick={() => onFiltersChange({ 
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
            className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white hover:bg-[#333] transition-colors"
          >
            {filters.sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}