// src/components/buyers/dashboard/RecentActivity.tsx
'use client';

import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react';
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
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent activity</h2>
        <Link
          href="/buyers/my-orders"
          className="text-xs font-medium text-orange-200 transition hover:text-orange-100"
        >
          View all orders
        </Link>
      </div>

      {safeActivities.length > 0 ? (
        <div className="mt-6 space-y-6">
          {safeActivities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/50 ${getStatusColor(activity.type)}`}>
                  {activity.icon}
                </span>
                {index !== safeActivities.length - 1 && <span className="mt-1 h-full w-px bg-white/10" aria-hidden="true" />}
              </div>

              <Link
                href={activity.href || '#'}
                className="flex flex-1 flex-col gap-2 rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-orange-300/40 hover:bg-slate-900/80"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <SecureMessageDisplay
                    content={activity.title}
                    className="text-sm font-medium text-slate-100"
                    allowBasicFormatting={false}
                    maxLength={100}
                  />
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
                <SecureMessageDisplay
                  content={activity.subtitle}
                  className="text-xs text-slate-400"
                  allowBasicFormatting={false}
                  maxLength={80}
                />

                <div className="flex items-center justify-between text-xs text-slate-400">
                  {typeof activity.amount === 'number' && !Number.isNaN(activity.amount) ? (
                    <span className="font-semibold text-slate-100">${activity.amount.toFixed(2)}</span>
                  ) : (
                    <span />
                  )}
                  {activity.status && getStatusIcon(activity.status)}
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-10 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-slate-500" />
          <p className="text-sm text-slate-300">You&apos;re all caught up. Activity will appear here once you place new orders.</p>
          <Link
            href="/browse"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-orange-300"
          >
            Discover new listings
          </Link>
        </div>
      )}
    </section>
  );
}
