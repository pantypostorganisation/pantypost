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
  
  // State for async profile pic
  const [sellerProfilePic, setSellerProfilePic] = useState<string | null>(null);
  
  // Get seller info
  const sellerUser = users?.[order.seller ?? ''];
  const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
  const hasDeliveryAddress = !!order.deliveryAddress;

  // Load seller profile pic asynchronously
  useEffect(() => {
    const loadProfilePic = async () => {
      if (order.seller) {
        const pic = await getUserProfilePic(order.seller);
        setSellerProfilePic(pic);
      }
    };
    loadProfilePic();
  }, [order.seller]);

  // CRITICAL FIX: Ensure order has an ID
  const orderId = order.id || (order as any)._id || `order-${Date.now()}`;

  // Show special status for auction orders without address
  const needsAddress = order.wasAuction && !hasDeliveryAddress;

  return (
    <div className="relative border border-white/5 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-white/10 transition-all duration-200">
      {/* Auction Won Badge - Better contrast */}
      {order.wasAuction && needsAddress && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            🏆 Won! Add Address
          </div>
        </div>
      )}

      {/* Order Header with consistent padding */}
      <div className="p-6">
        <OrderHeader
          order={order}
          type={type}
          styles={styles}
        />
        
        <OrderDetails
          order={order}
          type={type}
          hasDeliveryAddress={hasDeliveryAddress}
          isExpanded={isExpanded}
          onOpenAddressModal={onOpenAddressModal}
          onToggleExpanded={() => onToggleExpanded(orderId)}
        />
      </div>

      {/* Expanded Content */}
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
