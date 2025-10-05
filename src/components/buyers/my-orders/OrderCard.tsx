// src/components/buyers/my-orders/OrderCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { useListings } from '@/context/ListingContext';
import { getUserProfilePic } from '@/utils/profileUtils';
import OrderHeader from './OrderHeader';
import OrderDetails from './OrderDetails';
import ExpandedOrderContent from './ExpandedOrderContent';
import { getOrderStyles } from '@/utils/orderUtils';

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
      className={`relative overflow-hidden rounded-3xl border bg-black/35 transition-colors duration-300 ${
        isExpanded ? 'bg-black/45' : 'hover:bg-black/40'
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

      {/* Auction action badge */}
      {order.wasAuction && needsAddress && (
        <div className="absolute right-6 top-6 z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-200">
            <span className="text-base">🏆</span>
            <span>Confirm address</span>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 sm:p-8">
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
