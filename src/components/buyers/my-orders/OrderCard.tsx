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
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

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
  const displayOrderId = order.id || fallbackOrder._id || '';
  const needsAddress = order.wasAuction && !hasDeliveryAddress;
  const statusBadge = getShippingStatusBadge(order.shippingStatus);

  const typeLabel =
    type === 'auction' ? 'Auction win' : type === 'custom' ? 'Custom request' : 'Direct purchase';

  return (
    <article
      className={`rounded-2xl border border-neutral-800 bg-[var(--color-card)] p-4 shadow-lg transition-colors duration-200 hover:border-neutral-700 hover:shadow-xl sm:p-5 ${styles.borderStyle}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold leading-tight text-white line-clamp-2">
              <SecureMessageDisplay content={order.title || 'Untitled order'} allowBasicFormatting={false} as="span" />
            </h3>
            <p className="text-xs font-mono text-neutral-500">
              {displayOrderId ? `#${String(displayOrderId).slice(0, 10)}` : 'Pending order'}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold" style={{ color: styles.accentColor }}>
            ${totalPaid}
          </span>
        </div>

        <dl className="text-sm text-neutral-300 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-neutral-400">Placed</dt>
            <dd className="text-white">{formatOrderDate(order.date)}</dd>
          </div>
          {statusBadge && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-neutral-400">Status</dt>
              <dd className="flex justify-end">{statusBadge}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <dt className="text-neutral-400">Type</dt>
            <dd className="font-medium" style={{ color: styles.accentColor }}>
              {typeLabel}
            </dd>
          </div>
        </dl>

        {needsAddress && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
            🏆 Confirm delivery address for this win
          </div>
        )}

        <div className="flex flex-col gap-4">
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
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
            <ExpandedOrderContent
              order={order}
              type={type}
              sellerProfilePic={sellerProfilePic}
              isSellerVerified={isSellerVerified}
            />
          </div>
        )}
      </div>
    </article>
  );
}
