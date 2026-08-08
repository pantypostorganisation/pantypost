// src/components/browse-detail/StickyPurchaseBar.tsx
'use client';

import { ShoppingBag } from 'lucide-react';
import { StickyPurchaseBarProps } from '@/types/browseDetail';
import type { DropInfo } from '@/services/listings.service';

export default function StickyPurchaseBar({
  show,
  listing,
  isProcessing,
  needsSubscription,
  isAuctionListing,
  userRole,
  onPurchase,
}: StickyPurchaseBarProps) {
  if (userRole !== 'buyer' || needsSubscription || isAuctionListing) return null;

  const total = listing.markedUpPrice ?? listing.price;

  const drop = (listing as { drop?: DropInfo }).drop;
  const dropNotOpen = Boolean(
    drop?.isDrop && drop.scheduledFor && new Date(drop.scheduledFor).getTime() > Date.now()
  );
  const dropSoldOut = Boolean(drop?.isDrop && (drop.unitsRemaining ?? 0) <= 0);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur transition-all duration-200 lg:hidden ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 p-4 safe-bottom">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ink-faint">Total</p>
          <p className="text-lg font-semibold leading-none text-ink">${total.toFixed(2)}</p>
        </div>
        <button
          onClick={onPurchase}
          className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover active:bg-primary-press disabled:opacity-50"
          disabled={isProcessing || dropNotOpen || dropSoldOut}
          aria-label={drop?.isDrop ? 'Claim your unit' : 'Buy now'}
        >
          {isProcessing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              Processing
            </>
          ) : dropSoldOut ? (
            <>Sold out</>
          ) : dropNotOpen ? (
            <>Not open yet</>
          ) : drop?.isDrop ? (
            <>
              <ShoppingBag className="h-4 w-4" />
              Claim unit
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Buy now
            </>
          )}
        </button>
      </div>
    </div>
  );
}