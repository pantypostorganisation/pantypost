// src/components/wallet/buyer/EmptyState.tsx
'use client';

import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-12 border border-white/5 text-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#ff950e]/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10">
        <div className="relative inline-block mb-6">
          <div className="bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 p-5 rounded-2xl shadow-2xl">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-6 h-6 text-[#ff950e]" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">
          No Purchases Yet
        </h3>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Start exploring our marketplace to find amazing deals from verified sellers
        </p>
        
        <a
          href="/browse"
          className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#ff950e] to-orange-600 hover:from-orange-600 hover:to-[#ff950e] text-black rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
        >
          Browse Listings
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  );
}