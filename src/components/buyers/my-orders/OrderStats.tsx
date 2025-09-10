// src/components/buyers/my-orders/OrderStats.tsx
'use client';

import React from 'react';
import { Clock, Truck } from 'lucide-react';
import { OrderStats as StatsType } from '@/hooks/useMyOrders';

interface OrderStatsProps {
  stats: StatsType;
}

export default function OrderStats({ stats }: OrderStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-gradient-to-br from-yellow-500/15 to-amber-500/15 p-6 rounded-xl border border-yellow-500/40 hover:border-yellow-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-400 text-sm font-medium">Pending Orders</p>
            <p className="text-white text-2xl font-bold">{stats.pendingOrders}</p>
          </div>
          <div className="bg-yellow-500/25 p-3 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/15 to-sky-500/15 p-6 rounded-xl border border-blue-500/40 hover:border-blue-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-400 text-sm font-medium">Shipped Orders</p>
            <p className="text-white text-2xl font-bold">{stats.shippedOrders}</p>
          </div>
          <div className="bg-blue-500/25 p-3 rounded-lg">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
