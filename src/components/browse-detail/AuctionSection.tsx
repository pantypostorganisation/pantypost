// src/components/browse-detail/AuctionSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Gavel, Lock, Target, Trophy } from 'lucide-react';
import { AuctionSectionProps, BidHistoryItem } from '@/types/browseDetail';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeCurrency } from '@/utils/security/sanitization';

interface ExtendedAuctionSectionProps extends AuctionSectionProps {
  realtimeBids?: BidHistoryItem[];
  mergedBidsHistory?: BidHistoryItem[];
}

export default function AuctionSection({
  listing,
  isAuctionEnded,
  formatTimeRemaining,
  currentTotalPayable,
  getTimerProgress,
  bidAmount,
  onBidAmountChange,
  onBidSubmit,
  onBidKeyPress,
  isBidding,
  biddingEnabled,
  bidError,
  bidSuccess,
  onShowBidHistory,
  bidsCount,
  userRole,
  username,
  bidInputRef,
  bidButtonRef,
  realtimeBids,
  mergedBidsHistory,
}: ExtendedAuctionSectionProps) {
  const [isUrgent, setIsUrgent] = useState(false);
  const [userBidPosition, setUserBidPosition] = useState<number | null>(null);

  if (!listing.auction) return null;

  const isActualAuction = !!(listing.auction.isAuction || listing.auction.startingPrice !== undefined);
  if (!isActualAuction) return null;

  const isUserSeller = username === listing.seller;
  const canBid = !isAuctionEnded && userRole === 'buyer' && !isUserSeller; // admin/seller blocked

  // Check if reserve price exists and if it's met
  const hasReserve = !!listing.auction?.reservePrice;
  const currentBid = listing.auction.highestBid || 0;
  const reserveMet = hasReserve ? currentBid >= (listing.auction.reservePrice || 0) : true;
  const reservePercentage = hasReserve && listing.auction.reservePrice 
    ? Math.min(100, (currentBid / listing.auction.reservePrice) * 100)
    : 100;

  // Urgency (<= 5 minutes)
  useEffect(() => {
    if (!listing.auction?.endTime) return;
    const checkUrgency = () => {
      const end = new Date(listing.auction!.endTime).getTime();
      const left = end - Date.now();
      setIsUrgent(left <= 5 * 60 * 1000 && left > 0);
    };
    checkUrgency();
    const id = setInterval(checkUrgency, 1000);
    return () => clearInterval(id);
  }, [listing.auction?.endTime]);

  // User position based on merged history (highest first)
  useEffect(() => {
    if (!username || !mergedBidsHistory || mergedBidsHistory.length === 0) {
      setUserBidPosition(null);
      return;
    }
    const sorted = [...mergedBidsHistory].sort((a, b) => b.amount - a.amount);
    const idx = sorted.findIndex((b) => b.bidder === username);
    setUserBidPosition(idx === -1 ? null : idx + 1);
  }, [username, mergedBidsHistory]);

  const handleSecureBidChange = (value: string) => {
    if (value === '') onBidAmountChange('');
    else onBidAmountChange(sanitizeCurrency(value).toString());
  };

  const handleQuickBid = (increment: number) => {
    const current = listing.auction?.highestBid || listing.auction?.startingPrice || 0;
    const newBid = Math.ceil(current) + increment;
    handleSecureBidChange(newBid.toString());
  };

  const recentBids = mergedBidsHistory?.slice(0, 3) || listing.auction.bids?.slice(0, 3) || [];

  const getTimerColor = () => {
    if (isAuctionEnded) return 'text-gray-400';
    if (isUrgent) return 'text-red-400';
    return 'text-green-400';
  };

  const getMinimumBid = () => {
    if (listing.auction?.highestBid) return Math.floor(Number(listing.auction.highestBid)) + 1;
    const start = Math.floor(Number(listing.auction?.startingPrice || 0));
    return start || 1;
  };

  /* ---------------------------------------------------------------
   * LAYOUT NOTE
   *
   * This card used to stack ten separate boxes: header, reserve badge,
   * reserve progress bar, position, a 3-up stats grid, a time progress
   * bar, "total payable", "seller earnings", the bid form and recent
   * bids. Two progress bars sat three rows apart looking identical while
   * meaning completely different things (money vs time), and the reserve
   * status was stated in FOUR places.
   *
   * It also carried five colour families -- purple, red, green, yellow
   * and grey -- in a product whose palette is black plus one orange with
   * a single `auction` accent.
   *
   * Restructured around what a bidder actually decides on:
   *   1. the two numbers that matter (current bid, time left)
   *   2. one progress bar (time)
   *   3. reserve status, stated ONCE
   *   4. what you pay if you win
   *   5. where you stand
   *   6. the bid form
   *   7. recent activity
   *
   * All logic, props and handlers are unchanged.
   * --------------------------------------------------------------- */
  return (
    <div
      className={`rounded-lg border p-4 ${
        isAuctionEnded
          ? 'border-line bg-surface-raised'
          : isUrgent
            ? 'border-danger bg-surface-raised'
            : 'border-auction bg-surface-raised'
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white">Auction</h3>
          {isAuctionEnded ? (
            <span className="rounded-sm bg-surface-overlay px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              Ended
            </span>
          ) : (
            /* Static. The old badge ran an infinite opacity pulse AND an
               animate-pulse dot; the design rules rule out ambient
               animation, and two of them on one chip is noise. */
            <span
              className={`rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                isUrgent ? 'bg-danger text-white' : 'bg-auction-soft text-auction'
              }`}
            >
              {isUrgent ? 'Ending soon' : 'Live'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onShowBidHistory}
          className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          aria-label="View full bid history"
        >
          <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
          {bidsCount || 0} {(bidsCount || 0) === 1 ? 'bid' : 'bids'}
        </button>
      </div>

      {/* The two decision numbers, side by side and large. These were
          previously two thirds of a 3-up grid of small boxes, with the
          starting price given equal weight -- which almost nobody needs
          once bidding has started. */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs text-ink-faint">
            {listing.auction.highestBid ? 'Current bid' : 'Starting bid'}
          </p>
          <p className="text-2xl font-bold leading-none text-white">
            ${Math.floor(listing.auction.highestBid || listing.auction.startingPrice)}
          </p>
          {listing.auction.highestBid ? (
            <p className="mt-1 text-[11px] text-ink-faint">
              opened at ${Math.floor(listing.auction.startingPrice)}
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-1 text-xs text-ink-faint">
            {isAuctionEnded ? 'Closed' : 'Time left'}
          </p>
          <p
            className={`text-2xl font-bold leading-none ${
              isAuctionEnded ? 'text-ink-muted' : isUrgent ? 'text-danger' : 'text-white'
            }`}
          >
            {isAuctionEnded
              ? '--'
              : formatTimeRemaining(listing.auction.endTime).split(' ').slice(0, 2).join(' ')}
          </p>
        </div>
      </div>

      {/* One progress bar, and it is time. The reserve had its own
          identical-looking bar three rows away. */}
      {!isAuctionEnded && (
        <div
          className="mb-3 h-1 w-full overflow-hidden rounded-full bg-surface-overlay"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(getTimerProgress())}
          aria-label="Time elapsed"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ${
              isUrgent ? 'bg-danger' : 'bg-auction'
            }`}
            style={{ width: `${getTimerProgress()}%` }}
          />
        </div>
      )}

      {/* Reserve, stated ONCE. It previously appeared as a badge, a
          progress bar, a "$X more" line, a warning inside the payable
          box and a note in the seller box. */}
      {hasReserve && (
        <div
          className={`mb-3 flex items-center justify-between gap-2 rounded-sm border px-3 py-2 text-xs ${
            reserveMet
              ? 'border-success bg-success-soft text-success'
              : 'border-warning bg-warning-soft text-warning'
          }`}
        >
          <span className="inline-flex items-center gap-1.5 font-semibold">
            {reserveMet ? (
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {reserveMet ? 'Reserve met' : 'Reserve not met'}
          </span>
          {!reserveMet && currentBid > 0 ? (
            <span className="tabular-nums">
              ${Math.floor((listing.auction.reservePrice || 0) - currentBid).toLocaleString()} more
            </span>
          ) : null}
        </div>
      )}

      {/* What you actually pay. Kept because the bid and the charge are
          different numbers, and a buyer discovering that at checkout is
          how chargebacks start. */}
      <div className="mb-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-xs text-ink-muted">You pay if you win</span>
        <span className="text-base font-bold tabular-nums text-white">
          ${currentTotalPayable.toFixed(2)}
        </span>
      </div>

      {/* Seller's own view of the same auction. */}
      {userRole === 'seller' && username === listing.seller && listing.auction.highestBid ? (
        <div className="mb-3 flex items-baseline justify-between rounded-sm bg-surface-overlay px-3 py-2">
          <span className="text-xs text-ink-muted">You receive (80%)</span>
          <span className="text-sm font-bold tabular-nums text-success">
            ${(listing.auction.highestBid * 0.8).toFixed(2)}
          </span>
        </div>
      ) : null}

      {/* Where you stand */}
      {userBidPosition && !isAuctionEnded ? (
        <div
          className={`mb-3 flex items-center justify-center gap-2 rounded-sm border px-3 py-2 ${
            userBidPosition === 1
              ? 'border-success bg-success-soft'
              : 'border-warning bg-warning-soft'
          }`}
          role="status"
        >
          {userBidPosition === 1 ? (
            <>
              <Trophy className="h-4 w-4 text-success" aria-hidden="true" />
              <span className="text-sm font-bold text-success">
                {reserveMet ? "You're winning" : "You're highest, reserve not met"}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
              <span className="text-xs font-semibold text-warning">You&rsquo;re #{userBidPosition}</span>
            </>
          )}
        </div>
      ) : null}

      {/* Bidding */}
      {canBid && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <SecureInput
              ref={bidInputRef}
              type="number"
              placeholder={`Min $${getMinimumBid()}`}
              value={bidAmount}
              onChange={handleSecureBidChange}
              onKeyPress={onBidKeyPress}
              min={getMinimumBid().toString()}
              step="1"
              inputMode="numeric"
              pattern="[0-9]*"
              className="h-10 flex-1 rounded-sm border border-line bg-surface-overlay px-3 text-sm text-white placeholder-ink-faint transition-colors focus:border-auction focus:outline-none"
              sanitize={false}
              aria-label="Your bid amount"
            />
            <button
              ref={bidButtonRef}
              type="button"
              onClick={onBidSubmit}
              disabled={isBidding || !biddingEnabled}
              className="h-10 shrink-0 rounded-sm bg-auction px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Place bid"
            >
              {isBidding ? 'Placing...' : 'Place bid'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-faint">Quick</span>
            {[1, 5, 10].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickBid(amount)}
                className="flex-1 rounded-sm border border-line bg-surface-overlay px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-auction hover:bg-surface-hover"
                aria-label={`Increase bid by $${amount}`}
              >
                +${amount}
              </button>
            ))}
          </div>

          {bidError ? (
            <div
              className="flex items-center gap-1.5 rounded-sm border border-danger bg-danger-soft px-3 py-2 text-xs text-danger"
              role="alert"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {bidError}
            </div>
          ) : null}

          {bidSuccess ? (
            <div
              className="flex items-center gap-1.5 rounded-sm border border-success bg-success-soft px-3 py-2 text-xs text-success"
              role="status"
            >
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {bidSuccess}
            </div>
          ) : null}
        </div>
      )}

      {/* Recent bids */}
      {recentBids.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs font-semibold text-ink-muted">Recent bids</p>

          <div className="space-y-1">
            {recentBids.slice(0, 3).map((bid, index) => (
              <div
                key={`${bid.bidder}-${bid.amount}-${index}`}
                className="flex items-center justify-between rounded-sm bg-surface-overlay px-3 py-2 text-xs"
              >
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    bid.bidder === username ? 'text-auction' : 'text-ink'
                  }`}
                >
                  {index === 0 ? (
                    <Trophy className="h-3 w-3 text-success" aria-hidden="true" />
                  ) : null}
                  {bid.bidder === username ? 'You' : bid.bidder}
                </span>
                <span
                  className={`font-bold tabular-nums ${index === 0 ? 'text-success' : 'text-ink'}`}
                >
                  ${Math.floor(bid.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
