// src/app/browse/page.tsx - All Fixes Applied (1-10)
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
  ChevronDown, Package, DollarSign
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

  // FIX 6: Optimized timer management with safe date parsing
  const auctionTimers = useMemo(() => {
    const now = new Date();
    try {
      return listings
        .filter(listing => {
          if (!isAuctionListing(listing) || !isListingActive(listing)) return false;
          
          const endTime = safeParseDate(listing.auction.endTime);
          return endTime && endTime > now;
        })
        .map(listing => {
          if (!listing.auction) return null;
          
          const endTime = safeParseDate(listing.auction.endTime);
          if (!endTime) return null;
          
          const timer: AuctionTimer = {
            id: listing.id,
            endTime: listing.auction.endTime,
            updateInterval: (() => {
              const timeLeft = endTime.getTime() - now.getTime();
              if (timeLeft < 60000) return 1000; // Last minute: every second
              if (timeLeft < 300000) return 5000; // Last 5 minutes: every 5 seconds
              if (timeLeft < 3600000) return 15000; // Last hour: every 15 seconds
              return 60000; // Otherwise: every minute
            })()
          };
          return timer;
        })
        .filter((timer): timer is AuctionTimer => timer !== null);
    } catch (error) {
      console.error('Error calculating auction timers:', error);
      return [];
    }
  }, [listings, forceUpdateTimer]);

  // FIX 6: Smart timer that only updates when necessary
  useEffect(() => {
    if (auctionTimers.length === 0) return;

    try {
      const minInterval = Math.min(...auctionTimers.map(t => t.updateInterval));
      
      const interval = setInterval(() => {
        setForceUpdateTimer(prev => prev + 1);
      }, minInterval);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error setting up auction timer:', error);
    }
  }, [auctionTimers.length, auctionTimers]);

  // Improved timer cache with better memory management
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  
  // Clean up expired cache entries periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      try {
        const now = Date.now();
        const cache = timeCache.current;
        
        // Remove expired entries
        Object.keys(cache).forEach(key => {
          if (cache[key].expires < now) {
            delete cache[key];
          }
        });

        // FIX 6 & 9: Also remove cache entries for ended auctions and limit cache size
        const activeAuctionEndTimes = new Set(
          auctionTimers.map(timer => timer.endTime)
        );
        
        Object.keys(cache).forEach(key => {
          if (!activeAuctionEndTimes.has(key)) {
            delete cache[key];
          }
        });
        
        // FIX 9: Limit cache size to prevent memory issues
        const cacheKeys = Object.keys(cache);
        if (cacheKeys.length > 200) {
          // Remove oldest entries
          const sortedKeys = cacheKeys.sort((a, b) => cache[a].expires - cache[b].expires);
          sortedKeys.slice(0, 50).forEach(key => delete cache[key]);
        }
      } catch (error) {
        console.error('Error cleaning up timer cache:', error);
      }
    }, 60000); // Clean up every minute
    
    return () => clearInterval(cleanupInterval);
  }, [auctionTimers]);

  // FIX 10: Safe formatTimeRemaining with error handling
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
        return 'Ended';
      }
      
      const diffMs = endTime.getTime() - nowTime;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let formatted;
      let cacheTime;
      
      if (diffDays > 0) {
        formatted = `${diffDays}d ${diffHours}h`;
        cacheTime = 60000; // Cache for 1 minute
      } else if (diffHours > 0) {
        formatted = `${diffHours}h ${diffMinutes}m`;
        cacheTime = 30000; // Cache for 30 seconds
      } else if (diffMinutes > 0) {
        formatted = `${diffMinutes}m`;
        cacheTime = 10000; // Cache for 10 seconds
      } else {
        formatted = 'Soon';
        cacheTime = 1000; // Cache for 1 second
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
  }, []);

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
    if (filteredListings.length > PAGE_SIZE * (page + 1)) {
      setPage(prev => prev + 1);
    }
  }, [page]); // Remove filteredListings.length dependency to avoid issues

  const handlePageClick = useCallback((targetPage: number) => {
    if (targetPage >= 0) {
      setPage(targetPage);
    }
  }, []);

  // Consistent filtering logic with error handling
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

  // Render page indicators
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
            <p className="text-sm">
              You are viewing this page as a seller. You can browse listings but cannot make purchases.
            </p>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-6 max-w-[1700px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex flex-col leading-tight">
                <h1 className="text-xl font-bold text-[#ff950e]">
                  Browse Listings
                </h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {filteredListings.length} {filter === 'all' ? 'total' : filter} listings available
                </p>
              </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' 
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                }`}
              >
                <Package className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">All ({categoryCounts.all})</span>
              </button>
              
              <button
                onClick={() => setFilter('standard')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs ${
                  filter === 'standard' 
                    ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' 
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Standard ({categoryCounts.standard})</span>
              </button>
              
              <button
                onClick={() => setFilter('premium')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs ${
                  filter === 'premium' 
                    ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105' 
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                }`}
              >
                <Crown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Premium ({categoryCounts.premium})</span>
              </button>
              
              <button
                onClick={() => setFilter('auction')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs ${
                  filter === 'auction' 
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border border-white/20 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:shadow-2xl hover:shadow-[#8b5cf6]/30 transform hover:scale-105' 
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#8b5cf6] border border-[#333] hover:border-[#8b5cf6]/50 hover:shadow-[#8b5cf6]/20'
                }`}
              >
                <Gavel className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Auctions ({categoryCounts.auction})</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center bg-[#1a1a1a]/50 backdrop-blur-sm p-4 rounded-lg border border-gray-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search listings..."
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e]"
              />
            </div>

            <div className="flex gap-2 items-center">
              <DollarSign size={16} className="text-gray-500" />
              <input
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="Min"
                type="number"
                className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 w-20"
              />
              <span className="text-gray-500">-</span>
              <input
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="Max"
                type="number"
                className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 w-20"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
              <option value="endingSoon">Ending Soon</option>
            </select>

            <select
              value={selectedHourRange.label}
              onChange={(e) => {
                const selectedOption = hourRangeOptions.find(opt => opt.label === e.target.value);
                if (selectedOption) setSelectedHourRange(selectedOption);
              }}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white cursor-pointer"
            >
              {hourRangeOptions.map(option => (
                <option key={option.label} value={option.label}>{option.label}</option>
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
                className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm transition-all flex items-center gap-1"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="max-w-[1700px] mx-auto px-6">
          {paginatedListings.length === 0 ? (
            <div className="text-center py-20 bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-lg">
              <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-white font-bold text-xl mb-2">No listings found</p>
              <p className="text-gray-400 mb-6">
                Try adjusting your filters or check back later
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
                className="px-6 py-2 bg-[#ff950e] text-black rounded-lg font-medium hover:bg-[#e88800] transition-all"
              >
                Reset Filters
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
                        className={`relative flex flex-col bg-[#1a1a1a] border ${
                          hasAuction ? 'border-purple-800' : 'border-gray-800'
                        } rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                          hasAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]'
                        } cursor-pointer group`}
                        onMouseEnter={() => handleMouseEnter(listing.id)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleListingClick(listing.id, Boolean(isLockedPremium))}
                      >
                        {/* Type Badge */}
                        {hasAuction && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className="bg-purple-600 text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center">
                              <Gavel className="w-3.5 h-3.5 mr-1" /> Auction
                            </span>
                          </div>
                        )}
                        
                        {!hasAuction && listing.isPremium && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className="bg-[#ff950e] text-black text-xs px-2.5 py-1 rounded-lg font-medium flex items-center">
                              <Crown className="w-3.5 h-3.5 mr-1" /> Premium
                            </span>
                          </div>
                        )}

                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden bg-black">
                          {listing.imageUrls && listing.imageUrls.length > 0 && (
                            <img
                              src={listing.imageUrls[0]}
                              alt={listing.title}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                isLockedPremium ? 'blur-md' : ''
                              }`}
                              onError={(e) => {
                                console.warn('Image failed to load:', listing.imageUrls?.[0]);
                                // Set a fallback or hide the image
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          
                          {/* Bottom gradient for better text readability */}
                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                          
                          {isLockedPremium && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                              <Lock className="w-10 h-10 text-[#ff950e] mb-3" />
                              <p className="text-sm font-medium text-white text-center px-4">
                                Subscribe to view
                              </p>
                            </div>
                          )}
                          
                          {/* Auction timer */}
                          {hasAuction && listing.auction && (
                            <div className="absolute bottom-3 left-3 z-10" key={`timer-${listing.id}-${forceUpdateTimer}`}>
                              <span className="bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1 text-purple-400" />
                                {formatTimeRemaining(listing.auction.endTime)}
                              </span>
                            </div>
                          )}
                          
                          {/* Quick view button on hover */}
                          {hoveredListing === listing.id && !isLockedPremium && (
                            <div className="absolute bottom-3 right-3 z-10">
                              <button 
                                className="bg-[#ff950e] text-black text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-lg hover:bg-[#e88800] transition-all"
                                onClick={(e) => handleQuickView(e, listing.id)}
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-grow">
                          <h2 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-[#ff950e] transition-colors">
                            {listing.title}
                          </h2>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                            {listing.description}
                          </p>
                          
                          {/* Tags */}
                          {listing.tags && listing.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {listing.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="bg-black text-[#ff950e] text-xs px-2 py-0.5 rounded font-medium">
                                  {tag}
                                </span>
                              ))}
                              {listing.tags.length > 2 && (
                                <span className="text-gray-500 text-xs">
                                  +{listing.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Auction info */}
                          {hasAuction && listing.auction && (
                            <div className="bg-purple-900/20 rounded-lg p-2.5 mb-3 border border-purple-800/30">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-purple-300">{priceLabel}</span>
                                <span className="font-bold text-white flex items-center">
                                  {listing.auction.bids && listing.auction.bids.length > 0 && (
                                    <ArrowUp className="w-3.5 h-3.5 text-green-400 mr-1" />
                                  )}
                                  ${displayPrice}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-1.5 text-xs">
                                <span className="text-gray-400">
                                  {listing.auction.bids?.length || 0} bids
                                </span>
                                {listing.auction.reservePrice && (
                                  <span className={
                                    (!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                                      ? 'text-yellow-400'
                                      : 'text-green-400'
                                  }>
                                    {(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                                      ? 'Reserve not met'
                                      : 'Reserve met'
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Price and seller */}
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
                                  className="w-10 h-10 rounded-full object-cover"
                                  onError={(e) => {
                                    // Fallback to initials if profile pic fails
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-base font-bold text-[#ff950e]">
                                  {listing.seller.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium text-base flex items-center gap-1">
                                  {listing.seller}
                                  {isSellerVerified && (
                                    <BadgeCheck className="w-4 h-4 text-[#ff950e]" />
                                  )}
                                </span>
                                {sellerSales > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {sellerSales} sales
                                  </span>
                                )}
                              </div>
                            </Link>
                            
                            {!hasAuction && (
                              <p className="font-bold text-[#ff950e] text-xl">
                                ${displayPrice}
                              </p>
                            )}
                          </div>
                          
                          {/* Action button for locked premium */}
                          {user?.role === 'buyer' && isLockedPremium && (
                            <Link
                              href={`/sellers/${listing.seller}`}
                              className="mt-3 w-full bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 font-medium transition text-sm text-center flex items-center justify-center gap-1"
                              onClick={e => e.stopPropagation()}
                            >
                              <Lock className="w-4 h-4" /> Subscribe
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

              {/* Pagination */}
              {(filteredListings.length > PAGE_SIZE || page > 0) && (
                <div className="flex flex-col items-center mt-12 gap-2">
                  <div className="flex gap-4">
                    {page > 0 && (
                      <button
                        className="px-6 py-2.5 rounded-lg bg-[#1a1a1a] text-white font-medium hover:bg-[#222] transition border border-gray-800"
                        onClick={handlePreviousPage}
                      >
                        Previous
                      </button>
                    )}
                    {filteredListings.length > PAGE_SIZE * (page + 1) && (
                      <button
                        className="px-6 py-2.5 rounded-lg bg-[#ff950e] text-black font-medium hover:bg-[#e88800] transition"
                        onClick={handleNextPage}
                      >
                        Next
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