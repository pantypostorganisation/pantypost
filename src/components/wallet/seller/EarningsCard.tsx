'use client';

import React from 'react';
import { TrendingUp, Sparkle, ArrowUpRight } from 'lucide-react';

interface EarningsCardProps {
  totalEarnings: number;
  totalWithdrawn: number;
  salesCount: number;
  averageOrderValue: number;
  recentWithdrawalsCount: number;
}

export default function EarningsCard({
  totalEarnings,
  totalWithdrawn,
  salesCount,
  averageOrderValue,
  recentWithdrawalsCount,
}: EarningsCardProps): React.ReactElement {
  const safeAverageOrderValue = salesCount > 0 ? averageOrderValue : 0;

  return (
    <section className="rounded-2xl border border-gray-800 bg-[#111] p-6 transition-colors sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-green-400">
              Growth
            </span>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              ${totalEarnings.toFixed(2)}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Lifetime earnings across {salesCount} {salesCount === 1 ? 'sale' : 'sales'}.
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/30 bg-green-500/10">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Total withdrawn</p>
            <p className="mt-2 text-xl font-semibold text-white">${totalWithdrawn.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">{recentWithdrawalsCount} recent payouts processed.</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Average order value</p>
            <p className="mt-2 text-xl font-semibold text-white">${safeAverageOrderValue.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">Keep momentum with consistent pricing and fulfilment.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <div className="flex items-center gap-2 text-[#ff950e]">
            <Sparkle className="h-4 w-4" />
            <span>Unlock higher tiers by keeping fulfilment fast and ratings high.</span>
          </div>
          <span className="inline-flex items-center gap-2 text-[#ff950e]">
            <ArrowUpRight className="h-4 w-4" />
            Review your performance analytics in the seller hub.
          </span>
        </div>
      </div>
    </section>
  );
}
