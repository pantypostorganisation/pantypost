// src/components/admin/reports/ReportsFilters.tsx
'use client';

import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { ReportsFiltersProps } from './types';

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
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by username or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as any)}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
        >
          <option value="all">All Reports</option>
          <option value="unprocessed">Unprocessed</option>
          <option value="processed">Processed</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
        >
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
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
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 bg-[#222] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
        >
          <option value="date">Date</option>
          <option value="severity">Severity</option>
          <option value="reporter">Reporter</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-3 py-2 bg-[#222] border border-gray-700 rounded-lg text-white hover:bg-[#333] transition-colors"
        >
          {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
}
