'use client';

import React from 'react';
import { TrendingUp, ArrowDownCircle } from 'lucide-react';

interface EarningsCardProps {
  totalEarnings: number;
  totalWithdrawn: number;
  salesCount: number;
}

export default function EarningsCard({
  totalEarnings,
  totalWithdrawn,
  salesCount,
}: EarningsCardProps): React.ReactElement {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-300">Total Earnings</h2>
          <div className="p-1.5 bg-green-500 bg-opacity-20 rounded">
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-white">${totalEarnings.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {salesCount} {salesCount === 1 ? 'sale' : 'sales'}
        </p>
      </div>

      <div className="pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-gray-300">Withdrawn</h2>
          <div className="p-1.5 bg-blue-500 bg-opacity-20 rounded">
            <ArrowDownCircle className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        <div className="flex items-baseline">
          <span className="text-xl font-bold text-white">${totalWithdrawn.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
