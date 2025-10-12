'use client';

import React from 'react';
import { Clock, CheckCircle, ExternalLink, Hourglass, ArrowUpRight } from 'lucide-react';

interface RecentWithdrawalsProps {
  withdrawals: Array<{
    amount: number;
    date: string;
    status?: string; // e.g., 'Completed', 'Pending'
    method?: string; // e.g., 'Bank', 'PayPal'
  }>;
}

export default function RecentWithdrawals({ withdrawals }: RecentWithdrawalsProps): React.ReactElement {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyles = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('pending')) {
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    }
    if (normalized.includes('failed') || normalized.includes('error')) {
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    }
    return 'border-green-500/30 bg-green-500/10 text-green-300';
  };

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 transition-colors sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/10">
            <Clock className="h-6 w-6 text-[#ff950e]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white sm:text-xl">Recent withdrawals</h2>
            <p className="text-sm text-gray-400">Track the latest payouts and their statuses.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-[#0c0c0c] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Activity feed
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {withdrawals.map((withdrawal, index) => {
          const status = withdrawal.status ?? 'Completed';
          const statusStyles = getStatusStyles(status);
          const methodLabel = withdrawal.method ? withdrawal.method : 'Primary method';

          return (
            <div
              key={index}
              className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4 transition-colors hover:border-[#ff950e]/40 hover:bg-[#111]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">${withdrawal.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{formatDate(withdrawal.date)}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-right text-sm text-gray-400">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles}`}>
                    {status}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                    <Hourglass className="h-4 w-4" />
                    {methodLabel}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Need more details? View the full receipt in your payout history.</span>
                <ExternalLink className="h-4 w-4 text-[#ff950e]" />
              </div>
            </div>
          );
        })}
      </div>

      {withdrawals.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-gray-800 bg-[#0c0c0c] p-8 text-center">
          <Hourglass className="h-6 w-6 text-gray-500" />
          <p className="text-sm text-gray-500">No withdrawals yet</p>
            <span className="text-xs text-gray-600">
              Once you withdraw funds, you'll see a running log of payouts right here.
            </span>
        </div>
      )}

      {withdrawals.length > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4 text-xs text-gray-400">
          <span>Keep fulfilling orders to maintain a healthy payout cadence.</span>
          <span className="inline-flex items-center gap-2 text-[#ff950e]">
            <ArrowUpRight className="h-4 w-4" />
            View payout settings
          </span>
        </div>
      )}
    </section>
  );
}
