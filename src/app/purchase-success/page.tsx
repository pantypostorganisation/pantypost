// src/app/purchase-success/page.tsx
'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useWallet } from '@/context/WalletContext.enhanced';
import { useListings } from '@/context/ListingContext';
import BanCheck from '@/components/BanCheck';

export default function PurchaseSuccessPage() {
  const { orderHistory } = useWallet();
  const { addSellerNotification } = useListings();
  const hasNotified = useRef(false);

  useEffect(() => {
    if (orderHistory.length > 0 && !hasNotified.current) {
      const latest = orderHistory[orderHistory.length - 1];
      
      // Add seller name to notification message to make it easier to filter
      addSellerNotification(latest.seller, `💌 [For ${latest.seller}] A buyer purchased: ${latest.title}`);
      hasNotified.current = true;
    }
  }, [orderHistory, addSellerNotification]);

  return (
    <BanCheck>
      <main className="p-10 max-w-md mx-auto text-center">
        <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-pink-600 mb-2">
          Purchase Successful!
        </h1>
        <p className="text-gray-700 mb-6">
          Thanks for your order — your seller will be in touch with you soon 💌
        </p>

        <Link
          href="/browse"
          className="inline-block bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 transition"
        >
          Continue Browsing
        </Link>
      </main>
    </BanCheck>
  );
}
