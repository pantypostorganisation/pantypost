// src/components/buyers/my-orders/OrderSections.tsx
'use client';

import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'all' | 'purchases' | 'custom' | 'auctions'>('all');
  
  const allOrders = [...directOrders, ...customRequestOrders, ...auctionOrders];

  if (allOrders.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="w-20 h-20 text-gray-700 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-400 mb-2">No orders yet</h3>
        <p className="text-gray-600">Your purchases will appear here</p>
      </div>
    );
  }

  const shouldShowOrder = (type: 'direct' | 'custom' | 'auction') => {
    if (activeTab === 'all') return true;
    if (activeTab === 'purchases' && type === 'direct') return true;
    if (activeTab === 'custom' && type === 'custom') return true;
    if (activeTab === 'auctions' && type === 'auction') return true;
    return false;
  };

  const tabConfig = [
    { id: 'all', label: 'All Orders', count: allOrders.length, icon: ShoppingBag },
    { id: 'purchases', label: 'Direct', count: directOrders.length, icon: Package, show: directOrders.length > 0 },
    { id: 'custom', label: 'Custom', count: customRequestOrders.length, icon: Settings, show: customRequestOrders.length > 0 },
    { id: 'auctions', label: 'Auctions', count: auctionOrders.length, icon: Gavel, show: auctionOrders.length > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation */}
      <div className="relative">
        <div className="flex gap-1 p-1 bg-black/40 rounded-xl">
          {tabConfig.map((tab) => {
            if (tab.show === false) return null;
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                  font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-[#ff950e]/20 text-[#ff950e] shadow-lg' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold
                  ${isActive ? 'bg-[#ff950e]/30' : 'bg-white/10'}
                `}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List with improved spacing */}
      <div className="space-y-3">
        {shouldShowOrder('direct') && directOrders.map((order) => (
          <OrderCard
            key={`${order.id}-${order.date}`}
            order={order}
            type="direct"
            isExpanded={expandedOrder === order.id}
            onToggleExpanded={onToggleExpanded}
            onOpenAddressModal={onOpenAddressModal}
          />
        ))}

        {shouldShowOrder('custom') && customRequestOrders.map((order) => (
          <OrderCard
            key={`${order.id}-${order.date}`}
            order={order}
            type="custom"
            isExpanded={expandedOrder === order.id}
            onToggleExpanded={onToggleExpanded}
            onOpenAddressModal={onOpenAddressModal}
          />
        ))}

        {shouldShowOrder('auction') && auctionOrders.map((order) => (
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
    </div>
  );
}