// src/hooks/useBrowseListings.ts

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { storageService, listingsService, securityService } from '@/services';
import type { ListingSearchParams } from '@/services';
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

// Check if we have cached listings to determine initial loading state
const getCachedListings = () => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('browse_listings_cache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Validate cache structure
        if (parsedCache && typeof parsedCache.data === 'object' && typeof parsedCache.timestamp === 'number') {
          const { data, timestamp } = parsedCache;
          // Check if cache is less than 2 minutes old
          if (Date.now() - timestamp < 2 * 60 * 1000) {
            return data;
          }
        }
      }
    } catch (e) {
      // Ignore cache errors and clear invalid cache
      try {
        localStorage.removeItem('browse_listings_cache');
      } catch {}
    }
  }
  return null;
};

export const useBrowseListings = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { checkLimit: checkSearchLimit } = useRateLimit('SEARCH');

  // State
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
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  // Initialize with cached data if available
  const cachedListings = getCachedListings();
  const [listings, setListings] = useState<Listing[]>(cachedListings || []);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(!cachedListings); // Only show loading if no cache
  const [error, setError] = useState<string | null>(null);
  const [totalListings, setTotalListings] = useState(cachedListings?.length || 0);

  // Refs
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastClickTime = useRef<number>(0);
  const lastQuickViewTime = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_CACHED_PROFILES = 100;

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

  // Load data using listings service
  const loadListings = useCallback(async () => {
    // Debug: Log what's being loaded
    console.log('=== DEBUG: Loading Listings ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Filters:', { filter, searchTerm: debouncedSearchTerm, minPrice, maxPrice, sortBy, selectedHourRange });
    
    // Check localStorage directly first
    const rawListings = localStorage.getItem('listings');
    console.log('Raw listings from localStorage:', rawListings);
    if (rawListings) {
      try {
        const parsed = JSON.parse(rawListings);
        console.log('Parsed listings count:', parsed.length);
        console.log('First 3 listings:', parsed.slice(0, 3));
      } catch (e) {
        console.error('Failed to parse listings:', e);
      }
    }

    // Check rate limit
    const rateLimitResult = checkSearchLimit();
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many searches. Please wait ${rateLimitResult.waitTime} seconds.`);
      return;
    }
    setRateLimitError(null);

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Prepare search params with validation
      let sortByParam: 'date' | 'price' | 'views' | 'endingSoon' = 'date';
      if (sortBy === 'newest') {
        sortByParam = 'date';
      } else if (sortBy === 'priceAsc' || sortBy === 'priceDesc') {
        sortByParam = 'price';
      } else if (sortBy === 'endingSoon') {
        sortByParam = 'endingSoon';
      }

      // Validate and sanitize search params - IMPORTANT: Remove pagination for initial load
      const searchParams: ListingSearchParams = {
        query: sanitizeSearchQuery(debouncedSearchTerm),
        minPrice: minPrice ? sanitizeNumber(minPrice, 0, 10000) : undefined,
        maxPrice: maxPrice ? sanitizeNumber(maxPrice, 0, 10000) : undefined,
        isPremium: filter === 'premium' ? true : filter === 'standard' ? false : undefined,
        isAuction: filter === 'auction' ? true : filter === 'standard' ? false : undefined,
        isActive: true,
        sortBy: sortByParam,
        sortOrder: sortBy === 'priceDesc' ? 'desc' : 'asc',
        // REMOVED pagination params to get ALL listings
        // page: Math.max(0, page),
        // limit: PAGE_SIZE,
      };

      console.log('Search params being sent:', searchParams);

      // Validate price range
      if (searchParams.minPrice !== undefined && searchParams.maxPrice !== undefined) {
        if (searchParams.minPrice > searchParams.maxPrice) {
          throw new Error('Minimum price cannot be greater than maximum price');
        }
      }

      // Load listings
      const listingsResponse = await listingsService.getListings(searchParams);
      
      console.log('Listings service response:', listingsResponse);

      if (!mountedRef.current) return;

      if (listingsResponse.success && listingsResponse.data) {
        console.log('Got listings from service:', listingsResponse.data.length);
        
        // Apply hour range filter (not supported by service)
        let filteredListings = listingsResponse.data.filter((listing: Listing) => {
          if (selectedHourRange.label === 'Any Hours') return true;
          
          const hoursWorn = listing.hoursWorn ?? 0;
          return hoursWorn >= selectedHourRange.min && hoursWorn <= selectedHourRange.max;
        });

        console.log('After hour range filter:', filteredListings.length);

        // Handle endingSoon sort (custom logic)
        if (sortBy === 'endingSoon') {
          filteredListings.sort((a: Listing, b: Listing) => {
            if (a.auction && b.auction) {
              return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
            } else if (a.auction) {
              return -1;
            } else if (b.auction) {
              return 1;
            }
            return 0;
          });
        }

        setListings(filteredListings);
        setTotalListings(filteredListings.length);

        // Cache the listings with sanitized data
        if (typeof window !== 'undefined' && filteredListings.length > 0) {
          try {
            const cacheData = {
              data: filteredListings,
              timestamp: Date.now()
            };
            localStorage.setItem('browse_listings_cache', JSON.stringify(cacheData));
          } catch (e) {
            // Ignore cache errors (storage might be full)
            console.warn('Failed to cache listings:', e);
          }
        }
      } else {
        throw new Error(listingsResponse.error?.message || 'Failed to load listings');
      }

      // Load users with sanitization
      const usersData = await storageService.getItem<User[]>('users', []);
      const sanitizedUsers: Record<string, User> = {};
      
      // Handle both array and object formats
      if (Array.isArray(usersData)) {
        usersData.forEach((userData) => {
          sanitizedUsers[sanitizeStrict(userData.username)] = {
            username: sanitizeStrict(userData.username || ''),
            verified: Boolean(userData.verified),
            verificationStatus: userData.verificationStatus ? sanitizeStrict(userData.verificationStatus) : undefined
          };
        });
      } else {
        Object.entries(usersData as any).forEach(([key, userData]: [string, any]) => {
          sanitizedUsers[sanitizeStrict(key)] = {
            username: sanitizeStrict(userData.username || key || ''),
            verified: Boolean(userData.verified),
            verificationStatus: userData.verificationStatus ? sanitizeStrict(userData.verificationStatus) : undefined
          };
        });
      }
      
      console.log('Loaded users:', Object.keys(sanitizedUsers).length);
      setUsers(sanitizedUsers);

      // Load orders
      const ordersData = await storageService.getItem<Order[]>('orders', []);
      setOrderHistory(ordersData);

      // Load subscriptions
      const subsData = await storageService.getItem<Record<string, string[]>>('subscriptions', {});
      setSubscriptions(subsData);

      // Load popular tags with sanitization
      const tagsResponse = await listingsService.getPopularTags(10);
      if (tagsResponse.success && tagsResponse.data) {
        const sanitizedTags = tagsResponse.data.map(tag => ({
          tag: sanitizeStrict(tag.tag),
          count: Math.max(0, parseInt(tag.count.toString()) || 0)
        }));
        setPopularTags(sanitizedTags);
      }

      setIsLoading(false);
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }

      console.error('Error loading data:', error);
      const errorMessage = sanitizeStrict(error.message || 'Failed to load listings');
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, minPrice, maxPrice, filter, sortBy, selectedHourRange, checkSearchLimit]);

  // Add storage event listener to detect when listings change
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If listings were updated in storage, refresh our data
      if (e.key === 'listings' && e.newValue !== e.oldValue) {
        console.log('📦 Detected listings change in storage, refreshing...');
        loadListings();
      }
      
      // If browse cache was cleared, refresh
      if (e.key === 'browse_listings_cache' && e.newValue === null) {
        console.log('🧹 Browse cache cleared, refreshing...');
        loadListings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadListings]);

  // Add custom event listener for deleted listings
  useEffect(() => {
    const handleListingDeleted = (event: CustomEvent) => {
      const { listingId } = event.detail;
      console.log('🗑️ Listing deleted event received:', listingId);
      
      // Remove the listing from our local state immediately
      setListings(prev => prev.filter(l => l.id !== listingId));
      
      // Also refresh from storage to ensure consistency
      setTimeout(() => {
        loadListings();
      }, 100);
    };

    window.addEventListener('listingDeleted', handleListingDeleted as EventListener);
    
    return () => {
      window.removeEventListener('listingDeleted', handleListingDeleted as EventListener);
    };
  }, [loadListings]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Load seller profiles with sanitization
  useEffect(() => {
    const loadSellerProfiles = async () => {
      if (typeof window !== 'undefined' && !isLoading && listings.length > 0) {
        const currentSellers = new Set(listings.map(listing => listing.seller));
        const profiles: { [key: string]: SellerProfile } = {};
        
        const sellersArray = Array.from(currentSellers).slice(0, MAX_CACHED_PROFILES);
        
        // Load all user profiles at once
        const userProfiles = await storageService.getItem<any>('user_profiles', {});
        
        sellersArray.forEach(seller => {
          const profileData = userProfiles[seller];
          if (profileData) {
            profiles[sanitizeStrict(seller)] = { 
              bio: profileData.bio ? sanitizeStrict(profileData.bio) : null, 
              pic: profileData.profilePic || null 
            };
          }
        });
        
        setSellerProfiles(profiles);
      }
    };
    
    loadSellerProfiles();
  }, [listings, isLoading]);

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
      const activeAuctions = listings.filter(listing => {
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
  }, [listings, forceUpdateTimer]);

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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized calculations
  const categoryCounts = useMemo(() => {
    try {
      const activeListings = listings.filter(isListingActive);
      
      return {
        all: totalListings,
        standard: activeListings.filter(l => !l.isPremium && !l.auction).length,
        premium: activeListings.filter(l => l.isPremium).length,
        auction: activeListings.filter(l => l.auction).length
      };
    } catch (error) {
      console.error('Error calculating category counts:', error);
      return { all: 0, standard: 0, premium: 0, auction: 0 };
    }
  }, [listings, totalListings]);

  const getSellerSalesCount = useCallback((seller: string) => {
    try {
      return orderHistory.filter(order => order.seller === seller).length;
    } catch (error) {
      console.error('Error getting seller sales count:', error);
      return 0;
    }
  }, [orderHistory]);

  // FIXED: Paginate listings properly
  const paginatedListings = useMemo(() => {
    try {
      // First, create listings with profile data
      const listingsWithProfiles = listings.map(listing => {
        const sellerUser = users?.[listing.seller];
        const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
        const sellerSalesCount = getSellerSalesCount(listing.seller);
        const sellerProfile = sellerProfiles[listing.seller];
        
        return {
          ...listing,
          sellerProfile,
          sellerSalesCount,
          isSellerVerified
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
  }, [listings, users, getSellerSalesCount, sellerProfiles, page]);
  
  const totalPages = useMemo(() => {
    try {
      return Math.ceil(totalListings / PAGE_SIZE);
    } catch (error) {
      console.error('Error calculating total pages:', error);
      return 1;
    }
  }, [totalListings]);

  // Utility functions
  const isSubscribed = useCallback((buyerUsername: string, sellerUsername: string): boolean => {
    if (!buyerUsername || !sellerUsername) return false;
    const buyerSubs = subscriptions[buyerUsername] || [];
    return buyerSubs.includes(sellerUsername);
  }, [subscriptions]);

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

  const refreshListings = useCallback(() => {
    loadListings();
  }, [loadListings]);

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
    popularTags,
    
    // Loading state
    isLoading,
    error,
    
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
    refreshListings,
    
    // Utils
    isSubscribed,
    getDisplayPrice,
    formatTimeRemaining,
    
    // Constants
    HOUR_RANGE_OPTIONS,
    PAGE_SIZE
  };
};