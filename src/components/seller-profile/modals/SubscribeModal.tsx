// src/components/seller-profile/modals/SubscribeModal.tsx
'use client';

import { sanitizeStrict } from '@/utils/security/sanitization';

interface SubscribeModalProps {
  show: boolean;
  username: string;
  subscriptionPrice: number | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SubscribeModal({
  show,
  username,
  subscriptionPrice,
  onClose,
  onConfirm,
}: SubscribeModalProps) {
  if (!show) return null;

  const sanitizedUsername = sanitizeStrict(username);
  const priceText =
    typeof subscriptionPrice === 'number' && Number.isFinite(subscriptionPrice)
      ? subscriptionPrice.toFixed(2)
      : '...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/70 p-8 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff950e]">
            Premium Access
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Subscribe to {sanitizedUsername}</h2>
          <p className="mt-3 text-sm text-gray-300">
            Unlock private listings, exclusive gallery drops, and intimate updates. Cancel anytime.
          </p>
          <p className="mt-5 text-3xl font-semibold text-[#ff950e]">${priceText}/month</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30"
            type="button"
          >
            Maybe Later
          </button>
          <button
            onClick={onConfirm}
            className="w-full rounded-full bg-gradient-to-r from-[#ff950e] to-[#fb923c] px-6 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_-15px_rgba(255,149,14,0.7)] transition hover:from-[#ffa733] hover:to-[#ffb347]"
            type="button"
          >
            Confirm Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
