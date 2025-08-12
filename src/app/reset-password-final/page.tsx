// src/app/purchase-success/page.tsx
'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import BanCheck from '@/components/BanCheck';
import { sanitizeStrict } from '@/utils/security/sanitization';

export default function PurchaseSuccessPage() {
  const { orderHistory } = useWallet();
  const { addSellerNotification } = useListings();

  // Prevent duplicate notifications during a single mount
  const hasNotified = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Validate order data
  const validateOrderData = useCallback((order: any) => {
    if (!order || typeof order !== 'object') {
      return { isValid: false, error: 'Invalid order object' };
    }
    if (!order.seller || typeof order.seller !== 'string' || !order.seller.trim()) {
      return { isValid: false, error: 'Missing or invalid seller' };
    }
    if (!order.title || typeof order.title !== 'string' || !order.title.trim()) {
      return { isValid: false, error: 'Missing or invalid title' };
    }
    return { isValid: true };
  }, []);

  // Add a small sessionStorage-based dedupe so we don't re-notify on reloads
  const alreadyNotifiedFor = (sig: string) => {
    try {
      if (typeof window === 'undefined') return false;
      const lastSig = sessionStorage.getItem('last_purchase_notify_sig');
      return lastSig === sig;
    } catch {
      return false;
    }
  };

  const markNotifiedFor = (sig: string) => {
    try {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem('last_purchase_notify_sig', sig);
    } catch {
      // ignore storage errors
    }
  };

  // Process notification with proper validation & sanitization
  const processNotification = useCallback(
    (latestOrder: any) => {
      if (!isMountedRef.current || hasNotified.current) return;

      const validation = validateOrderData(latestOrder);
      if (!validation.isValid) {
        console.error('Invalid order data in purchase success:', validation.error);
        return;
      }

      try {
        const sanitizedSeller = sanitizeStrict(latestOrder.seller.trim());
        const sanitizedTitle = sanitizeStrict(latestOrder.title.trim());

        // Extra length guards
        if (!sanitizedSeller || sanitizedSeller.length > 50) {
          console.error('Seller name empty or too long (max 50)');
          return;
        }
        if (!sanitizedTitle || sanitizedTitle.length > 200) {
          console.error('Product title empty or too long (max 200)');
          return;
        }

        const sig = `${sanitizedSeller}|${sanitizedTitle}`;
        if (alreadyNotifiedFor(sig)) {
          // We’ve already notified for this exact purchase on this session
          return;
        }

        if (typeof addSellerNotification !== 'function') {
          console.error('addSellerNotification is not a function');
          return;
        }

        addSellerNotification(
          sanitizedSeller,
          `💌 [For ${sanitizedSeller}] A buyer purchased: ${sanitizedTitle}`
        );

        hasNotified.current = true;
        markNotifiedFor(sig);
      } catch (error) {
        console.error('Error adding seller notification:', error);
        // Non-critical; do not rethrow
      }
    },
    [validateOrderData, addSellerNotification]
  );

  // Handle order history updates
  useEffect(() => {
    if (!isMountedRef.current) return;

    if (!Array.isArray(orderHistory)) {
      console.error('orderHistory is not an array:', typeof orderHistory);
      return;
    }

    if (orderHistory.length > 0 && !hasNotified.current) {
      const latestOrder = orderHistory[orderHistory.length - 1];
      processNotification(latestOrder);
    }
  }, [orderHistory, processNotification]);

  return (
    <BanCheck>
      <main className="min-h-screen bg-black flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center bg-[#0f0f0f] border border-gray-800 rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-700/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500 w-8 h-8" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Purchase Successful!</h1>
          <p className="text-gray-400 mb-6">
            Thanks for your order — your seller will be in touch with you soon 💌
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/buyers/my-orders"
              className="inline-flex items-center justify-center bg-white text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              View My Orders
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center bg-[#ff950e] text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-[#ff8c00] transition"
            >
              Continue Browsing
            </Link>
          </div>

          <p className="text-xs text-gray-600 mt-6">
            Tip: you can track delivery progress and contact the seller from your orders page.
          </p>
        </div>
      </main>
    </BanCheck>
  );
}
