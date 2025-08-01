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
  const hasNotified = useRef(false);
  const isMountedRef = useRef(true);

  // Component mount/unmount tracking
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
    
    if (!order.seller || typeof order.seller !== 'string' || order.seller.trim().length === 0) {
      return { isValid: false, error: 'Missing or invalid seller' };
    }
    
    if (!order.title || typeof order.title !== 'string' || order.title.trim().length === 0) {
      return { isValid: false, error: 'Missing or invalid title' };
    }
    
    return { isValid: true };
  }, []);

  // Process notification with proper error handling
  const processNotification = useCallback((latestOrder: any) => {
    if (!isMountedRef.current || hasNotified.current) {
      return;
    }

    // Validate order data before processing
    const validation = validateOrderData(latestOrder);
    if (!validation.isValid) {
      console.error('Invalid order data in purchase success:', validation.error);
      return;
    }
    
    try {
      // Sanitize seller name and title before adding to notification
      const sanitizedSeller = sanitizeStrict(latestOrder.seller.trim());
      const sanitizedTitle = sanitizeStrict(latestOrder.title.trim());
      
      // Additional validation for length limits and XSS prevention
      if (sanitizedSeller.length === 0 || sanitizedSeller.length > 50) {
        console.error('Seller name is empty or exceeds maximum length (50 chars)');
        return;
      }
      
      if (sanitizedTitle.length === 0 || sanitizedTitle.length > 200) {
        console.error('Product title is empty or exceeds maximum length (200 chars)');
        return;
      }
      
      // Check if addSellerNotification function exists
      if (typeof addSellerNotification !== 'function') {
        console.error('addSellerNotification is not a function');
        return;
      }
      
      // Add seller name to notification message to make it easier to filter
      addSellerNotification(
        sanitizedSeller, 
        `💌 [For ${sanitizedSeller}] A buyer purchased: ${sanitizedTitle}`
      );
      
      hasNotified.current = true;
    } catch (error) {
      console.error('Error adding seller notification:', error);
      // Don't rethrow - this is a non-critical feature
    }
  }, [validateOrderData, addSellerNotification]);

  // Handle order history updates
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Check if orderHistory exists and is an array
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