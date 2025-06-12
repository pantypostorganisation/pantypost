// src/hooks/profile/useSellerListings.ts
import { useMemo } from 'react';
import { useListings } from '@/context/ListingContext';

export function useSellerListings(username: string) {
  const { listings } = useListings();

  const standardListings = useMemo(() => 
    listings.filter(listing => listing.seller === username && !listing.isPremium),
    [listings, username]
  );

  const premiumListings = useMemo(() =>
    listings.filter(listing => listing.seller === username && listing.isPremium),
    [listings, username]
  );

  return {
    standardListings,
    premiumListings,
  };
}