// src/components/browse/ListingGrid.tsx
'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import ListingCard from './ListingCard';
import { ListingGridProps } from '@/types/browse';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface ExtendedListingGridProps extends Omit<ListingGridProps, 'getDisplayPrice'> {
  isGuest?: boolean;
  /* Infinite scroll. `hasMore` stops the observer once the shopper
     reaches the end; `onLoadMore` reveals the next batch. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  /* Widened from the shared type: the price shown now depends on who
     is looking, since buyers see the marked-up price they will be
     charged while sellers and guests see the listed price. Overridden
     here rather than in types/browse.ts so no other consumer of
     ListingGridProps has to change. */
  getDisplayPrice: (
    listing: Parameters<ListingGridProps['getDisplayPrice']>[0],
    viewerRole?: string | null
  ) => ReturnType<ListingGridProps['getDisplayPrice']>;
}

export default function ListingGrid({
  listings,
  hoveredListing,
  onListingHover,
  onListingLeave,
  onListingClick,
  onQuickView,
  user,
  isSubscribed,
  getDisplayPrice,
  forceUpdateTimer,
  formatTimeRemaining,
  listingErrors,
  onListingError,
  isGuest = false,
  hasMore = false,
  onLoadMore
}: ExtendedListingGridProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /* Loads the next batch while the shopper is still reading the
     current one.
     rootMargin of 800px means the sentinel counts as "seen" well
     before it scrolls into view, so the next rows are mounted and
     their images already downloading by the time anyone reaches them.
     Waiting for the sentinel to actually appear would show a gap. */
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: '800px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, listings.length]);

  return (
    <>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
      {listings.map((listing) => {
        // Individual listing error handling
        if (listingErrors[listing.id]) {
          return (
            <div key={listing.id} className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-sm">Error loading listing</p>
              <SecureMessageDisplay
                content={listingErrors[listing.id]}
                allowBasicFormatting={false}
                className="text-gray-500 text-xs mt-1"
                maxLength={100}
              />
            </div>
          );
        }

        try {
          const isLockedPremium =
            listing.isPremium && (!user?.username || !isSubscribed(user?.username, listing.seller));
          // Buyers see the marked-up price they will be charged;
          // sellers and guests see the seller's listed price.
          const displayPrice = getDisplayPrice(listing, user?.role);

          return (
            <ListingCard
              key={listing.id}
              listing={listing}
              isHovered={hoveredListing === listing.id}
              onMouseEnter={() => onListingHover(listing.id)}
              onMouseLeave={onListingLeave}
              onClick={() => onListingClick(listing.id, Boolean(isLockedPremium))}
              onQuickView={(e) => onQuickView(e, listing.id)}
              user={user}
              isSubscribed={isSubscribed(user?.username || '', listing.seller)}
              displayPrice={displayPrice}
              forceUpdateTimer={forceUpdateTimer}
              formatTimeRemaining={formatTimeRemaining}
              isGuest={isGuest}
            />
          );
        } catch (error) {
          onListingError(error as Error, listing.id);
          return null;
        }
      })}
    </div>

      {/* Sits below the grid and triggers the next batch. Rendered
          only while there is more, so it disappears at the end rather
          than leaving a permanent spinner. */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8" aria-hidden="true">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-700 border-t-[#ff950e]" />
        </div>
      )}
    </>
  );
}






