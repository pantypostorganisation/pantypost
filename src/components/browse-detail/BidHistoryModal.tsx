// src/components/browse-detail/BidHistoryModal.tsx
'use client';

import { useEffect } from 'react';
import { Gavel, Trophy, X } from 'lucide-react';
import { BidHistoryModalProps } from '@/types/browseDetail';

/* =====================================================================
 * Full bid history.
 *
 * Previously: a grey gradient panel with a purple border, four gradients
 * inside it, a 40px avatar circle per row (green gradient ring for the
 * leader, purple for you, grey otherwise), a "Highest" pill that
 * scale-animated in, a per-row entrance stagger, and its own inline
 * scrollbar CSS duplicating the `.custom-scrollbar` class that already
 * exists in globals.css.
 *
 * A bid list needs three things per row: who, how much, when. Everything
 * else was decoration competing with the numbers -- which is exactly
 * what made the auction surface feel busy.
 *
 * Now: one flat panel, rows on a single surface, the leader marked by a
 * small trophy and the success colour rather than by a gradient, and
 * amounts in tabular figures so the column actually lines up.
 * ===================================================================== */

export default function BidHistoryModal({
  show,
  onClose,
  bidsHistory,
  currentUsername,
  formatBidDate,
  calculateTotalPayable,
}: BidHistoryModalProps) {
  // Declared before the early return so hook order is stable.
  useEffect(() => {
    if (!show) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bid history"
        onClick={(event) => event.stopPropagation()}
        className="pop-in flex max-h-[70vh] w-full max-w-lg flex-col rounded-lg border border-line bg-surface-raised"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            Bid history
            {bidsHistory.length > 0 && (
              <span className="rounded-sm bg-surface-overlay px-2 py-0.5 text-xs font-semibold text-ink-muted">
                {bidsHistory.length}
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-surface-hover hover:text-white"
            aria-label="Close bid history"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        {bidsHistory.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface-overlay">
              <Gavel className="h-6 w-6 text-ink-faint" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-white">No bids yet</p>
            <p className="mt-1 text-xs text-ink-muted">Be the first to bid on this item.</p>
          </div>
        ) : (
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-3">
            <ul className="divide-y divide-line">
              {bidsHistory.map((bid, index) => {
                const isLeader = index === 0;
                const isYou = bid.bidder === currentUsername;

                return (
                  <li
                    key={`${bid.bidder}-${bid.amount}-${index}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {isLeader ? (
                        <Trophy className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <span className="w-4 shrink-0 text-center text-xs tabular-nums text-ink-faint">
                          {index + 1}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-medium ${
                            isYou ? 'text-primary' : 'text-white'
                          }`}
                        >
                          {isYou ? 'You' : bid.bidder}
                        </p>
                        <p className="text-xs text-ink-faint">{formatBidDate(bid.date)}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-bold tabular-nums ${
                          isLeader ? 'text-success' : 'text-white'
                        }`}
                      >
                        ${bid.amount.toFixed(2)}
                      </p>
                      {/* The bid and the amount charged are different
                          numbers; showing both here keeps it honest. */}
                      <p className="text-xs tabular-nums text-ink-faint">
                        ${calculateTotalPayable(bid.amount).toFixed(2)} total
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md border border-line bg-surface-overlay px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary-line hover:bg-surface-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
