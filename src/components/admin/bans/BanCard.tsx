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
      <span className="flex items-center gap-1 text-red-400">
        <InfinityIcon size={14} /> Permanent
      </span>
    );
  }

  if (!ban.remainingHours || ban.remainingHours <= 0) {
    return <span className="text-gray-500">Expired</span>;
  }

  const hours = Number(ban.remainingHours);
  if (hours < 1) {
    const minutes = Math.ceil(hours * 60);
    return <span className="text-yellow-400">{minutes}m remaining</span>;
  }

  if (hours < 24) {
    return <span className="text-orange-400">{Math.ceil(hours)}h remaining</span>;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.ceil(hours % 24);
  return <span className="text-red-400">{days}d {remainingHours}h remaining</span>;
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

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">
              <SecureMessageDisplay content={ban.username} allowBasicFormatting={false} />
            </h3>
            <span
              className={`px-2 py-1 text-xs rounded font-medium ${
                ban.banType === 'permanent'
                  ? 'bg-red-900/20 text-red-400'
                  : 'bg-orange-900/20 text-orange-400'
              }`}
            >
              {ban.banType}
            </span>
            {ban.appealSubmitted && (
              <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded font-medium">
                Appeal {ban.appealStatus ?? 'Pending'}
              </span>
            )}
          </div>

          <div className="text-sm text-gray-400 mb-2">
            <span>Reason: </span>
            <span className="text-gray-300">
              {getBanReasonDisplay(ban.reason, ban.customReason)}
            </span>
          </div>

          <div className="text-sm text-gray-400">
            <span>Duration: </span>
            {formatRemainingTime(ban)}
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={() => onToggleExpand(ban.id)}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center transition-colors"
          >
            <Eye size={12} className="mr-1" />
            {isExpanded ? 'Less' : 'More'}
          </button>

          {ban.appealSubmitted && ban.appealStatus === 'pending' && (
            <button
              onClick={() => onReviewAppeal(ban)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center transition-colors"
            >
              <MessageSquare size={12} className="mr-1" />
              Review
            </button>
          )}

          <button
            onClick={() => onUnban(ban)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center transition-colors"
          >
            <UserCheck size={12} className="mr-1" />
            Unban
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Start Time:</span>
              <div className="text-gray-300">{new Date(ban.startTime).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-400">Banned By:</span>
              <div className="text-gray-300">
                <SecureMessageDisplay content={ban.bannedBy ?? 'Unknown'} allowBasicFormatting={false} />
              </div>
            </div>
            {ban.endTime && (
              <div>
                <span className="text-gray-400">End Time:</span>
                <div className="text-gray-300">{new Date(ban.endTime).toLocaleString()}</div>
              </div>
            )}
            {ban.notes && (
              <div className="col-span-2">
                <span className="text-gray-400">Notes:</span>
                <div className="text-gray-300 mt-1">
                  <SecureMessageDisplay content={ban.notes} allowBasicFormatting={false} maxLength={500} />
                </div>
              </div>
            )}
          </div>

          {ban.appealSubmitted && (
            <div className="mt-4 p-3 bg-blue-900/10 border border-blue-800 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-blue-400 font-medium">Appeal Submitted</div>

                {hasEvidence && (
                  <button
                    onClick={() => onShowEvidence(evidenceList)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                  >
                    <span className="w-2 h-2 bg-blue-400 rounded"></span>
                    {evidenceList.length} Evidence
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-300">
                <SecureMessageDisplay
                  content={ban.appealText ?? 'No appeal text provided'}
                  allowBasicFormatting={false}
                  maxLength={500}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown date'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
