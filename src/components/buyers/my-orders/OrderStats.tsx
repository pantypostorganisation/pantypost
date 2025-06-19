// src/components/buyers/my-orders/OrderStats.tsx
'use client';

import React from 'react';
import { DollarSign, Clock, Truck } from 'lucide-react';
import { OrderStats as StatsType } from '@/hooks/useMyOrders';

interface OrderStatsProps {
  stats: StatsType;
}

export default function OrderStats({ stats }: OrderStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 p-6 rounded-xl border border-[#ff950e]/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#ff950e] text-sm font-medium">Total Spent</p>
            <p className="text-white text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
          </div>
          <DollarSign className="w-8 h-8 text-[#ff950e] drop-shadow-lg drop-shadow-[#ff950e]/50" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 rounded-xl border border-yellow-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-300 text-sm font-medium">Pending Orders</p>
            <p className="text-white text-2xl font-bold">{stats.pendingOrders}</p>
          </div>
          <Clock className="w-8 h-8 text-yellow-400 drop-shadow-lg drop-shadow-yellow-400/50" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-300 text-sm font-medium">Shipped Orders</p>
            <p className="text-white text-2xl font-bold">{stats.shippedOrders}</p>
          </div>
          <Truck className="w-8 h-8 text-green-400 drop-shadow-lg drop-shadow-green-400/50" />
        </div>
      </div>
    </div>
  );
}