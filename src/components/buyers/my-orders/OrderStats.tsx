// src/components/buyers/my-orders/OrderStats.tsx
'use client';

import React from 'react';
import { Clock, Truck, DollarSign } from 'lucide-react';
import { OrderStats as StatsType } from '@/hooks/useMyOrders';

interface OrderStatsProps {
  stats: StatsType;
}

export default function OrderStats({ stats }: OrderStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Total Spent Card */}
      <div className="bg-gradient-to-br from-[#ff950e]/10 via-[#ff950e]/5 to-transparent p-5 md:p-6 rounded-xl border border-[#ff950e]/20 hover:border-[#ff950e]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff950e]/10 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#ff950e] text-sm font-medium mb-1">Total Spent</p>
            <p className="text-white text-2xl md:text-3xl font-bold">${stats.totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-[#ff950e]/20 to-[#ff950e]/10 p-3 md:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="w-7 h-7 md:w-8 md:h-8 text-[#ff950e]" />
          </div>
        </div>
      </div>

      {/* Pending Orders Card */}
      <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent p-5 md:p-6 rounded-xl border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-400 text-sm font-medium mb-1">Pending Orders</p>
            <p className="text-white text-2xl md:text-3xl font-bold">{stats.pendingOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 p-3 md:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-7 h-7 md:w-8 md:h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Shipped Orders Card */}
      <div className="bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent p-5 md:p-6 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-400 text-sm font-medium mb-1">Shipped Orders</p>
            <p className="text-white text-2xl md:text-3xl font-bold">{stats.shippedOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 p-3 md:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Truck className="w-7 h-7 md:w-8 md:h-8 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
