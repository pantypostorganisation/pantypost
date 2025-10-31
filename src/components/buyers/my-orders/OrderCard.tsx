// src/components/buyers/my-orders/OrderCard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '@/types/order';
import { useListings } from '@/context/ListingContext';
import { getUserProfilePic } from '@/utils/profileUtils';
import ExpandedOrderContent from './ExpandedOrderContent';
import { formatOrderDate, getOrderStyles } from '@/utils/orderUtils';
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (!order.imageUrl) {
      setThumbnailUrl(null);
      return;
    }

    const trimmedImageUrl = order.imageUrl.trim();
    if (!trimmedImageUrl || trimmedImageUrl === 'undefined' || trimmedImageUrl === 'null') {
      setThumbnailUrl(null);
      return;
    }

    setThumbnailUrl(trimmedImageUrl);
  }, [order.imageUrl]);

  const fallbackOrder = order as { _id?: string };
  const orderId = order.id || fallbackOrder._id || `order-${Date.now()}`;
  const displayOrderId = order.id || fallbackOrder._id || '';
  const needsAddress = order.wasAuction && !hasDeliveryAddress;

  const typeLabel =
    type === 'auction' ? 'Auction win' : type === 'custom' ? 'Custom request' : 'Direct purchase';
  const typeChip = typeLabel;

  const shortId = useMemo(() => {
    if (displayOrderId) {
      return String(displayOrderId).slice(0, 10);
    }
    return 'Pending';
  }, [displayOrderId]);

  const placedDate = useMemo(() => formatOrderDate(order.date), [order.date]);

  const { statusLabel, statusTone } = useMemo(() => {
    switch (order.shippingStatus) {
      case 'processing':
        return {
          statusLabel: 'Preparing',
          statusTone: 'border-sky-800/40 bg-sky-900/20 text-sky-300',
        } as const;
      case 'shipped':
        return {
          statusLabel: 'Shipped',
          statusTone: 'border-emerald-800/40 bg-emerald-900/20 text-emerald-300',
        } as const;
      case 'delivered':
        return {
          statusLabel: 'Delivered',
          statusTone: 'border-emerald-800/40 bg-emerald-900/20 text-emerald-300',
        } as const;
      default:
        return {
          statusLabel: 'Awaiting shipment',
          statusTone: 'border-amber-800/40 bg-amber-900/20 text-amber-300',
        } as const;
    }
  }, [order.shippingStatus]);

  const showConfirmAddress = needsAddress;
  const subtitle = order.description || order.notes || '';

  const handleConfirmAddress = () => {
    if (needsAddress) {
      onOpenAddressModal(order.id);
    }
  };

  const handleViewDetails = () => {
    onToggleExpanded(isExpanded ? null : orderId);
  };

  const metaItems = useMemo(() => {
    return [
      <span key="order-id" className="inline-flex items-center gap-1">
        <span className="opacity-70">Order ID:</span>
        <code className="text-neutral-300">{shortId}</code>
      </span>,
      <span key="placed">Placed {placedDate}</span>,
      <span key="type">{typeLabel}</span>,
      <span
        key="status"
        className={`inline-flex items-center rounded-md border px-2 py-0.5 ${statusTone}`}
      >
        {statusLabel}
      </span>,
    ];
  }, [placedDate, shortId, statusLabel, statusTone, typeLabel]);

  const interleavedMeta = useMemo(
    () =>
      metaItems.flatMap((item, index) =>
        index === 0
          ? [item]
          : [
              <span key={`dot-${index}`} className="opacity-60">
                •
              </span>,
              item,
            ]
      ),
    [metaItems]
  );

  return (
    <article
      className={`rounded-xl bg-[var(--color-card)] border border-neutral-800/80 shadow-lg p-4 hover:border-neutral-700 transition-colors ${styles.borderStyle}`}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white leading-tight truncate">
            <SecureMessageDisplay content={order.title || 'Untitled order'} allowBasicFormatting={false} as="span" />
          </h3>
          <span className="shrink-0 text-sm font-bold text-[var(--color-primary)]">${totalPaid}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          {interleavedMeta}
        </div>

        <span className="mt-2 inline-flex items-center rounded-md border border-neutral-700 px-2 py-0.5 text-[11px] uppercase tracking-wide text-neutral-300">
          {typeChip}
        </span>

        {thumbnailUrl && (
          <div className="mt-3 flex items-center gap-3">
            <img src={thumbnailUrl} alt="" className="h-14 w-14 rounded-lg object-cover border border-neutral-800" />
            {subtitle && (
              <SecureMessageDisplay
                content={subtitle}
                allowBasicFormatting={false}
                as="p"
                className="text-sm text-neutral-300 line-clamp-2"
              />
            )}
          </div>
        )}

        {!thumbnailUrl && subtitle && (
          <SecureMessageDisplay
            content={subtitle}
            allowBasicFormatting={false}
            as="p"
            className="mt-3 text-sm text-neutral-300 line-clamp-2"
          />
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          {showConfirmAddress && (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)]/90 hover:bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-black"
              onClick={handleConfirmAddress}
            >
              Confirm address
            </button>
          )}
          <button
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-900"
            onClick={handleViewDetails}
          >
            View details
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
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
