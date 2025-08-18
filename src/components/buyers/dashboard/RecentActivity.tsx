// src/components/buyers/dashboard/RecentActivity.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { RecentActivityProps } from '@/types/dashboard';

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'shipped':
        return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
      case 'processing':
        return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
      case 'pending':
        return <AlertCircle className="w-3.5 h-3.5 text-orange-400" />;
      case 'delivered':
        return <Truck className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-[#ff950e]';
      case 'message':
        return 'text-blue-400';
      case 'request':
        return 'text-purple-400';
      case 'subscription':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const safeActivities = Array.isArray(activities) ? activities : [];

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        <Link href="/buyers/my-orders" className="text-[#ff950e] hover:text-[#e88800] font-medium flex items-center gap-2 text-sm">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {safeActivities.length > 0 ? (
        <div className="space-y-3">
          {safeActivities.map((activity) => (
            <Link
              key={activity.id}
              href={activity.href || '#'}
              className="flex items-center justify-between bg-[#111111] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-black ${getStatusColor(activity.type)}`}>{activity.icon}</div>
                <div>
                  <SecureMessageDisplay
                    content={activity.title}
                    className="text-white font-medium text-sm group-hover:text-[#ff950e] transition-colors"
                    allowBasicFormatting={false}
                    maxLength={100}
                  />
                  <SecureMessageDisplay
                    content={activity.subtitle}
                    className="text-gray-500 text-xs mt-0.5"
                    allowBasicFormatting={false}
                    maxLength={80}
                  />
                </div>
              </div>

              <div className="text-right flex items-center gap-3">
                <div>
                  {typeof activity.amount === 'number' && !Number.isNaN(activity.amount) && (
                    <p className="text-white font-semibold text-sm">${activity.amount.toFixed(2)}</p>
                  )}
                  <p className="text-gray-500 text-xs">{activity.time}</p>
                </div>
                {activity.status && getStatusIcon(activity.status)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#111111] rounded-lg">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No recent activity</p>
          <Link href="/browse" className="text-[#ff950e] hover:underline text-sm mt-2 inline-block">
            Start browsing
          </Link>
        </div>
      )}
    </div>
  );
}
