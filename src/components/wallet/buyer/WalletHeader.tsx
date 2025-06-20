// src/components/wallet/buyer/WalletHeader.tsx
'use client';

import { Wallet } from 'lucide-react';

export default function WalletHeader() {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-lg shadow-purple-500/10">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Wallet Dashboard
        </h1>
      </div>
      <p className="text-gray-400 text-lg">
        Manage your funds with enterprise-grade security
      </p>
    </div>
  );
}