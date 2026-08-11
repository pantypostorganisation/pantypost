// src/components/browse-detail/AuctionEndedModal.tsx
'use client';

import { useEffect } from 'react';
import { Gavel, RefreshCw, Target, XCircle } from 'lucide-react';
import { AuctionEndedModalProps } from '@/types/browseDetail';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

/* =====================================================================
 * Auction ended.
 *
 * This file used to contain FOUR complete modal shells -- buyer with
 * reserve not met, seller with reserve not met, seller / non-bidder, and
 * outbid bidder -- each repeating its own overlay, panel, icon block,
 * heading, body and button markup. Between them they carried eight
 * gradients, seven pill buttons and three raw hex values, and the four
 * copies had already drifted apart from each other.
 *
 * There is one shell now. The branching decides a small descriptor --
 * tone, icon, title, body, action -- and the shell renders it. Adding a
 * fifth outcome later means adding a case, not another 90 lines of
 * duplicated chrome.
 *
 * Every original condition and every piece of copy is preserved.
 * ===================================================================== */

type Tone = 'neutral' | 'warning' | 'danger';

export default function AuctionEndedModal({
  isAuctionListing,
  isAuctionEnded,
  listing,
  isUserHighestBidder,
  didUserBid,
  userRole,
  username,
  bidsHistory,
  onNavigate,
}: AuctionEndedModalProps) {
  /* Escape dismisses, matching every other overlay in the app. Declared
     before the early returns so the hook order never changes. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onNavigate('/browse');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNavigate]);

  if (!isAuctionListing || !isAuctionEnded || !listing.auction) return null;

  const auction = listing.auction;
  const hasBids = !!(auction.bids && auction.bids.length > 0);
  const isSeller = username === listing.seller;
  const hasUserBid = !!(didUserBid && !isUserHighestBidder);

  const hasReserve = auction.reservePrice !== undefined && auction.reservePrice > 0;
  const reserveMet = !hasReserve || (auction.highestBid && auction.highestBid >= auction.reservePrice!);
  const isReserveNotMet = hasReserve && !reserveMet;
  const cancelled = auction.status === 'cancelled';
  const reserveNotMetStatus = auction.status === 'reserve_not_met';

  // The winner gets a separate success flow; nothing to show here.
  if (userRole === 'buyer' && isUserHighestBidder && reserveMet && !cancelled && !reserveNotMetStatus) {
    return null;
  }

  const title = (
    <SecureMessageDisplay
      content={listing.title}
      allowBasicFormatting={false}
      className="inline font-semibold text-primary"
    />
  );

  const money = (value?: number) => `$${(value ?? 0).toFixed(2)}`;

  /* ---- Decide WHAT to say. One place, all outcomes visible together. ---- */
  let tone: Tone = 'neutral';
  let Icon = Gavel;
  let heading = 'Auction ended';
  let body: React.ReactNode = null;
  let actionLabel = 'Browse other listings';

  if (userRole === 'buyer' && isUserHighestBidder && (isReserveNotMet || reserveNotMetStatus)) {
    tone = 'warning';
    Icon = Target;
    heading = 'Reserve price not met';
    body = (
      <>
        <p>
          You had the highest bid on {title}, but it did not reach the seller&rsquo;s reserve of{' '}
          <span className="font-semibold text-white">{money(auction.reservePrice)}</span>, so the
          sale did not complete.
        </p>
        <p className="mt-3 rounded-sm border border-line bg-surface-overlay px-3 py-2 text-ink-muted">
          <span className="font-semibold text-white">You have not been charged.</span> Any hold on
          your balance is released automatically.
        </p>
      </>
    );
  } else if (isSeller && (isReserveNotMet || reserveNotMetStatus)) {
    tone = 'warning';
    Icon = Target;
    heading = 'Reserve not met';
    body = (
      <>
        <p>
          Your auction for {title} ended at{' '}
          <span className="font-semibold text-white">{money(auction.highestBid)}</span>, below your
          reserve of <span className="font-semibold text-white">{money(auction.reservePrice)}</span>.
          No sale was made and the bidder was not charged.
        </p>
        <p className="mt-3 text-ink-muted">
          You can relist it with a lower reserve, or none at all.
        </p>
      </>
    );
    actionLabel = 'Back to browse';
  } else if (cancelled) {
    tone = 'danger';
    Icon = XCircle;
    heading = 'Auction cancelled';
    body = <p>This auction was cancelled by the seller.</p>;
  } else if (isSeller) {
    Icon = hasBids ? Gavel : RefreshCw;
    heading = hasBids ? 'Your auction ended' : 'Your auction ended with no bids';
    body = hasBids ? (
      <p>
        {title} sold for{' '}
        <span className="font-semibold text-success">{money(auction.highestBid)}</span> to{' '}
        <SecureMessageDisplay
          content={auction.highestBidder || ''}
          allowBasicFormatting={false}
          className="inline font-semibold text-white"
        />
        .
      </p>
    ) : (
      <p>
        {title} ended without any bids. Relisting at a lower starting price is usually the fastest
        fix.
      </p>
    );
    actionLabel = 'Back to browse';
  } else if (hasUserBid) {
    heading = 'You were outbid';
    body = (
      <p>
        {title} ended at{' '}
        <span className="font-semibold text-white">{money(auction.highestBid)}</span>
        {bidsHistory && bidsHistory.length > 0 ? (
          <> across {bidsHistory.length} {bidsHistory.length === 1 ? 'bid' : 'bids'}</>
        ) : null}
        . You have not been charged.
      </p>
    );
  } else {
    body = (
      <p>
        {title} has finished
        {hasBids ? (
          <>
            {' '}at <span className="font-semibold text-white">{money(auction.highestBid)}</span>
          </>
        ) : (
          ' without any bids'
        )}
        .
      </p>
    );
  }

  const toneRing: Record<Tone, string> = {
    neutral: 'border-line bg-surface-overlay text-ink',
    warning: 'border-warning bg-warning-soft text-warning',
    danger: 'border-danger bg-danger-soft text-danger',
  };

  return (
    <div
      role="presentation"
      onClick={() => onNavigate('/browse')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        onClick={(event) => event.stopPropagation()}
        className="pop-in w-full max-w-md rounded-lg border border-line bg-surface-raised p-6 text-center"
      >
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border ${toneRing[tone]}`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <h2 className="mb-2 text-xl font-bold text-white">{heading}</h2>

        <div className="text-sm leading-relaxed text-ink-muted">{body}</div>

        <button
          type="button"
          onClick={() => onNavigate('/browse')}
          className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-primary-hover active:bg-primary-press"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
