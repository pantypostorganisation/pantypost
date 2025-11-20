// src/components/admin/bans/AppealsContent.tsx
'use client';

import { MessageSquare, Infinity as InfinityIcon } from 'lucide-react';
import { BanEntry } from '@/types/ban';
import { isValidBan, getBanReasonDisplay } from '@/utils/banUtils';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface AppealsContentProps {
  pendingAppeals: BanEntry[];
  onReviewAppeal: (ban: BanEntry) => void;
  onShowEvidence: (evidence: string[]) => void;
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

const formatRemainingTime = (ban: BanEntry) => {
  if (!ban || typeof ban !== 'object') return 'Unknown';

  if (ban.banType === 'permanent') {
    return (
      <span className="flex items-center gap-1 text-rose-400">
        <InfinityIcon size={14} /> Permanent
      </span>
    );
  }

  if (!ban.remainingHours || ban.remainingHours <= 0) {
    return <span className="text-zinc-500">Expired</span>;
  }

  const hours = Number(ban.remainingHours);
  if (hours < 1) {
    const minutes = Math.ceil(hours * 60);
    return <span className="text-amber-300">{minutes}m remaining</span>;
  }

  if (hours < 24) {
    return <span className="text-amber-400">{Math.ceil(hours)}h remaining</span>;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.ceil(hours % 24);
  return <span className="text-orange-400">{days}d {remainingHours}h remaining</span>;
};

export default function AppealsContent({
  pendingAppeals,
  onReviewAppeal,
  onShowEvidence,
}: AppealsContentProps) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold text-white">Pending Appeals ({pendingAppeals.length})</h2>

      {pendingAppeals.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <MessageSquare size={48} className="mx-auto mb-4 text-zinc-600" />
          <p className="text-lg text-zinc-300">No pending appeals</p>
          <p className="mt-2 text-sm text-zinc-500">
            All appeals have been processed or no appeals have been submitted
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingAppeals
            .map((ban) => {
              if (!isValidBan(ban)) return null;

              // Build a definite string[] for evidence, with runtime filtering
              const evidenceList: string[] = Array.isArray(ban.appealEvidence)
                ? ban.appealEvidence.filter((x): x is string => typeof x === 'string')
                : [];
              const hasEvidence = evidenceList.length > 0;
              const normalizedReason = String(ban.reason || '').toLowerCase();
              const normalizedCustomReason = String(ban.customReason || '').toLowerCase();
              const reasonHighlight = severeReasonKeywords.some((keyword) =>
                normalizedReason.includes(keyword) || normalizedCustomReason.includes(keyword)
              );
              const banTypeChipClass =
                ban.banType === 'permanent'
                  ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border border-amber-500/40 bg-amber-500/10 text-amber-300';

              return (
                <div key={ban.id} className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          <SecureMessageDisplay content={ban.username} allowBasicFormatting={false} />
                        </h3>
                        <span className="inline-flex items-center rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium uppercase text-indigo-300">
                          Appeal {ban.appealStatus || 'Pending'}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase ${banTypeChipClass}`}>
                          {ban.banType}
                        </span>
                      </div>

                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                        <div className="mb-2 flex flex-col gap-2 text-sm text-indigo-300 sm:flex-row sm:items-center sm:justify-between">
                          <div className="font-medium uppercase tracking-wide">Appeal Message</div>

                          {hasEvidence && (
                            <button
                              onClick={() => onShowEvidence(evidenceList)}
                              className="inline-flex items-center gap-2 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                            >
                              <span className="h-2 w-2 rounded-full bg-indigo-300" />
                              {evidenceList.length} Evidence File{evidenceList.length !== 1 ? 's' : ''}
                            </button>
                          )}
                        </div>

                        <div className="text-sm text-zinc-200">
                          <SecureMessageDisplay
                            content={ban.appealText || 'No appeal text provided'}
                            allowBasicFormatting={false}
                            maxLength={500}
                          />
                        </div>

                        <div className="text-xs text-zinc-500">
                          Submitted:{' '}
                          {ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown'}
                        </div>
                      </div>

                      <div className="text-sm text-zinc-400">
                        <span className="font-medium text-zinc-500">Original Ban Reason</span>
                        <span className={`ml-2 ${reasonHighlight ? 'text-rose-400' : 'text-zinc-200'}`}>
                          {getBanReasonDisplay(ban.reason, ban.customReason)}
                        </span>
                      </div>

                      <div className="text-sm text-zinc-400">
                        <span className="font-medium text-zinc-500">Duration</span>
                        <span className="ml-2 text-zinc-200">
                          {ban.banType === 'permanent' ? 'Permanent' : formatRemainingTime(ban)}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 text-xs font-medium md:w-auto md:items-end">
                      <button
                        onClick={() => onReviewAppeal(ban)}
                        className="inline-flex items-center gap-2 rounded-md border border-indigo-500/40 bg-zinc-900 px-4 py-2 text-indigo-300 transition-all duration-150 hover:bg-zinc-800"
                      >
                        <MessageSquare size={14} />
                        Review Appeal
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      )}
    </div>
  );
}
