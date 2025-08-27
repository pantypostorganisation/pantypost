'use client';

import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps): React.ReactElement {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-300">Available Balance</h2>
        <div className="p-2 bg-[#ff950e] bg-opacity-20 rounded-lg">
          <DollarSign className="w-6 h-6 text-[#ff950e]" />
        </div>
      </div>
      <div className="flex items-baseline">
        <span className="text-4xl font-bold text-white">${balance.toFixed(2)}</span>
        <span className="ml-2 text-sm text-gray-400">USD</span>
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Ready to withdraw to your account. Funds are available after the 10% platform fee.
      </p>
      {balance > 100 && (
        <div className="mt-3 flex items-center text-sm text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          Great job! You have funds ready to withdraw
        </div>
      )}
    </div>
  );
}
