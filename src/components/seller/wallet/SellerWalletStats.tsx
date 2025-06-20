// src/components/seller/wallet/SellerWalletStats.tsx
'use client';

import { 
  DollarSign, 
  TrendingUp,
  ArrowDownCircle
} from 'lucide-react';

interface SellerWalletStatsProps {
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  sellerSales: any[];
  logs: any[];
}

export default function SellerWalletStats({
  balance,
  totalEarnings,
  totalWithdrawn,
  sellerSales,
  logs
}: SellerWalletStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Current Balance */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-300">Available Balance</h2>
          <div className="p-2 bg-[#ff950e] bg-opacity-20 rounded-lg">
            <DollarSign className="w-6 h-6 text-[#ff950e]" />
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-white">${balance.toFixed(2)}</span>
          <span className="ml-2 text-sm text-gray-400">USD</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Available for withdrawal
        </p>
      </div>

      {/* Total Earnings */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-300">Total Earnings</h2>
          <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-white">${totalEarnings.toFixed(2)}</span>
          <span className="ml-2 text-sm text-gray-400">USD</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {sellerSales.length} {sellerSales.length === 1 ? 'sale' : 'sales'} completed
        </p>
      </div>

      {/* Total Withdrawn */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-300">Total Withdrawn</h2>
          <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
            <ArrowDownCircle className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-white">${totalWithdrawn.toFixed(2)}</span>
          <span className="ml-2 text-sm text-gray-400">USD</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {logs.length} {logs.length === 1 ? 'withdrawal' : 'withdrawals'} made
        </p>
      </div>
    </div>
  );
}