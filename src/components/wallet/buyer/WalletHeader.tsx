// src/components/wallet/buyer/WalletHeader.tsx
'use client';

import { Wallet, Shield, Zap } from 'lucide-react';

export default function WalletHeader() {
  return (
    <div className="mb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="bg-gradient-to-br from-[#ff950e] via-orange-500 to-orange-600 p-4 rounded-2xl shadow-xl shadow-orange-500/20">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Buyer Wallet
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage funds & track spending
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Secure Platform</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>Instant Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
}