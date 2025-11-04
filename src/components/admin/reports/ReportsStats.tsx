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

  const cards: Array<{ label: string; value: number; className?: string }> = [
    { label: 'Total Reports', value: totals.total },
    { label: 'Pending', value: totals.unprocessed, className: 'text-[#ff950e]' },
    { label: 'Critical', value: totals.critical, className: 'text-red-400' },
    { label: 'Today', value: totals.today, className: 'text-zinc-200' },
    { label: 'Processed', value: totals.processed, className: 'text-emerald-400' },
    { label: 'Resulted in Bans', value: totals.withBans, className: 'text-rose-400' }
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, className }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-3 text-left shadow-none"
        >
          <div className={`text-2xl font-semibold tracking-tight text-white ${className ?? ''}`.trim()}>{value}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
        </div>
      ))}
    </div>
  );
}
