// Modified src/app/browse/page.tsx

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
  Gavel, ArrowUp, Calendar, BarChart2, User, AlertTriangle, ExternalLink, Eye
} from 'lucide-react';

type SellerProfile = {
  bio: string | null;
  pic: string | null;
};

const hourRangeOptions = [
  { label: 'Any Hours', min: 0, max: Infinity },
  { label: '12+ Hours', min: 12, max: Infinity },
  { label: '24+ Hours', min: 24, max: Infinity },
  { label: '48+ Hours', min: 48, max: Infinity },
];

const PAGE_SIZE = 40;

// Type guard for auction listings
const isAuctionListing = (listing: Listing): listing is Listing & { auction: AuctionSettings } => {
  return !!listing.auction;
};

export default function BrowsePage() {
  // Added 'users' to the useListings hook
  const { listings, removeListing, user, users, isSubscribed, addSellerNotification, placeBid } = useListings();
  const { purchaseListing } = useWallet();
  const router = useRouter();

  const [filter, setFilter] = useState<'all' | 'standard' | 'premium' | 'auction'>('all');
  const [selectedHourRange, setSelectedHourRange] = useState(hourRangeOptions[0]);
  const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: SellerProfile }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');
  const [page, setPage] = useState(0);
  const [hoveredListing, setHoveredListing] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sellers = new Set(listings.map(listing => listing.seller));
      const profiles: { [key: string]: SellerProfile } = {};
      sellers.forEach(seller => {
        const bio = sessionStorage.getItem(`profile_bio_${seller}`);
        const pic = sessionStorage.getItem(`profile_pic_${seller}`);
        profiles[seller] = { bio, pic };
      });
      setSellerProfiles(profiles);
    }
  }, [listings]);

  useEffect(() => {
    setPage(0);
  }, [filter, selectedHourRange, searchTerm, minPrice, maxPrice, sortBy]);

  // Helper function to format time remaining for auction with memoization to improve performance
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  
  const formatTimeRemaining = (endTimeStr: string) => {
    const now = new Date();
    const nowTime = now.getTime();
    
    // Check cache first to avoid repetitive calculations
    if (timeCache.current[endTimeStr] && timeCache.current[endTimeStr].expires > nowTime) {
      return timeCache.current[endTimeStr].formatted;
    }
    
    const endTime = new Date(endTimeStr);
    
    if (endTime <= now) {
      return 'Ended';
    }
    
    const diffMs = endTime.getTime() - nowTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let formatted;
    if (diffDays > 0) {
      formatted = `${diffDays}d ${diffHours}h left`;
    } else if (diffHours > 0) {
      formatted = `${diffHours}h ${diffMinutes}m left`;
    } else if (diffMinutes > 0) {
      formatted = `${diffMinutes}m left`;
    } else {
      formatted = 'Ending soon!';
    }
    
    // Cache the result for 1 minute to avoid recalculating for the same endTimeStr too frequently
    timeCache.current[endTimeStr] = {
      formatted,
      expires: nowTime + 60000  // 1 minute expiration
    };
    
    return formatted;
  };

  // Memoized filtering and sorting for better performance
  const filteredListings = useMemo(() => {
    return listings
      .filter((listing: Listing) => {
        // Filter by listing type
        if (filter === 'standard' && (listing.isPremium || listing.auction)) return false;
        if (filter === 'premium' && !listing.isPremium) return false;
        if (filter === 'auction' && !listing.auction) return false;
        
        // Skip inactive auctions
        if (listing.auction) {
          // Check if the auction is active
          const isActive = listing.auction.status === 'active';
          // Additionally check if the end time hasn't passed
          const endTimeNotPassed = new Date(listing.auction.endTime) > new Date();
          if (!isActive || !endTimeNotPassed) return false;
        }
        
        // Filter by hours worn
        const hoursWorn = listing.hoursWorn ?? 0;
        if (hoursWorn < selectedHourRange.min || hoursWorn > selectedHourRange.max) {
          return false;
        }
        
        // Filter by search term (case-insensitive)
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            (listing.title?.toLowerCase().includes(searchLower)) || 
            (listing.description?.toLowerCase().includes(searchLower)) || 
            (listing.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false);
          
          if (!matchesSearch) return false;
        }
        
        // Filter by price
        let price: number;
        if (isAuctionListing(listing)) {
          price = listing.auction.highestBid || listing.auction.startingPrice;
        } else {
          price = listing.markedUpPrice || listing.price;
        }
        
        const min = parseFloat(minPrice) || 0;
        const max = parseFloat(maxPrice) || Infinity;
        if (price < min || price > max) return false;
        
        return true;
      })
      .sort((a: Listing, b: Listing) => {
        // Sort listings
        if (sortBy === 'priceAsc') {
          let aPrice: number, bPrice: number;
          
          if (isAuctionListing(a)) {
            aPrice = a.auction.highestBid || a.auction.startingPrice;
          } else {
            aPrice = a.markedUpPrice ?? a.price;
          }
          
          if (isAuctionListing(b)) {
            bPrice = b.auction.highestBid || b.auction.startingPrice;
          } else {
            bPrice = b.markedUpPrice ?? b.price;
          }
          
          return aPrice - bPrice;
        }
        
        if (sortBy === 'priceDesc') {
          let aPrice: number, bPrice: number;
          
          if (isAuctionListing(a)) {
            aPrice = a.auction.highestBid || a.auction.startingPrice;
          } else {
            aPrice = a.markedUpPrice ?? a.price;
          }
          
          if (isAuctionListing(b)) {
            bPrice = b.auction.highestBid || b.auction.startingPrice;
          } else {
            bPrice = b.markedUpPrice ?? b.price;
          }
          
          return bPrice - aPrice;
        }
        
        // Special handling for auctions - prioritize those ending soon
        if (isAuctionListing(a) && isAuctionListing(b)) {
          const aEndTime = new Date(a.auction.endTime).getTime();
          const bEndTime = new Date(b.auction.endTime).getTime();
          if (Math.abs(aEndTime - bEndTime) < 86400000) { // If end times are within a day of each other
            return new Date(b.date).getTime() - new Date(a.date).getTime(); // Then fall back to newest first
          }
          return aEndTime - bEndTime; // Otherwise, sort by end time (soonest first)
        } 
        else if (isAuctionListing(a)) {
          return -1; // Auctions before non-auctions
        }
        else if (isAuctionListing(b)) {
          return 1;  // Auctions before non-auctions
        }
        
        // Default sort by newest first
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [listings, filter, selectedHourRange, searchTerm, minPrice, maxPrice, sortBy]);

  const paginatedListings = useMemo(() => {
    return filteredListings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filteredListings, page]);
  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredListings.length / PAGE_SIZE);
  }, [filteredListings.length]);

  // Memoized function to render page indicators
  const renderPageIndicators = useCallback(() => {
    if (totalPages <= 1) return null;
    
    const indicators = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show
    
    // Always include first page
    if (page > 0) {
      indicators.push(
        <span key={0} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(0)}>
          1
        </span>
      );
    }
    
    // Show ellipsis if needed
    if (page > 2) {
      indicators.push(
        <span key="start-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
      );
    }
    
    // Calculate range of visible pages
    let startPage = Math.max(1, page - 1);
    let endPage = Math.min(totalPages - 2, page + 1);
    
    // Ensure at least 3 pages are shown if available
    if (endPage - startPage < 2 && totalPages > 3) {
      if (startPage === 1) {
        endPage = Math.min(totalPages - 2, 3);
      } else if (endPage === totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
    }
    
    // Generate page buttons
    for (let i = startPage; i <= endPage; i++) {
      if (i === page) {
        indicators.push(
          <span key={i} className="px-2 py-1 text-sm font-bold text-[#ff950e] border-b-2 border-[#ff950e]">
            {i + 1}
          </span>
        );
      } else {
        indicators.push(
          <span key={i} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(i)}>
            {i + 1}
          </span>
        );
      }
    }
    
    // Show ellipsis if needed
    if (endPage < totalPages - 2) {
      indicators.push(
        <span key="end-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
      );
    }
    
    // Always include last page
    if (page < totalPages - 1) {
      indicators.push(
        <span key={totalPages - 1} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(totalPages - 1)}>
          {totalPages}
        </span>
      );
    }
    
    return (
      <div className="flex justify-center items-center gap-1 mt-4">
        {indicators}
      </div>
    );
  }, [page, totalPages, setPage]);

  return (
    <RequireAuth role={user?.role || 'buyer'}>
      <main className="relative min-h-screen bg-black text-white pb-16">
        <div className="fixed top-0 left-0 w-full h-2 z-30 bg-gradient-to-r from-[#ff950e] via-pink-500 to-[#ff950e] animate-pulse opacity-70 pointer-events-none" />

        {user?.role === 'seller' && (
          <div className="bg-blue-700 text-white p-4 rounded-xl mb-6 shadow-lg max-w-3xl mx-auto mt-8">
            <p className="text-sm">
              You are viewing this page as a seller. You can browse listings but cannot make purchases.
            </p>
          </div>
        )}

        <div className="sticky top-4 z-20 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 max-w-[1700px] mx-auto px-2 sm:px-6">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ff950e] drop-shadow-[0_2px_8px_rgba(255,149,14,0.18)] relative"
            style={{
              textShadow: '0 2px 8px #ff950e44, 0 1px 0 #ff950e, 0 0px 2px #000'
            }}
          >
            Browse Listings
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-20 h-1 bg-[#ff950e] blur-sm opacity-40 rounded-full pointer-events-none" />
          </h1>
          <div className="flex flex-wrap gap-2 items-center bg-[#181818]/80 backdrop-blur-md p-3 rounded-2xl shadow border border-gray-800 w-full xl:w-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff950e] w-5 h-5" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search listings..."
                className="pl-10 pr-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ff950e] w-32 sm:w-48"
              />
            </div>
            <input
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="Min $"
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 w-20"
            />
            <input
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Max $"
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 w-20"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
            </select>
            <select
              value={selectedHourRange.label}
              onChange={(e) => {
                const selectedOption = hourRangeOptions.find(opt => opt.label === e.target.value);
                if (selectedOption) setSelectedHourRange(selectedOption);
              }}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            >
              {hourRangeOptions.map(option => (
                <option key={option.label} value={option.label}>{option.label}</option>
              ))}
            </select>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            >
              <option value="all">All</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="auction">Auctions</option>
            </select>
          </div>
        </div>
        <div className="max-w-[1700px] mx-auto px-6">
          {paginatedListings.length === 0 ? (
            <div className="text-center py-20 bg-[#181818] rounded-2xl border border-dashed border-gray-700 shadow-lg mt-10">
              <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-bold text-xl">No listings match your current filters</p>
              <p className="text-md text-gray-400 mt-2">
                Try changing your filter settings or check back later
              </p>
              {filter === 'premium' && (
                <p className="mt-6 text-md text-yellow-400">
                  Premium listings require subscribing to the seller to view fully.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10">
                {paginatedListings.map((listing) => {
                  const isLockedPremium = listing.isPremium && (!user?.username || !isSubscribed(user?.username, listing.seller));
                  // Check seller's current verification status from users context
                  const sellerUser = users?.[listing.seller];
                  const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
                  const hasAuction = isAuctionListing(listing);
                  
                  // Determine the displayed price based on listing type
                  let displayPrice = '';
                  let priceLabel = '';
                  
                  if (hasAuction) {
                    const hasActiveBids = listing.auction.bids && listing.auction.bids.length > 0;
                    const highestBid = listing.auction.highestBid;
                    
                    if (hasActiveBids && highestBid) {
                      displayPrice = highestBid.toFixed(2);
                      priceLabel = 'Current Bid';
                    } else {
                      displayPrice = listing.auction.startingPrice.toFixed(2);
                      priceLabel = 'Starting Bid';
                    }
                  } else {
                    displayPrice = listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2);
                    priceLabel = 'Price';
                  }

                  return (
                    <div
                      key={listing.id}
                      className={`relative flex flex-col bg-gradient-to-br from-[#181818] via-black to-[#181818] border ${hasAuction ? 'border-purple-800' : 'border-gray-800'} rounded-3xl shadow-2xl hover:shadow-[0_8px_32px_0_rgba(255,149,14,0.25)] transition-all duration-300 overflow-hidden ${hasAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]'} min-h-[480px] cursor-pointer group`}
                      style={{
                        boxShadow: hasAuction 
                          ? '0 4px 32px 0 #000a, 0 2px 8px 0 rgba(168, 85, 247, 0.2)' 
                          : '0 4px 32px 0 #000a, 0 2px 8px 0 #ff950e22',
                      }}
                      onMouseEnter={() => setHoveredListing(listing.id)}
                      onMouseLeave={() => setHoveredListing(null)}
                      onClick={() => {
                        if (!isLockedPremium) router.push(`/browse/${listing.id}`);
                      }}
                      tabIndex={0}
                    >
                      {hasAuction && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
                            <Gavel className="w-4 h-4 mr-1" /> Auction
                          </span>
                        </div>
                      )}
                      
                      {!hasAuction && listing.isPremium && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow animate-pulse">
                            <Crown className="w-4 h-4 mr-1" /> Premium
                          </span>
                        </div>
                      )}

                      {/* Embedded image with 10px padding and matching rounded-3xl, taller image */}
                      <div className="relative p-[10px] pb-0">
                        <div className="relative w-full h-[290px] rounded-3xl overflow-hidden">
                          {listing.imageUrls && listing.imageUrls.length > 0 && (
                            <img
                              src={listing.imageUrls[0]}
                              alt={listing.title}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isLockedPremium ? 'blur-[4.5px]' : ''} rounded-3xl`}
                            />
                          )}
                          {/* Soft black gradient overlay at the bottom */}
                          <div
                            className="pointer-events-none absolute left-0 bottom-0 w-full h-20 rounded-b-3xl"
                            style={{
                              background: 'linear-gradient(0deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.00) 100%)'
                            }}
                          />
                          {isLockedPremium && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4 rounded-3xl z-10">
                              <Lock className="w-10 h-10 text-[#ff950e] mb-3" />
                              <p className="text-sm font-semibold text-white">
                                Subscribe to <Link href={`/sellers/${listing.seller}`} className="underline hover:text-[#ff950e]" onClick={e => e.stopPropagation()}>{listing.seller}</Link> to view
                              </p>
                            </div>
                          )}
                          
                          {/* Auction timer badge */}
                          {hasAuction && (
                            <div className="absolute bottom-3 left-3 z-10">
                              <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                {formatTimeRemaining(listing.auction.endTime)}
                              </span>
                            </div>
                          )}
                          
                          {/* View button - only shows on hover */}
                          {hoveredListing === listing.id && !isLockedPremium && (
                            <div 
                              className="absolute bottom-3 right-3 z-20 transition-opacity duration-200 opacity-100"
                            >
                              <button 
                                className="bg-[#ff950e] text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:bg-[#e88a0d] transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/browse/${listing.id}`);
                                }}
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <h2 className={`text-2xl font-bold text-white mb-1 group-hover:text-[#ff950e]`}>{listing.title}</h2>
                        <p className="text-base text-gray-300 mb-2 line-clamp-2">{listing.description}</p>
                        {listing.tags && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {listing.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="bg-[#232323] text-[#ff950e] text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                                {tag}
                              </span>
                            ))}
                            {listing.tags.length > 3 && (
                              <span className="bg-[#232323] text-[#ff950e] text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                                +{listing.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Auction details for auction listings */}
                        {hasAuction && (
                          <div className="bg-purple-900/30 rounded-lg p-3 mb-3 border border-purple-800/50">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-purple-300 flex items-center gap-1">
                                <BarChart2 className="w-3.5 h-3.5" /> {priceLabel}:
                              </span>
                              <span className="font-bold text-white text-lg flex items-center gap-1">
                                {listing.auction.bids && listing.auction.bids.length > 0 && (
                                  <ArrowUp className="w-3.5 h-3.5 text-green-400" />
                                )}
                                ${displayPrice}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-purple-300 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Ends:
                              </span>
                              <span className="text-xs font-medium text-white">
                                {formatTimeRemaining(listing.auction.endTime)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                              <span>{listing.auction.bids?.length || 0} {listing.auction.bids?.length === 1 ? 'bid' : 'bids'}</span>
                              
                              {listing.auction.reservePrice && (
                                <span className="flex items-center gap-1 ml-2">
                                  {(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice) ? (
                                    <span className="flex items-center gap-1 text-yellow-400">
                                      <AlertTriangle className="w-3 h-3" /> Reserve not met
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-green-400">
                                      <CheckCircle className="w-3 h-3" /> Reserve met
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-auto">
                          {!hasAuction && (
                            <p className="font-bold text-[#ff950e] text-2xl">
                              ${listing.markedUpPrice?.toFixed(2) ?? 'N/A'}
                            </p>
                          )}
                          
                          {hasAuction && (
                            <div className="flex items-center gap-1">
                              {listing.auction.bids && listing.auction.bids.length > 0 ? (
                                <ArrowUp className="w-4 h-4 text-green-400" />
                              ) : null}
                              <p className={`font-bold text-2xl ${listing.auction.bids && listing.auction.bids.length > 0 ? 'text-green-400' : 'text-purple-400'}`}>
                                ${displayPrice}
                              </p>
                            </div>
                          )}
                          
                          <Link
                            href={`/sellers/${listing.seller}`}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#ff950e] font-semibold group/seller" // Added group/seller here
                            title={sellerProfiles[listing.seller]?.bio || listing.seller}
                            onClick={e => e.stopPropagation()}
                          >
                            {sellerProfiles[listing.seller]?.pic ? (
                              <span className="relative group-hover/seller:ring-2 group-hover/seller:ring-[#ff950e] rounded-full transition">
                                <img
                                  src={sellerProfiles[listing.seller]?.pic!}
                                  alt={listing.seller}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-[#ff950e]"
                                />
                              </span>
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[#ff950e] font-bold border-2 border-[#ff950e]">
                                {listing.seller.charAt(0).toUpperCase()}
                              </span>
                            )}
                            {listing.seller}
                            {/* Verified Badge - Check seller's current status */}
                            {isSellerVerified && (
                              <div className="relative"> {/* Removed group here */}
                                <img
                                  src="/verification_badge.png"
                                  alt="Verified"
                                  className="w-4 h-4" // Adjusted size
                                />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover/seller:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20"> {/* Used group-hover/seller */}
                                  Verified Seller
                                </div>
                              </div>
                            )}
                          </Link>
                        </div>
                        {user?.role === 'buyer' ? (
                          isLockedPremium ? (
                            <Link
                              href={`/sellers/${listing.seller}`}
                              className="mt-6 w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-500 font-bold transition text-lg shadow flex items-center justify-center gap-2"
                              onClick={e => e.stopPropagation()}
                            >
                              <Lock className="w-5 h-5 mr-1" /> Subscribe to Buy
                            </Link>
                          ) : null
                        ) : user?.role === 'seller' ? (
                          <div className="mt-6 text-center text-sm text-gray-500">
                            Sellers cannot purchase listings
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              {(filteredListings.length > PAGE_SIZE || page > 0) && (
                <div className="flex flex-col items-center mt-12 gap-2">
                  <div className="flex gap-4">
                    {page > 0 && (
                      <button
                        className="px-8 py-3 rounded-full bg-[#232323] text-white font-bold text-lg shadow-lg hover:bg-[#181818] transition"
                        onClick={() => setPage(page - 1)}
                      >
                        Previous Page
                      </button>
                    )}
                    {filteredListings.length > PAGE_SIZE * (page + 1) && (
                      <button
                        className="px-8 py-3 rounded-full bg-[#ff950e] text-black font-bold text-lg shadow-lg hover:bg-[#e0850d] transition"
                        onClick={() => setPage(page + 1)}
                      >
                        Next Page
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
