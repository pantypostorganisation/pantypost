// src/components/buyers/my-orders/OrdersHeader.tsx
'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, Package, Sparkles } from 'lucide-react';

export default function OrdersHeader() {
  return (
    <div className="relative">
      {/* Background decorations */}
      <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#ff950e]/10 rounded-full blur-3xl" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff950e]/5 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title section */}
          <div className="flex items-center gap-4">
            {/* Animated icon container */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
              <div className="relative bg-gradient-to-r from-[#ff950e] to-[#ff6b00] p-3.5 md:p-4 rounded-xl shadow-xl">
                <ShoppingBag className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
            </div>
            
            {/* Title with gradient */}
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  My Orders
                </span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base mt-1">
                Track purchases & manage deliveries
              </p>
            </div>
          </div>
          
          {/* Quick stats/tags */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-4 py-2 rounded-full border border-green-500/20">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Live Tracking</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-sky-500/10 px-4 py-2 rounded-full border border-blue-500/20">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">Secure Delivery</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-violet-500/10 px-4 py-2 rounded-full border border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium">Premium Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
