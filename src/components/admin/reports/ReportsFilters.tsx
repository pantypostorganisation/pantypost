// src/components/admin/reports/ReportsFilters.tsx
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
    <div className="mb-8 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {/* Search */}
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} aria-hidden />
          <SecureInput
            type="text"
            placeholder="Search by username or notes..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
            maxLength={100}
            aria-label="Search reports"
          />
        </div>

        {/* Status Filter */}
        <select
          value={(FILTER_STATES as readonly string[]).includes(filterBy as any) ? filterBy : 'all'}
          onChange={(e) => onFilterChange(e.target.value)}
          className="h-full w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
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
          className="h-full w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
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
          className="h-full w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
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
      <div className="mt-5 flex flex-col gap-3 border-t border-zinc-900 pt-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-zinc-300">Sort</span>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={(SORT_BY as readonly string[]).includes(sortBy as any) ? sortBy : 'date'}
            onChange={(e) => onSortByChange(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
            aria-label="Sort reports by"
          >
            <option value="date">Date</option>
            <option value="severity">Severity</option>
            <option value="reporter">Reporter</option>
          </select>
          <button
            type="button"
            onClick={toggleSortOrder}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white"
            aria-label={`Change sort order (currently ${sortOrder})`}
          >
            {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
