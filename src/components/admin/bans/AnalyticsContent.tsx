// src/components/admin/bans/AnalyticsContent.tsx
'use client';

import React, { useMemo } from 'react';
import { BarChart3, MessageSquare } from 'lucide-react';
import { BanStats } from '@/types/ban';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface AnalyticsContentProps {
  banStats: BanStats;
}

// Valid ban reasons for validation / bucketing
const VALID_BAN_REASONS = [
  'harassment',
  'inappropriate_content',
  'spam',
  'fake_profile',
  'scamming',
  'underage',
  'ban_evasion',
  'other',
] as const;

const VALID_SET = new Set<string>(VALID_BAN_REASONS as unknown as string[]);

// Format reason for display with sanitization
const formatReasonForDisplay = (reason: string): string => {
  const sanitizedReason = sanitizeStrict(reason);
  return sanitizedReason
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Safely calculate percentage
const calculatePercentage = (count: number, total: number): number => {
  if (total <= 0 || !Number.isFinite(total)) return 0;
  if (count < 0 || !Number.isFinite(count)) return 0;

  const percentage = (count / total) * 100;
  return Math.min(100, Math.max(0, percentage)); // Clamp 0–100
};

export default function AnalyticsContent({ banStats }: AnalyticsContentProps) {
  // Sanitize & bucket ban reasons (unknown -> 'other'), memoized
  const sanitizedBansByReason = useMemo(() => {
    const raw = Object.entries(banStats?.bansByReason || {});
    const acc: Record<string, number> = {};

    for (const [reason, count] of raw) {
      const normalized = sanitizeStrict(String(reason)).toLowerCase();
      const bucket = VALID_SET.has(normalized) ? normalized : 'other';
      const safeCount = sanitizeNumber(Number(count) || 0, 0, 999_999, 0);
      acc[bucket] = (acc[bucket] || 0) + safeCount;
    }

    // Optionally drop zero-count buckets
    Object.keys(acc).forEach((k) => {
      if (!acc[k]) delete acc[k];
    });

    return acc;
  }, [banStats]);

  // Total bans (memoized)
  const total = useMemo(
    () =>
      Object.values(sanitizedBansByReason).reduce((sum, val) => {
        const num = Number(val);
        return sum + (Number.isFinite(num) ? num : 0);
      }, 0),
    [sanitizedBansByReason]
  );

  // Sanitize appeal stats with consistency check (memoized)
  const sanitizedAppealStats = useMemo(() => {
    const stats = {
      totalAppeals: sanitizeNumber(banStats?.appealStats?.totalAppeals || 0, 0, 999_999, 0),
      pendingAppeals: sanitizeNumber(banStats?.appealStats?.pendingAppeals || 0, 0, 999_999, 0),
      approvedAppeals: sanitizeNumber(banStats?.appealStats?.approvedAppeals || 0, 0, 999_999, 0),
      rejectedAppeals: sanitizeNumber(banStats?.appealStats?.rejectedAppeals || 0, 0, 999_999, 0),
    };

    const sum = stats.pendingAppeals + stats.approvedAppeals + stats.rejectedAppeals;
    if (sum > stats.totalAppeals) {
      stats.totalAppeals = sum; // keep totals consistent if inputs drift
    }
    return stats;
  }, [banStats]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">Ban Analytics</h2>

      {/* Ban Reasons Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <BarChart3 size={20} className="text-indigo-400" />
          Ban Reasons Distribution
        </h3>
        <div className="space-y-3">
          {Object.keys(sanitizedBansByReason).length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500">No ban data available</p>
          ) : (
            Object.entries(sanitizedBansByReason)
              .sort(([, a], [, b]) => b - a) // Sort by count desc
              .map(([reason, count]) => {
                const percentage = calculatePercentage(count, total);
                return (
                  <div key={reason}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-zinc-200">
                        <SecureMessageDisplay
                          content={formatReasonForDisplay(reason)}
                          allowBasicFormatting={false}
                        />
                      </span>
                      <span className="text-sm text-zinc-400">
                        {count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full border border-zinc-800 bg-zinc-900">
                      <div
                        className="h-2 rounded-full bg-[#ff950e] transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={Number.isFinite(percentage) ? Math.round(percentage) : 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Appeal Statistics */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <MessageSquare size={20} className="text-orange-400" />
          Appeal Processing
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-indigo-300">
              {sanitizedAppealStats.totalAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">Total Appeals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-amber-300">
              {sanitizedAppealStats.pendingAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-emerald-300">
              {sanitizedAppealStats.approvedAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-rose-300">
              {sanitizedAppealStats.rejectedAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-500">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  );
}
