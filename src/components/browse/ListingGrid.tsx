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
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
      {listings.map((listing) => {
        // Individual listing error handling
        if (listingErrors[listing.id]) {
          return (
            <div key={listing.id} className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-center">
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
