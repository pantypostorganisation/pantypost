// src/components/admin/resolved/ResolvedFilters.tsx
'use client';

import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';
import type { ResolvedFiltersProps } from '@/types/resolved';

export default function ResolvedFilters({
  filters,
  onFiltersChange
}: ResolvedFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ searchTerm: sanitizeSearchQuery(value) });
  };

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400 z-10" size={16} />
          <SecureInput
            type="text"
            placeholder="Search by username or notes..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] transition-all"
            maxLength={100}
            sanitize={true}
            sanitizer={sanitizeSearchQuery}
            aria-label="Search resolved reports"
          />
        </div>

        {/* Filter Type */}
        <select
          value={filters.filterBy}
          onChange={(e) => onFiltersChange({ filterBy: e.target.value as any })}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          aria-label="Filter resolved reports"
        >
          <option value="all">All Reports</option>
          <option value="banned">With Bans</option>
          <option value="nobanned">No Bans</option>
        </select>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            aria-label="Sort resolved reports"
          >
            <option value="date">Sort by Date</option>
            <option value="reporter">Sort by Reporter</option>
            <option value="reportee">Sort by Reportee</option>
          </select>
          <button
            type="button"
            onClick={() => onFiltersChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white hover:bg-[#333] transition-colors"
            aria-label={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            title="Toggle sort order"
          >
            {filters.sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
