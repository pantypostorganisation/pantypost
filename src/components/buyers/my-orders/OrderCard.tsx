// src/components/buyers/my-orders/OrderCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Order } from '@/types/order';
import { useListings } from '@/context/ListingContext';
import { getUserProfilePic } from '@/utils/profileUtils';
import OrderHeader from './OrderHeader';
import OrderDetails from './OrderDetails';
import ExpandedOrderContent from './ExpandedOrderContent';
import { formatOrderDate, getOrderStyles } from '@/utils/orderUtils';

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

  const orderId = order.id || (order as any)._id || `order-${Date.now()}`;
  const needsAddress = order.wasAuction && !hasDeliveryAddress;

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isExpanded
          ? `bg-black/45 shadow-[0_35px_90px_-40px_rgba(0,0,0,0.85)] ${styles.borderStyle}`
          : `bg-black/35 ${styles.borderStyle} hover:-translate-y-1 hover:shadow-[0_40px_95px_-45px_rgba(0,0,0,0.9)]`
      }`}
    >
      <div className={`pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br ${styles.gradientStyle}`} />
      <div className="absolute inset-0 bg-black/30" />

      {/* Accent border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5"
        aria-hidden
      />

      {/* Action indicator */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${
          type === 'auction'
            ? 'from-purple-500 via-purple-400 to-violet-500'
            : type === 'custom'
              ? 'from-blue-500 via-sky-400 to-cyan-500'
              : 'from-[#ff950e] via-[#ffb469] to-orange-500'
        }`}
      />

      {/* Auction action badge */}
      {order.wasAuction && needsAddress && (
        <div className="absolute right-6 top-6 z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-200 shadow-[0_12px_30px_-20px_rgba(16,185,129,0.8)]">
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
