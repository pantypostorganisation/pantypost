// src/components/admin/bans/AnalyticsContent.tsx
'use client';

import { BarChart3, MessageSquare } from 'lucide-react';
import { BanStats } from '@/types/ban';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface AnalyticsContentProps {
  banStats: BanStats;
}

// Valid ban reasons for validation
const VALID_BAN_REASONS = [
  'harassment',
  'inappropriate_content',
  'spam',
  'fake_profile',
  'scamming',
  'underage',
  'ban_evasion',
  'other'
] as const;

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
  return Math.min(100, Math.max(0, percentage)); // Clamp between 0 and 100
};

export default function AnalyticsContent({ banStats }: AnalyticsContentProps) {
  // Validate and sanitize ban statistics
  const sanitizedBansByReason = Object.entries(banStats.bansByReason || {})
    .filter(([reason]) => {
      // Only include valid reasons or sanitize unknown ones
      const sanitizedReason = sanitizeStrict(reason);
      return sanitizedReason.length > 0;
    })
    .reduce((acc, [reason, count]) => {
      const sanitizedReason = sanitizeStrict(reason);
      const sanitizedCount = sanitizeNumber(count, 0, 999999, 0);
      acc[sanitizedReason] = sanitizedCount;
      return acc;
    }, {} as Record<string, number>);

  // Calculate total with validation
  const total = Object.values(sanitizedBansByReason).reduce((sum, val) => {
    const num = Number(val);
    return sum + (Number.isFinite(num) ? num : 0);
  }, 0);

  // Sanitize appeal statistics
  const sanitizedAppealStats = {
    totalAppeals: sanitizeNumber(banStats.appealStats?.totalAppeals || 0, 0, 999999, 0),
    pendingAppeals: sanitizeNumber(banStats.appealStats?.pendingAppeals || 0, 0, 999999, 0),
    approvedAppeals: sanitizeNumber(banStats.appealStats?.approvedAppeals || 0, 0, 999999, 0),
    rejectedAppeals: sanitizeNumber(banStats.appealStats?.rejectedAppeals || 0, 0, 999999, 0),
  };

  // Validate appeal stats consistency
  const appealSum = sanitizedAppealStats.pendingAppeals + 
                   sanitizedAppealStats.approvedAppeals + 
                   sanitizedAppealStats.rejectedAppeals;
  
  if (appealSum > sanitizedAppealStats.totalAppeals) {
    // Adjust total if sum exceeds it
    sanitizedAppealStats.totalAppeals = appealSum;
  }

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
          {Object.entries(sanitizedBansByReason).length === 0 ? (
            <p className="text-gray-400 text-center py-4">No ban data available</p>
          ) : (
            Object.entries(sanitizedBansByReason)
              .sort(([, a], [, b]) => b - a) // Sort by count descending
              .map(([reason, count]) => {
                const percentage = calculatePercentage(count, total);
                
                return (
                  <div key={reason}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">
                        <SecureMessageDisplay 
                          content={formatReasonForDisplay(reason)}
                          allowBasicFormatting={false}
                        />
                      </span>
                      <span className="text-sm text-gray-400">
                        {count.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#ff950e] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={percentage}
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
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare size={20} className="text-orange-400" />
          Appeal Processing
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {sanitizedAppealStats.totalAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total Appeals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {sanitizedAppealStats.pendingAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {sanitizedAppealStats.approvedAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {sanitizedAppealStats.rejectedAppeals.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Rejected</div>
          </div>
        </div>
      </div>
    </div>
  );
}

