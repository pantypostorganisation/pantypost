// src/components/wallet/buyer/BalanceCard.tsx
'use client';

import { DollarSign, AlertCircle, ShieldCheck, Zap, ArrowUpRight, Clock } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const safeBalance = Math.max(0, balance);

  return (
    <section
      aria-label="Current balance"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_30px_90px_-60px_rgba(59,130,246,0.35)] transition-colors hover:border-white/20 sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-20 top-1/2 h-60 w-60 -translate-y-1/2 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-300/70">
              Balance
            </span>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                ${safeBalance.toFixed(2)}
              </p>
              <span className="pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">USD</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 rounded-2xl border border-blue-400/40 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-white">
            <DollarSign className="h-4 w-4" />
            Available to spend
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>Escrow protection keeps every transaction secure.</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-sky-300" />
            <span>Instant reloads mean funds are ready to spend immediately.</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-300" />
            <span>Real-time activity sync keeps your balance up to date.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 p-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <p>
            Each transaction includes a <span className="font-semibold text-gray-100">10% platform fee</span> for secure processing and buyer protection.
          </p>
          <span className="inline-flex items-center gap-2 text-sky-200">
            <ArrowUpRight className="h-4 w-4" />
            Boost your balance to stay checkout-ready.
          </span>
        </div>

        {safeBalance < 20 && safeBalance > 0 && (
          <div className="flex items-start gap-2 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Low balance — add funds to continue shopping.</span>
          </div>
        )}
      </div>
    </section>
  );
}
