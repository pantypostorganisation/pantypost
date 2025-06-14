// src/components/buyers/dashboard/StatsGrid.tsx
'use client';

import { DollarSign, ShoppingBag, MessageCircle, Crown } from 'lucide-react';
import { StatsGridProps } from '@/types/dashboard';

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="w-6 h-6 text-[#ff950e]" />
        </div>
        <p className="text-2xl font-bold text-white">${stats.totalSpent.toFixed(2)}</p>
        <p className="text-sm text-gray-400 mt-1">Total Spent</p>
      </div>
      
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <ShoppingBag className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        <p className="text-sm text-gray-400 mt-1">Total Orders</p>
      </div>
      
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <Crown className="w-6 h-6 text-[#ff950e]" />
        </div>
        <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
        <p className="text-sm text-gray-400 mt-1">Subscriptions</p>
      </div>
      
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <MessageCircle className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-white">{stats.unreadMessages}</p>
        <p className="text-sm text-gray-400 mt-1">Unread Messages</p>
      </div>
    </div>
  );
}