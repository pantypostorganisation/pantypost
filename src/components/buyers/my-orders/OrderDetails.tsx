// src/components/buyers/my-orders/OrderDetails.tsx
'use client';

import React from 'react';
import { Calendar, Tag, MapPin, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '@/context/WalletContext';
import { formatOrderDate, getShippingStatusBadge } from '@/utils/orderUtils';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface OrderDetailsProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  hasDeliveryAddress: boolean;
  isExpanded: boolean;
  onOpenAddressModal: (orderId: string) => void;
  onToggleExpanded: (orderId: string | null) => void;
}

export default function OrderDetails({
  order,
  type,
  hasDeliveryAddress,
  isExpanded,
  onOpenAddressModal,
  onToggleExpanded,
}: OrderDetailsProps) {
  const isAuction = type === 'auction';
  const isCustom = type === 'custom';

  return (
    <>
      {/* Streamlined Meta Info */}
      <div className="flex flex-wrap items-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-4 h-4 opacity-60" />
          <span>{formatOrderDate(order.date)}</span>
        </div>
        
        {order.tags && order.tags.length > 0 && (
          <div className="flex items-center gap-2 text-gray-400">
            <Tag className="w-4 h-4 opacity-60" />
            <span className="opacity-80">
              {order.tags.slice(0, 2).join(', ')}
              {order.tags.length > 2 && ` +${order.tags.length - 2}`}
            </span>
          </div>
        )}

        {/* Inline status badge */}
        {getShippingStatusBadge(order.shippingStatus)}
      </div>

      {/* Type-specific highlight - More subtle */}
      {isAuction && (
        <div className="mt-4 pl-4 border-l-2 border-purple-500/30">
          <p className="text-sm text-purple-300">
            Winning bid: <span className="font-semibold">${order.finalBid?.toFixed(2) || order.price.toFixed(2)}</span>
          </p>
        </div>
      )}

      {isCustom && order.originalRequestId && (
        <div className="mt-4 pl-4 border-l-2 border-blue-500/30">
          <p className="text-sm text-blue-300">
            Custom Request • <span className="font-mono text-xs opacity-60">#{order.originalRequestId.slice(0, 8)}</span>
          </p>
        </div>
      )}

      {/* Simplified Actions Bar */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        {!hasDeliveryAddress ? (
          <button
            onClick={() => onOpenAddressModal(order.id)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all text-sm font-medium"
          >
            <MapPin className="w-4 h-4" />
            Add Delivery Address
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Address Confirmed</span>
          </div>
        )}
        
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
            isExpanded 
              ? 'text-gray-400 hover:text-white' 
              : 'text-[#ff950e] hover:bg-[#ff950e]/10'
          }`}
          onClick={() => onToggleExpanded(isExpanded ? null : order.id)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Less
            </>
          ) : (
            <>
              Details
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
