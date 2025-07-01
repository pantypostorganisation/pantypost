// src/hooks/useBrowseListings.ts

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { storageService, listingsService } from '@/services';
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

export const useBrowseListings = () => {
  const { user } = useAuth();
  const router = useRouter();

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
  
  // Data state
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalListings, setTotalListings] = useState(0);

  // Refs
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastClickTime = useRef<number>(0);
  const lastQuickViewTime = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const MAX_CACHED_PROFILES = 100;

  // Load data using listings service
  const loadListings = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Prepare search params
      let sortByParam: 'date' | 'price' | 'views' | 'endingSoon' = 'date';
      if (sortBy === 'newest') {
        sortByParam = 'date';
      } else if (sortBy === 'priceAsc' || sortBy === 'priceDesc') {
        sortByParam = 'price';
      } else if (sortBy === 'endingSoon') {
        sortByParam = 'endingSoon';
      }

      const searchParams: ListingSearchParams = {
        query: debouncedSearchTerm,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        isPremium: filter === 'premium' ? true : filter === 'standard' ? false : undefined,
        isAuction: filter === 'auction' ? true : filter === 'standard' ? false : undefined,
        isActive: true,
        sortBy: sortByParam,
        sortOrder: sortBy === 'priceDesc' ? 'desc' : 'asc',
        page: page,
        limit: PAGE_SIZE,
      };

      // Load listings
      const listingsResponse = await listingsService.getListings(searchParams);
      
      if (!mountedRef.current) return;

      if (listingsResponse.success && listingsResponse.data) {
        // Apply hour range filter (not supported by service)
        let filteredListings = listingsResponse.data.filter((listing: Listing) => {
          const hoursWorn = listing.hoursWorn ?? 0;
          return hoursWorn >= selectedHourRange.min && hoursWorn <= selectedHourRange.max;
        });

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
        setTotalListings(listingsResponse.meta?.totalItems || filteredListings.length);
      } else {
        throw new Error(listingsResponse.error?.message || 'Failed to load listings');
      }

      // Load users
      const usersData = await storageService.getItem<Record<string, User>>('users', {});
      setUsers(usersData);

      // Load orders
      const ordersData = await storageService.getItem<Order[]>('orders', []);
      setOrderHistory(ordersData);

      // Load subscriptions
      const subsData = await storageService.getItem<Record<string, string[]>>('subscriptions', {});
      setSubscriptions(subsData);

      // Load popular tags
      const tagsResponse = await listingsService.getPopularTags(10);
      if (tagsResponse.success && tagsResponse.data) {
        setPopularTags(tagsResponse.data);
      }

      setIsLoading(false);
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }

      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load listings');
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, minPrice, maxPrice, filter, sortBy, page, selectedHourRange]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Load seller profiles
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
          profiles[seller] = { 
            bio: profileData?.bio || null, 
            pic: profileData?.profilePic || null 
          };
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

  const paginatedListings = useMemo(() => {
    try {
      return listings.map(listing => {
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
    } catch (error) {
      console.error('Error creating paginated listings:', error);
      return [];
    }
  }, [listings, users, getSellerSalesCount, sellerProfiles]);
  
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
    setListingErrors(prev => ({
      ...prev,
      [listingId]: error.message
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
    setSearchTerm,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    page,
    hoveredListing,
    listingErrors,
    forceUpdateTimer,
    
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
