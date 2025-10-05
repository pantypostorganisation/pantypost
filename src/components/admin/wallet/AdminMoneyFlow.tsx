// src/components/admin/wallet/AdminMoneyFlow.tsx
'use client';

import { Info, Download, ShoppingBag, Upload, TrendingUp } from 'lucide-react';

export default function AdminMoneyFlow() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-sm shadow-xl shadow-black/30">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#ff6b00]/20 via-transparent to-transparent" aria-hidden="true" />
      <div className="relative">
        <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
          <Info className="h-5 w-5 text-[#ffbf7f]" aria-hidden="true" />
          How Your Money Machine Works
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[{
            title: '1. Buyer Deposits',
            description: 'Buyer adds $100 to wallet → You collect $100 upfront cash flow',
            icon: Download,
            ring: 'from-sky-500/20 to-sky-400/10 text-sky-300'
          }, {
            title: '2. Purchase Made',
            description: '$1000 item → Buyer pays $1100 → Seller gets $900 → You keep $200 (20%)',
            icon: ShoppingBag,
            ring: 'from-[#ff950e]/30 to-[#ff6b00]/10 text-[#ffbf7f]'
          }, {
            title: '3. Seller Withdraws',
            description: 'Seller requests payout of their earnings from completed sales',
            icon: Upload,
            ring: 'from-rose-500/25 to-rose-400/10 text-rose-200'
          }, {
            title: '4. Pure Profit',
            description: '20% profit margin on all sales + 25% from subscriptions',
            icon: TrendingUp,
            ring: 'from-emerald-500/25 to-emerald-400/10 text-emerald-200'
          }].map(({ title, description, icon: Icon, ring }) => (
            <div
              key={title}
              className="relative flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition-colors hover:border-[#ff950e]/40"
            >
              <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${ring}`}>
                <Icon className="h-8 w-8" aria-hidden="true" />
              </div>
              <h4 className="mb-2 text-base font-semibold text-white">{title}</h4>
              <p className="text-sm text-gray-300">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
