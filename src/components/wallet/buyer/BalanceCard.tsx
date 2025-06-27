// src/components/wallet/buyer/BalanceCard.tsx
'use client';

import { DollarSign, AlertCircle } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-300">Current Balance</h2>
        <div className="p-2 bg-[#ff950e] bg-opacity-20 rounded-lg">
          <DollarSign className="w-6 h-6 text-[#ff950e]" />
        </div>
      </div>
      <div className="flex items-baseline">
        <span className="text-4xl font-bold text-white">${Math.max(0, balance).toFixed(2)}</span>
        <span className="ml-2 text-sm text-gray-400">USD</span>
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Use your wallet to purchase listings. Each transaction includes a 10% platform fee.
      </p>
      {balance < 20 && balance > 0 && (
        <div className="mt-3 flex items-center text-sm text-yellow-400">
          <AlertCircle className="w-4 h-4 mr-1" />
          Low balance - consider adding more funds
        </div>
      )}
    </div>
  );
}
