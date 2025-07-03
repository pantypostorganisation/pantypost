// src/components/wallet/buyer/TotalSpentCard.tsx
'use client';

import { ShoppingBag, TrendingDown } from 'lucide-react';

interface TotalSpentCardProps {
  totalSpent: number;
  totalOrders: number;
}

export default function TotalSpentCard({ totalSpent, totalOrders }: TotalSpentCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 relative overflow-hidden group">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-1">Total Spent</h2>
            <p className="text-xs text-gray-500">Lifetime purchases</p>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-3 rounded-xl shadow-lg shadow-green-500/20">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="flex items-baseline mb-4">
          <span className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</span>
          <span className="ml-2 text-sm text-gray-400">USD</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total Orders</span>
          <span className="font-semibold text-gray-300">{totalOrders}</span>
        </div>
        
        {totalOrders > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Avg. per order</span>
              <span className="text-gray-400">${(totalSpent / totalOrders).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

