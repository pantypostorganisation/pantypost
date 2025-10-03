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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-[#13060a] to-black p-px shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,149,14,0.25),_transparent_70%)]" aria-hidden="true" />
        <div className="relative rounded-[26px] bg-black/80 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">Unlock the premium feed</h2>
            <p className="mt-2 text-sm text-gray-400">
              Get instant access to intimate drops, premium listings, and gallery exclusives.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10 p-5 text-center text-[#ff950e]">
            <p className="text-sm uppercase tracking-[0.3em]">Monthly access</p>
            <p className="mt-2 text-3xl font-bold text-white">${priceText}</p>
            <p className="mt-1 text-sm text-gray-200">
              Subscribe to <span className="font-semibold text-[#ff950e]">{sanitizedUsername}</span>
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-gray-200 transition hover:bg-white/10 sm:w-auto"
              type="button"
            >
              Not now
            </button>
            <button
              onClick={onConfirm}
              className="w-full rounded-full bg-[#ff950e] px-6 py-3 text-base font-semibold text-black shadow-lg shadow-[#ff950e33] transition hover:bg-[#e0850d] sm:w-auto"
              type="button"
            >
              Confirm &amp; Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
