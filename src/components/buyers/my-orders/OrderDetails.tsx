// src/components/buyers/my-orders/OrderDetails.tsx
'use client';

import React from 'react';
import { Calendar, Tag, MapPin, CheckCircle, Eye, ChevronUp, Settings } from 'lucide-react';
import { Order } from '@/context/WalletContext.enhanced';
import { formatOrderDate, getShippingStatusBadge } from '@/utils/orderUtils';

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
      {/* Order Meta Info */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{formatOrderDate(order.date)}</span>
        </div>
        
        {order.tags && order.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">
              {order.tags.slice(0, 2).join(', ')}
              {order.tags.length > 2 && '...'}
            </span>
          </div>
        )}
      </div>

      {/* Order Type Specific Information */}
      {isAuction && (
        <div className="bg-purple-900/30 p-3 rounded-lg mb-4 border border-purple-700/50">
          <p className="text-sm font-semibold text-purple-300 mb-1">
            🏆 Winning bid: ${order.finalBid?.toFixed(2) || order.price.toFixed(2)}
          </p>
          <p className="text-xs text-purple-400/80">
            Auction won on {formatOrderDate(order.date)}
          </p>
        </div>
      )}

      {isCustom && (
        <div className="bg-blue-900/30 p-3 rounded-lg mb-4 border border-blue-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-semibold text-blue-300">Custom Request Order</p>
          </div>
          <p className="text-xs text-blue-400/80">
            Fulfilled on {formatOrderDate(order.date)}
          </p>
          {order.originalRequestId && (
            <p className="text-xs text-blue-400 mt-1 font-mono">
              ID: {order.originalRequestId.slice(0, 8)}...
            </p>
          )}
        </div>
      )}

      {/* Bottom Row - Status and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {getShippingStatusBadge(order.shippingStatus)}
          
          {hasDeliveryAddress ? (
            <div className="flex items-center gap-2 bg-green-900/30 px-3 py-1.5 rounded-lg border border-green-700/50">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-xs font-medium">Address confirmed</span>
            </div>
          ) : (
            <button
              onClick={() => onOpenAddressModal(order.id)}
              className="flex items-center gap-2 bg-yellow-900/30 hover:bg-yellow-800/50 px-3 py-1.5 rounded-lg border border-yellow-700/50 hover:border-yellow-600 text-yellow-300 hover:text-yellow-200 transition-all text-xs font-medium"
            >
              <MapPin className="w-4 h-4" />
              Add Address
            </button>
          )}
        </div>
        
        <button
          className="flex items-center gap-2 text-[#ff950e] bg-[#ff950e]/10 hover:bg-[#ff950e]/20 border border-[#ff950e]/30 hover:border-[#ff950e]/50 font-semibold px-4 py-2 rounded-lg transition-all text-sm"
          onClick={() => onToggleExpanded(isExpanded ? null : order.id)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Details
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              View Details
            </>
          )}
        </button>
      </div>
    </>
  );
}
