// src/components/buyers/my-orders/OrderCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { useListings } from '@/context/ListingContext';
import { getUserProfilePic } from '@/utils/profileUtils';
import OrderHeader from './OrderHeader';
import OrderDetails from './OrderDetails';
import ExpandedOrderContent from './ExpandedOrderContent';
import { formatOrderDate, getOrderStyles, getShippingStatusBadge } from '@/utils/orderUtils';
import { Calendar } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  isExpanded: boolean;
  onToggleExpanded: (orderId: string | null) => void;
  onOpenAddressModal: (orderId: string) => void;
}

export default function OrderCard({
  order,
  type,
  isExpanded,
  onToggleExpanded,
  onOpenAddressModal,
}: OrderCardProps) {
  const { users } = useListings();
  const styles = getOrderStyles(type);

  const [sellerProfilePic, setSellerProfilePic] = useState<string | null>(null);

  const sellerUser = users?.[order.seller ?? ''];
  const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
  const hasDeliveryAddress = !!order.deliveryAddress;
  const totalPaid = (order.markedUpPrice ?? order.price ?? 0).toFixed(2);

  useEffect(() => {
    const loadProfilePic = async () => {
      if (order.seller) {
        const pic = await getUserProfilePic(order.seller);
        setSellerProfilePic(pic);
      }
    };
    loadProfilePic();
  }, [order.seller]);

  const fallbackOrder = order as { _id?: string };
  const orderId = order.id || fallbackOrder._id || `order-${Date.now()}`;
  const needsAddress = order.wasAuction && !hasDeliveryAddress;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-black/25 transition-colors duration-300 ${
        isExpanded ? 'bg-black/40' : 'hover:bg-black/35'
      } ${styles.borderStyle}`}
    >
      {/* Action indicator */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 ${
          type === 'auction'
            ? 'bg-purple-500'
            : type === 'custom'
              ? 'bg-sky-400'
              : 'bg-[#ff950e]'
        }`}
      />

      <div className="absolute right-4 top-4 z-20 flex flex-col items-end gap-3 text-right">
        <div className="flex flex-col items-end text-right">
          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Total paid</span>
          <span className="text-xl font-bold" style={{ color: styles.accentColor }}>
            ${totalPaid}
          </span>
          <span className="text-[10px] text-gray-500">Includes seller payout & platform fee</span>
        </div>

        <div className="flex flex-col items-end gap-2 text-right text-[10px] text-gray-400 sm:text-xs">
          {getShippingStatusBadge(order.shippingStatus)}

          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1">
            <Calendar className="h-3.5 w-3.5 text-white/60" />
            <span>{formatOrderDate(order.date)}</span>
          </div>
        </div>

        {/* Auction action badge */}
        {order.wasAuction && needsAddress && (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="text-base">🏆</span>
            <span>Confirm address</span>
          </div>
        )}
      </div>

      <div className="relative z-10 p-4 sm:p-5">
        <OrderHeader order={order} type={type} styles={styles} />

        <OrderDetails
          order={order}
          type={type}
          hasDeliveryAddress={hasDeliveryAddress}
          isExpanded={isExpanded}
          onOpenAddressModal={onOpenAddressModal}
          onToggleExpanded={() => onToggleExpanded(orderId)}
        />
      </div>

      {isExpanded && (
        <ExpandedOrderContent
          order={order}
          type={type}
          sellerProfilePic={sellerProfilePic}
          isSellerVerified={isSellerVerified}
        />
      )}
    </div>
  );
}
