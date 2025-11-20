// src/components/buyers/my-orders/ExpandedOrderContent.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, Package, CreditCard } from 'lucide-react';
import { Order } from '@/context/WalletContext';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';
import ReviewSection from './ReviewSection';

interface ExpandedOrderContentProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  sellerProfilePic: string | null;
  isSellerVerified: boolean;
}

/**
 * Safely extract a tracking number from various possible shapes without
 * requiring changes to the global Order type.
 * Supported shapes:
 *  - order.trackingNumber: string
 *  - order.shipping?.trackingNumber: string
 */
function getTrackingNumber(o: unknown): string | null {
  if (!o || typeof o !== 'object' || o === null) {
    return null;
  }

  const orderRecord = o as Record<string, unknown>;
  const directTracking = orderRecord.trackingNumber;

  if (typeof directTracking === 'string' && directTracking.trim().length > 0) {
    return directTracking.trim();
  }

  const shipping = orderRecord.shipping as { trackingNumber?: unknown } | undefined;

  if (shipping && typeof shipping.trackingNumber === 'string' && shipping.trackingNumber.trim().length > 0) {
    return shipping.trackingNumber.trim();
  }

  return null;
}

export default function ExpandedOrderContent({
  order,
  type,
  sellerProfilePic,
  isSellerVerified,
}: ExpandedOrderContentProps) {
  const sanitizedUsername = sanitizeUsername(order.seller);
  const trackingNumber = getTrackingNumber(order);

  return (
    <div className="relative z-10 border-t border-white/10 bg-black/25 px-6 pb-8 pt-6 sm:px-8">
      <div className="space-y-8">
        {/* Seller Info */}
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/sellers/${sanitizedUsername}`}
            className="group flex items-center gap-4"
          >
            {sellerProfilePic ? (
              <SecureImage
                src={sellerProfilePic}
                alt={order.seller}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-white/10 transition duration-300 group-hover:ring-[#ff950e]/60"
                fallbackSrc="/placeholder-avatar.png"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 text-lg font-semibold text-white ring-2 ring-white/10 transition duration-300 group-hover:ring-[#ff950e]/60">
                {order.seller ? order.seller.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-base font-semibold text-white transition-colors duration-300 group-hover:text-[#ffb469]">
                <SecureMessageDisplay content={order.seller} allowBasicFormatting={false} as="span" />
                {isSellerVerified && <img src="/verification_badge.png" alt="Verified" className="h-4 w-4" />}
              </div>
              <p className="text-xs uppercase tracking-widest text-gray-500">View seller profile</p>
            </div>
          </Link>

          <Link
            href={`/buyers/messages?thread=${sanitizedUsername}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" />
            Message seller
          </Link>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <Package className="h-4 w-4" />
              Order details
            </h4>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span>Order ID</span>
                <span className="font-mono text-xs text-gray-300">
                  {order.id ? `${order.id.slice(0, 12)}...` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Type</span>
                <span className="text-gray-200 capitalize">{type} purchase</span>
              </div>
              {trackingNumber && (
                <div className="flex items-center justify-between text-gray-400">
                  <span>Tracking</span>
                  <span className="font-mono text-xs text-gray-200">{trackingNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
              <CreditCard className="h-4 w-4" />
              Payment summary
            </h4>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span>Item price</span>
                <span className="text-gray-200">${order.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Platform fee</span>
                <span className="text-gray-200">
                  ${((order.markedUpPrice || order.price) - order.price).toFixed(2)}
                </span>
              </div>
              {order.tierCreditAmount && order.tierCreditAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-300">
                  <span>Bonus credit</span>
                  <span>+${order.tierCreditAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
                <span>Total</span>
                <span className="text-[#ffb469]">
                  ${(order.markedUpPrice || order.price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ReviewSection order={order} />
      </div>
    </div>
  );
}
