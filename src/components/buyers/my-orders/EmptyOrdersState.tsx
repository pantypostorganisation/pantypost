// src/components/buyers/my-orders/EmptyOrdersState.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Package, MessageCircle } from 'lucide-react';

export default function EmptyOrdersState() {
  return (
    <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-gray-800">
      <Package className="w-24 h-24 text-gray-600 mx-auto mb-8" />
      <h3 className="text-2xl font-bold text-gray-400 mb-4">No orders yet</h3>
      <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
        Your purchases from direct sales, auctions, and custom requests will appear here once you start shopping.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black font-bold px-8 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105"
        >
          <Package className="w-5 h-5" />
          Browse Listings
        </Link>
        <Link
          href="/buyers/messages"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl"
        >
          <MessageCircle className="w-5 h-5" />
          Send Custom Requests
        </Link>
      </div>
    </div>
  );
}