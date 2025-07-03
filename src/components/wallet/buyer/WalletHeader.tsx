// src/components/wallet/buyer/WalletHeader.tsx
'use client';

import { Wallet, TrendingUp } from 'lucide-react';

export default function WalletHeader() {
  return (
    <div className="mb-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
            <div className="bg-gradient-to-r from-[#ff950e] to-orange-600 p-3 rounded-xl mr-4 shadow-lg shadow-orange-500/20">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            Buyer Wallet
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your funds and track your spending
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <TrendingUp className="w-4 h-4" />
          <span>Secure payments with instant processing</span>
        </div>
      </div>
    </div>
  );
}
