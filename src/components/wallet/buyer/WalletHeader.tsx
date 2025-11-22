// src/components/wallet/buyer/WalletHeader.tsx
'use client';

import { CreditCard, ArrowUpRight } from 'lucide-react';

export default function WalletHeader() {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-8">
        <div className="flex items-center gap-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
            <img
              src="/icons/HeaderWallet.png"
              alt="Wallet"
              className="h-6 w-6 object-contain"
              draggable={false}
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-[#0c0c0c] px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-gray-400">
              Buyer hub
            </span>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
              <span className="text-white">Digital Wallet</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-300 sm:text-base">
              Top up instantly, keep your payments protected, and stay aligned with the premium aesthetic across your buyer dashboard.
            </p>
          </div>
        </div>

      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-gray-800 bg-[#111] p-6 text-sm text-gray-300">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10">
            <CreditCard className="h-6 w-6 text-[#ff950e]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sync with your dashboard</p>
            <p className="text-xs text-gray-500">Balances update in real-time across every buyer surface.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4 text-xs text-gray-400">
          <p className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-[#ff950e]" />
            Keep purchases flowing—add funds before you check out to skip processing delays.
          </p>
        </div>
      </div>
    </div>
  );
}
