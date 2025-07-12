// src/components/seller-profile/SubscriptionSection.tsx
'use client';

import { Crown, Lock } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface SubscriptionSectionProps {
  hasAccess: boolean | undefined;
  subscriptionPrice: number | null;
  username: string;
  user: any;
  onShowSubscribeModal: () => void;
}

export default function SubscriptionSection({
  hasAccess,
  subscriptionPrice,
  username,
  user,
  onShowSubscribeModal,
}: SubscriptionSectionProps) {
  if (!subscriptionPrice || hasAccess || user?.role !== 'buyer' || user?.username === username) {
    return null;
  }

  return (
    <div className="mb-12 bg-gradient-to-r from-[#ff950e]/20 to-[#ff950e]/10 rounded-2xl p-6 sm:p-8 border border-[#ff950e]/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Crown className="w-8 h-8 text-[#ff950e]" />
          <div>
            <h3 className="text-xl font-bold text-white">Premium Content Available</h3>
            <p className="text-gray-300">Subscribe to unlock exclusive listings and content</p>
          </div>
        </div>
        <button
          onClick={onShowSubscribeModal}
          className="flex items-center gap-2 bg-[#ff950e] text-black font-bold px-6 py-3 rounded-full shadow-lg hover:bg-[#e0850d] transition"
        >
          <Lock className="w-5 h-5" />
          Subscribe for ${subscriptionPrice.toFixed(2)}/mo
        </button>
      </div>
    </div>
  );
}
