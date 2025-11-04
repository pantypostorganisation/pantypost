// src/components/admin/bans/BanFilters.tsx
'use client';

import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';
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

  const handleSearchChange = (value: string) => {
    // Sanitize search input
    const sanitizedValue = sanitizeSearchQuery(value);
    onFiltersChange({ searchTerm: sanitizedValue });
  };

  return (
    <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 z-10 text-zinc-500" size={16} />
          <SecureInput
            type="text"
            placeholder="Search by username or reason..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#ff950e] focus:outline-none focus:ring-0"
            maxLength={100}
            sanitize={true}
            sanitizer={sanitizeSearchQuery}
          />
        </div>

        {/* Type Filter */}
        {showTypeFilter && (
          <select
            value={filters.filterBy}
            onChange={(e) => onFiltersChange({ filterBy: e.target.value as any })}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-0"
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
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-0"
          >
            <option value="date">Sort by Date</option>
            <option value="username">Sort by Username</option>
            <option value="duration">Sort by Duration</option>
          </select>
          <button
            onClick={() => onFiltersChange({
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
            })}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition-colors hover:bg-zinc-800"
          >
            {filters.sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
