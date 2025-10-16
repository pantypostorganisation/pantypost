// src/components/admin/wallet/AdminMoneyFlow.tsx
'use client';

import { Info, Download, ShoppingBag, Upload, TrendingUp } from 'lucide-react';

export default function AdminMoneyFlow() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Info className="h-4 w-4 text-[#ff950e]" aria-hidden="true" />
        Money Flow Snapshot
      </div>
      <div className="grid grid-cols-1 gap-3 text-xs text-gray-300 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
            <Download className="h-4 w-4 text-blue-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-white">Buyer deposits</p>
            <p>Instant cash in platform wallets ready for future orders.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff950e]/20">
            <ShoppingBag className="h-4 w-4 text-[#ff950e]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-white">Orders processed</p>
            <p>Buyer payments split automatically between seller earnings and fees.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
            <Upload className="h-4 w-4 text-red-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-white">Seller payouts</p>
            <p>Completed sales move to withdrawal queue for scheduled releases.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
            <TrendingUp className="h-4 w-4 text-green-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-white">Platform profit</p>
            <p>Transaction fees and subscriptions accumulate as retained revenue.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
