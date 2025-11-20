// src/components/buyers/my-orders/OrderSections.tsx
'use client';

import React from 'react';
import { ShoppingBag, Settings, Gavel, Package } from 'lucide-react';
import OrderCard from './OrderCard';
import { Order } from '@/context/WalletContext';

interface OrderSectionsProps {
  directOrders: Order[];
  customRequestOrders: Order[];
  auctionOrders: Order[];
  expandedOrder: string | null;
  onToggleExpanded: (orderId: string | null) => void;
  onOpenAddressModal: (orderId: string) => void;
}

export default function OrderSections({
  directOrders,
  customRequestOrders,
  auctionOrders,
  expandedOrder,
  onToggleExpanded,
  onOpenAddressModal,
}: OrderSectionsProps) {
  const totalOrders = directOrders.length + customRequestOrders.length + auctionOrders.length;

  const sections: Array<{
    id: 'direct' | 'custom' | 'auction';
    title: string;
    icon: React.ComponentType<any>;
    orders: Order[];
  }> = [
    { id: 'direct', title: 'Direct purchases', icon: ShoppingBag, orders: directOrders },
    { id: 'custom', title: 'Custom requests', icon: Settings, orders: customRequestOrders },
    { id: 'auction', title: 'Auction wins', icon: Gavel, orders: auctionOrders },
  ];

  if (totalOrders === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-[var(--color-card)] p-8 text-center text-neutral-400">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/60">
            <Package className="h-5 w-5" />
          </span>
          <p className="text-sm">No orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {sections.map(({ id, title, icon: Icon, orders }) => (
        <section key={id} className="mb-10 last:mb-0">
          <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-white">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 truncate">{title}</span>
            <span className="text-sm font-medium text-neutral-400">{orders.length}</span>
          </h2>

          {orders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <OrderCard
                  key={`${order.id}-${order.date}`}
                  order={order}
                  type={id}
                  isExpanded={expandedOrder === order.id}
                  onToggleExpanded={onToggleExpanded}
                  onOpenAddressModal={onOpenAddressModal}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-800 bg-[var(--color-card)] p-6 text-neutral-400">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4" />
                <span>No orders yet.</span>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
