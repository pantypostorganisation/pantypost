// src/components/wallet/seller/WalletHeader.tsx
'use client';

import React from 'react';
import { Wallet, ArrowUpRight, ShieldCheck, BarChart3 } from 'lucide-react';

interface WalletHeaderProps {
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  salesCount: number;
  recentWithdrawalsCount: number;
  remainingDailyLimit: number;
}

export default function WalletHeader({
  balance,
  totalEarnings,
  totalWithdrawn,
  salesCount,
  recentWithdrawalsCount,
  remainingDailyLimit,
}: WalletHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-8">
        <div className="flex items-center gap-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
            <Wallet className="h-7 w-7 text-[#ff950e]" />
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-[#0c0c0c] px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">
              Seller hub
            </span>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              <span className="text-white">Wallet & payouts</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-300 sm:text-base">
              Monitor balance health, trigger withdrawals, and stay aligned with the premium aesthetic shared across the buyer and seller experiences.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-xl flex-col gap-4 text-sm text-gray-300">
        <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Lifetime earnings</p>
              <p className="mt-2 text-2xl font-semibold text-white">${totalEarnings.toFixed(2)}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/10">
              <BarChart3 className="h-5 w-5 text-[#ff950e]" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">{salesCount} {salesCount === 1 ? 'sale fulfilled' : 'sales fulfilled'}.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Ready balance</p>
            <p className="mt-2 text-xl font-semibold text-white">${Math.max(0, balance).toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">${Math.max(0, remainingDailyLimit).toFixed(2)} remaining daily limit.</p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Payouts processed</p>
            <p className="mt-2 text-xl font-semibold text-white">${totalWithdrawn.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">{recentWithdrawalsCount} recent withdrawal{recentWithdrawalsCount === 1 ? '' : 's'}.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4 text-xs text-gray-400">
          <p className="flex items-center gap-2 text-[#ff950e]">
            <ShieldCheck className="h-4 w-4" />
            Secure payouts: compliance checks run automatically before each transfer.
          </p>
          <p className="mt-3 flex items-center gap-2 text-[#ff950e]">
            <ArrowUpRight className="h-4 w-4" />
            Keep your banking details current to avoid payout interruptions.
          </p>
        </div>
      </div>
    </div>
  );
}
