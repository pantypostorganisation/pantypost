// src/components/admin/bans/BanStatsDashboard.tsx
'use client';

import { BanStats } from '@/types/ban';

interface BanStatsDashboardProps {
  banStats: BanStats;
}

export default function BanStatsDashboard({ banStats }: BanStatsDashboardProps) {
  // Ensure all values are valid numbers
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-red-400">{safeNumber(banStats.totalActiveBans)}</div>
        <div className="text-xs text-gray-400">Active Bans</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-yellow-400">{safeNumber(banStats.temporaryBans)}</div>
        <div className="text-xs text-gray-400">Temporary</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-purple-400">{safeNumber(banStats.permanentBans)}</div>
        <div className="text-xs text-gray-400">Permanent</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-orange-400">{safeNumber(banStats.pendingAppeals)}</div>
        <div className="text-xs text-gray-400">Appeals</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-blue-400">{safeNumber(banStats.recentBans24h)}</div>
        <div className="text-xs text-gray-400">24h Bans</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <div className="text-2xl font-bold text-green-400">{safeNumber(banStats.appealStats?.approvedAppeals)}</div>
        <div className="text-xs text-gray-400">Approved</div>
      </div>
    </div>
  );
}
