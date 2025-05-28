// src/app/browse/page.tsx - Fixed Memory Leaks and Performance Issues
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { Listing, AuctionSettings } from '@/context/ListingContext';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Crown, Filter, Clock, ShoppingBag, Lock, Search, X, CheckCircle, BadgeCheck,
  Gavel, ArrowUp, Calendar, BarChart2, User, AlertTriangle, ExternalLink, Eye,
  ChevronDown, Package, DollarSign, Heart, Share2, Sparkles
} from 'lucide-react';

type SellerProfile = {
  bio: string | null;
  pic: string | null;
};

type AuctionTimer = {
  id: string;
  endTime: string;
  updateInterval: number;
};

const hourRangeOptions = [
  { label: 'Any Hours', min: 0, max: Infinity },
  { label: '12+ Hours', min: 12, max: Infinity },
  { label: '24+ Hours', min: 24, max: Infinity },
  { label: '48+ Hours', min: 48, max: Infinity },
];

const PAGE_SIZE = 40;

// FIX 8: Error boundary for individual listing cards
const ListingCard = ({ listing, onError }: { listing: Listing; onError: (error: Error, listingId: string) => void }) => {
  try {
    // This will be the listing card content - moved to separate component for error isolation
    return null; // Placeholder - actual card content will be in main component
  } catch (error) {
    onError(error as Error, listing.id);
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 text-sm">Error loading listing</p>
        <p className="text-gray-500 text-xs mt-1">ID: {listing.id}</p>
      </div>
    );
  }
};

// Type guard for auction listings
const isAuctionListing = (listing: Listing): listing is Listing & { auction: AuctionSettings } => {
  return !!listing.auction;
};

// FIX 10: Safe date parsing with validation
const safeParseDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return null;
    }
    return date;
  } catch (error) {
    console.error('Date parsing error:', error, 'for string:', dateString);
    return null;
  }
};

// Helper function to check if listing is active with safe date parsing
const isListingActive = (listing: Listing): boolean => {
  if (listing.auction) {
    const isActive = listing.auction.status === 'active';
    const endTime = safeParseDate(listing.auction.endTime);
    const endTimeNotPassed = endTime ? endTime > new Date() : false;
    return isActive && endTimeNotPassed;
  }
  return true; // Non-auction listings are always active
};

