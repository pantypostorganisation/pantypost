// src/components/buyers/my-orders/OrderCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Order } from '@/context/WalletContext';
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

  return (
    <div
      className={`relative border rounded-2xl bg-gradient-to-br overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${styles.gradientStyle} ${styles.borderStyle}`}
    >
      {/* Order Header */}
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
          onToggleExpanded={onToggleExpanded}
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
