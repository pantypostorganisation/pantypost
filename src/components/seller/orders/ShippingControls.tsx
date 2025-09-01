// src/components/seller/orders/ShippingControls.tsx
'use client';

import React, { useState } from 'react';
import { Order } from '@/context/WalletContext';
import { Truck, Package, Clock, CheckCircle } from 'lucide-react';

interface ShippingControlsProps {
  order: Order;
  onStatusChange: (orderId: string, status: 'pending' | 'processing' | 'shipped') => void;
}

export default function ShippingControls({ order, onStatusChange }: ShippingControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  if (!order.deliveryAddress) return null;

  const handleStatusChange = async (status: 'pending' | 'processing' | 'shipped') => {
    setIsUpdating(true);
    setSelectedStatus(status);
    
    try {
      await onStatusChange(order.id, status);
      
      // Show success feedback
      setTimeout(() => {
        setSelectedStatus(null);
      }, 2000);
    } catch (error) {
      console.error('[ShippingControls] Error updating status:', error);
      setSelectedStatus(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusButton = (
    status: 'pending' | 'processing' | 'shipped',
    icon: React.ReactNode,
    label: string,
    activeClass: string,
    inactiveClass: string
  ) => {
    const isActive = order.shippingStatus === status;
    const isSelected = selectedStatus === status;
    
    return (
      <button
        onClick={() => handleStatusChange(status)}
        disabled={isUpdating || isActive}
        className={`
          px-4 py-2 rounded-lg text-sm font-bold transition-all
          ${isActive || isSelected
            ? activeClass
            : inactiveClass
          }
          ${isUpdating && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
          ${isActive ? 'cursor-default' : ''}
        `}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
          {isSelected && isUpdating && (
            <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="mt-6 border-t border-gray-700 pt-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h4 className="font-semibold text-white text-lg flex items-center">
          <Truck className="w-5 h-5 mr-2 text-[#ff950e]" />
          Update Shipping Status
        </h4>
        <div className="flex flex-wrap gap-3">
          {getStatusButton(
            'pending',
            <Clock className="w-4 h-4" />,
            'Pending',
            'bg-gradient-to-r from-yellow-500 to-yellow-400 text-black shadow-lg',
            'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          )}
          
          {getStatusButton(
            'processing',
            <Package className="w-4 h-4" />,
            'Processing',
            'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg',
            'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          )}
          
          {getStatusButton(
            'shipped',
            <CheckCircle className="w-4 h-4" />,
            'Shipped',
            'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-lg',
            'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          )}
        </div>
      </div>
      
      {/* Status change feedback */}
      {selectedStatus && !isUpdating && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-300 text-sm">
          ✅ Shipping status updated successfully
        </div>
      )}
      
      {/* Helpful tips based on current status */}
      {order.shippingStatus === 'pending' && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
          💡 Update to "Processing" when you start preparing the order
        </div>
      )}
      
      {order.shippingStatus === 'processing' && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
          📦 Update to "Shipped" once you've sent the package
        </div>
      )}
      
      {order.shippingStatus === 'shipped' && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
          ✅ Order has been shipped. The buyer has been notified.
        </div>
      )}
    </div>
  );
}
