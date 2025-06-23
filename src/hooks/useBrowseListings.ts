// src/hooks/useBrowseListings.ts

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useRouter } from 'next/navigation';
import { storageService } from '@/services';
import { Listing } from '@/context/ListingContext';
import { FilterOptions, CategoryCounts, SellerProfile, ListingWithProfile } from '@/types/browse';
import { 
  HOUR_RANGE_OPTIONS, 
  PAGE_SIZE, 
  isAuctionListing, 
  isListingActive, 
  getDisplayPrice as getDisplayPriceUtil,
  formatTimeRemaining as formatTimeRemainingUtil
} from '@/utils/browseUtils';

export const useBrowseListings = () => {
  const { user } = useAuth();
  const { listings, removeListing, users, isSubscribed, addSellerNotification, placeBid } = useListings();
  const { purchaseListing, orderHistory } = useWallet();
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

  // Refs
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastClickTime = useRef<number>(0);
  const lastQuickViewTime = useRef<number>(0);

  const MAX_CACHED_PROFILES = 100;

  // Load seller profiles
  useEffect(() => {
    const loadSellerProfiles = async () => {
      if (typeof window !== 'undefined') {
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
  }, [listings]);

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

  // Timer management
  const auctionTimers = useMemo(() => {
    try {
      const now = new Date();
      const activeAuctions = listings.filter(listing => {
        if (!isAuctionListing(listing) || !isListingActive(listing)) return false;
        
        const endTime = listing.auction.endTime ? new Date(listing.auction.endTime) : null;
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
    };
  }, []);

  // Timer cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (!mountedRef.current) return;
      
      try {
        const now = Date.now();
        const cache = timeCache.current;
        
        Object.keys(cache).forEach(key => {
          if (cache[key].expires < now) {
            delete cache[key];
          }
        });

        const activeAuctionEndTimes = new Set(
          auctionTimers.map(timer => timer?.endTime ?? '')
        );
        
        Object.keys(cache).forEach(key => {
          if (!activeAuctionEndTimes.has(key)) {
            delete cache[key];
          }
        });
        
        const cacheKeys = Object.keys(cache);
        if (cacheKeys.length > 200) {
          const sortedKeys = cacheKeys.sort((a, b) => cache[a].expires - cache[b].expires);
          const keysToRemove = sortedKeys.slice(0, cacheKeys.length - 200);
          keysToRemove.forEach(key => delete cache[key]);
        }
      } catch (error) {
        console.error('Error cleaning up timer cache:', error);
      }
    }, 60000);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Memoized calculations
  const categoryCounts = useMemo(() => {
    try {
      const activeListings = listings.filter(isListingActive);
      
      return {
        all: activeListings.length,
        standard: activeListings.filter(l => !l.isPremium && !l.auction).length,
        premium: activeListings.filter(l => l.isPremium).length,
        auction: activeListings.filter(l => l.auction).length
      };
    } catch (error) {
      console.error('Error calculating category counts:', error);
      return { all: 0, standard: 0, premium: 0, auction: 0 };
    }
  }, [listings]);

  const getSellerSalesCount = useCallback((seller: string) => {
    try {
      return orderHistory.filter(order => order.seller === seller).length;
    } catch (error) {
      console.error('Error getting seller sales count:', error);
      return 0;
    }
  }, [orderHistory]);

  const filteredListings = useMemo(() => {
    try {
      return listings
        .filter((listing: Listing) => {
          try {
            if (!isListingActive(listing)) {
              return false;
            }
            
            if (filter === 'standard' && (listing.isPremium || listing.auction)) return false;
            if (filter === 'premium' && !listing.isPremium) return false;
            if (filter === 'auction' && !listing.auction) return false;
            
            const hoursWorn = listing.hoursWorn ?? 0;
            if (hoursWorn < selectedHourRange.min || hoursWorn > selectedHourRange.max) {
              return false;
            }
            
            if (debouncedSearchTerm) {
              const searchLower = debouncedSearchTerm.toLowerCase();
              const matchesSearch = 
                (listing.title?.toLowerCase().includes(searchLower)) || 
                (listing.description?.toLowerCase().includes(searchLower)) || 
                (listing.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false) ||
                (listing.seller.toLowerCase().includes(searchLower));
              
              if (!matchesSearch) return false;
            }
            
            let price: number;
            if (isAuctionListing(listing)) {
              price = listing.auction.highestBid ?? listing.auction.startingPrice;
            } else {
              price = listing.markedUpPrice || listing.price;
            }
            
            const min = parseFloat(minPrice) || 0;
            const max = parseFloat(maxPrice) || Infinity;
            if (price < min || price > max) return false;
            
            return true;
          } catch (error) {
            console.error('Error filtering listing:', error, listing.id);
            return false;
          }
        })
        .sort((a: Listing, b: Listing) => {
          try {
            if (sortBy === 'endingSoon') {
              if (isAuctionListing(a) && isAuctionListing(b)) {
                const aTime = new Date(a.auction.endTime).getTime();
                const bTime = new Date(b.auction.endTime).getTime();
                return aTime - bTime;
              }
              if (isAuctionListing(a)) return -1;
              if (isAuctionListing(b)) return 1;
              
              const aDate = new Date(a.date).getTime();
              const bDate = new Date(b.date).getTime();
              return bDate - aDate;
            }
            
            if (sortBy === 'priceAsc' || sortBy === 'priceDesc') {
              let aPrice: number, bPrice: number;
              
              if (isAuctionListing(a)) {
                aPrice = a.auction.highestBid ?? a.auction.startingPrice;
              } else {
                aPrice = a.markedUpPrice ?? a.price;
              }
              
              if (isAuctionListing(b)) {
                bPrice = b.auction.highestBid ?? b.auction.startingPrice;
              } else {
                bPrice = b.markedUpPrice ?? b.price;
              }
              
              return sortBy === 'priceAsc' ? aPrice - bPrice : bPrice - aPrice;
            }
            
            const aDate = new Date(a.date).getTime();
            const bDate = new Date(b.date).getTime();
            return bDate - aDate;
          } catch (error) {
            console.error('Error sorting listings:', error);
            return 0;
          }
        });
    } catch (error) {
      console.error('Error filtering and sorting listings:', error);
      return [];
    }
  }, [listings, filter, selectedHourRange, debouncedSearchTerm, minPrice, maxPrice, sortBy]);

  const paginatedListings = useMemo(() => {
    try {
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      
      return filteredListings.slice(start, end).map(listing => {
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
      console.error('Error paginating listings:', error);
      return [];
    }
  }, [filteredListings, page, users, getSellerSalesCount, sellerProfiles]);
  
  const totalPages = useMemo(() => {
    try {
      return Math.ceil(filteredListings.length / PAGE_SIZE);
    } catch (error) {
      console.error('Error calculating total pages:', error);
      return 1;
    }
  }, [filteredListings.length]);

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
    setPage(prev => prev + 1);
  }, []);

  const handlePageClick = useCallback((targetPage: number) => {
    if (targetPage >= 0) {
      setPage(targetPage);
    }
  }, []);

  const getDisplayPrice = useCallback((listing: Listing) => {
    return getDisplayPriceUtil(listing);
  }, []);

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
    filteredListings,
    paginatedListings,
    categoryCounts,
    totalPages,
    
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
    
    // Utils
    isSubscribed,
    getDisplayPrice,
    formatTimeRemaining,
    
    // Constants
    HOUR_RANGE_OPTIONS,
    PAGE_SIZE
  };
};