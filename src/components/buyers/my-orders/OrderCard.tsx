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
      <span key="order-id" className="font-medium text-neutral-200">
        #{shortId}
      </span>,
      <span key="placed">Placed {placedDate}</span>,
      <span key="type">{typeLabel}</span>,
      <span
        key="status"
        className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusTone}`}
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

  const addressPreview = useMemo(() => {
    const previewFromOrder = (order as unknown as { deliveryAddressPreview?: string })?.deliveryAddressPreview;
    if (typeof previewFromOrder === 'string' && previewFromOrder.trim().length > 0) {
      return previewFromOrder.trim();
    }

    const pendingAddress = (order as unknown as { pendingDeliveryAddress?: Partial<Order['deliveryAddress']> })
      ?.pendingDeliveryAddress;

    const addressSource = pendingAddress || order.deliveryAddress;
    if (!addressSource) {
      return null;
    }

    const { fullName, addressLine1, city, state, postalCode, country } = addressSource;
    const parts = [fullName, addressLine1, [city, state].filter(Boolean).join(', '), postalCode, country]
      .map((part) => (part ?? '').toString().trim())
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      return null;
    }

    return parts.slice(0, 3).join(' • ');
  }, [order]);

  return (
    <article
      className={`group rounded-2xl border border-neutral-800/80 bg-[var(--color-card)] p-4 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)] transition-colors hover:border-neutral-700 ${styles.borderStyle}`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-sm font-semibold leading-tight text-white sm:text-base">
            <SecureMessageDisplay content={order.title || 'Untitled order'} allowBasicFormatting={false} as="span" />
          </h3>
          <span className="shrink-0 text-sm font-semibold text-[var(--color-primary)] sm:text-base">${totalPaid}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400">
          {interleavedMeta}
        </div>

        {thumbnailUrl && (
          <div className="flex items-start gap-3">
            <img
              src={thumbnailUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-lg border border-neutral-800 object-cover"
            />
            {subtitle && (
              <SecureMessageDisplay
                content={subtitle}
                allowBasicFormatting={false}
                as="p"
                className="text-xs leading-relaxed text-neutral-300 line-clamp-2"
              />
            )}
          </div>
        )}

        {!thumbnailUrl && subtitle && (
          <SecureMessageDisplay
            content={subtitle}
            allowBasicFormatting={false}
            as="p"
            className="text-xs leading-relaxed text-neutral-300 line-clamp-2"
          />
        )}

        {showConfirmAddress && (
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/70 p-3">
            <div className="flex flex-col gap-2 text-xs text-neutral-300">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Confirm delivery address</p>
                  <p className="text-xs text-neutral-400">
                    We&apos;ll share your preferred delivery details with the seller once you confirm.
                  </p>
                  {addressPreview && (
                    <p className="text-xs text-neutral-400">
                      <span className="text-neutral-200">{addressPreview}</span>
                    </p>
                  )}
                </div>
                <button
                  className="shrink-0 rounded-md bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-black transition-colors hover:bg-[var(--color-primary)]/90"
                  onClick={handleConfirmAddress}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end">
          <button
            className="inline-flex items-center gap-1 rounded-md border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-600 hover:bg-neutral-900"
            onClick={handleViewDetails}
          >
            View details
          </button>
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
