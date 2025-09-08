// src/hooks/useBrowseListings.ts

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { storageService, listingsService } from '@/services';
import { FilterOptions, CategoryCounts, SellerProfile, ListingWithProfile } from '@/types/browse';
import { 
  HOUR_RANGE_OPTIONS, 
  PAGE_SIZE, 
  isAuctionListing as isAuctionListingUtil, 
  isListingActive as isListingActiveUtil, 
  getDisplayPrice as getDisplayPriceUtil,
  formatTimeRemaining as formatTimeRemainingUtil
} from '@/utils/browseUtils';
import { Listing } from '@/context/ListingContext';
import { sanitizeSearchQuery, sanitizeNumber, sanitizeStrict } from '@/utils/security/sanitization';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { searchSchemas } from '@/utils/validation/schemas';
import { resolveApiUrl } from '@/utils/url';

// Type definitions - matching what we actually have in storage
interface Order {
  id: string;
  seller: string;
  buyer: string;
  date: string;
}

interface User {
  username: string;
  verified?: boolean;
  verificationStatus?: string;
}

// Extended Listing type that includes sellerProfile from backend
interface ListingFromBackend extends Listing {
  sellerProfile?: SellerProfile;
  isSellerVerified?: boolean;
  sellerSalesCount?: number;
}

// Helper functions to normalize listings for utility functions
const normalizeListing = (listing: Listing): any => ({
  ...listing,
  markedUpPrice: listing.markedUpPrice || Math.round(listing.price * 1.1 * 100) / 100,
  imageUrls: listing.imageUrls || []
});

const isAuctionListing = (listing: Listing): boolean => {
  return isAuctionListingUtil(normalizeListing(listing));
};

const isListingActive = (listing: Listing): boolean => {
  return isListingActiveUtil(normalizeListing(listing));
};

const getDisplayPrice = (listing: Listing) => {
  return getDisplayPriceUtil(normalizeListing(listing));
};