export default function BrowsePage() {
  const { listings, removeListing, user, users, isSubscribed, addSellerNotification, placeBid } = useListings();
  const { purchaseListing, orderHistory } = useWallet();
  const router = useRouter();

  const [filter, setFilter] = useState<'all' | 'standard' | 'premium' | 'auction'>('all');
  const [selectedHourRange, setSelectedHourRange] = useState(hourRangeOptions[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon'>('newest');
  const [page, setPage] = useState(0);
  const [forceUpdateTimer, setForceUpdateTimer] = useState(0);

  // FIX 7: Moved hover state management to useCallback to avoid render-time state updates
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);
  
  const handleMouseEnter = useCallback((listingId: string) => {
    setHoveredListing(listingId);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredListing(null);
  }, []);

  // FIX 9: Optimized seller profiles with cleanup and size limits
  const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: SellerProfile }>({});
  const MAX_CACHED_PROFILES = 100; // Limit cache size
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentSellers = new Set(listings.map(listing => listing.seller));
      const profiles: { [key: string]: SellerProfile } = {};
      
      // FIX 9: Only keep profiles for current sellers and limit cache size
      const sellersArray = Array.from(currentSellers).slice(0, MAX_CACHED_PROFILES);
      
      sellersArray.forEach(seller => {
        const bio = sessionStorage.getItem(`profile_bio_${seller}`);
        const pic = sessionStorage.getItem(`profile_pic_${seller}`);
        profiles[seller] = { bio, pic };
      });
      
      setSellerProfiles(profiles);
      
      // FIX 9: Clean up unused profiles from sessionStorage
      const allProfileKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('profile_bio_') || key.startsWith('profile_pic_')
      );
      
      allProfileKeys.forEach(key => {
        const seller = key.replace('profile_bio_', '').replace('profile_pic_', '');
        if (!currentSellers.has(seller)) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [listings]);

  // FIX 8: Error handling state
  const [listingErrors, setListingErrors] = useState<{ [listingId: string]: string }>({});
  
  const handleListingError = useCallback((error: Error, listingId: string) => {
    console.error('Listing error:', error, 'for listing:', listingId);
    setListingErrors(prev => ({
      ...prev,
      [listingId]: error.message
    }));
  }, []);

  // FIX 5: Memoize expensive seller sales calculations
  const sellerSalesCache = useMemo(() => {
    const cache: { [seller: string]: number } = {};
    try {
      orderHistory.forEach(order => {
        if (order.seller) {
          cache[order.seller] = (cache[order.seller] || 0) + 1;
        }
      });
    } catch (error) {
      console.error('Error calculating seller sales:', error);
    }
    return cache;
  }, [orderHistory]);

  // FIX 5: Memoized function to get seller sales count
  const getSellerSalesCount = useCallback((seller: string) => {
    try {
      return sellerSalesCache[seller] || 0;
    } catch (error) {
      console.error('Error getting seller sales count:', error);
      return 0;
    }
  }, [sellerSalesCache]);

  // 🚀 FIX: Completely rewritten timer management to prevent memory leaks
  const auctionTimers = useMemo(() => {
    try {
      const now = new Date();
      const activeAuctions = listings.filter(listing => {
        if (!isAuctionListing(listing) || !isListingActive(listing)) return false;
        
        const endTime = safeParseDate(listing.auction.endTime);
        return endTime && endTime > now;
      });

      return activeAuctions.map(listing => {
        if (!listing.auction) return null;
        
        const endTime = safeParseDate(listing.auction.endTime);
        if (!endTime) return null;
        
        const timeLeft = endTime.getTime() - now.getTime();
        let updateInterval: number;
        
        // 🚀 FIX: More conservative update intervals to reduce CPU usage
        if (timeLeft < 60000) { // Last minute
          updateInterval = 5000; // Every 5 seconds instead of 1
        } else if (timeLeft < 300000) { // Last 5 minutes
          updateInterval = 15000; // Every 15 seconds instead of 5
        } else if (timeLeft < 3600000) { // Last hour
          updateInterval = 60000; // Every minute instead of 15 seconds
        } else {
          updateInterval = 300000; // Every 5 minutes instead of 1 minute
        }
        
        const timer: AuctionTimer = {
          id: listing.id,
          endTime: listing.auction.endTime,
          updateInterval
        };
        return timer;
      }).filter((timer): timer is AuctionTimer => timer !== null);
    } catch (error) {
      console.error('Error calculating auction timers:', error);
      return [];
    }
  }, [listings, forceUpdateTimer]);

  // 🚀 FIX: Completely rewritten timer effect with proper cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only set up timer if we have active auctions and component is mounted
    if (auctionTimers.length === 0 || !mountedRef.current) {
      return;
    }

    try {
      // 🚀 FIX: Use the minimum interval, but cap it at reasonable values
      const minInterval = Math.max(
        Math.min(...auctionTimers.map(t => t.updateInterval)),
        5000 // Never update more frequently than every 5 seconds
      );
      
      timerRef.current = setInterval(() => {
        // 🚀 FIX: Check if component is still mounted before updating
        if (!mountedRef.current) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return;
        }
        
        // 🚀 FIX: Batch state updates to prevent excessive re-renders
        setForceUpdateTimer(prev => prev + 1);
      }, minInterval);
      
    } catch (error) {
      console.error('Error setting up auction timer:', error);
    }
    
    // 🚀 FIX: Always return cleanup function, even in error cases
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [auctionTimers.length]); // 🚀 FIX: Only depend on length, not the entire array

  // 🚀 FIX: Cleanup on unmount
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

  // 🚀 FIX: Improved timer cache with better memory management and size limits
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  const maxCacheSize = 200; // Limit cache size
  
  // 🚀 FIX: More aggressive cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (!mountedRef.current) return;
      
      try {
        const now = Date.now();
        const cache = timeCache.current;
        
        // Remove expired entries
        Object.keys(cache).forEach(key => {
          if (cache[key].expires < now) {
            delete cache[key];
          }
        });

        // 🚀 FIX: Remove cache entries for ended auctions
        const activeAuctionEndTimes = new Set(
          auctionTimers.map(timer => timer.endTime)
        );
        
        Object.keys(cache).forEach(key => {
          if (!activeAuctionEndTimes.has(key)) {
            delete cache[key];
          }
        });
        
        // 🚀 FIX: Limit cache size to prevent memory bloat
        const cacheKeys = Object.keys(cache);
        if (cacheKeys.length > maxCacheSize) {
          // Remove oldest entries (those expiring soonest)
          const sortedKeys = cacheKeys.sort((a, b) => cache[a].expires - cache[b].expires);
          const keysToRemove = sortedKeys.slice(0, cacheKeys.length - maxCacheSize);
          keysToRemove.forEach(key => delete cache[key]);
        }
      } catch (error) {
        console.error('Error cleaning up timer cache:', error);
      }
    }, 60000); // Clean up every minute
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []); // 🚀 FIX: Remove auctionTimers dependency to prevent unnecessary cleanups

  // FIX 10: Safe formatTimeRemaining with error handling and better caching
  const formatTimeRemaining = useCallback((endTimeStr: string) => {
    try {
      const now = new Date();
      const nowTime = now.getTime();
      
      // Check cache first
      const cached = timeCache.current[endTimeStr];
      if (cached && cached.expires > nowTime) {
        return cached.formatted;
      }
      
      const endTime = safeParseDate(endTimeStr);
      if (!endTime) {
        return 'Invalid time';
      }
      
      if (endTime <= now) {
        // 🚀 FIX: Cache ended auctions for longer to prevent repeated calculations
        timeCache.current[endTimeStr] = {
          formatted: 'Ended',
          expires: nowTime + 300000 // Cache for 5 minutes
        };
        return 'Ended';
      }
      
      const diffMs = endTime.getTime() - nowTime;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let formatted: string;
      let cacheTime: number;
      
      if (diffDays > 0) {
        formatted = `${diffDays}d ${diffHours}h`;
        cacheTime = 300000; // Cache for 5 minutes
      } else if (diffHours > 0) {
        formatted = `${diffHours}h ${diffMinutes}m`;
        cacheTime = 60000; // Cache for 1 minute
      } else if (diffMinutes > 0) {
        formatted = `${diffMinutes}m`;
        cacheTime = 30000; // Cache for 30 seconds
      } else {
        formatted = 'Soon';
        cacheTime = 10000; // Cache for 10 seconds
      }
      
      // Update cache
      timeCache.current[endTimeStr] = {
        formatted,
        expires: nowTime + cacheTime
      };
      
      return formatted;
    } catch (error) {
      console.error('Error formatting time remaining:', error, 'for string:', endTimeStr);
      return 'Time error';
    }
  }, []); // 🚀 FIX: Remove all dependencies since we use refs

  // FIX 5: Debounced search to prevent excessive re-filtering
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // FIX 4: Safe navigation handler using refs for click tracking
  const lastClickTime = useRef<number>(0);
  const lastQuickViewTime = useRef<number>(0);
  
  const handleListingClick = useCallback((listingId: string, isLocked: boolean) => {
    try {
      if (isLocked) return;
      
      // Prevent multiple rapid clicks
      const now = Date.now();
      if (now - lastClickTime.current < 300) return; // 300ms debounce
      
      lastClickTime.current = now;
      router.push(`/browse/${listingId}`);
    } catch (error) {
      console.error('Error navigating to listing:', error);
    }
  }, [router]);

  // FIX 4: Safe navigation for quick view button
  const handleQuickView = useCallback((e: React.MouseEvent, listingId: string) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      
      // Prevent multiple rapid clicks
      const now = Date.now();
      if (now - lastQuickViewTime.current < 300) return;
      
      lastQuickViewTime.current = now;
      router.push(`/browse/${listingId}`);
    } catch (error) {
      console.error('Error quick viewing listing:', error);
    }
  }, [router]);

  // FIX 5: Reset page only when filters actually change (not on every render)
  useEffect(() => {
    setPage(0);
  }, [filter, selectedHourRange, debouncedSearchTerm, minPrice, maxPrice, sortBy]);

  // Fixed category counts to match filtering logic exactly
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

  // Fixed price display logic to handle 0 bids correctly
  const getDisplayPrice = useCallback((listing: Listing) => {
    try {
      if (isAuctionListing(listing)) {
        const hasActiveBids = listing.auction.bids && listing.auction.bids.length > 0;
        const highestBid = listing.auction.highestBid;
        
        // Check for null/undefined explicitly, not falsy (allows 0)
        if (hasActiveBids && highestBid !== null && highestBid !== undefined) {
          return {
            price: highestBid.toFixed(2),
            label: 'Current Bid'
          };
        } else {
          return {
            price: listing.auction.startingPrice.toFixed(2),
            label: 'Starting Bid'
          };
        }
      } else {
        return {
          price: listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2),
          label: 'Buy Now'
        };
      }
    } catch (error) {
      console.error('Error getting display price:', error);
      return { price: '0.00', label: 'Price Error' };
    }
  }, []);

  // FIX 4: Safe pagination handlers
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

  // 🚀 FIX: Memoized filtered listings with better error handling
  const filteredListings = useMemo(() => {
    try {
      return listings
        .filter((listing: Listing) => {
          try {
            // First check if listing is active (same logic as category counts)
            if (!isListingActive(listing)) {
              return false;
            }
            
            // Then apply category filters
            if (filter === 'standard' && (listing.isPremium || listing.auction)) return false;
            if (filter === 'premium' && !listing.isPremium) return false;
            if (filter === 'auction' && !listing.auction) return false;
            
            // Hours worn filter
            const hoursWorn = listing.hoursWorn ?? 0;
            if (hoursWorn < selectedHourRange.min || hoursWorn > selectedHourRange.max) {
              return false;
            }
            
            // FIX 5: Use debounced search term
            if (debouncedSearchTerm) {
              const searchLower = debouncedSearchTerm.toLowerCase();
              const matchesSearch = 
                (listing.title?.toLowerCase().includes(searchLower)) || 
                (listing.description?.toLowerCase().includes(searchLower)) || 
                (listing.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false) ||
                (listing.seller.toLowerCase().includes(searchLower));
              
              if (!matchesSearch) return false;
            }
            
            // Price filter
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
              // Auctions ending soon first
              if (isAuctionListing(a) && isAuctionListing(b)) {
                const aTime = safeParseDate(a.auction.endTime)?.getTime() || 0;
                const bTime = safeParseDate(b.auction.endTime)?.getTime() || 0;
                return aTime - bTime;
              }
              if (isAuctionListing(a)) return -1;
              if (isAuctionListing(b)) return 1;
              
              const aDate = safeParseDate(a.date)?.getTime() || 0;
              const bDate = safeParseDate(b.date)?.getTime() || 0;
              return bDate - aDate;
            }
            
            if (sortBy === 'priceAsc') {
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
              
              return aPrice - bPrice;
            }
            
            if (sortBy === 'priceDesc') {
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
              
              return bPrice - aPrice;
            }
            
            // Default: newest first
            const aDate = safeParseDate(a.date)?.getTime() || 0;
            const bDate = safeParseDate(b.date)?.getTime() || 0;
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
      return filteredListings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    } catch (error) {
      console.error('Error paginating listings:', error);
      return [];
    }
  }, [filteredListings, page]);
  
  const totalPages = useMemo(() => {
    try {
      return Math.ceil(filteredListings.length / PAGE_SIZE);
    } catch (error) {
      console.error('Error calculating total pages:', error);
      return 1;
    }
  }, [filteredListings.length]);

  // 🚀 FIX: Memoized page indicators to prevent unnecessary re-renders
  const renderPageIndicators = useCallback(() => {
    if (totalPages <= 1) return null;
    
    const indicators = [];
    
    if (page > 0) {
      indicators.push(
        <span 
          key={0} 
          className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" 
          onClick={() => handlePageClick(0)}
        >
          1
        </span>
      );
    }
    
    if (page > 2) {
      indicators.push(
        <span key="start-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
      );
    }
    
    let startPage = Math.max(1, page - 1);
    let endPage = Math.min(totalPages - 2, page + 1);
    
    if (endPage - startPage < 2 && totalPages > 3) {
      if (startPage === 1) {
        endPage = Math.min(totalPages - 2, 3);
      } else if (endPage === totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === page) {
        indicators.push(
          <span key={i} className="px-2 py-1 text-sm font-bold text-[#ff950e] border-b-2 border-[#ff950e]">
            {i + 1}
          </span>
        );
      } else {
        indicators.push(
          <span 
            key={i} 
            className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" 
            onClick={() => handlePageClick(i)}
          >
            {i + 1}
          </span>
        );
      }
    }
    
    if (endPage < totalPages - 2) {
      indicators.push(
        <span key="end-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
      );
    }
    
    if (page < totalPages - 1) {
      indicators.push(
        <span 
          key={totalPages - 1} 
          className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" 
          onClick={() => handlePageClick(totalPages - 1)}
        >
          {totalPages}
        </span>
      );
    }
    
    return (
      <div className="flex justify-center items-center gap-1 mt-4">
        {indicators}
      </div>
    );
  }, [page, totalPages, handlePageClick]);

  // FIX 8: Global error boundary for the entire page
  if (listingErrors && Object.keys(listingErrors).length > 3) {
    return (
      <RequireAuth role={user?.role || 'buyer'}>
        <main className="min-h-screen bg-black text-white pb-16 pt-8">
          <div className="max-w-2xl mx-auto px-6">
            <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Multiple Listing Errors</h2>
              <p className="text-gray-300 mb-4">
                There were errors loading multiple listings. Please refresh the page or try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-500 transition"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </main>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role={user?.role || 'buyer'}>
      <main className="min-h-screen bg-black text-white pb-16 pt-8">
        {user?.role === 'seller' && (
          <div className="bg-blue-700/20 border border-blue-700 text-blue-400 p-4 rounded-lg mb-6 max-w-3xl mx-auto">
            <p className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              You are viewing this page as a seller. You can browse listings but cannot make purchases.
            </p>
          </div>
        )}

        {/* Compact Header Section */}
        <div className="mb-4 max-w-[1700px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div className="flex flex-col leading-tight">
              <h1 className="text-2xl font-bold text-white mb-1">
                Browse <span className="text-[#ff950e]">Listings</span>
              </h1>
              <p className="text-gray-400 text-sm">
                Discover {filteredListings.length} amazing {filter === 'all' ? 'total' : filter} listings from verified sellers
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-3">
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                    filter === 'all' 
                      ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' 
                      : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>All</span>
                  <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                    {categoryCounts.all}
                  </span>
                </button>
                
                <button
                  onClick={() => setFilter('standard')}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                    filter === 'standard' 
                      ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' 
                      : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Standard</span>
                  <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                    {categoryCounts.standard}
                  </span>
                </button>
                
                <button
                  onClick={() => setFilter('premium')}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                    filter === 'premium' 
                      ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' 
                      : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Premium</span>
                  <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                    {categoryCounts.premium}
                  </span>
                </button>
                
                <button
                  onClick={() => setFilter('auction')}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                    filter === 'auction' 
                      ? 'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border border-white/20 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:shadow-2xl hover:shadow-[#8b5cf6]/30 transform hover:scale-105' 
                      : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#8b5cf6] border border-[#333] hover:border-[#8b5cf6]/50 hover:shadow-[#8b5cf6]/20'
                  }`}
                >
                  <Gavel className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>Auctions</span>
                  <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                    {categoryCounts.auction}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Compact Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center bg-gradient-to-r from-[#1a1a1a]/80 to-[#222]/80 backdrop-blur-sm p-3 rounded-lg border border-gray-800 shadow-lg">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, tags, or seller..."
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
              />
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-1 text-gray-400">
                <DollarSign size={14} />
                <span className="text-xs font-medium">Price</span>
              </div>
              <input
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="Min"
                type="number"
                className="px-2 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white placeholder-gray-400 w-16 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
              />
              <span className="text-gray-500 text-xs">—</span>
              <input
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="Max"
                type="number"
                className="px-2 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white placeholder-gray-400 w-16 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white cursor-pointer focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="priceAsc">💰 Price: Low → High</option>
              <option value="priceDesc">💎 Price: High → Low</option>
              <option value="endingSoon">⏰ Ending Soon</option>
            </select>

            <select
              value={selectedHourRange.label}
              onChange={(e) => {
                const selectedOption = hourRangeOptions.find(opt => opt.label === e.target.value);
                if (selectedOption) setSelectedHourRange(selectedOption);
              }}
              className="px-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white cursor-pointer focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
            >
              {hourRangeOptions.map(option => (
                <option key={option.label} value={option.label}>
                  {option.label === 'Any Hours' ? '⏱️ Any Hours' : `⏱️ ${option.label}`}
                </option>
              ))}
            </select>

            {(searchTerm || minPrice || maxPrice || selectedHourRange.label !== 'Any Hours' || sortBy !== 'newest') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSelectedHourRange(hourRangeOptions[0]);
                  setSortBy('newest');
                }}
                className="px-3 py-2 rounded-lg bg-red-600/20 border border-red-700 text-red-400 hover:bg-red-600/30 text-xs transition-all flex items-center gap-1 font-medium"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="max-w-[1700px] mx-auto px-6">
          {paginatedListings.length === 0 ? (
            <div className="text-center py-24 bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 shadow-2xl">
              <div className="mb-6">
                <ShoppingBag className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <div className="w-24 h-1 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] mx-auto rounded-full mb-6"></div>
              </div>
              <h3 className="text-white font-bold text-2xl mb-3">No listings found</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                We couldn't find any listings matching your criteria. Try adjusting your filters or check back later for new items.
              </p>
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchTerm('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSelectedHourRange(hourRangeOptions[0]);
                  setSortBy('newest');
                }}
                className="px-8 py-3 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black rounded-xl font-bold hover:from-[#e88800] hover:to-[#ff950e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {paginatedListings.map((listing) => {
                  // FIX 8: Individual listing error handling
                  if (listingErrors[listing.id]) {
                    return (
                      <div key={listing.id} className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-red-400 text-sm">Error loading listing</p>
                        <p className="text-gray-500 text-xs mt-1">{listingErrors[listing.id]}</p>
                      </div>
                    );
                  }

                  try {
                    const isLockedPremium = listing.isPremium && (!user?.username || !isSubscribed(user?.username, listing.seller));
                    const sellerUser = users?.[listing.seller];
                    const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
                    const hasAuction = isAuctionListing(listing);
                    const sellerSales = getSellerSalesCount(listing.seller);
                    
                    // Use the new getDisplayPrice function
                    const { price: displayPrice, label: priceLabel } = getDisplayPrice(listing);

                    return (
                      <div
                        key={listing.id}
                        className={`relative flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#111] border ${
                          hasAuction ? 'border-purple-800' : 'border-gray-800'
                        } rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                          hasAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]'
                        } cursor-pointer group hover:transform hover:scale-[1.02]`}
                        onMouseEnter={() => handleMouseEnter(listing.id)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleListingClick(listing.id, Boolean(isLockedPremium))}
                      >
                        {/* Type Badge */}
                        {hasAuction && (
                          <div className="absolute top-4 right-4 z-10">
                            <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center shadow-lg">
                              <Gavel className="w-3.5 h-3.5 mr-1.5" /> AUCTION
                            </span>
                          </div>
                        )}
                        
                        {!hasAuction && listing.isPremium && (
                          <div className="absolute top-4 right-4 z-10">
                            <span className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-xs px-3 py-1.5 rounded-lg font-bold flex items-center shadow-lg">
                              <Crown className="w-3.5 h-3.5 mr-1.5" /> PREMIUM
                            </span>
                          </div>
                        )}

                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-black">
                          {listing.imageUrls && listing.imageUrls.length > 0 && (
                            <img
                              src={listing.imageUrls[0]}
                              alt={listing.title}
                              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                                isLockedPremium ? 'blur-md' : ''
                              }`}
                              onError={(e) => {
                                console.warn('Image failed to load:', listing.imageUrls?.[0]);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          
                          {/* Enhanced bottom gradient */}
                          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                          
                          {isLockedPremium && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
                              <Lock className="w-12 h-12 text-[#ff950e] mb-4" />
                              <p className="text-sm font-bold text-white text-center px-4">
                                Subscribe to view premium content
                              </p>
                            </div>
                          )}
                          
                          {/* Enhanced auction timer */}
                          {hasAuction && listing.auction && (
                            <div className="absolute bottom-4 left-4 z-10" key={`timer-${listing.id}-${forceUpdateTimer}`}>
                              <span className="bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center shadow-lg border border-purple-500/30">
                                <Clock className="w-4 h-4 mr-2 text-purple-400" />
                                {formatTimeRemaining(listing.auction.endTime)}
                              </span>
                            </div>
                          )}
                          
                          {/* Enhanced quick view button */}
                          {hoveredListing === listing.id && !isLockedPremium && (
                            <div className="absolute bottom-4 right-4 z-10">
                              <button 
                                className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl hover:from-[#e88800] hover:to-[#ff950e] transition-all transform hover:scale-105"
                                onClick={(e) => handleQuickView(e, listing.id)}
                              >
                                <Eye className="w-4 h-4" /> Quick View
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Content */}
                        <div className="p-5 flex flex-col flex-grow">
                          <div>
                            <h2 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-[#ff950e] transition-colors">
                              {listing.title}
                            </h2>
                            <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                              {listing.description}
                            </p>
                          </div>
                          
                          {/* Enhanced Tags */}
                          {listing.tags && listing.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {listing.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="bg-black/50 text-[#ff950e] text-xs px-3 py-1 rounded-full font-medium border border-[#ff950e]/20">
                                  #{tag}
                                </span>
                              ))}
                              {listing.tags.length > 3 && (
                                <span className="text-gray-500 text-xs px-2 py-1">
                                  +{listing.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Enhanced Auction info */}
                          {hasAuction && listing.auction && (
                            <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl p-4 mb-4 border border-purple-700/30 backdrop-blur-sm">
                              <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-purple-300 font-medium">{priceLabel}</span>
                                <span className="font-bold text-white flex items-center text-lg">
                                  {listing.auction.bids && listing.auction.bids.length > 0 && (
                                    <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                                  )}
                                  ${displayPrice}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 flex items-center gap-1">
                                  <Gavel className="w-3 h-3" />
                                  {listing.auction.bids?.length || 0} bids
                                </span>
                                {listing.auction.reservePrice && (
                                  <span className={`font-medium ${
                                    (!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                                      ? 'text-yellow-400'
                                      : 'text-green-400'
                                  }`}>
                                    {(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                                      ? '⚠️ Reserve not met'
                                      : '✅ Reserve met'
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Enhanced Price and seller */}
                          <div className="flex justify-between items-end mt-auto">
                            <Link
                              href={`/sellers/${listing.seller}`}
                              className="flex items-center gap-3 text-base text-gray-400 hover:text-[#ff950e] transition-colors group/seller"
                              onClick={e => e.stopPropagation()}
                            >
                              {sellerProfiles[listing.seller]?.pic ? (
                                <img
                                  src={sellerProfiles[listing.seller]?.pic!}
                                  alt={listing.seller}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-lg font-bold text-[#ff950e] border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors">
                                  {listing.seller.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <div className="flex flex-col">
                                <span className="font-bold text-base flex items-center gap-2">
                                  {listing.seller}
                                  {isSellerVerified && (
                                    <img 
                                      src="/verification_badge.png" 
                                      alt="Verified" 
                                      className="w-5 h-5"
                                    />
                                  )}
                                </span>
                                {sellerSales > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {sellerSales} completed sales
                                  </span>
                                )}
                              </div>
                            </Link>
                            
                            {!hasAuction && (
                              <div className="text-right">
                                <p className="font-bold text-[#ff950e] text-2xl">
                                  ${displayPrice}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                  {priceLabel}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Enhanced action button for locked premium */}
                          {user?.role === 'buyer' && isLockedPremium && (
                            <Link
                              href={`/sellers/${listing.seller}`}
                              className="mt-4 w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-3 rounded-xl hover:from-gray-600 hover:to-gray-500 font-bold transition-all text-sm text-center flex items-center justify-center gap-2 shadow-lg"
                              onClick={e => e.stopPropagation()}
                            >
                              <Lock className="w-4 h-4" /> Subscribe to Unlock
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    handleListingError(error as Error, listing.id);
                    return null;
                  }
                })}
              </div>

              {/* Enhanced Pagination */}
              {(filteredListings.length > PAGE_SIZE || page > 0) && (
                <div className="flex flex-col items-center mt-16 gap-4">
                  <div className="flex gap-4">
                    {page > 0 && (
                      <button
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#222] text-white font-bold hover:from-[#222] hover:to-[#333] transition-all border border-gray-800 shadow-lg hover:shadow-xl"
                        onClick={handlePreviousPage}
                      >
                        ← Previous
                      </button>
                    )}
                    {filteredListings.length > PAGE_SIZE * (page + 1) && (
                      <button
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black font-bold hover:from-[#e88800] hover:to-[#ff950e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        onClick={handleNextPage}
                      >
                        Next →
                      </button>
                    )}
                  </div>
                  {renderPageIndicators()}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}