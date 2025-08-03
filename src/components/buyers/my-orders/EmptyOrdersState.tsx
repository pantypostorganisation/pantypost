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
          className="group relative inline-flex items-center gap-2 bg-transparent text-[#ff950e] font-semibold px-8 py-3 rounded-xl transition-all duration-300 border-2 border-[#ff950e]/70 hover:border-[#ff950e] hover:bg-[#ff950e]/10 hover:-translate-y-1 shadow-[0_4px_0_0] shadow-[#ff950e]/50 hover:shadow-[0_6px_0_0] hover:shadow-[#ff950e]/70"
        >
          <Package className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="relative">
            Browse Listings
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff950e] transition-all duration-300 group-hover:w-full"></span>
          </span>
        </Link>
        
        <Link
          href="/buyers/messages"
          className="group relative inline-flex items-center gap-2 bg-transparent text-[#ff950e] font-semibold px-8 py-3 rounded-xl transition-all duration-300 border-2 border-[#ff950e]/70 hover:border-[#ff950e] hover:bg-[#ff950e]/10 hover:-translate-y-1 shadow-[0_4px_0_0] shadow-[#ff950e]/50 hover:shadow-[0_6px_0_0] hover:shadow-[#ff950e]/70"
        >
          <MessageCircle className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
          <span className="relative">
            Send Custom Requests
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#ff950e] transition-all duration-300 group-hover:w-full"></span>
          </span>
        </Link>
      </div>
    </div>
  );
}