// src/components/seller/orders/OrdersEmptyState.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Package, MessageCircle } from 'lucide-react';

export default function OrdersEmptyState() {
  return (
    <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-700">
      <Package className="w-20 h-20 text-gray-600 mx-auto mb-6" />
      <h3 className="text-gray-400 text-2xl mb-4">No orders to fulfill yet</h3>
      <p className="text-gray-500 text-lg mb-6">
        Orders from direct sales, auctions, and custom requests will appear here once customers make purchases.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/sellers/my-listings"
          className="inline-flex items-center gap-2 bg-[#ff950e] hover:bg-[#e88800] text-black font-bold px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-[#ff950e]/25"
        >
          <Package className="w-5 h-5" />
          Manage Listings
        </Link>
        <Link
          href="/sellers/messages"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
          Check Messages
        </Link>
      </div>
    </div>
  );
}
