// src/utils/orderUtils.tsx
import React from 'react';
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  Gavel,
  Settings,
  Star
} from 'lucide-react';

export interface OrderStyles {
  borderStyle: string;
  badgeContent: React.ReactNode | null;
  accentColor: string;
}

export function getOrderStyles(type: 'auction' | 'direct' | 'custom'): OrderStyles {
  switch (type) {
    case 'auction':
      return {
        borderStyle: 'border-purple-500/30 hover:border-purple-400/50',
        accentColor: '#a855f7',
        badgeContent: (
          <span className="absolute -top-2 -right-2 rounded-full bg-purple-500 px-2 py-1 text-xs font-bold text-white">
            <Gavel className="mr-1 h-3 w-3" />
            Auction
          </span>
        ),
      };
    case 'custom':
      return {
        borderStyle: 'border-blue-500/30 hover:border-blue-400/50',
        accentColor: '#3b82f6',
        badgeContent: (
          <span className="absolute -top-2 -right-2 rounded-full bg-sky-500 px-2 py-1 text-xs font-bold text-white">
            <Settings className="mr-1 h-3 w-3" />
            Custom
          </span>
        ),
      };
    default:
      return {
        borderStyle: 'border-gray-700 hover:border-[#ff950e]/50',
        accentColor: '#ff950e',
        badgeContent: null,
      };
  }
}

export function formatOrderDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function getShippingStatusBadge(status?: string) {
  if (!status || status === 'pending') {
    return (
      <div className="inline-flex items-center rounded-lg border border-yellow-500/30 bg-yellow-500/20 px-3 py-1.5 text-xs font-bold text-yellow-300">
        <Clock className="mr-1 h-3 w-3" />
        Awaiting Shipment
      </div>
    );
  } else if (status === 'processing') {
    return (
      <div className="inline-flex items-center rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5 text-xs font-bold text-blue-300">
        <Package className="mr-1 h-3 w-3" />
        Preparing
      </div>
    );
  } else if (status === 'shipped') {
    return (
      <div className="inline-flex items-center rounded-lg border border-green-500/30 bg-green-500/20 px-3 py-1.5 text-xs font-bold text-green-300">
        <Truck className="mr-1 h-3 w-3" />
        Shipped
      </div>
    );
  }

  // Add default return
  return null;
}
