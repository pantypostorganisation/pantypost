// src/utils/orderUtils.ts
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
  gradientStyle: string;
  badgeContent: React.ReactNode | null;
  accentColor: string;
}

export function getOrderStyles(type: 'auction' | 'direct' | 'custom'): OrderStyles {
  switch (type) {
    case 'auction':
      return {
        borderStyle: 'border-purple-500/30 hover:border-purple-400/50',
        gradientStyle: 'from-purple-900/10 via-gray-900/50 to-blue-900/10',
        accentColor: '#a855f7',
        badgeContent: (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-purple-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
            <Gavel className="w-3 h-3 mr-1" />
            Auction
          </span>
        ),
      };
    case 'custom':
      return {
        borderStyle: 'border-blue-500/30 hover:border-blue-400/50',
        gradientStyle: 'from-blue-900/10 via-gray-900/50 to-cyan-900/10',
        accentColor: '#3b82f6',
        badgeContent: (
          <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
            <Settings className="w-3 h-3 mr-1" />
            Custom
          </span>
        ),
      };
    default:
      return {
        borderStyle: 'border-gray-700 hover:border-[#ff950e]/50',
        gradientStyle: 'from-gray-900/50 via-black/30 to-gray-800/50',
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
      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
        <Clock className="w-3 h-3 mr-1" />
        Awaiting Shipment
      </div>
    );
  } else if (status === 'processing') {
    return (
      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
        <Package className="w-3 h-3 mr-1" />
        Preparing
      </div>
    );
  } else if (status === 'shipped') {
    return (
      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
        <Truck className="w-3 h-3 mr-1" />
        Shipped
      </div>
    );
  }
}