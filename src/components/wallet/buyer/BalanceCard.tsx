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
      className="rounded-2xl border border-gray-800 bg-[#111] p-6 transition-colors sm:p-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#ff950e]">
              Balance
            </span>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                ${safeBalance.toFixed(2)}
              </p>
              <span className="pb-1 text-xs font-medium uppercase tracking-wider text-gray-400">USD</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/10 px-4 py-2 text-sm font-semibold text-[#ff950e]">
            <DollarSign className="h-4 w-4" />
            Available to spend
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#ff950e]" />
            <span>Secure transaction coverage keeps every purchase protected.</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#ff950e]" />
            <span>Instant reloads mean funds are ready to spend immediately.</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#ff950e]" />
            <span>Real-time activity sync keeps your balance up to date.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-800 bg-[#0c0c0c] p-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <p>
            Each transaction includes a <span className="font-semibold text-gray-100">10% platform fee</span> for secure processing and buyer protection.
          </p>
          <span className="inline-flex items-center gap-2 text-[#ff950e]">
            <ArrowUpRight className="h-4 w-4" />
            Boost your balance to stay checkout-ready.
          </span>
        </div>

        {safeBalance < 20 && safeBalance > 0 && (
          <div className="flex items-start gap-2 rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-3 text-sm text-[#ff950e]">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Low balance — add funds to continue shopping.</span>
          </div>
        )}
      </div>
    </section>
  );
}
