'use client';

import { useCallback } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { ReportsFiltersProps } from './types';
import { SecureInput } from '@/components/ui/SecureInput';

const FILTER_STATES = ['all', 'unprocessed', 'processed'] as const;
type FilterState = typeof FILTER_STATES[number];

const SEVERITIES = ['all', 'low', 'medium', 'high', 'critical'] as const;
type Severity = typeof SEVERITIES[number];

const CATEGORIES = ['all', 'harassment', 'spam', 'inappropriate_content', 'scam', 'other'] as const;
type Category = typeof CATEGORIES[number];

const SORT_BY = ['date', 'severity', 'reporter'] as const;
type SortBy = typeof SORT_BY[number];

export default function ReportsFilters({
  searchTerm,
  setSearchTerm,
  filterBy,
  setFilterBy,
  severityFilter,
  setSeverityFilter,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder
}: ReportsFiltersProps) {
  const onFilterChange = useCallback(
    (value: string) => {
      const v = value.toLowerCase();
      if ((FILTER_STATES as readonly string[]).includes(v)) {
        setFilterBy(v as FilterState);
      }
    },
    [setFilterBy]
  );

  const onSeverityChange = useCallback(
    (value: string) => {
      const v = value.toLowerCase();
      if ((SEVERITIES as readonly string[]).includes(v)) {
        setSeverityFilter(v as Severity);
      }
    },
    [setSeverityFilter]
  );

  const onCategoryChange = useCallback(
    (value: string) => {
      const v = value.toLowerCase();
      if ((CATEGORIES as readonly string[]).includes(v)) {
        setCategoryFilter(v as Category);
      }
    },
    [setCategoryFilter]
  );

  const onSortByChange = useCallback(
    (value: string) => {
      const v = value.toLowerCase();
      if ((SORT_BY as readonly string[]).includes(v)) {
        setSortBy(v as SortBy);
      }
    },
    [setSortBy]
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [setSortOrder, sortOrder]);

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} aria-hidden />
          <SecureInput
            type="text"
            placeholder="Search by username or notes..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] transition-all"
            maxLength={100}
            aria-label="Search reports"
          />
        </div>

        {/* Status Filter */}
        <select
          value={(FILTER_STATES as readonly string[]).includes(filterBy as any) ? filterBy : 'all'}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          aria-label="Filter by status"
        >
          <option value="all">All Reports</option>
          <option value="unprocessed">Unprocessed</option>
          <option value="processed">Processed</option>
        </select>

        {/* Severity Filter */}
        <select
          value={(SEVERITIES as readonly string[]).includes(severityFilter as any) ? severityFilter : 'all'}
          onChange={(e) => onSeverityChange(e.target.value)}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          aria-label="Filter by severity"
        >
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {/* Category Filter */}
        <select
          value={(CATEGORIES as readonly string[]).includes(categoryFilter as any) ? categoryFilter : 'all'}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          <option value="harassment">Harassment</option>
          <option value="spam">Spam</option>
          <option value="inappropriate_content">Inappropriate Content</option>
          <option value="scam">Scam</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-3 mt-4">
        <span className="text-sm text-gray-400">Sort by:</span>
        <select
          value={(SORT_BY as readonly string[]).includes(sortBy as any) ? sortBy : 'date'}
          onChange={(e) => onSortByChange(e.target.value)}
          className="px-3 py-1.5 bg-[#222] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
          aria-label="Sort reports by"
        >
          <option value="date">Date</option>
          <option value="severity">Severity</option>
          <option value="reporter">Reporter</option>
        </select>
        <button
          type="button"
          onClick={toggleSortOrder}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white hover:bg-[#333] transition-colors"
          aria-label={`Change sort order (currently ${sortOrder})`}
        >
          {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}
