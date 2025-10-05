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
      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-gray-400 sm:text-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
          <Calendar className="h-4 w-4 text-white/60" />
          <span>{formatOrderDate(order.date)}</span>
        </div>

        {order.tags && order.tags.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <Tag className="h-4 w-4 text-white/60" />
            <span className="opacity-80">
              {order.tags.slice(0, 2).join(', ')}
              {order.tags.length > 2 && ` +${order.tags.length - 2}`}
            </span>
          </div>
        )}

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm">
          {getShippingStatusBadge(order.shippingStatus)}
        </div>
      </div>

      {/* Type-specific highlight - More subtle */}
      {isAuction && (
        <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-5 py-4 text-sm text-purple-100">
          Winning bid
          <span className="ml-2 font-semibold text-white">${order.finalBid?.toFixed(2) || order.price.toFixed(2)}</span>
        </div>
      )}

      {isCustom && order.originalRequestId && (
        <div className="mt-5 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-5 py-4 text-sm text-sky-100">
          Custom Request •
          <span className="ml-2 font-mono text-xs text-sky-200/80">#{order.originalRequestId.slice(0, 8)}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-4">
        {!hasDeliveryAddress ? (
          <button
            onClick={() => onOpenAddressModal(order.id)}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition-all hover:-translate-y-0.5 hover:border-amber-300/60 hover:bg-amber-500/15"
          >
            <MapPin className="h-4 w-4" />
            Confirm delivery address
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
            <CheckCircle className="h-4 w-4" />
            Address confirmed
          </div>
        )}

        <button
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
            isExpanded
              ? 'text-gray-300 hover:-translate-y-0.5 hover:text-white'
              : 'bg-gradient-to-r from-[#ff950e]/20 to-[#ff7a00]/20 text-[#ffb469] hover:-translate-y-0.5 hover:from-[#ff950e]/30 hover:to-[#ff7a00]/30'
          }`}
          onClick={() => onToggleExpanded(isExpanded ? null : order.id)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide details
            </>
          ) : (
            <>
              View details
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
