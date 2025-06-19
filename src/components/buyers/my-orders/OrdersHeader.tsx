// src/components/buyers/my-orders/OrdersHeader.tsx
'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function OrdersHeader() {
  return (
    <div className="mb-10">
      <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center mb-4">
        <ShoppingBag className="w-8 h-8 mr-3 text-[#ff950e] drop-shadow-lg drop-shadow-[#ff950e]/50" />
        My Orders
      </h1>
      <p className="text-gray-300 text-lg">
        Track your purchases, manage delivery addresses, and stay updated on order status.
      </p>
    </div>
  );
}