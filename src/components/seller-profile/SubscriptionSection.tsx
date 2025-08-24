// src/components/seller-profile/SubscriptionSection.tsx
'use client';

import { Crown, Lock } from 'lucide-react';
import { z } from 'zod';
import { formatCurrency } from '@/utils/url';

const PropsSchema = z.object({
  hasAccess: z.boolean().optional(),
  subscriptionPrice: z.number().nullable().optional(),
  username: z.string().default(''),
  user: z
    .object({
      role: z.enum(['buyer', 'seller', 'admin']).optional(),
      username: z.string().default(''),
    })
    .passthrough()
    .nullable()
    .optional(),
  onShowSubscribeModal: z.function().args().returns(z.void()),
});

interface SubscriptionSectionProps extends z.infer<typeof PropsSchema> {}

export default function SubscriptionSection(rawProps: SubscriptionSectionProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const { hasAccess, subscriptionPrice, username, user, onShowSubscribeModal } = parsed.success
    ? parsed.data
    : { hasAccess: undefined, subscriptionPrice: null, username: '', user: null, onShowSubscribeModal: () => {} };

  const isBuyer = user?.role === 'buyer';
  const isSelf = user?.username === username;
  const priceValid = typeof subscriptionPrice === 'number' && Number.isFinite(subscriptionPrice) && subscriptionPrice > 0;

  const show =
    priceValid &&
    !hasAccess &&
    isBuyer &&
    !isSelf;

  if (!show) return null;

  const priceLabel = formatCurrency(subscriptionPrice as number);

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
          type="button"
        >
          <Lock className="w-5 h-5" />
          Subscribe for {priceLabel}/mo
        </button>
      </div>
    </div>
  );
}
