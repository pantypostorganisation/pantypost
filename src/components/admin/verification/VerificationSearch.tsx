// src/components/admin/verification/VerificationSearch.tsx
'use client';

import { useCallback, useMemo } from 'react';
import { Search, UserCheck } from 'lucide-react';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';
import type { VerificationSearchProps } from '@/types/verification';

export default function VerificationSearch({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  pendingCount
}: VerificationSearchProps) {
  const handleSearchChange = useCallback((value: string) => {
    onSearchChange(sanitizeSearchQuery(value));
  }, [onSearchChange]);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value as 'newest' | 'oldest' | 'alphabetical';
      onSortChange(v);
    },
    [onSortChange]
  );

  // prevent negative / NaN
  const safePending = useMemo(() => {
    const n = Number(pendingCount);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [pendingCount]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 text-gray-500 w-4 h-4 z-10" aria-hidden="true" />
          <SecureInput
            type="text"
            placeholder="Search username..."
            aria-label="Search username"
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-[#121212] border border-[#2a2a2a] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
            maxLength={100}
            sanitize={true}
            sanitizer={sanitizeSearchQuery}
          />
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#ff950e] flex items-center">
            <UserCheck className="mr-2 h-6 w-6" aria-hidden="true" />
            Pending Verifications
            <span
              className="ml-3 text-sm bg-[#1f1f1f] text-gray-300 rounded-full px-3 py-1 font-normal"
              aria-label={`${safePending} ${safePending === 1 ? 'request' : 'requests'}`}
            >
              {safePending} {safePending === 1 ? 'request' : 'requests'}
            </span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Review and validate seller identity documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="verification-sort" className="text-gray-400 text-sm">
            Sort by:
          </label>
          <select
            id="verification-sort"
            value={sortBy}
            onChange={handleSortChange}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e] cursor-pointer"
            aria-label="Sort pending verifications"
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
