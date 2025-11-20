// src/components/admin/bans/BanStatsDashboard.tsx
'use client';

import { BanStats } from '@/types/ban';

interface BanStatsDashboardProps {
  banStats: BanStats;
}

export default function BanStatsDashboard({ banStats }: BanStatsDashboardProps) {
  const safeNumber = (value: unknown): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };

  const {
    totalActiveBans,
    temporaryBans,
    permanentBans,
    pendingAppeals,
    recentBans24h,
    appealStats,
  } = banStats || ({} as BanStats);

  const cards: Array<{
    label: string;
    value: number;
    valueClass: string;
    labelClass: string;
    borderClass?: string;
  }> = [
    {
      label: 'Active Bans',
      value: safeNumber(totalActiveBans),
      valueClass: 'text-red-400',
      labelClass: 'text-red-300/80',
      borderClass: 'border-red-500/30 hover:border-red-400/60',
    },
    {
      label: 'Temporary',
      value: safeNumber(temporaryBans),
      valueClass: 'text-amber-400',
      labelClass: 'text-amber-300/80',
      borderClass: 'border-amber-500/30 hover:border-amber-400/60',
    },
    {
      label: 'Permanent',
      value: safeNumber(permanentBans),
      valueClass: 'text-rose-400',
      labelClass: 'text-rose-300/80',
      borderClass: 'border-rose-500/30 hover:border-rose-400/60',
    },
    {
      label: 'Appeals',
      value: safeNumber(pendingAppeals),
      valueClass: 'text-purple-400',
      labelClass: 'text-purple-300/80',
      borderClass: 'border-purple-500/30 hover:border-purple-400/60',
    },
    {
      label: '24h Bans',
      value: safeNumber(recentBans24h),
      valueClass: 'text-yellow-300',
      labelClass: 'text-yellow-200/80',
      borderClass: 'border-yellow-400/30 hover:border-yellow-300/60',
    },
    {
      label: 'Approved',
      value: safeNumber(appealStats?.approvedAppeals),
      valueClass: 'text-emerald-400',
      labelClass: 'text-emerald-300/80',
      borderClass: 'border-emerald-500/30 hover:border-emerald-400/60',
    },
  ];

  return (
    <div
      className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      role="group"
      aria-label="Ban statistics overview"
    >
      {cards.map(({ label, value, valueClass, labelClass, borderClass }) => (
        <div
          key={label}
          className={`rounded-xl border bg-zinc-950/80 px-4 py-3 text-left transition-colors ${
            borderClass ?? 'border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className={`text-2xl font-semibold ${valueClass}`}>{value}</div>
          <div className={`mt-1 text-xs font-medium uppercase tracking-wide ${labelClass}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
