// src/components/admin/wallet/AdminMoneyFlow.tsx
'use client';

import { Info, Download, ShoppingBag, Upload, TrendingUp } from 'lucide-react';

export default function AdminMoneyFlow() {
  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#101010] p-5 shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-200">
        <Info className="h-4 w-4 text-[#ff950e]" aria-hidden="true" />
        Money Flow Snapshot
      </div>
      <div className="grid grid-cols-1 gap-3 text-xs text-gray-300 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-[#1f1f1f] bg-[#181818] p-4">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/15">
            <Download className="h-4 w-4 text-blue-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-gray-100">Buyer deposits</p>
            <p className="leading-relaxed text-gray-400">Instant cash in platform wallets ready for future orders.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-[#1f1f1f] bg-[#181818] p-4">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-[#ff950e]/15">
            <ShoppingBag className="h-4 w-4 text-[#ff950e]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-gray-100">Orders processed</p>
            <p className="leading-relaxed text-gray-400">Buyer payments split automatically between seller earnings and fees.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-[#1f1f1f] bg-[#181818] p-4">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-red-500/15">
            <Upload className="h-4 w-4 text-red-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-gray-100">Seller payouts</p>
            <p className="leading-relaxed text-gray-400">Completed sales move to withdrawal queue for scheduled releases.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-[#1f1f1f] bg-[#181818] p-4">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-green-500/15">
            <TrendingUp className="h-4 w-4 text-green-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-gray-100">Platform profit</p>
            <p className="leading-relaxed text-gray-400">Transaction fees and subscriptions accumulate as retained revenue.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