export const useBrowseListings = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { checkLimit: checkSearchLimit } = useRateLimit('SEARCH');
  
  // CRITICAL FIX: Don't use context listings, fetch fresh from API
  const { 
    users: contextUsers,
    subscriptions: contextSubscriptions,
    orderHistory: contextOrderHistory,
    error: contextError,
  } = useListings();

  // State for filters and UI
  const [filter, setFilter] = useState<FilterOptions['filter']>('all');
  const [selectedHourRange, setSelectedHourRange] = useState(HOUR_RANGE_OPTIONS[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('newest');
  const [page, setPage] = useState(0);
  const [forceUpdateTimer, setForceUpdateTimer] = useState(0);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: SellerProfile }>({});
  const [listingErrors, setListingErrors] = useState<{ [listingId: string]: string }>({});
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  // CRITICAL: Add state for fresh listings
  const [freshListings, setFreshListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  // Refs
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastClickTime = useRef<number>(0);
  const lastQuickViewTime = useRef<number>(0);

  const MAX_CACHED_PROFILES = 100;
  const REFRESH_INTERVAL = 5000; // Refresh every 5 seconds

  // CRITICAL FIX: Fetch fresh listings from API
  const fetchFreshListings = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setIsLoading(true);
      console.log('[useBrowseListings] Fetching fresh listings from API...');
      
      // Clear the listings service cache to force fresh data
      listingsService.clearCache();
      
      // Fetch fresh listings directly from API
      const result = await listingsService.getListings({ isActive: true });
      
      if (result.success && result.data && mountedRef.current) {
        console.log('[useBrowseListings] Got fresh listings:', result.data.length);
        setFreshListings(result.data);
        setLastFetchTime(Date.now());
      }
    } catch (error) {
      console.error('[useBrowseListings] Error fetching listings:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    // Initial fetch
    fetchFreshListings();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      if (mountedRef.current) {
        fetchFreshListings();
      }
    }, REFRESH_INTERVAL);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchFreshListings]);

  // Listen for any events that should trigger a refresh
  useEffect(() => {
    const handleRefreshNeeded = () => {
      console.log('[useBrowseListings] Refresh triggered by event');
      fetchFreshListings();
    };
    
    // Listen for various events that might change listings
    window.addEventListener('listing:removed', handleRefreshNeeded);
    window.addEventListener('listingDeleted', handleRefreshNeeded);
    window.addEventListener('listingCreated', handleRefreshNeeded);
    window.addEventListener('listings:refreshed', handleRefreshNeeded);
    window.addEventListener('verification:status-changed', handleRefreshNeeded);
    window.addEventListener('user:verification-updated', handleRefreshNeeded);
    
    return () => {
      window.removeEventListener('listing:removed', handleRefreshNeeded);
      window.removeEventListener('listingDeleted', handleRefreshNeeded);
      window.removeEventListener('listingCreated', handleRefreshNeeded);
      window.removeEventListener('listings:refreshed', handleRefreshNeeded);
      window.removeEventListener('verification:status-changed', handleRefreshNeeded);
      window.removeEventListener('user:verification-updated', handleRefreshNeeded);
    };
  }, [fetchFreshListings]);

  // Sanitized search term setter
  const handleSearchTermChange = useCallback((value: string) => {
    const sanitized = sanitizeSearchQuery(value);
    setSearchTerm(sanitized);
  }, []);

  // Validated price setters
  const handleMinPriceChange = useCallback((value: string) => {
    if (value === '') {
      setMinPrice('');
      return;
    }
    
    const validation = searchSchemas.priceRange.safeParse({ min: parseFloat(value) });
    if (validation.success) {
      setMinPrice(value);
    }
  }, []);

  const handleMaxPriceChange = useCallback((value: string) => {
    if (value === '') {
      setMaxPrice('');
      return;
    }
    
    const validation = searchSchemas.priceRange.safeParse({ max: parseFloat(value) });
    if (validation.success) {
      setMaxPrice(value);
    }
  }, []);

  // Apply filters to fresh listings (not context listings)
  const filteredListings = useMemo(() => {
    console.log('=== Filtering listings ===');
    console.log('Fresh listings count:', freshListings.length);
    console.log('Current filters:', { filter, searchTerm: debouncedSearchTerm, minPrice, maxPrice, sortBy, selectedHourRange });
    
    let filtered = [...freshListings];
    
    // Filter out ended auctions
    filtered = filtered.filter(listing => {
      if (!listing.auction) return true;
      const now = new Date();
      const endTime = new Date(listing.auction.endTime);
      return endTime > now;
    });
    
    console.log('After active filter:', filtered.length);
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(listing => {
        if (filter === 'premium') return listing.isPremium && !listing.auction;
        if (filter === 'standard') return !listing.isPremium && !listing.auction;
        if (filter === 'auction') return !!listing.auction;
        return true;
      });
    }
    
    console.log('After category filter:', filtered.length);
    
    // Apply search filter
    if (debouncedSearchTerm) {
      const query = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        listing.seller.toLowerCase().includes(query)
      );
    }
    
    console.log('After search filter:', filtered.length);
    
    // Apply price filters
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter(listing => {
          const price = listing.auction?.highestBid || listing.price;
          return price >= min;
        });
      }
    }
    
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter(listing => {
          const price = listing.auction?.highestBid || listing.price;
          return price <= max;
        });
      }
    }
    
    console.log('After price filter:', filtered.length);
    
    // Apply hour range filter
    filtered = filtered.filter(listing => {
      const hoursWorn = listing.hoursWorn ?? 0;
      return hoursWorn >= selectedHourRange.min && hoursWorn <= selectedHourRange.max;
    });
    
    console.log('After hour range filter:', filtered.length);
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'priceAsc':
          const aPrice = a.auction?.highestBid || a.price;
          const bPrice = b.auction?.highestBid || b.price;
          return aPrice - bPrice;
        case 'priceDesc':
          const aPriceDesc = a.auction?.highestBid || a.price;
          const bPriceDesc = b.auction?.highestBid || b.price;
          return bPriceDesc - aPriceDesc;
        case 'endingSoon':
          if (a.auction && b.auction) {
            return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
          }
          return a.auction ? -1 : b.auction ? 1 : 0;
        default:
          return 0;
      }
    });
    
    console.log('Final filtered count:', filtered.length);
    return filtered;
  }, [freshListings, filter, debouncedSearchTerm, minPrice, maxPrice, selectedHourRange, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [filter, selectedHourRange, debouncedSearchTerm, minPrice, maxPrice, sortBy]);

  // Timer management for auctions
  const auctionTimers = useMemo(() => {
    try {
      const now = new Date();
      const activeAuctions = filteredListings.filter(listing => {
        if (!isAuctionListing(listing) || !isListingActive(listing)) return false;
        
        const endTime = listing.auction?.endTime ? new Date(listing.auction.endTime) : null;
        return endTime && endTime > now;
      });

      return activeAuctions.map(listing => {
        if (!listing.auction) return null;
        
        const endTime = new Date(listing.auction.endTime);
        const timeLeft = endTime.getTime() - now.getTime();
        let updateInterval: number;
        
        if (timeLeft < 60000) {
          updateInterval = 5000;
        } else if (timeLeft < 300000) {
          updateInterval = 15000;
        } else if (timeLeft < 3600000) {
          updateInterval = 60000;
        } else {
          updateInterval = 300000;
        }
        
        return {
          id: listing.id,
          endTime: listing.auction.endTime,
          updateInterval
        };
      }).filter(timer => timer !== null);
    } catch (error) {
      console.error('Error calculating auction timers:', error);
      return [];
    }
  }, [filteredListings]);

  // Timer effect
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (auctionTimers.length === 0 || !mountedRef.current) {
      return;
    }

    try {
      const minInterval = Math.max(
        Math.min(...auctionTimers.map(t => t?.updateInterval ?? Infinity)),
        5000
      );
      
      timerRef.current = setInterval(() => {
        if (!mountedRef.current) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return;
        }
        
        setForceUpdateTimer(prev => prev + 1);
      }, minInterval);
      
    } catch (error) {
      console.error('Error setting up auction timer:', error);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [auctionTimers.length]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Memoized calculations
  const categoryCounts = useMemo(() => {
    try {
      const activeListings = freshListings.filter(isListingActive);
      
      return {
        all: activeListings.length,
        standard: activeListings.filter(l => !l.isPremium && !l.auction).length,
        premium: activeListings.filter(l => l.isPremium && !l.auction).length,
        auction: activeListings.filter(l => l.auction).length
      };
    } catch (error) {
      console.error('Error calculating category counts:', error);
      return { all: 0, standard: 0, premium: 0, auction: 0 };
    }
  }, [freshListings]);

  const getSellerSalesCount = useCallback((seller: string) => {
    try {
      return contextOrderHistory.filter(order => order.seller === seller).length;
    } catch (error) {
      console.error('Error getting seller sales count:', error);
      return 0;
    }
  }, [contextOrderHistory]);

  // Create paginated listings with profile data
  const paginatedListings = useMemo(() => {
    try {
      // First, create listings with profile data
      const listingsWithProfiles = filteredListings.map(listing => {
        // Cast to check for backend data
        const listingWithBackendData = listing as ListingFromBackend;
        
        // CRITICAL: Use the isSellerVerified field directly from the backend
        // The backend already provides this field
        const isSellerVerified = listingWithBackendData.isSellerVerified || false;
        
        const sellerSalesCount = listingWithBackendData.sellerSalesCount ?? getSellerSalesCount(listing.seller);
        
        // Use the sellerProfile from the listing if it exists
        // and resolve the pic URL if it's a relative path
        let sellerProfile = listingWithBackendData.sellerProfile;
        if (sellerProfile?.pic) {
          sellerProfile = {
            ...sellerProfile,
            pic: resolveApiUrl(sellerProfile.pic)
          };
        }
        
        console.log(`[Browse] Seller ${listing.seller} verification from backend:`, isSellerVerified);
        
        return {
          ...listing,
          sellerProfile,
          sellerSalesCount,
          isSellerVerified, // Use backend's verification status directly
          isVerified: isSellerVerified // Also set for compatibility
        } as ListingWithProfile;
      });

      // Then paginate
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      
      console.log(`Paginating: page ${page}, showing items ${start}-${end} of ${listingsWithProfiles.length}`);
      
      return listingsWithProfiles.slice(start, end);
    } catch (error) {
      console.error('Error creating paginated listings:', error);
      return [];
    }
  }, [filteredListings, getSellerSalesCount, page]);
  
  const totalPages = useMemo(() => {
    try {
      return Math.ceil(filteredListings.length / PAGE_SIZE);
    } catch (error) {
      console.error('Error calculating total pages:', error);
      return 1;
    }
  }, [filteredListings]);

  // Utility functions
  const isSubscribed = useCallback((buyerUsername: string, sellerUsername: string): boolean => {
    if (!buyerUsername || !sellerUsername) return false;
    const buyerSubs = contextSubscriptions[buyerUsername] || [];
    return buyerSubs.includes(sellerUsername);
  }, [contextSubscriptions]);

  // Handlers
  const handleMouseEnter = useCallback((listingId: string) => {
    setHoveredListing(listingId);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredListing(null);
  }, []);

  const handleListingClick = useCallback((listingId: string, isLocked: boolean) => {
    try {
      if (isLocked) return;
      
      const now = Date.now();
      if (now - lastClickTime.current < 300) return;
      
      lastClickTime.current = now;
      router.push(`/browse/${listingId}`);
    } catch (error) {
      console.error('Error navigating to listing:', error);
    }
  }, [router]);

  const handleQuickView = useCallback((e: React.MouseEvent, listingId: string) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastQuickViewTime.current < 300) return;
      
      lastQuickViewTime.current = now;
      router.push(`/browse/${listingId}`);
    } catch (error) {
      console.error('Error quick viewing listing:', error);
    }
  }, [router]);

  const handleListingError = useCallback((error: Error, listingId: string) => {
    console.error('Listing error:', error, 'for listing:', listingId);
    const sanitizedError = sanitizeStrict(error.message);
    setListingErrors(prev => ({
      ...prev,
      [listingId]: sanitizedError
    }));
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (page > 0) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const handleNextPage = useCallback(() => {
    if (page < totalPages - 1) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const handlePageClick = useCallback((targetPage: number) => {
    if (targetPage >= 0 && targetPage < totalPages) {
      setPage(targetPage);
    }
  }, [totalPages]);

  const formatTimeRemaining = useCallback((endTime: string) => {
    return formatTimeRemainingUtil(endTime, timeCache);
  }, []);

  const resetFilters = useCallback(() => {
    setFilter('all');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedHourRange(HOUR_RANGE_OPTIONS[0]);
    setSortBy('newest');
    setRateLimitError(null);
  }, []);

  const handleRateLimit = useCallback(() => {
    const rateLimitResult = checkSearchLimit();
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many searches. Please wait ${rateLimitResult.waitTime} seconds.`);
      return false;
    }
    setRateLimitError(null);
    return true;
  }, [checkSearchLimit]);

  return {
    // Auth & State
    user,
    filter,
    setFilter,
    selectedHourRange,
    setSelectedHourRange,
    searchTerm,
    setSearchTerm: handleSearchTermChange,
    minPrice,
    setMinPrice: handleMinPriceChange,
    maxPrice,
    setMaxPrice: handleMaxPriceChange,
    sortBy,
    setSortBy,
    page,
    hoveredListing,
    listingErrors,
    forceUpdateTimer,
    rateLimitError,
    
    // Data
    filteredListings: paginatedListings,
    paginatedListings,
    categoryCounts,
    totalPages,
    
    // Loading state
    isLoading,
    error: contextError,
    
    // Handlers
    handleMouseEnter,
    handleMouseLeave,
    handleListingClick,
    handleQuickView,
    handleListingError,
    handlePreviousPage,
    handleNextPage,
    handlePageClick,
    resetFilters,
    refreshListings: fetchFreshListings,
    
    // Utils
    isSubscribed,
    getDisplayPrice,
    formatTimeRemaining,
    
    // Constants
    HOUR_RANGE_OPTIONS,
    PAGE_SIZE
  };
};