// src/components/buyers/my-orders/OrdersHeader.tsx
'use client';

import React from 'react';
import { ShoppingBag, TrendingUp, Package } from 'lucide-react';

export default function OrdersHeader() {
  return (
    <div className="mb-10 relative">
      {/* Background decoration */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#ff950e]/10 rounded-full blur-3xl" />
      <div className="absolute -top-8 right-0 w-32 h-32 bg-[#ff950e]/5 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          {/* Animated icon container */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
            <div className="relative bg-gradient-to-r from-[#ff950e] to-[#ff6b00] p-3 rounded-xl shadow-xl">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Title with gradient */}
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              My Orders
            </span>
          </h1>
        </div>
        
        {/* Modern description with tags */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-gray-400 text-lg flex-1">
            Track your purchases, manage delivery addresses, and stay updated on order status.
          </p>
          
          {/* Quick stats/tags */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Live Tracking</span>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <Package className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">Secure Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}