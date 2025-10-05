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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      {/* Total Spent Card */}
      <div className="rounded-3xl border border-[#ff950e]/30 bg-black/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#ffb469]">Total spent</p>
            <p className="mt-2 text-3xl font-bold text-white">${stats.totalSpent.toFixed(2)}</p>
            <p className="mt-1 text-xs text-[#ffb469]/80">Includes platform fees and credits redeemed</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff950e]/50 bg-[#ff950e]/15 text-[#ff950e]">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Pending Orders Card */}
      <div className="rounded-3xl border border-yellow-400/25 bg-black/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-yellow-200/80">Pending orders</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.pendingOrders}</p>
            <p className="mt-1 text-xs text-yellow-100/70">Awaiting seller confirmation or shipment</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-300/50 bg-yellow-300/15 text-yellow-200">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Shipped Orders Card */}
      <div className="rounded-3xl border border-sky-400/25 bg-black/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-sky-200/80">Shipped orders</p>
            <p className="mt-2 text-3xl font-bold text-white">{stats.shippedOrders}</p>
            <p className="mt-1 text-xs text-sky-100/70">In transit and ready for doorstep delivery</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/50 bg-sky-300/15 text-sky-200">
            <Truck className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
