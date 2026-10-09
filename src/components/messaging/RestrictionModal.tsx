// src/components/messaging/RestrictionModal.tsx
'use client';

import { useEffect } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

export interface RestrictionNotice {
  title: string;
  body: string;
  matched?: string[];
  permanent?: boolean;
}

interface RestrictionModalProps {
  notice: RestrictionNotice | null;
  onDismiss: () => void;
}

/**
 * Shown when a message is refused and the sender is restricted.
 *
 * Deliberately a modal and not a toast. A toast slides away in four
 * seconds whether or not it was read, and the whole reason people kept
 * asking sellers to move to Telegram is that nothing ever told them
 * not to -- the failed send was completely silent, and the message even
 * stayed on screen looking delivered.
 *
 * It cannot be dismissed by clicking the backdrop or pressing Escape.
 * Acknowledging takes a deliberate click on the button, so nobody gets
 * to say they never saw it.
 */
export default function RestrictionModal({ notice, onDismiss }: RestrictionModalProps) {
  // Lock the page behind the modal while it is open.
  useEffect(() => {
    if (!notice) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [notice]);

  if (!notice) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="restriction-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-red-500/40 bg-[#0b0b0f] shadow-2xl">
        <div className="flex items-start gap-3 border-b border-red-500/30 bg-red-500/10 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-red-500/40 bg-red-500/15">
            <Lock className="h-5 w-5 text-red-400" />
          </div>
          <h2
            id="restriction-title"
            className="pt-1 text-base font-bold leading-snug tracking-wide text-red-200"
          >
            {notice.title}
          </h2>
        </div>

        <div className="space-y-4 px-6 py-5">
          {notice.body.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-sm leading-relaxed text-gray-300">
              {paragraph}
            </p>
          ))}

          <div className="flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-200">
              Payments made outside PantyPost have no escrow, no refund and no record. If
              someone asks you to move a conversation off the platform, they are asking you
              to give up the only protection you have.
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-white/10 bg-black/40 px-6 py-4">
          <button
            onClick={onDismiss}
            className="rounded-md bg-[#ff950e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e68500]"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
