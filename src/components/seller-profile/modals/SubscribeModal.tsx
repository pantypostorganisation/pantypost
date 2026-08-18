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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/85 backdrop-blur">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-white/10 bg-surface/70 p-8 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Premium Access
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Subscribe to {sanitizedUsername}</h2>
          <p className="mt-3 text-sm text-ink-muted">
            Unlock private listings, exclusive gallery drops, and intimate updates. Cancel anytime.
          </p>
          <p className="mt-5 text-3xl font-semibold text-primary">${priceText}/month</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="w-full rounded-md border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30"
            type="button"
          >
            Maybe Later
          </button>
          <button
            onClick={onConfirm}
            /* Flattening the gradient here left a grey button with black
                text -- invisible. This is the primary action in the
                dialog, so it stays a solid brand fill. Black label
                because white on #ff950e is 2.20:1 and fails AA. */
            className="w-full rounded-md bg-primary px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover active:bg-primary-press"
            type="button"
          >
            Confirm Subscription
          </button>
        </div>
      </div>
    </div>
  );
}