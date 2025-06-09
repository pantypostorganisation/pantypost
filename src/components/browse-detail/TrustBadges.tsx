// src/components/browse-detail/TrustBadges.tsx
'use client';

import { Shield, Truck, Gift } from 'lucide-react';
import { TrustBadgesProps } from '@/types/browseDetail';

export default function TrustBadges({}: TrustBadgesProps) {
  return (
    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
      <div className="text-center">
        <Shield className="w-5 h-5 text-green-400 mx-auto mb-1" />
        <p className="text-xs text-gray-400">Secure Payment</p>
      </div>
      <div className="text-center">
        <Truck className="w-5 h-5 text-blue-400 mx-auto mb-1" />
        <p className="text-xs text-gray-400">Discreet Shipping</p>
      </div>
      <div className="text-center">
        <Gift className="w-5 h-5 text-purple-400 mx-auto mb-1" />
        <p className="text-xs text-gray-400">Quality Guaranteed</p>
      </div>
    </div>
  );
}