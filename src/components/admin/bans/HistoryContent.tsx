// src/components/admin/bans/HistoryContent.tsx
'use client';

import { FileText } from 'lucide-react';
import { BanHistoryEntry, FilterOptions } from '@/types/ban';
import { sanitizeSearchQuery } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface HistoryContentProps {
  banHistory: BanHistoryEntry[];
  filters: FilterOptions;
}

export default function HistoryContent({ banHistory, filters }: HistoryContentProps) {
  const sanitizedSearchTerm = filters.searchTerm ? sanitizeSearchQuery(filters.searchTerm).toLowerCase() : '';

  const filteredHistory = (banHistory || [])
    .filter((entry) => {
      if (!entry || !entry.username) return false;
      return sanitizedSearchTerm
        ? entry.username.toLowerCase().includes(sanitizedSearchTerm) ||
            (entry.details && entry.details.toLowerCase().includes(sanitizedSearchTerm))
        : true;
    })
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 50);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-white">Ban History ({(banHistory || []).length})</h2>
      {filteredHistory.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-zinc-600" />
          <p className="text-lg text-zinc-300">No ban history found</p>
          <p className="mt-2 text-sm text-zinc-500">Ban actions will appear here as they occur</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHistory
            .map((entry) => {
              if (!entry || !entry.id) return null;

              const chipClasses: Record<string, string> = {
                banned: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
                unbanned: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                appeal_submitted: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
                appeal_approved: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
                appeal_rejected: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
              };
              const actionClass = chipClasses[entry.action as keyof typeof chipClasses] ?? 'border-zinc-700/60 bg-zinc-900 text-zinc-300';

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 transition-colors hover:border-zinc-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="font-medium text-white">
                          <SecureMessageDisplay content={entry.username || 'Unknown'} allowBasicFormatting={false} />
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium uppercase ${actionClass}`}>
                          {(entry.action || 'unknown').replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="mb-2 text-sm text-zinc-200">
                        <SecureMessageDisplay content={entry.details || 'No details available'} allowBasicFormatting={false} maxLength={200} />
                      </div>
                      <div className="text-xs text-zinc-500">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time'} by{' '}
                        <SecureMessageDisplay content={entry.adminUsername || 'Unknown admin'} allowBasicFormatting={false} className="inline" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            .filter((entry) => entry !== null)}
        </div>
      )}
    </div>
  );
}
