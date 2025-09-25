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
  if (!o || typeof o !== 'object') return null;

  const anyOrder = o as Record<string, any>;

  // Direct property (some code paths may attach it here)
  if (typeof anyOrder.trackingNumber === 'string' && anyOrder.trackingNumber.trim().length > 0) {
    return anyOrder.trackingNumber.trim();
  }

  // Nested under shipping
  if (
    anyOrder.shipping &&
    typeof anyOrder.shipping === 'object' &&
    typeof anyOrder.shipping.trackingNumber === 'string' &&
    anyOrder.shipping.trackingNumber.trim().length > 0
  ) {
    return anyOrder.shipping.trackingNumber.trim();
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
    <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
      {/* Seller Info - Cleaner layout */}
      <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
        <Link
          href={`/sellers/${sanitizedUsername}`}
          className="flex items-center gap-3 group"
        >
          {sellerProfilePic ? (
            <SecureImage
              src={sellerProfilePic}
              alt={order.seller}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-[#ff950e]/50 transition-all"
              fallbackSrc="/placeholder-avatar.png"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold ring-2 ring-white/10 group-hover:ring-[#ff950e]/50 transition-all">
              {order.seller ? order.seller.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div>
            <div className="font-semibold text-white group-hover:text-[#ff950e] transition-colors flex items-center gap-2">
              <SecureMessageDisplay
                content={order.seller}
                allowBasicFormatting={false}
                as="span"
              />
              {isSellerVerified && (
                <img src="/verification_badge.png" alt="Verified" className="w-4 h-4" />
              )}
            </div>
            <div className="text-xs text-gray-500">View Profile</div>
          </div>
        </Link>

        <Link
          href={`/buyers/messages?thread=${sanitizedUsername}`}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Link>
      </div>

      {/* Info Grid - Cleaner presentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
            <Package className="w-4 h-4" />
            ORDER DETAILS
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="text-gray-300 font-mono">
                {order.id ? `${order.id.slice(0, 12)}...` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-300 capitalize">{type} Purchase</span>
            </div>
            {trackingNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tracking</span>
                <span className="text-gray-300 font-mono">{trackingNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            PAYMENT SUMMARY
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Item Price</span>
              <span className="text-gray-300">${order.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform Fee</span>
              <span className="text-gray-300">
                ${((order.markedUpPrice || order.price) - order.price).toFixed(2)}
              </span>
            </div>
            {order.tierCreditAmount && order.tierCreditAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Bonus Credit</span>
                <span>+${order.tierCreditAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/5 font-semibold">
              <span className="text-white">Total</span>
              <span className="text-[#ff950e]">
                ${(order.markedUpPrice || order.price).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <ReviewSection order={order} />
    </div>
  );
}
