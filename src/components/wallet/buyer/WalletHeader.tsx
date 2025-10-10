'use client';

import { Wallet, ShieldCheck, Zap, CreditCard, Sparkles, ArrowUpRight } from 'lucide-react';

export default function WalletHeader() {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-8">
        <div className="flex items-center gap-5">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff950e]/50 bg-[#ff950e]/15 backdrop-blur-sm">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-gray-300/80">
              Buyer hub
            </span>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                Digital Wallet
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-gray-300 sm:text-base">
              Top up instantly, keep your payments protected, and stay aligned with the premium aesthetic across your buyer dashboard.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Escrow protected</p>
              <p className="text-sm font-semibold text-white">Secure transfers</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff950e]/20">
              <Zap className="h-5 w-5 text-[#ffb347]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Instant reloads</p>
              <p className="text-sm font-semibold text-white">No waiting period</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20">
              <Sparkles className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Curated perks</p>
              <p className="text-sm font-semibold text-white">Buyer exclusives</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 text-sm text-gray-300">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/15">
            <CreditCard className="h-6 w-6 text-[#ffb347]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Sync with your dashboard</p>
            <p className="text-xs text-gray-500">Balances update in real-time across every buyer surface.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-xs text-gray-400">
          <p className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-[#ff950e]" />
            Keep purchases flowing—add funds before you check out to skip processing delays.
          </p>
        </div>
      </div>
    </div>
  );
}
