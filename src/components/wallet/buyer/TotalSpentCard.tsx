// src/components/wallet/buyer/TotalSpentCard.tsx
'use client';

import { ShoppingBag } from 'lucide-react';

interface TotalSpentCardProps {
  totalSpent: number;
  totalOrders: number;
}

export default function TotalSpentCard({ totalSpent, totalOrders }: TotalSpentCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-300">Total Spent</h2>
        <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
          <ShoppingBag className="w-6 h-6 text-green-500" />
        </div>
      </div>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</span>
        <span className="ml-2 text-sm text-gray-400">USD</span>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {totalOrders} {totalOrders === 1 ? 'purchase' : 'purchases'} made
      </p>
    </div>
  );
}
