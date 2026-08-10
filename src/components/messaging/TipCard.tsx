// src/components/messaging/TipCard.tsx
'use client';

import { Gift } from 'lucide-react';
import { timeLabel } from './transcript';
import type { UIMessage } from './types';

/* =====================================================================
 * A tip, rendered as a card.
 *
 * The Message schema has carried `type: 'tip'` with `meta.tipAmount`
 * since the beginning, but neither side ever rendered it â€” a seller who
 * received a tip saw a plain grey text bubble, indistinguishable from
 * chatter. Money arriving should look like money arriving.
 *
 * Tips remain buyer -> seller only; this just makes the receipt visible
 * to both parties.
 * ===================================================================== */

interface TipCardProps {
  message: UIMessage;
  isOwn: boolean;
  currentUser: string;
}

export default function TipCard({ message, isOwn, currentUser }: TipCardProps) {
  const amount = Number(message.meta?.tipAmount) || 0;
  const received = message.receiver === currentUser;

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="w-full max-w-[85%] sm:max-w-[22rem]">
        <div className="rounded-md border border-success-soft bg-success-soft p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/20">
              <Gift className="h-4 w-4 text-success" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {received ? 'Tip received' : 'Tip sent'}
              </p>
              <p className="text-xl font-bold tabular-nums text-success">
                ${amount.toFixed(2)}
              </p>
            </div>
          </div>

          {message.content ? (
            <p className="mt-3 break-words border-t border-line pt-3 text-sm text-ink-muted">
              {message.content}
            </p>
          ) : null}
        </div>

        <time
          className={`mt-1 block px-1 text-[11px] text-ink-faint ${isOwn ? 'text-right' : ''}`}
          dateTime={message.date}
        >
          {timeLabel(message.date)}
        </time>
      </div>
    </div>
  );
}