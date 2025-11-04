// src/components/admin/bans/ExpiredBansContent.tsx
'use client';

import { Clock } from 'lucide-react';
import { BanEntry, FilterOptions } from '@/types/ban';
import { isValidBan, getBanReasonDisplay } from '@/utils/banUtils';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface ExpiredBansContentProps {
  expiredBans: BanEntry[];
  filters: FilterOptions;
}

const severeReasonKeywords = [
  'harassment',
  'abuse',
  'scam',
  'scamming',
  'fraud',
  'payment_fraud',
  'extortion',
  'threat',
  'dox',
  'hate',
];

const filterAndSortBans = (bans: BanEntry[], filters: FilterOptions): BanEntry[] => {
  if (!Array.isArray(bans)) return [];

  const sanitizedSearchTerm = filters.searchTerm ? sanitizeSearchQuery(filters.searchTerm).toLowerCase() : '';
  const sortOrder = (filters.sortOrder === 'asc' || filters.sortOrder === 'desc') ? filters.sortOrder : 'desc';
  const filterBy = ['all', 'temporary', 'permanent'].includes(filters.filterBy as string) ? filters.filterBy : 'all';

  const filtered = bans.filter((ban) => {
    if (!isValidBan(ban)) return false;

    const matchesSearch = sanitizedSearchTerm
      ? ban.username.toLowerCase().includes(sanitizedSearchTerm) ||
        (ban.reason && ban.reason.toLowerCase().includes(sanitizedSearchTerm)) ||
        (ban.customReason && ban.customReason.toLowerCase().includes(sanitizedSearchTerm))
      : true;

    const matchesFilter =
      filterBy === 'all' ? true : filterBy === 'temporary' ? ban.banType === 'temporary' : ban.banType === 'permanent';

    return matchesSearch && matchesFilter;
  });

  filtered.sort((a, b) => {
    const comparison = new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime();
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
};

export default function ExpiredBansContent({ expiredBans, filters }: ExpiredBansContentProps) {
  const filteredBans = filterAndSortBans(expiredBans || [], filters);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-white">Expired Bans ({(expiredBans || []).length})</h2>
      {filteredBans.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <Clock size={48} className="mx-auto mb-4 text-zinc-600" />
          <p className="text-lg text-zinc-300">No expired bans found</p>
          {filters.searchTerm && (
            <p className="mt-2 text-sm text-zinc-500">Try adjusting your search terms or filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBans
            .map((ban) => {
              if (!isValidBan(ban)) return null;

              const hours =
                ban.banType === 'permanent' || !ban.endTime || !ban.startTime
                  ? null
                  : Math.ceil((new Date(ban.endTime).getTime() - new Date(ban.startTime).getTime()) / (1000 * 60 * 60));

              const normalizedReason = String(ban.reason || '').toLowerCase();
              const normalizedCustomReason = String(ban.customReason || '').toLowerCase();
              const reasonHighlight = severeReasonKeywords.some((keyword) =>
                normalizedReason.includes(keyword) || normalizedCustomReason.includes(keyword)
              );

              return (
                <div key={ban.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          <SecureMessageDisplay content={ban.username} allowBasicFormatting={false} />
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-900 px-2.5 py-1 text-xs font-medium uppercase text-zinc-400">
                          Expired
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm text-zinc-400 md:grid-cols-2">
                        <div>
                          <span className="font-medium text-zinc-500">Reason</span>
                          <span className={`ml-2 ${reasonHighlight ? 'text-rose-400' : 'text-zinc-200'}`}>
                            {getBanReasonDisplay(ban.reason, ban.customReason)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-zinc-500">Duration</span>
                          <span className="ml-2 text-zinc-200">
                            {ban.banType === 'permanent' ? 'Permanent' : hours !== null ? `${hours} hours` : 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-zinc-500">Start</span>
                          <span className="ml-2 text-zinc-200">{ban.startTime ? new Date(ban.startTime).toLocaleString() : 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-zinc-500">End</span>
                          <span className="ml-2 text-zinc-200">{ban.endTime ? new Date(ban.endTime).toLocaleString() : 'Manually lifted'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            .filter((ban) => ban !== null)}
        </div>
      )}
    </div>
  );
}
