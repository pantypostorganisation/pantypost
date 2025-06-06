'use client';

import { BarChart3, MessageSquare } from 'lucide-react';
import { BanStats } from '@/types/ban';

interface AnalyticsContentProps {
  banStats: BanStats;
}

export default function AnalyticsContent({ banStats }: AnalyticsContentProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white mb-4">Ban Analytics</h2>
      
      {/* Ban Reasons Chart */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-400" />
          Ban Reasons Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(banStats.bansByReason).map(([reason, count]) => {
            const total = Object.values(banStats.bansByReason).reduce((sum, val) => sum + Number(val), 0);
            const percentage = total > 0 ? (Number(count) / total) * 100 : 0;
            
            return (
              <div key={reason}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300 capitalize">{reason.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-400">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-[#ff950e] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appeal Statistics */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-orange-400" />
          Appeal Processing
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{banStats.appealStats.totalAppeals}</div>
            <div className="text-xs text-gray-400">Total Appeals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{banStats.appealStats.pendingAppeals}</div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{banStats.appealStats.approvedAppeals}</div>
            <div className="text-xs text-gray-400">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{banStats.appealStats.rejectedAppeals}</div>
            <div className="text-xs text-gray-400">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  );
}

