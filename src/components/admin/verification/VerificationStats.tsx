// src/components/admin/verification/VerificationStats.tsx
'use client';

import { FileCheck, Clock, Calendar, Timer } from 'lucide-react';
import type { VerificationStatsProps } from '@/types/verification';

export default function VerificationStats({ stats }: VerificationStatsProps) {
  // Ensure all values are valid numbers
  const safeNumber = (value: any): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
          <FileCheck className="mx-auto mb-2 text-[#ff950e]" size={20} />
          <div className="text-2xl font-bold text-white">{safeNumber(stats?.total)}</div>
          <div className="text-xs text-gray-400">Total Pending</div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
          <Clock className="mx-auto mb-2 text-blue-400" size={20} />
          <div className="text-2xl font-bold text-blue-400">{safeNumber(stats?.today)}</div>
          <div className="text-xs text-gray-400">Today</div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
          <Calendar className="mx-auto mb-2 text-purple-400" size={20} />
          <div className="text-2xl font-bold text-purple-400">{safeNumber(stats?.thisWeek)}</div>
          <div className="text-xs text-gray-400">This Week</div>
        </div>
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
          <Timer className="mx-auto mb-2 text-green-400" size={20} />
          <div className="text-2xl font-bold text-green-400">{safeNumber(stats?.averageProcessingTime)}h</div>
          <div className="text-xs text-gray-400">Avg Processing</div>
        </div>
      </div>
    </div>
  );
}
