// src/components/buyers/my-orders/OrderSections.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import OrderCard from './OrderCard';
import { Order } from '@/context/WalletContext';

/* =====================================================================
 * Was: three separate sections -- "Direct purchases", "Custom requests",
 * "Auction wins" -- each with its own heading, icon tile, count and
 * empty state. Three orders could therefore produce three headings with
 * one card each, and an order you were looking for could be under any of
 * them depending on how you happened to buy it.
 *
 * Now: ONE list, newest first, which is how people actually look for an
 * order ("the one I bought on Tuesday"). The kind of purchase becomes a
 * small tag on the row, and a filter appears only once there is
 * something to filter.
 * ===================================================================== */

type OrderKind = 'direct' | 'custom' | 'auction';

interface OrderSectionsProps {
  directOrders: Order[];
  customRequestOrders: Order[];
  auctionOrders: Order[];
  expandedOrder: string | null;
  onToggleExpanded: (orderId: string | null) => void;
  onOpenAddressModal: (orderId: string) => void;
}

const FILTERS: Array<{ id: OrderKind | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'direct', label: 'Purchases' },
  { id: 'custom', label: 'Custom' },
  { id: 'auction', label: 'Auctions' },
];

export default function OrderSections({
  directOrders,
  customRequestOrders,
  auctionOrders,
  expandedOrder,
  onToggleExpanded,
  onOpenAddressModal,
}: OrderSectionsProps) {
  const [filter, setFilter] = useState<OrderKind | 'all'>('all');

  const all = useMemo(() => {
    const tagged: Array<{ order: Order; kind: OrderKind }> = [
      ...directOrders.map((order) => ({ order, kind: 'direct' as const })),
      ...customRequestOrders.map((order) => ({ order, kind: 'custom' as const })),
      ...auctionOrders.map((order) => ({ order, kind: 'auction' as const })),
    ];
    // Newest first: one chronological list is how an order is looked for.
    return tagged.sort(
      (a, b) => new Date(b.order.date).getTime() - new Date(a.order.date).getTime()
    );
  }, [directOrders, customRequestOrders, auctionOrders]);

  const visible = filter === 'all' ? all : all.filter((item) => item.kind === filter);

  // The filter row earns its place only when there is a mix to filter.
  const kindsPresent = new Set(all.map((item) => item.kind));
  const showFilters = all.length > 3 && kindsPresent.size > 1;

  if (all.length === 0) {
    return (
      <div className="rounded-md border border-line bg-surface-raised px-6 py-12 text-center">
        <Package className="mx-auto mb-3 h-6 w-6 text-ink-faint" aria-hidden="true" />
        <p className="text-sm text-ink-muted">No orders yet.</p>
      </div>
    );
  }

  return (
    <div>
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map(({ id, label }) => {
            const count = id === 'all' ? all.length : all.filter((i) => i.kind === id).length;
            if (count === 0) return null;
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-primary bg-primary text-black'
                    : 'border-line bg-surface-raised text-ink-muted hover:border-primary-line hover:text-ink'
                }`}
              >
                {label} {count}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ order, kind }) => (
          <OrderCard
            key={`${order.id}-${order.date}`}
            order={order}
            type={kind}
            isExpanded={expandedOrder === order.id}
            onToggleExpanded={onToggleExpanded}
            onOpenAddressModal={onOpenAddressModal}
          />
        ))}
      </div>
    </div>
  );
}
