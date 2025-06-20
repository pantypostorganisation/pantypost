// src/components/wallet/buyer/BalanceCard.tsx
'use client';

import { DollarSign, AlertCircle, Sparkles } from 'lucide-react';
import { BalanceCardProps } from '@/types/wallet';

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="lg:col-span-2 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
      <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-purple-500/20 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-gray-300 mb-1">Available Balance</h2>
            <p className="text-sm text-gray-500">Instant access to your funds</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl backdrop-blur-sm">
            <DollarSign className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-5xl font-bold text-white tracking-tight">${Math.max(0, balance).toFixed(2)}</span>
          <span className="text-lg text-gray-400">USD</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-[#333] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
              style={{ width: balance > 0 ? '100%' : '0%' }}
            />
          </div>
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        {balance < 20 && balance > 0 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-xl flex items-center text-sm text-yellow-400">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            Low balance - top up to continue shopping
          </div>
        )}
      </div>
    </div>
  );
}