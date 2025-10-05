// src/components/buyers/dashboard/StatsGrid.tsx
'use client';

import type { ReactNode } from 'react';
import { DollarSign, ShoppingBag, MessageCircle, Crown } from 'lucide-react';
import { StatsGridProps } from '@/types/dashboard';

export default function StatsGrid({ stats }: StatsGridProps) {
  const totalSpent = Number(stats?.totalSpent) || 0;
  const totalOrders = Number(stats?.totalOrders) || 0;
  const activeSubscriptions = Number(stats?.activeSubscriptions) || 0;
  const unreadMessages = Number(stats?.unreadMessages) || 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={<DollarSign className="h-4 w-4" />}
        iconTone="bg-[#ff950e]/15 text-[#ffb347]"
        label="Total spent"
        value={`$${totalSpent.toFixed(2)}`}
        supporting="Across all orders"
      />
      <StatCard
        icon={<ShoppingBag className="h-4 w-4" />}
        iconTone="bg-purple-500/15 text-purple-200"
        label="Total orders"
        value={totalOrders.toString()}
        supporting="Completed purchases"
      />
      <StatCard
        icon={<Crown className="h-4 w-4" />}
        iconTone="bg-amber-500/15 text-amber-200"
        label="Subscriptions"
        value={activeSubscriptions.toString()}
        supporting="Active plans"
      />
      <StatCard
        icon={<MessageCircle className="h-4 w-4" />}
        iconTone="bg-blue-500/15 text-blue-200"
        label="Unread messages"
        value={unreadMessages.toString()}
        supporting="Sellers awaiting replies"
      />
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  iconTone: string;
  label: string;
  value: string;
  supporting: string;
}

function StatCard({ icon, iconTone, label, value, supporting }: StatCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1b1b]/95 to-[#0f0f0f]/95 p-5 shadow-[0_14px_40px_-24px_rgba(0,0,0,0.8)] transition">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
        <div className="absolute inset-0 bg-[#ff950e]/5" />
      </div>
      <div className="relative flex items-center justify-between">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${iconTone}`}>{icon}</span>
      </div>
      <p className="relative mt-6 text-2xl font-semibold text-white">{value}</p>
      <p className="relative mt-1 text-sm text-gray-300">{label}</p>
      <p className="relative mt-4 text-xs text-gray-500">{supporting}</p>
    </article>
  );
}
