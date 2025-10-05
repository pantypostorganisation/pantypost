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
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 bg-black/40 p-12 text-center text-gray-400">
        <Package className="h-16 w-16 text-white/20" />
        <h3 className="text-2xl font-semibold text-white/80">No orders yet</h3>
        <p className="max-w-md text-sm text-gray-500">
          Your direct purchases, custom requests, and auction wins will appear here once you start shopping.
        </p>
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
    { id: 'all', label: 'All orders', count: allOrders.length, icon: ShoppingBag, gradient: 'from-[#ff950e]/35 to-[#ff7a00]/30', iconBg: 'bg-[#ff950e]/15 text-[#ffb469]' },
    { id: 'purchases', label: 'Direct', count: directOrders.length, icon: Package, show: directOrders.length > 0, gradient: 'from-emerald-500/25 to-teal-500/25', iconBg: 'bg-emerald-500/15 text-emerald-300' },
    { id: 'custom', label: 'Custom', count: customRequestOrders.length, icon: Settings, show: customRequestOrders.length > 0, gradient: 'from-sky-500/25 to-cyan-500/20', iconBg: 'bg-sky-500/15 text-sky-300' },
    { id: 'auctions', label: 'Auctions', count: auctionOrders.length, icon: Gavel, show: auctionOrders.length > 0, gradient: 'from-purple-500/25 to-violet-500/20', iconBg: 'bg-purple-500/15 text-purple-300' },
  ] as const;

  const activeTabConfig = tabConfig.find((tab) => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Enhanced Tab Navigation */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {tabConfig.map((tab) => {
              if (tab.show === false) return null;
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-[0_18px_45px_-35px_rgba(255,149,14,0.8)]`
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tab.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-sm font-semibold capitalize">{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-xs text-gray-400">
          <span>
            Showing{' '}
            <span className="font-semibold text-white">{activeTabConfig?.count ?? allOrders.length}</span>{' '}
            order{(activeTabConfig?.count ?? allOrders.length) === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-widest text-gray-300">
            Sorted by most recent
          </span>
        </div>
      </div>

      {/* Orders List with improved spacing */}
      <div className="space-y-4">
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
