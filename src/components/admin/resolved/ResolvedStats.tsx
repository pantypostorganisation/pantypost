// src/components/admin/resolved/ResolvedStats.tsx
'use client';

import { FileText, Ban, CheckCircle, Clock, Calendar } from 'lucide-react';
import type { ResolvedStatsProps } from '@/types/resolved';

export default function ResolvedStats({ stats }: ResolvedStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <FileText className="mx-auto mb-2 text-gray-400" size={20} />
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-xs text-gray-400">Total Resolved</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <Ban className="mx-auto mb-2 text-red-400" size={20} />
        <div className="text-2xl font-bold text-red-400">{stats.withBans}</div>
        <div className="text-xs text-gray-400">With Bans</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <CheckCircle className="mx-auto mb-2 text-green-400" size={20} />
        <div className="text-2xl font-bold text-green-400">{stats.withoutBans}</div>
        <div className="text-xs text-gray-400">No Bans</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <Clock className="mx-auto mb-2 text-blue-400" size={20} />
        <div className="text-2xl font-bold text-blue-400">{stats.today}</div>
        <div className="text-xs text-gray-400">Today</div>
      </div>
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 text-center hover:border-gray-700 transition-colors">
        <Calendar className="mx-auto mb-2 text-purple-400" size={20} />
        <div className="text-2xl font-bold text-purple-400">{stats.thisWeek}</div>
        <div className="text-xs text-gray-400">This Week</div>
      </div>
    </div>
  );
}
