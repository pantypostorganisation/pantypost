// src/components/messaging/CustomRequestCard.tsx
'use client';

import { useState } from 'react';
import { ClipboardList, Check, X, Pencil, CreditCard, Clock } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { timeLabel } from './transcript';
import type { UICustomRequest, UIMessage, MessagingRole } from './types';

/* =====================================================================
 * A custom request, rendered as a negotiation card — not as a form
 * stuffed inside a speech bubble.
 *
 * The old version put label/value paragraphs inside the ordinary orange
 * bubble, and the edit form was a `bg-white/90` card with white inputs
 * nested inside it. In a dark product that reads as a rendering bug.
 *
 * WHO CAN ACT: driven by `pendingWith` from the server. The server also
 * enforces it (see customRequest.routes.js) and answers 409 if you try to
 * act out of turn, so this only decides what to *show* — it is not the
 * security boundary. Buttons disable while a response is in flight, since
 * accepting twice used to be possible with a double tap.
 * ===================================================================== */

const STATUS_STYLE: Record<UICustomRequest['status'], { label: string; cls: string }> = {
  pending: { label: 'Awaiting response', cls: 'bg-warning-soft text-warning' },
  edited: { label: 'Counter-offer', cls: 'bg-auction-soft text-auction' },
  accepted: { label: 'Accepted', cls: 'bg-success-soft text-success' },
  rejected: { label: 'Declined', cls: 'bg-danger-soft text-danger' },
  paid: { label: 'Paid', cls: 'bg-success-soft text-success' },
};

interface CustomRequestCardProps {
  message: UIMessage;
  request?: UICustomRequest;
  isOwn: boolean;
  currentUser: string;
  role: MessagingRole;
  onAccept?: (request: UICustomRequest) => Promise<void> | void;
  onDecline?: (request: UICustomRequest) => Promise<void> | void;
  onCounter?: (request: UICustomRequest) => void;
  onPay?: (request: UICustomRequest) => void;
}

export default function CustomRequestCard({
  message,
  request,
  isOwn,
  currentUser,
  role,
  onAccept,
  onDecline,
  onCounter,
  onPay,
}: CustomRequestCardProps) {
  const [busy, setBusy] = useState(false);

  const title = request?.title || message.meta?.title || 'Custom request';
  const price = Number(request?.price ?? message.meta?.price ?? 0);
  const description = request?.description || message.meta?.message || '';
  const tags = request?.tags || message.meta?.tags || [];
  const status = request?.status || 'pending';
  const badge = STATUS_STYLE[status];

  const myTurn = Boolean(request && request.pendingWith === currentUser);
  const settled = status === 'accepted' || status === 'rejected' || status === 'paid';
  const canPay = role === 'buyer' && status === 'accepted' && !request?.paid;

  const act = async (fn?: (r: UICustomRequest) => Promise<void> | void) => {
    if (!request || !fn || busy) return;
    setBusy(true);
    try {
      await fn(request);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="w-full max-w-[92%] sm:max-w-[26rem]">
        <div className="overflow-hidden rounded-lg border border-line bg-surface-raised">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <ClipboardList className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Custom request
            </span>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          <div className="px-4 py-3">
            <h4 className="break-words font-semibold text-ink">
              <SecureMessageDisplay content={title} allowBasicFormatting={false} />
            </h4>

            <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
              ${price.toFixed(2)}
            </p>

            {description ? (
              <p className="mt-2 break-words text-sm leading-relaxed text-ink-muted">
                <SecureMessageDisplay content={description} allowBasicFormatting={false} />
              </p>
            ) : null}

            {tags.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line bg-surface-overlay px-2 py-0.5 text-[11px] text-ink-muted"
                  >
                    <SecureMessageDisplay content={tag} allowBasicFormatting={false} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions, or an explanation of why there are none. */}
          {request && !settled && (
            <div className="border-t border-line px-4 py-3">
              {myTurn ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(onAccept)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 transition-colors hover:bg-primary-hover disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5 text-black" aria-hidden="true" />
                    <span className="text-sm font-semibold text-black">Accept</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(onDecline)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Decline
                  </button>
                  {onCounter && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => request && onCounter(request)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Counter
                    </button>
                  )}
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Waiting for {request.pendingWith || 'the other party'} to respond
                </p>
              )}
            </div>
          )}

          {canPay && (
            <div className="border-t border-line px-4 py-3">
              <button
                type="button"
                onClick={() => request && onPay?.(request)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 transition-colors hover:bg-primary-hover"
              >
                <CreditCard className="h-4 w-4 text-black" aria-hidden="true" />
                <span className="text-sm font-semibold text-black">
                  Pay ${price.toFixed(2)}
                </span>
              </button>
            </div>
          )}
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
