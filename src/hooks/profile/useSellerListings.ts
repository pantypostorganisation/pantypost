// src/hooks/profile/useSellerListings.ts

import { useMemo } from 'react';
import { useListings } from '@/context/ListingContext';
import { sanitizeUsername } from '@/utils/security/sanitization';

export function useSellerListings(username: string) {
  const { listings } = useListings();
  
  // Sanitize username to prevent injection attacks
  const sanitizedUsername = sanitizeUsername(username);
  
  const standardListings = useMemo(() => 
    listings.filter(listing => listing.seller === sanitizedUsername && !listing.isPremium),
    [listings, sanitizedUsername]
  );

  const premiumListings = useMemo(() =>
    listings.filter(listing => listing.seller === sanitizedUsername && listing.isPremium),
    [listings, sanitizedUsername]
  );

  return {
    standardListings,
    premiumListings,
  };
}
