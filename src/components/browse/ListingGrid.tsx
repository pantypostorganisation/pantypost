// src/components/browse/ListingGrid.tsx
'use client';

import { AlertTriangle } from 'lucide-react';
import ListingCard from './ListingCard';
import { ListingGridProps } from '@/types/browse';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface ExtendedListingGridProps extends ListingGridProps {
  isGuest?: boolean;
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
  isGuest = false
}: ExtendedListingGridProps) {
  return (
    /* Capped at 4 columns and given generous gaps.
       Premium marketplaces run lower grid density than discount ones —
       more air per item reads as considered, while packing six across
       reads as a bargain bin. Two columns on mobile matches how
       Depop-style browsing actually happens on a phone. */
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4 xl:gap-6">
      {listings.map((listing) => {
        if (listingErrors[listing.id]) {
          return (
            <div
              key={listing.id}
              className="flex flex-col items-center justify-center rounded-lg border border-danger/30 bg-danger-soft p-4 text-center"
            >
              <AlertTriangle className="mb-2 h-6 w-6 text-danger" />
              <p className="text-sm text-danger">Could not load listing</p>
              <SecureMessageDisplay
                content={listingErrors[listing.id]}
                allowBasicFormatting={false}
                className="mt-1 text-xs text-ink-faint"
                maxLength={100}
              />
            </div>
          );
        }

        try {
          const isLockedPremium =
            listing.isPremium && (!user?.username || !isSubscribed(user?.username, listing.seller));
          const displayPrice = getDisplayPrice(listing);

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
  );
}
