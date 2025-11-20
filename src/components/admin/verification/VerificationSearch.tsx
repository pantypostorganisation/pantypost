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
    <section className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="rounded-2xl border border-white/5 bg-black/40 px-6 py-6 shadow-[0_18px_36px_-28px_rgba(0,0,0,0.8)] md:px-8 md:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
              <SecureInput
                type="text"
                placeholder="Search by username"
                aria-label="Search username"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-xl border border-white/10 bg-black/60 py-3 pl-11 pr-4 text-sm text-gray-100 placeholder:text-white/35 focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40 transition"
                maxLength={100}
                sanitize={true}
                sanitizer={sanitizeSearchQuery}
              />
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 text-left sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
              <UserCheck className="h-4 w-4 text-[#ff950e]" aria-hidden="true" />
              {safePending} {safePending === 1 ? 'Request' : 'Requests'}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="verification-sort" className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                Sort
              </label>
              <select
                id="verification-sort"
                value={sortBy}
                onChange={handleSortChange}
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white/80 transition focus:border-[#ff950e] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
                aria-label="Sort pending verifications"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm text-white/50">
          Review and validate documentation quickly. Use search and sorting to prioritise the requests that need your attention first.
        </p>
      </div>
    </section>
  );
}
