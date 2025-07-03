// src/components/wallet/buyer/EmptyState.tsx
'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-12 border border-gray-800 text-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 149, 14, 0.3) 0%, transparent 50%)`
        }} />
      </div>
      
      <div className="relative z-10">
        <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 shadow-lg">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">No Purchases Yet</h3>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Start exploring our marketplace to find amazing deals from verified sellers
        </p>
        <a
          href="/browse"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#ff950e] to-orange-600 hover:from-[#e88800] hover:to-orange-700 text-black rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 group"
        >
          Browse Listings
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}