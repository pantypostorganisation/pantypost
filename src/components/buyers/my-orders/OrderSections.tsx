// src/components/buyers/my-orders/OrderSections.tsx
'use client';

import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'all' | 'purchases' | 'custom' | 'auctions'>('all');
  
  // Combine all orders
  const allOrders = [...directOrders, ...customRequestOrders, ...auctionOrders];

  if (allOrders.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No orders yet</h3>
        <p className="text-gray-500">Your purchases will appear here</p>
      </div>
    );
  }

  // Determine which orders to show based on active tab
  const shouldShowOrder = (type: 'direct' | 'custom' | 'auction') => {
    if (activeTab === 'all') return true;
    if (activeTab === 'purchases' && type === 'direct') return true;
    if (activeTab === 'custom' && type === 'custom') return true;
    if (activeTab === 'auctions' && type === 'auction') return true;
    return false;
  };

  return (
    <div className="space-y-8">
      {/* Tab-style navigation */}
      <div className="flex gap-6 border-b border-gray-800 pb-4">
        <button 
          onClick={() => setActiveTab('all')}
          className={`font-medium pb-2 transition-colors ${
            activeTab === 'all' 
              ? 'text-white border-b-2 border-[#ff950e]' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Orders ({allOrders.length})
        </button>
        
        {directOrders.length > 0 && (
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`font-medium pb-2 transition-colors ${
              activeTab === 'purchases' 
                ? 'text-white border-b-2 border-[#ff950e]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Purchases ({directOrders.length})
          </button>
        )}
        
        {customRequestOrders.length > 0 && (
          <button 
            onClick={() => setActiveTab('custom')}
            className={`font-medium pb-2 transition-colors ${
              activeTab === 'custom' 
                ? 'text-white border-b-2 border-[#ff950e]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Custom ({customRequestOrders.length})
          </button>
        )}
        
        {auctionOrders.length > 0 && (
          <button 
            onClick={() => setActiveTab('auctions')}
            className={`font-medium pb-2 transition-colors ${
              activeTab === 'auctions' 
                ? 'text-white border-b-2 border-[#ff950e]' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Auctions ({auctionOrders.length})
          </button>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {/* Direct Purchases */}
        {shouldShowOrder('direct') && directOrders.map((order) => (
          <div 
            key={`${order.id}-${order.date}`}
            className="bg-gradient-to-br from-black via-[#080808]/90 via-[#0a0a0a]/80 via-[#0c0c0c]/70 to-[#111111] rounded-lg hover:from-[#030303] hover:via-[#0a0a0a] hover:to-[#131313] transition-all"
          >
            <OrderCard
              order={order}
              type="direct"
              isExpanded={expandedOrder === order.id}
              onToggleExpanded={onToggleExpanded}
              onOpenAddressModal={onOpenAddressModal}
            />
          </div>
        ))}

        {/* Custom Requests */}
        {shouldShowOrder('custom') && customRequestOrders.map((order) => (
          <div 
            key={`${order.id}-${order.date}`}
            className="bg-gradient-to-br from-black via-[#080808]/90 via-[#0a0a0a]/80 via-[#0c0c0c]/70 to-[#111111] rounded-lg hover:from-[#030303] hover:via-[#0a0a0a] hover:to-[#131313] transition-all relative"
          >
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full font-medium backdrop-blur-sm">
                Custom Request
              </span>
            </div>
            <OrderCard
              order={order}
              type="custom"
              isExpanded={expandedOrder === order.id}
              onToggleExpanded={onToggleExpanded}
              onOpenAddressModal={onOpenAddressModal}
            />
          </div>
        ))}

        {/* Auction Wins */}
        {shouldShowOrder('auction') && auctionOrders.map((order) => (
          <div 
            key={`${order.id}-${order.date}`}
            className="bg-gradient-to-br from-black via-[#080808]/90 via-[#0a0a0a]/80 via-[#0c0c0c]/70 to-[#111111] rounded-lg hover:from-[#030303] hover:via-[#0a0a0a] hover:to-[#131313] transition-all relative overflow-hidden"
          >
            {order.wasAuction && !order.deliveryAddress && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-950/30 to-emerald-950/20 border-b border-green-900/30 px-4 py-2 backdrop-blur-sm">
                <p className="text-green-400 text-sm font-medium">
                  🏆 Auction Won - Add delivery address
                </p>
              </div>
            )}
            <div className={order.wasAuction && !order.deliveryAddress ? 'pt-8' : ''}>
              <OrderCard
                order={order}
                type="auction"
                isExpanded={expandedOrder === order.id}
                onToggleExpanded={onToggleExpanded}
                onOpenAddressModal={onOpenAddressModal}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
