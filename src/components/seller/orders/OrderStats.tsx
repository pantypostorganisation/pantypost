// src/components/seller/orders/OrderStats.tsx
'use client';

import React from 'react';
import { Gavel, Settings, ShoppingBag } from 'lucide-react';

interface OrderStatsProps {
  auctionCount: number;
  customRequestCount: number;
  standardCount: number;
}

export default function OrderStats({ auctionCount, customRequestCount, standardCount }: OrderStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Auction Orders */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-purple-600/20 p-3 rounded-lg">
            <Gavel className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-3xl font-bold text-purple-300">{auctionCount}</span>
        </div>
        <h3 className="text-purple-200 font-semibold">Auction Orders</h3>
        <p className="text-purple-300/70 text-sm mt-1">Won through bidding</p>
      </div>

      {/* Custom Requests */}
      <div className="bg-gradient-to-br from-blue-900/20 to-cyan-800/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-blue-600/20 p-3 rounded-lg">
            <Settings className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-3xl font-bold text-blue-300">{customRequestCount}</span>
        </div>
        <h3 className="text-blue-200 font-semibold">Custom Requests</h3>
        <p className="text-blue-300/70 text-sm mt-1">Special orders</p>
      </div>

      {/* Direct Sales */}
      <div className="bg-gradient-to-br from-[#ff950e]/20 to-[#e0850d]/10 border border-[#ff950e]/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-[#ff950e]/20 p-3 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-[#ff950e]" />
          </div>
          <span className="text-3xl font-bold text-[#ff950e]">{standardCount}</span>
        </div>
        <h3 className="text-orange-200 font-semibold">Direct Sales</h3>
        <p className="text-orange-300/70 text-sm mt-1">Standard purchases</p>
      </div>
    </div>
  );
}
