// src/components/buyers/my-orders/OrderDetails.tsx
'use client';

import React from 'react';
import { Tag, MapPin, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '@/context/WalletContext';

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
      {order.tags && order.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-400 sm:text-xs">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1">
            <Tag className="h-4 w-4 text-white/60" />
            <span className="opacity-80">
              {order.tags.slice(0, 2).join(', ')}
              {order.tags.length > 2 && ` +${order.tags.length - 2}`}
            </span>
          </div>
        </div>
      )}

      {/* Type-specific highlight - More subtle */}
      {isAuction && (
        <div className="mt-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm text-purple-100">
          Winning bid
          <span className="ml-2 font-semibold text-white">${order.finalBid?.toFixed(2) || order.price.toFixed(2)}</span>
        </div>
      )}

      {isCustom && order.originalRequestId && (
        <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-100">
          Custom Request •
          <span className="ml-2 font-mono text-xs text-sky-200/80">#{order.originalRequestId.slice(0, 8)}</span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {!hasDeliveryAddress ? (
          <button
            onClick={() => onOpenAddressModal(order.id)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3.5 py-1.5 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-300/60 hover:bg-amber-500/15 sm:w-auto sm:justify-start"
          >
            <MapPin className="h-4 w-4" />
            Confirm delivery address
          </button>
        ) : (
          <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-semibold text-emerald-200 sm:w-auto sm:justify-start">
            <CheckCircle className="h-4 w-4" />
            Address confirmed
          </div>
        )}

        <button
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors sm:w-auto sm:justify-start ${
            isExpanded
              ? 'text-gray-300 hover:text-white'
              : 'bg-[#ff950e]/15 text-[#ffb469] hover:bg-[#ff950e]/25'
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
