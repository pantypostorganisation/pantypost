// src/components/wallet/seller/WalletHeader.tsx
'use client';

import React from 'react';
import { ArrowUpRight, BarChart3 } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-start justify-between rounded-xl border border-gray-800 bg-[#0c0c0c] p-4 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Ready balance</p>
            <p className="mt-2 text-2xl font-semibold text-white">${Math.max(0, balance).toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">${Math.max(0, remainingDailyLimit).toFixed(2)} remaining daily limit.</p>
          </div>
          <div className="ml-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff950e]/30 bg-[#ff950e]/10">
            <img
              src="/icons/HeaderWallet.png"
              alt="Wallet"
              className="h-6 w-6 object-contain"
              draggable={false}
            />
          </div>
        </div>

        <div className="flex items-start justify-between rounded-xl border border-gray-800 bg-[#0c0c0c] p-4 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Lifetime earnings</p>
            <p className="mt-2 text-2xl font-semibold text-white">${totalEarnings.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">{salesCount} {salesCount === 1 ? 'sale fulfilled' : 'sales fulfilled'}.</p>
          </div>
          <div className="ml-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff950e]/30 bg-[#ff950e]/10">
            <BarChart3 className="h-4 w-4 text-[#ff950e]" />
          </div>
        </div>

        <div className="flex items-start justify-between rounded-xl border border-gray-800 bg-[#0c0c0c] p-4 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">Payouts processed</p>
            <p className="mt-2 text-2xl font-semibold text-white">${totalWithdrawn.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-500">{recentWithdrawalsCount} recent withdrawal{recentWithdrawalsCount === 1 ? '' : 's'}.</p>
          </div>
          <div className="ml-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff950e]/30 bg-[#ff950e]/10">
            <ArrowUpRight className="h-4 w-4 text-[#ff950e]" />
          </div>
        </div>
      </div>

    </div>
  );
}
