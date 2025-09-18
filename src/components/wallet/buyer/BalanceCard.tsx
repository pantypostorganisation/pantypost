// src/components/wallet/buyer/BalanceCard.tsx
'use client';

import { DollarSign, AlertCircle, ShieldCheck, Zap } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const safeBalance = Math.max(0, balance);

  return (
    <section
      aria-label="Current balance"
      className="bg-[#141414] rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-colors relative overflow-hidden"
    >
      {/* subtle background wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff950e]/5 to-transparent" />

      <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
        {/* Top row: title + icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-medium text-gray-300">Current Balance</h2>
            <span className="text-xs text-gray-500">Available for purchases</span>
          </div>

          <div className="bg-gradient-to-r from-[#ff950e] to-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/15">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Divider */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

        {/* Content grid */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-center">
          {/* Amount */}
          <div className="flex items-end gap-3">
            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white tabular-nums">
              ${safeBalance.toFixed(2)}
            </span>
            <span className="pb-2 text-xs md:text-sm text-gray-400">USD</span>
          </div>

          {/* Status / badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              <Zap className="w-3.5 h-3.5" />
              Instant deposits
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1 text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              No waiting period
            </span>
          </div>

          {/* Meta / fine print */}
          <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed lg:text-right">
            Each transaction includes a <span className="text-gray-300 font-medium">10% platform fee</span> for secure
            processing.
          </p>
        </div>

        {/* Low balance notice */}
        {safeBalance < 20 && safeBalance > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5 text-sm text-yellow-300">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Low balance — add funds to continue shopping.</span>
          </div>
        )}
      </div>
    </section>
  );
}
