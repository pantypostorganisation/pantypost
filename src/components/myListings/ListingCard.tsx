// src/components/myListings/ListingCard.tsx
'use client';

import { Edit, Trash2, X } from 'lucide-react';
import { ListingCardProps } from '@/types/myListings';
import { timeSinceListed, formatTimeRemaining } from '@/utils/myListingsUtils';
import { useConfirmation } from '@/components/ui/ConfirmationModal';

export default function ListingCard({
  listing,
  analytics,
  onEdit,
  onDelete,
  onCancelAuction,
}: ListingCardProps) {
  const { confirm, ConfirmationModal } = useConfirmation();
  const isAuctionListing = !!listing.auction;
  const isPendingApproval = listing.approvalStatus === 'pending';
  const isDenied = listing.approvalStatus === 'denied';

  const drop = (listing as { drop?: { isDrop?: boolean; totalUnits?: number; unitsRemaining?: number; unitsSold?: number } }).drop;
  const isDrop = Boolean(drop?.isDrop);
  const dropUnitsSold = drop?.unitsSold ?? 0;
  const dropTotalUnits = drop?.totalUnits ?? 0;
  const dropPct = dropTotalUnits > 0 ? Math.round((dropUnitsSold / dropTotalUnits) * 100) : 0;
  // Gross of platform fees — what buyers have paid for units so far, at
  // the listed per-unit price. Net earnings live in the wallet.
  const dropRevenue = dropUnitsSold * (listing.price || 0);

  const cover = listing.imageUrls?.[0] ?? '';

  const currentBid = (() => {
    if (!isAuctionListing || !listing.auction) return null;
    const bid =
      typeof listing.auction.highestBid === 'number' && listing.auction.highestBid > 0
        ? listing.auction.highestBid
        : listing.auction.startingPrice;
    return `$${Number(bid).toFixed(2)}`;
  })();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Listing',
      message: 'Are you sure you want to delete this listing? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    
    if (confirmed) {
      onDelete(listing.id);
    }
  };

  const handleCancelAuction = async () => {
    const confirmed = await confirm({
      title: 'Cancel Auction',
      message: 'Are you sure you want to cancel this auction? All bids will be voided and this action cannot be undone.',
      confirmText: 'Cancel Auction',
      cancelText: 'Keep Active',
      type: 'warning',
    });
    
    if (confirmed) {
      onCancelAuction(listing.id);
    }
  };

  /* ---------------------------------------------------------------
   * SELLER LISTING CARD
   *
   * Was: an outer border that changed colour per type (purple for
   * auctions, orange for premium, grey otherwise), FIVE separately
   * written absolutely-positioned corner badges that are all mutually
   * exclusive, a 24px title, a description, a full-width status banner
   * repeating what the badge already said, a drop panel, a tag row of
   * pills, an auction panel in purple, a grey stats bar, and finally a
   * price row with three circular icon buttons.
   *
   * Eleven pill shapes and five colour families on one card, in a grid
   * of them.
   *
   * Now: image with ONE status badge, title, price, one meta line, and
   * actions in a footer row -- the same shape as the buyer order cards,
   * so both sides of the marketplace read as one product. Auctions and
   * drops keep the extra line they genuinely need; nothing else gets a
   * panel.
   * --------------------------------------------------------------- */

  // Exactly one badge can apply, so decide it once rather than writing
  // five mutually-exclusive blocks.
  const badge = isPendingApproval
    ? { label: 'Pending approval', tone: 'bg-warning text-black' }
    : isDenied
      ? { label: 'Denied', tone: 'bg-danger text-white' }
      : isAuctionListing
        ? { label: 'Auction', tone: 'bg-auction text-white' }
        : isDrop
          ? { label: 'Drop', tone: 'bg-primary text-black' }
          : listing.isPremium
            ? { label: 'Premium', tone: 'bg-primary text-black' }
            : null;

  const canEdit = !isAuctionListing || (listing.auction && listing.auction.status !== 'active');
  const canCancelAuction = isAuctionListing && listing.auction?.status === 'active';

  return (
    <>
      {ConfirmationModal}
      <article className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface-raised transition-colors hover:border-line-strong">
        <div className="relative aspect-square w-full overflow-hidden bg-surface-overlay">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-xs text-ink-faint">No image</span>
            </div>
          )}

          {badge ? (
            <span
              className={`absolute right-2 top-2 rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.tone}`}
            >
              {badge.label}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-sm font-semibold text-white">{listing.title}</h3>
            <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
              {isAuctionListing && listing.auction
                ? currentBid
                : `$${Number(listing.price).toFixed(2)}`}
            </span>
          </div>

          {/* One meta line replaces the grey stats bar. */}
          <p className="mt-1 truncate text-xs text-ink-faint">
            {analytics.views} views &middot; {timeSinceListed(listing.date)}
            {isAuctionListing && listing.auction
              ? ` - ${listing.auction.bids?.length ?? 0} ${
                  listing.auction.bids?.length === 1 ? 'bid' : 'bids'
                }`
              : ''}
          </p>

          {/* Auctions get one extra line -- the deadline is the thing a
              seller actually checks. The purple panel is gone. */}
          {isAuctionListing && listing.auction ? (
            <p className="mt-1 truncate text-xs text-auction">
              Ends {formatTimeRemaining(listing.auction.endTime)}
            </p>
          ) : null}

          {/* Drops keep their progress bar: it is live information that
              changes, not decoration. */}
          {isDrop && dropTotalUnits > 0 ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">
                  {dropUnitsSold} of {dropTotalUnits} claimed
                </span>
                <span className="tabular-nums text-ink">${dropRevenue.toFixed(2)}</span>
              </div>
              <div
                className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-overlay"
                role="progressbar"
                aria-valuenow={dropPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Units claimed"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${dropPct}%` }}
                />
              </div>
            </div>
          ) : null}

          {isDenied ? (
            <p className="mt-2 text-xs text-danger">
              This listing did not meet our guidelines.
            </p>
          ) : null}
        </div>

        {/* Actions as a footer row, matching the buyer order cards. */}
        <div className="flex divide-x divide-line border-t border-line">
          {canEdit ? (
            <button
              type="button"
              onClick={() => onEdit(listing)}
              className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <Edit className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
          ) : null}

          {canCancelAuction ? (
            <button
              type="button"
              onClick={handleCancelAuction}
              className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-warning"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancel auction
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleDelete}
            className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-hover hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      </article>
    </>
  );
}
