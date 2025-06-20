// src/components/wallet/buyer/TotalSpentCard.tsx
'use client';

import { TrendingUp } from 'lucide-react';
import { TotalSpentCardProps } from '@/types/wallet';

export default function TotalSpentCard({ totalSpent, totalOrders }: TotalSpentCardProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-md opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
      <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-green-500/20 shadow-xl h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-gray-300 mb-1">Total Spent</h2>
            <p className="text-sm text-gray-500">Lifetime purchases</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl backdrop-blur-sm">
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-4xl font-bold text-white tracking-tight">${totalSpent.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl">
          <span className="text-sm text-gray-400">Total Orders</span>
          <span className="text-lg font-semibold text-white">{totalOrders}</span>
        </div>
      </div>
    </div>
  );
}