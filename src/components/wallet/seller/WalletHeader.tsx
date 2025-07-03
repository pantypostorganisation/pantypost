// src/components/wallet/seller/WalletHeader.tsx
'use client';

import { Wallet } from 'lucide-react';

export default function WalletHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2 text-[#ff950e] flex items-center">
        <Wallet className="mr-3 h-8 w-8" />
        Seller Wallet
      </h1>
      <p className="text-gray-400">
        Manage your earnings and track withdrawals
      </p>
    </div>
  );
}
