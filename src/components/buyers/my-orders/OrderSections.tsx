// src/components/buyers/my-orders/OrderSections.tsx
'use client';

import React from 'react';
import { ShoppingBag, Settings, Gavel } from 'lucide-react';
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
  return (
    <>
      {/* Direct Purchases - TOP PRIORITY */}
      <section className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center text-white">
          <div className="bg-gradient-to-r from-[#ff950e] to-[#e0850d] p-1.5 rounded-md mr-2.5 shadow-md">
            <ShoppingBag className="w-5 h-5 text-black" />
          </div>
          <span className="leading-none">Direct Purchases ({directOrders.length})</span>
        </h2>

        {directOrders.length === 0 ? (
          <div className="text-center py-10 bg-gray-900/30 rounded-xl border border-gray-800">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-base mb-1">No direct purchases yet</p>
            <p className="text-gray-500 text-sm">Items you buy directly from the browse page will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
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
        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center text-white">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-1.5 rounded-md mr-2.5 shadow-md">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <span className="leading-none">Custom Request Orders ({customRequestOrders.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
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
        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center text-white">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-1.5 rounded-md mr-2.5 shadow-md">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <span className="leading-none">Auction Purchases ({auctionOrders.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
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