'use client';

import { ShoppingBag } from 'lucide-react';
import { StickyPurchaseBarProps } from '@/types/browseDetail';

export default function StickyPurchaseBar({
  show,
  listing,
  isProcessing,
  needsSubscription,
  isAuctionListing,
  userRole,
  onPurchase,
}: StickyPurchaseBarProps) {
  // Only buyers can see this; admins/sellers are excluded via userRole
  if (userRole !== 'buyer' || needsSubscription || isAuctionListing) return null;

  const total = listing.markedUpPrice ?? listing.price;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
    >
      <div className="bg-black/95 p-4">
        <button
          onClick={onPurchase}
          className="w-full bg-[#ff950e] text-black px-6 py-3 rounded-xl font-bold text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={isProcessing}
          aria-label="Buy now"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              Buy Now • ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
