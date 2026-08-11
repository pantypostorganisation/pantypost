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
      className="rounded-lg border border-line bg-surface p-6 transition-colors sm:p-8"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                ${safeBalance.toFixed(2)}
              </p>
              <span className="pb-1 text-xs font-medium uppercase tracking-wider text-ink-muted">USD</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <DollarSign className="h-4 w-4" />
            Available to spend
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Secure transaction coverage keeps every purchase protected.</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>Instant reloads mean funds are ready to spend immediately.</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Real-time activity sync keeps your balance up to date.</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <p>
            Each transaction includes a <span className="font-semibold text-gray-100">10% platform fee</span> for secure processing and buyer protection.
          </p>
          <span className="inline-flex items-center gap-2 text-primary">
            <ArrowUpRight className="h-4 w-4" />
            Boost your balance to stay checkout-ready.
          </span>
        </div>

        {safeBalance < 20 && safeBalance > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>Low balance — add funds to continue shopping.</span>
          </div>
        )}
      </div>
    </section>
  );
}