// src/components/wallet/buyer/BalanceCard.tsx
'use client';

import { DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 col-span-1 md:col-span-2 relative overflow-hidden group">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff950e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-1">Current Balance</h2>
            <p className="text-xs text-gray-500">Available for purchases</p>
          </div>
          <div className="bg-gradient-to-r from-[#ff950e] to-orange-600 p-3 rounded-xl shadow-lg shadow-orange-500/20">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex items-baseline mb-6">
          <span className="text-5xl font-bold text-white">${Math.max(0, balance).toFixed(2)}</span>
          <span className="ml-3 text-sm text-gray-400">USD</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>Instant deposits • No waiting period</span>
          </div>
          <p className="text-sm text-gray-500">
            Each transaction includes a 10% platform fee for secure processing
          </p>
        </div>
        
        {balance < 20 && balance > 0 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center text-sm text-yellow-400">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>Low balance - add funds to continue shopping</span>
          </div>
        )}
      </div>
    </div>
  );
}
