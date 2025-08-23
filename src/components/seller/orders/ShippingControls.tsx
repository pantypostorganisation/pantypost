'use client';

import React from 'react';
import { Order } from '@/context/WalletContext';
import { Truck } from 'lucide-react';

interface ShippingControlsProps {
  order: Order;
  onStatusChange: (orderId: string, status: 'pending' | 'processing' | 'shipped') => void;
}

export default function ShippingControls({ order, onStatusChange }: ShippingControlsProps) {
  if (!order.deliveryAddress) return null;

  return (
    <div className="mt-6 border-t border-gray-700 pt-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h4 className="font-semibold text-white text-lg flex items-center">
          <Truck className="w-5 h-5 mr-2 text-[#ff950e]" />
          Update Shipping Status
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onStatusChange(order.id, 'pending')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              order.shippingStatus === 'pending' || !order.shippingStatus
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            ⏳ Pending
          </button>
          <button
            onClick={() => onStatusChange(order.id, 'processing')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              order.shippingStatus === 'processing'
                ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            📦 Processing
          </button>
          <button
            onClick={() => onStatusChange(order.id, 'shipped')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              order.shippingStatus === 'shipped'
                ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            🚚 Shipped
          </button>
        </div>
      </div>
    </div>
  );
}
