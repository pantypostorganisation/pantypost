// src/components/wallet/buyer/WalletHeader.tsx
'use client';

import { CreditCard, ArrowUpRight } from 'lucide-react';

export default function WalletHeader() {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-8">
        <div className="flex items-center gap-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <img
              src="/icons/HeaderWallet.png"
              alt="Wallet"
              className="h-6 w-6 object-contain"
              draggable={false}
            />
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-ink-muted">
              Buyer hub
            </span>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
              <span className="text-white">Digital Wallet</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
              Top up instantly, keep your payments protected, and stay aligned with the premium aesthetic across your buyer dashboard.
            </p>
          </div>
        </div>

      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-line bg-surface p-6 text-sm text-ink-muted">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sync with your dashboard</p>
            <p className="text-xs text-ink-faint">Balances update in real-time across every buyer surface.</p>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-4 text-xs text-ink-muted">
          <p className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            Keep purchases flowing—add funds before you check out to skip processing delays.
          </p>
        </div>
      </div>
    </div>
  );
}