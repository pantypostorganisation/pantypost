// src/components/admin/wallet/AdminMoneyFlow.tsx
'use client';

import { Info, Download, ShoppingBag, Upload, TrendingUp } from 'lucide-react';

export default function AdminMoneyFlow() {
  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-[#1a1a1a]/90 to-[#252525]/70 p-6 shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Info className="h-5 w-5 text-[#ff950e]" aria-hidden="true" />
        How Your Money Machine Works
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Download className="h-8 w-8 text-blue-400" aria-hidden="true" />
          </div>
          <h4 className="font-bold text-white mb-2">1. Buyer Deposits</h4>
          <p className="text-sm text-gray-400">Buyer adds $100 to wallet → You collect $100 upfront cash flow</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-[#ff950e]/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="h-8 w-8 text-[#ff950e]" aria-hidden="true" />
          </div>
          <h4 className="font-bold text-white mb-2">2. Purchase Made</h4>
          <p className="text-sm text-gray-400">$1000 item → Buyer pays $1100 → Seller gets $900 → You keep $200 (20%)</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Upload className="h-8 w-8 text-red-400" aria-hidden="true" />
          </div>
          <h4 className="font-bold text-white mb-2">3. Seller Withdraws</h4>
          <p className="text-sm text-gray-400">Seller requests payout of their earnings from completed sales</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-8 w-8 text-green-400" aria-hidden="true" />
          </div>
          <h4 className="font-bold text-white mb-2">4. Pure Profit</h4>
          <p className="text-sm text-gray-400">20% profit margin on all sales + 25% from subscriptions</p>
        </div>
      </div>
    </div>
  );
}
