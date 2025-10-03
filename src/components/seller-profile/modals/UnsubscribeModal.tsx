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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/70 p-8 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
            Manage Access
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">Cancel subscription?</h2>
          <p className="mt-3 text-sm text-gray-300">
            You’ll immediately lose access to <span className="text-red-300">{sanitizedUsername}</span>'s premium drops and gallery reveals.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="w-full rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30"
            type="button"
          >
            Keep Access
          </button>
          <button
            onClick={onConfirm}
            className="w-full rounded-full border border-red-500/40 bg-red-500/20 px-6 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/30"
            type="button"
          >
            Unsubscribe
          </button>
        </div>
      </div>
    </div>
  );
}
