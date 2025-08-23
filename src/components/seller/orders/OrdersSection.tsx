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
}: OrdersSectionProps) {
  if (orders.length === 0 && !showEmptyState) {
    return null;
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
        <div className={`bg-gradient-to-r ${iconColor} p-2 rounded-lg mr-3 shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {title} ({orders.length})
      </h2>

      {orders.length === 0 && showEmptyState ? (
        <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-700">
          <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-xl mb-2">No direct sales to fulfill yet</p>
          <p className="text-gray-500">Orders will appear here when buyers purchase your items</p>
        </div>
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
