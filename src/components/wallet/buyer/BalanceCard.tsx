// src/components/wallet/buyer/BalanceCard.tsx
'use client';

import { DollarSign, TrendingUp, Wallet } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const safeBalance = Math.max(0, balance);
  const isLowBalance = safeBalance < 20 && safeBalance > 0;

  return (
    <section
      aria-label="Current balance"
      className="h-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-300"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff950e]/10 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#ff950e]/20 to-orange-600/20 backdrop-blur-sm">
              <Wallet className="w-5 h-5 text-[#ff950e]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Available Balance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Ready to spend</p>
            </div>
          </div>
        </div>

        {/* Balance Display */}
        <div className="flex-1 flex flex-col justify-center">
          <div className={`transition-all duration-300 ${isLowBalance ? 'scale-95' : ''}`}>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-white tabular-nums">
                ${safeBalance.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 font-medium">USD</span>
            </div>

            {/* Low Balance Warning */}
            {isLowBalance && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 font-medium">
                  Low balance • Add funds to continue
                </p>
              </div>
            )}

            {/* Balance OK Indicator */}
            {!isLowBalance && safeBalance > 0 && (
              <div className="mt-4 flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <p className="text-xs font-medium">Balance healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-white/5">
          <p className="text-[11px] text-gray-500">
            Instant deposits • No waiting period
          </p>
        </div>
      </div>
    </section>
  );
}