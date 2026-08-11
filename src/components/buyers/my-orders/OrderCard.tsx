// src/components/buyers/my-orders/OrderCard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '@/types/order';
import { useListings } from '@/context/ListingContext';
import { getUserProfilePic } from '@/utils/profileUtils';
import ExpandedOrderContent from './ExpandedOrderContent';
import { formatOrderDate } from '@/utils/orderUtils';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { ChevronDown, MapPin } from 'lucide-react';

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
 const needsAddress = !hasDeliveryAddress && (order.wasAuction || type === 'direct');

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

 /* metaItems / interleavedMeta removed: they assembled a
     bullet-separated run of #id, date, type and a status pill. The meta
     line is now one plain sentence plus a chip, so the array plumbing had
     nothing left to do. */


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

  /* ---------------------------------------------------------------
   * ORDER CARD
   *
   * Was: title + price, a four-part meta line (#id, date, type, status)
   * with bullet separators, a 64px thumbnail beside a two-line
   * description, then a permanently-mounted "Confirm delivery address"
   * PANEL with its own heading, explanatory paragraph, address preview
   * and button, then a "View details" button -- and the expanded content
   * nested in yet another bordered box inside the card.
   *
   * Three of those side by side is a wall.
   *
   * Now: image, title, price, one line of meta, one status chip, and
   * full-width action rows separated by hairlines. The address prompt is
   * an inline strip rather than a panel -- and once checkout collects the
   * address up front it becomes a rare exception rather than a fixture on
   * every card. The order id moved into the expanded view: it was the
   * most prominent thing on the meta line and the least useful.
   * --------------------------------------------------------------- */
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-surface-raised transition-colors hover:border-line-strong">
      <div className="flex gap-3 p-3">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-md border border-line object-cover"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-md border border-line bg-surface-overlay" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 truncate text-sm font-semibold text-white">
              <SecureMessageDisplay
                content={order.title || 'Untitled order'}
                allowBasicFormatting={false}
                as="span"
              />
            </h3>
            <span className="shrink-0 text-sm font-bold tabular-nums text-white">${totalPaid}</span>
          </div>

          <p className="mt-1 truncate text-xs text-ink-faint">
            {placedDate} &middot; {typeLabel}
          </p>

          <span
            className={`mt-2 inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {showConfirmAddress && (
        <button
          type="button"
          onClick={handleConfirmAddress}
          className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-left text-xs font-semibold text-warning transition-colors hover:bg-surface-hover"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Add delivery address
        </button>
      )}

      <button
        type="button"
        onClick={handleViewDetails}
        className="flex w-full items-center justify-between border-t border-line px-3 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Hide details' : 'View details'}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div className="border-t border-line p-4">
          <p className="mb-3 text-[11px] text-ink-faint">Order #{shortId}</p>
          {subtitle ? (
            <SecureMessageDisplay
              content={subtitle}
              allowBasicFormatting={false}
              as="p"
              className="mb-3 text-xs leading-relaxed text-ink-muted"
            />
          ) : null}
          {addressPreview ? (
            <p className="mb-3 text-xs text-ink-muted">
              <span className="text-ink-faint">Ships to </span>
              {addressPreview}
            </p>
          ) : null}
          <ExpandedOrderContent
            order={order}
            type={type}
            sellerProfilePic={sellerProfilePic}
            isSellerVerified={isSellerVerified}
          />
        </div>
      )}
    </article>
  );
}
