// src/components/buyers/my-orders/OrderStats.tsx
'use client';

import React from 'react';
import { OrderStats as StatsType } from '@/hooks/useMyOrders';

/* =====================================================================
 * Was: three rounded-3xl cards, each with a 56px icon tile, an uppercase
 * label, a big number AND a sentence of explanation ("Includes platform
 * fees and credits redeemed"), in three different colour families --
 * orange, yellow and sky.
 *
 * Three numbers do not need three cards, three icons, three colours and
 * three paragraphs. Same one-line treatment as the dashboard, so the two
 * pages read as the same product.
 * ===================================================================== */

interface OrderStatsProps {
 stats: StatsType;
}

export default function OrderStats({ stats }: OrderStatsProps) {
 const money = (value: number) =>
 new Intl.NumberFormat('en-US', {
 style: 'currency',
 currency: 'USD',
 maximumFractionDigits: value >= 1000 ? 0 : 2,
 }).format(value);

 return (
 <div className="grid grid-cols-3 gap-4 border-y border-line py-5">
 <div>
 <p className="text-lg font-bold tabular-nums text-white sm:text-xl">
 {money(stats.totalSpent)}
 </p>
 <p className="text-xs text-ink-faint">Total spent</p>
 </div>
 <div>
 <p className="text-lg font-bold tabular-nums text-white sm:text-xl">{stats.pendingOrders}</p>
 <p className="text-xs text-ink-faint">Pending</p>
 </div>
 <div>
 <p className="text-lg font-bold tabular-nums text-white sm:text-xl">{stats.shippedOrders}</p>
 <p className="text-xs text-ink-faint">Shipped</p>
 </div>
 </div>
 );
}
