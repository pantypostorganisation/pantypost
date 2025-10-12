'use client';

import React from 'react';
import { DollarSign, ShieldCheck, Zap, ArrowUpRight, Gauge } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  remainingDailyLimit: number;
  todaysWithdrawals: number;
}

export default function BalanceCard({
  balance,
  remainingDailyLimit,
  todaysWithdrawals,
}: BalanceCardProps): React.ReactElement {
  const safeBalance = Math.max(0, balance);
  const safeRemainingLimit = Math.max(0, remainingDailyLimit);
  const todaysTotal = Math.max(0, todaysWithdrawals);
  const dailyLimit = safeRemainingLimit + todaysTotal;
  const dailyUsagePercent = dailyLimit > 0 ? Math.min(100, Math.round((todaysTotal / dailyLimit) * 100)) : 0;

  return (
    <section
      aria-label="Available balance"
      className="rounded-2xl border border-gray-800 bg-[#111] p-6 transition-colors sm:p-8"
    >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  ${safeBalance.toFixed(2)}
                </p>
                <span className="pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">USD</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-3 rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/10 px-4 py-2 text-sm font-semibold text-[#ff950e]">
              <DollarSign className="h-4 w-4" />
              Payout ready
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#ff950e]" />
              <span>Eligible earnings are secured and ready for instant withdrawal.</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#ff950e]" />
              <span>Withdraw directly to your connected payout method without delays.</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#ff950e]" />
              <span>{dailyLimit > 0 ? `${dailyUsagePercent}%` : 'No'} of today's withdrawal limit used.</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-[#0c0c0c] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col text-sm text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Daily availability</span>
              <span className="mt-2 text-base text-gray-300">
                ${safeRemainingLimit.toFixed(2)} remaining today
              </span>
              {todaysTotal > 0 && (
                <span className="mt-1 text-xs text-gray-500">
                  You've already withdrawn ${todaysTotal.toFixed(2)} in the last 24 hours.
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <div className="h-2 w-full rounded-full bg-[#1f1f1f]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ff950e] to-[#ffb72c] transition-all"
                  style={{ width: `${dailyLimit > 0 ? dailyUsagePercent : 0}%` }}
                />
              </div>
              <p className="flex items-center gap-2 text-xs font-medium text-[#ff950e]">
                <ArrowUpRight className="h-4 w-4" />
                Optimize your payout schedule to keep momentum.
              </p>
            </div>
          </div>

          {safeBalance < 50 && (
            <div className="flex items-start gap-2 rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-3 text-sm text-[#ff950e]">
              <ArrowUpRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Boost your balance by fulfilling more orders or adjusting pricing.</span>
            </div>
          )}
        </div>
    </section>
  );
}
