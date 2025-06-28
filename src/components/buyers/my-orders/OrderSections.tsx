// src/components/buyers/my-orders/OrderSections.tsx
'use client';

import React from 'react';
import { ShoppingBag, Settings, Gavel } from 'lucide-react';
import OrderCard from './OrderCard';
import { Order } from '@/context/WalletContext.enhanced';

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
  return (
    <>
      {/* Direct Purchases - TOP PRIORITY */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
          <div className="bg-gradient-to-r from-[#ff950e] to-[#e0850d] p-2 rounded-lg mr-3 shadow-lg">
            <ShoppingBag className="w-6 h-6 text-black" />
          </div>
          Direct Purchases ({directOrders.length})
        </h2>
        {directOrders.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-700">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl mb-2">No direct purchases yet</p>
            <p className="text-gray-500">Items you buy directly from the browse page will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {directOrders.map((order) => (
              <OrderCard
                key={`${order.id}-${order.date}`}
                order={order}
                type="direct"
                isExpanded={expandedOrder === order.id}
                onToggleExpanded={onToggleExpanded}
                onOpenAddressModal={onOpenAddressModal}
              />
            ))}
          </div>
        )}
      </section>

      {/* Custom Request Orders Section - SECOND */}
      {customRequestOrders.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg mr-3 shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            Custom Request Orders ({customRequestOrders.length})
          </h2>
          <div className="space-y-6">
            {customRequestOrders.map((order) => (
              <OrderCard
                key={`${order.id}-${order.date}`}
                order={order}
                type="custom"
                isExpanded={expandedOrder === order.id}
                onToggleExpanded={onToggleExpanded}
                onOpenAddressModal={onOpenAddressModal}
              />
            ))}
          </div>
        </section>
      )}

      {/* Auction Purchases Section - LAST */}
      {auctionOrders.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-2 rounded-lg mr-3 shadow-lg">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            Auction Purchases ({auctionOrders.length})
          </h2>
          <div className="space-y-6">
            {auctionOrders.map((order) => (
              <OrderCard
                key={`${order.id}-${order.date}`}
                order={order}
                type="auction"
                isExpanded={expandedOrder === order.id}
                onToggleExpanded={onToggleExpanded}
                onOpenAddressModal={onOpenAddressModal}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
