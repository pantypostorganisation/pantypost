// src/components/buyers/my-orders/OrderHeader.tsx
'use client';

import React from 'react';
import { Settings, Star } from 'lucide-react';
import { Order } from '@/context/WalletContext';
import { OrderStyles } from '@/utils/orderUtils';

interface OrderHeaderProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  styles: OrderStyles;
}

export default function OrderHeader({ order, type, styles }: OrderHeaderProps) {
  const isCustom = type === 'custom';
  const isAuction = type === 'auction';

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Product Image or Custom Request Icon */}
      <div className="relative">
        {isCustom ? (
          <div className="w-24 h-24 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border-2 border-blue-500/30 flex items-center justify-center shadow-lg">
            <Settings className="w-10 h-10 text-blue-400" />
          </div>
        ) : (
          <img
            src={order.imageUrl || '/default-image.jpg'}
            alt={order.title}
            className="w-24 h-24 object-cover rounded-xl border-2 border-gray-600 shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-image.jpg';
            }}
          />
        )}
        {styles.badgeContent}
      </div>

      {/* Order Title and Price */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-xl text-white truncate">{order.title}</h3>
            {isAuction && <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />}
            {isCustom && <Settings className="w-5 h-5 text-blue-400 flex-shrink-0" />}
          </div>
          
          <div className="bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-lg px-3 py-2 ml-4">
            <div className="text-xs text-[#ff950e]/80 font-medium text-center">Total Paid</div>
            <div className="text-[#ff950e] font-bold text-lg text-center">
              ${(order.markedUpPrice || order.price).toFixed(2)}
            </div>
          </div>
        </div>
        
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{order.description}</p>
      </div>
    </div>
  );
}
