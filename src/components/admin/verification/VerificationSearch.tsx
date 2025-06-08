// src/components/admin/verification/VerificationSearch.tsx
'use client';

import { Search, UserCheck } from 'lucide-react';
import type { VerificationSearchProps } from '@/types/verification';

export default function VerificationSearch({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  pendingCount
}: VerificationSearchProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search username..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
          />
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#ff950e] flex items-center">
            <UserCheck className="mr-2 h-6 w-6" />
            Pending Verifications
            <span className="ml-3 text-sm bg-[#1f1f1f] text-gray-300 rounded-full px-3 py-1 font-normal">
              {pendingCount} {pendingCount === 1 ? 'request' : 'requests'}
            </span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Review and validate seller identity documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>
    </div>
  );
}
