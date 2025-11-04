// src/components/admin/bans/BanCard.tsx
'use client';

import { Eye, MessageSquare, UserCheck, Infinity as InfinityIcon } from 'lucide-react';
import { BanEntry } from '@/types/ban';
import { getBanReasonDisplay } from '@/utils/banUtils';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface BanCardProps {
  ban: BanEntry;
  isExpanded: boolean;
  onToggleExpand: (banId: string) => void;
  onUnban: (ban: BanEntry) => void;
  onReviewAppeal: (ban: BanEntry) => void;
  onShowEvidence: (evidence: string[]) => void;
}

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

export default function BanCard({
  ban,
  isExpanded,
  onToggleExpand,
  onUnban,
  onReviewAppeal,
  onShowEvidence,
}: BanCardProps) {
  // Build a definite evidence list (no non-null assertions)
  const evidenceList: string[] = Array.isArray(ban.appealEvidence)
    ? ban.appealEvidence.filter((x): x is string => typeof x === 'string')
    : [];
  const hasEvidence = evidenceList.length > 0;

  const reasonDisplay = getBanReasonDisplay(ban.reason, ban.customReason);
  const normalizedReason = String(ban.reason || '').toLowerCase();
  const normalizedCustomReason = String(ban.customReason || '').toLowerCase();
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
  const isSevereReason = severeReasonKeywords.some((keyword) =>
    normalizedReason.includes(keyword) || normalizedCustomReason.includes(keyword)
  );
  const reasonTextClass = isSevereReason ? 'text-rose-400' : 'text-zinc-200';
  const banTypeChipClass =
    ban.banType === 'permanent'
      ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
      : 'border border-amber-500/40 bg-amber-500/10 text-amber-300';

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 transition-colors hover:border-zinc-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              <SecureMessageDisplay content={ban.username} allowBasicFormatting={false} />
            </h3>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase ${banTypeChipClass}`}>
              {ban.banType}
            </span>
            {ban.appealSubmitted && (
              <span className="inline-flex items-center rounded-full border border-indigo-500/40 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300">
                Appeal {ban.appealStatus ?? 'Pending'}
              </span>
            )}
          </div>

          <div className="text-sm text-zinc-400">
            <span className="font-medium text-zinc-500">Reason</span>
            <span className={`ml-2 ${reasonTextClass}`}>{reasonDisplay}</span>
          </div>

          <div className="text-sm text-zinc-400">
            <span className="font-medium text-zinc-500">Duration</span>
            <span className="ml-2">{formatRemainingTime(ban)}</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 text-xs font-medium md:w-auto md:items-end">
          <button
            onClick={() => onToggleExpand(ban.id)}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-zinc-200 transition-all duration-150 hover:bg-zinc-800"
          >
            <Eye size={12} />
            {isExpanded ? 'Hide' : 'Details'}
          </button>

          {ban.appealSubmitted && ban.appealStatus === 'pending' && (
            <button
              onClick={() => onReviewAppeal(ban)}
              className="inline-flex items-center gap-1 rounded-md border border-indigo-500/40 bg-zinc-900 px-3 py-1.5 text-indigo-300 transition-all duration-150 hover:bg-zinc-800"
            >
              <MessageSquare size={12} />
              Review Appeal
            </button>
          )}

          <button
            onClick={() => onUnban(ban)}
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-zinc-900 px-3 py-1.5 text-emerald-400 transition-all duration-150 hover:bg-zinc-800"
          >
            <UserCheck size={12} />
            Unban
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-zinc-800/80 pt-4">
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Start Time</span>
              <div className="mt-1 text-zinc-200">{new Date(ban.startTime).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Banned By</span>
              <div className="mt-1 text-zinc-400">
                <SecureMessageDisplay content={ban.bannedBy ?? 'Unknown'} allowBasicFormatting={false} />
              </div>
            </div>
            {ban.endTime && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">End Time</span>
                <div className="mt-1 text-zinc-200">{new Date(ban.endTime).toLocaleString()}</div>
              </div>
            )}
            {ban.notes && (
              <div className="md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</span>
                <div className="mt-1 text-zinc-300">
                  <SecureMessageDisplay content={ban.notes} allowBasicFormatting={false} maxLength={500} />
                </div>
              </div>
            )}
          </div>

          {ban.appealSubmitted && (
            <div className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-indigo-300">Appeal Submitted</div>

                {hasEvidence && (
                  <button
                    onClick={() => onShowEvidence(evidenceList)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    <span className="h-2 w-2 rounded-full bg-indigo-300" />
                    {evidenceList.length} Evidence
                  </button>
                )}
              </div>

              <div className="text-sm text-zinc-200">
                <SecureMessageDisplay
                  content={ban.appealText ?? 'No appeal text provided'}
                  allowBasicFormatting={false}
                  maxLength={500}
                />
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown date'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
