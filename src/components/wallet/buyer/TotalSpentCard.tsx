'use client';

import { ShoppingBag } from 'lucide-react';

interface TotalSpentCardProps {
  totalSpent: number;
  totalOrders: number;
}

export default function TotalSpentCard({ totalSpent, totalOrders }: TotalSpentCardProps) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-[#111] p-8 transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-400 mb-1">Total Spent</h2>
            <p className="text-xs text-gray-500">Lifetime purchases</p>
          </div>
          <div className="rounded-xl border border-[#ff950e]/40 bg-[#ff950e]/10 p-3">
            <ShoppingBag className="w-6 h-6 text-[#ff950e]" />
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
  );
}
