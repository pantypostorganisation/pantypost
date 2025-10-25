// src/hooks/useListingUpdates.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ListingUpdate {
  listingId: string;
  price?: number;
  markedUpPrice?: number;
  title?: string;
  description?: string;
  tags?: string[];
  imageUrls?: string[];
  listing?: any;
}

export function useListingUpdates(onUpdate?: (update: ListingUpdate) => void) {
  const router = useRouter();

  const handleListingUpdate = useCallback((event: CustomEvent<ListingUpdate>) => {
    console.log('[useListingUpdates] Received listing update:', event.detail);
    
    // Call the provided callback if available
    if (onUpdate) {
      onUpdate(event.detail);
    }
    
    // Trigger a soft refresh of the current page data
    router.refresh();
  }, [onUpdate, router]);

  useEffect(() => {
    // Listen for listing update events
    const updateHandler = (event: Event) => {
      if (event instanceof CustomEvent) {
        handleListingUpdate(event);
      }
    };

    // Add event listeners for various update events
    window.addEventListener('listing:updated', updateHandler);
    window.addEventListener('listing:price_updated', updateHandler);
    
    // Cleanup
    return () => {
      window.removeEventListener('listing:updated', updateHandler);
      window.removeEventListener('listing:price_updated', updateHandler);
    };
  }, [handleListingUpdate]);

  return {
    // Expose a manual refresh function if needed
    refreshListings: () => {
      router.refresh();
    }
  };
}