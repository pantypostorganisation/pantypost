// src/components/admin/reports/ReportsStats.tsx
'use client';

import { ReportsStatsProps } from './types';

export default function ReportsStats({ reportStats }: ReportsStatsProps) {
  // Ensure all values are valid numbers
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };

  const totals = {
    total: safeNumber(reportStats?.total),
    unprocessed: safeNumber(reportStats?.unprocessed),
    critical: safeNumber(reportStats?.critical),
    today: safeNumber(reportStats?.today),
    processed: safeNumber(reportStats?.processed),
    withBans: safeNumber(reportStats?.withBans),
  };

  const cards: Array<{
    label: string;
    value: number;
    valueClass?: string;
    labelClass?: string;
    borderClass?: string;
  }> = [
    {
      label: 'Total Reports',
      value: totals.total,
      valueClass: 'text-slate-100',
      labelClass: 'text-zinc-400',
      borderClass: 'border-zinc-800/80 hover:border-zinc-700',
    },
    {
      label: 'Pending',
      value: totals.unprocessed,
      valueClass: 'text-[#ff950e]',
      labelClass: 'text-[#ff950e]/80',
      borderClass: 'border-[#ff950e]/30 hover:border-[#ff950e]/60',
    },
    {
      label: 'Critical',
      value: totals.critical,
      valueClass: 'text-red-400',
      labelClass: 'text-red-300/80',
      borderClass: 'border-red-500/30 hover:border-red-400/60',
    },
    {
      label: 'Today',
      value: totals.today,
      valueClass: 'text-indigo-400',
      labelClass: 'text-indigo-300/80',
      borderClass: 'border-indigo-500/30 hover:border-indigo-400/60',
    },
    {
      label: 'Processed',
      value: totals.processed,
      valueClass: 'text-emerald-400',
      labelClass: 'text-emerald-300/80',
      borderClass: 'border-emerald-500/30 hover:border-emerald-400/60',
    },
    {
      label: 'Resulted in Bans',
      value: totals.withBans,
      valueClass: 'text-rose-400',
      labelClass: 'text-rose-300/80',
      borderClass: 'border-rose-500/30 hover:border-rose-400/60',
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, valueClass, labelClass, borderClass }) => (
        <div
          key={label}
          className={`rounded-xl border bg-zinc-950/80 px-4 py-3 text-left shadow-none transition-colors ${
            borderClass ?? 'border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div
            className={`text-2xl font-semibold tracking-tight ${valueClass ?? 'text-white'}`}
          >
            {value}
          </div>
          <div
            className={`mt-1 text-xs font-medium uppercase tracking-wide ${
              labelClass ?? 'text-zinc-500'
            }`}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
