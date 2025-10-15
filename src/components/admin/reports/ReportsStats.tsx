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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-white">{totals.total}</div>
        <div className="text-xs text-gray-400">Total Reports</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-yellow-400">{totals.unprocessed}</div>
        <div className="text-xs text-gray-400">Pending</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-red-400">{totals.critical}</div>
        <div className="text-xs text-gray-400">Critical</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-blue-400">{totals.today}</div>
        <div className="text-xs text-gray-400">Today</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-green-400">{totals.processed}</div>
        <div className="text-xs text-gray-400">Processed</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-purple-400">{totals.withBans}</div>
        <div className="text-xs text-gray-400">Resulted in Bans</div>
      </div>
    </div>
  );
}
