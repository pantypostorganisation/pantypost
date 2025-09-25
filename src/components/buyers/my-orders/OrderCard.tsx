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
    <div className={`relative overflow-hidden transition-all duration-300 ${
      isExpanded 
        ? 'bg-black/40 backdrop-blur-sm shadow-2xl' 
        : 'bg-black/20 hover:bg-black/30 shadow-lg hover:shadow-xl'
    }`}>
      {/* Subtle type indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
        type === 'auction' ? 'from-purple-500 to-violet-500' :
        type === 'custom' ? 'from-blue-500 to-cyan-500' :
        'from-[#ff950e] to-orange-500'
      }`} />

      {/* Auction Won Badge - Refined */}
      {order.wasAuction && needsAddress && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
            <span className="text-base">🏆</span>
            <span>Action Required</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`p-6 transition-all duration-300 ${isExpanded ? 'pb-0' : ''}`}>
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

      {/* Expanded Content - Seamless transition */}
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
