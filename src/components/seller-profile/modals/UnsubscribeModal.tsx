'use client';

import { sanitizeStrict } from '@/utils/security/sanitization';

interface UnsubscribeModalProps {
  show: boolean;
  username: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function UnsubscribeModal({
  show,
  username,
  onClose,
  onConfirm,
}: UnsubscribeModalProps) {
  if (!show) return null;

  const sanitizedUsername = sanitizeStrict(username);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-[#2d0a0f] to-black p-px shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.25),_transparent_70%)]" aria-hidden="true" />
        <div className="relative rounded-[26px] bg-black/85 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">Cancel premium access?</h2>
            <p className="mt-2 text-sm text-gray-400">
              Leaving means you&apos;ll lose the unlocked listings and premium gallery content from {sanitizedUsername}.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-center text-red-200">
            <p className="text-sm uppercase tracking-[0.3em]">Current subscription</p>
            <p className="mt-2 text-base text-gray-200">
              {sanitizedUsername} • Premium tier access
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="w-full rounded-full border border-white/10 bg-white/5 px-6 py-3 text-base font-semibold text-gray-200 transition hover:bg-white/10 sm:w-auto"
              type="button"
            >
              Keep access
            </button>
            <button
              onClick={onConfirm}
              className="w-full rounded-full bg-red-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600 sm:w-auto"
              type="button"
            >
              Unsubscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
