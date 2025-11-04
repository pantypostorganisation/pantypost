// src/components/seller/orders/OrdersSection.tsx
'use client';

import React from 'react';
import { Order } from '@/context/WalletContext';
import OrderCard from './OrderCard';
import { ShoppingBag } from 'lucide-react';

interface OrdersSectionProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  orders: Order[];
  type: 'auction' | 'direct' | 'custom';
  expandedOrder: string | null;
  onToggleExpand: (orderId: string) => void;
  renderAddressBlock: (order: Order) => React.ReactNode;
  renderShippingControls: (order: Order) => React.ReactNode;
  getShippingStatusBadge: (status?: string) => React.ReactNode;
  showEmptyState?: boolean;
  totalCount?: number;
  filterActive?: boolean;
}

export default function OrdersSection({
  title,
  icon: Icon,
  iconColor,
  orders,
  type,
  expandedOrder,
  onToggleExpand,
  renderAddressBlock,
  renderShippingControls,
  getShippingStatusBadge,
  showEmptyState = false,
  totalCount,
  filterActive = false,
}: OrdersSectionProps) {
  const hasOrders = orders.length > 0;
  const shouldRender = hasOrders || showEmptyState || filterActive;

  if (!shouldRender) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-gray-950/40 p-6">
      <div className="flex flex-col gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center text-white">
          <div className={`bg-gradient-to-r ${iconColor} mr-3 rounded-2xl p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
            <p className="text-sm text-white/60">
              {typeof totalCount === 'number' ? (
                <>
                  {orders.length} showing{filterActive && ` of ${totalCount}`} {totalCount === 1 ? 'order' : 'orders'}
                </>
              ) : (
                <>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</>
              )}
            </p>
          </div>
        </div>
        {filterActive && (
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Filter applied
          </span>
        )}
      </div>

      {!hasOrders ? (
        showEmptyState ? (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/5">
              <ShoppingBag className="h-10 w-10 text-white/30" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white/80">No direct sales to fulfil yet</p>
            <p className="mt-2 text-sm text-white/50">Orders will appear here when buyers purchase your items.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-sm text-white/60">
            No orders match the current filters.
          </div>
        )
      ) : (
        <ul className="space-y-6">
          {orders.map((order, index) => (
            <OrderCard
              key={order.id || `${type}-order-${index}`}
              order={order}
              type={type}
              isExpanded={expandedOrder === order.id}
              onToggleExpand={() => onToggleExpand(order.id)}
              renderAddressBlock={renderAddressBlock}
              renderShippingControls={renderShippingControls}
              getShippingStatusBadge={getShippingStatusBadge}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
