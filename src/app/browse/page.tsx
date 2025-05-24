// src/app/browse/page.tsx
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
  const { listings, removeListing, user, users, isSubscribed, addSellerNotification, placeBid } = useListings();
  const { purchaseListing, orderHistory } = useWallet();
  const router = useRouter();

  const [filter, setFilter] = useState<'all' | 'standard' | 'premium' | 'auction'>('all');
  const [selectedHourRange, setSelectedHourRange] = useState(hourRangeOptions[0]);
  const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: SellerProfile }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon'>('newest');
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

  // Helper function to format time remaining for auction
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  
  const formatTimeRemaining = (endTimeStr: string) => {
    const now = new Date();
    const nowTime = now.getTime();
    
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
      formatted = `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      formatted = `${diffHours}h ${diffMinutes}m`;
    } else if (diffMinutes > 0) {
      formatted = `${diffMinutes}m`;
    } else {
      formatted = 'Soon';
    }
    
    timeCache.current[endTimeStr] = {
      formatted,
      expires: nowTime + 60000
    };
    
    return formatted;
  };

  // Get seller's total sales count
  const getSellerSalesCount = (seller: string) => {
    return orderHistory.filter(order => order.seller === seller).length;
  };

  // Fixed: Category counts based on ACTIVE listings only
  const categoryCounts = useMemo(() => {
    // Filter to only include active listings (excluding ended auctions)
    const activeListings = listings.filter(l => {
      if (l.auction) {
        const isActive = l.auction.status === 'active';
        const endTimeNotPassed = new Date(l.auction.endTime) > new Date();
        return isActive && endTimeNotPassed;
      }
      return true; // Non-auction listings are always active
    });
    
    const activeAuctions = activeListings.filter(l => 
      l.auction && 
      l.auction.status === 'active' && 
      new Date(l.auction.endTime) > new Date()
    );
    
    return {
      all: activeListings.length, // Changed from listings.length to activeListings.length
      standard: activeListings.filter(l => !l.isPremium && !l.auction).length,
      premium: activeListings.filter(l => l.isPremium).length,
      auction: activeAuctions.length
    };
  }, [listings]);

  // Memoized filtering and sorting
  const filteredListings = useMemo(() => {
    return listings
      .filter((listing: Listing) => {
        if (filter === 'standard' && (listing.isPremium || listing.auction)) return false;
        if (filter === 'premium' && !listing.isPremium) return false;
        if (filter === 'auction' && !listing.auction) return false;
        
        if (listing.auction) {
          const isActive = listing.auction.status === 'active';
          const endTimeNotPassed = new Date(listing.auction.endTime) > new Date();
          if (!isActive || !endTimeNotPassed) return false;
        }
        
        const hoursWorn = listing.hoursWorn ?? 0;
        if (hoursWorn < selectedHourRange.min || hoursWorn > selectedHourRange.max) {
          return false;
        }
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = 
            (listing.title?.toLowerCase().includes(searchLower)) || 
            (listing.description?.toLowerCase().includes(searchLower)) || 
            (listing.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false) ||
            (listing.seller.toLowerCase().includes(searchLower));
          
          if (!matchesSearch) return false;
        }
        
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
        if (sortBy === 'endingSoon') {
          // Auctions ending soon first
          if (isAuctionListing(a) && isAuctionListing(b)) {
            return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
          }
          if (isAuctionListing(a)) return -1;
          if (isAuctionListing(b)) return 1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        
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
        
        // Default: newest first
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [listings, filter, selectedHourRange, searchTerm, minPrice, maxPrice, sortBy]);

  const paginatedListings = useMemo(() => {
    return filteredListings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [filteredListings, page]);
  
  const totalPages = useMemo(() => {
    return Math.ceil(filteredListings.length / PAGE_SIZE);
  }, [filteredListings.length]);

  // Render page indicators
  const renderPageIndicators = useCallback(() => {
    if (totalPages <= 1) return null;
    
    const indicators = [];
    
    if (page > 0) {
      indicators.push(
        <span key={0} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(0)}>
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
          <span key={i} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(i)}>
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
  }, [page, totalPages]);

  return (
    <RequireAuth role={user?.role || 'buyer'}>
      <main className="min-h-screen bg-black text-white pb-16">
        {user?.role === 'seller' && (
          <div className="bg-blue-700/20 border border-blue-700 text-blue-400 p-4 rounded-lg mb-6 max-w-3xl mx-auto mt-8">
            <p className="text-sm">
              You are viewing this page as a seller. You can browse listings but cannot make purchases.
            </p>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8 max-w-[1700px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#ff950e] mb-2">
                Browse Listings
              </h1>
              <p className="text-gray-400">
                {filteredListings.length} {filter === 'all' ? 'total' : filter} listings available
              </p>
            </div>

            {/* Fixed: Category Filters with proper button styling to match header */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium transition-all border ${
                  filter === 'all' 
                    ? 'bg-[#ff950e] text-black border-[#ff950e]' 
                    : 'bg-[#1a1a1a] text-[#ff950e] hover:bg-[#222] border-[#333] hover:border-[#ff950e]/50'
                }`}
                style={{ borderRadius: '0.5rem' }} // Explicitly set border-radius to match header
              >
                All ({categoryCounts.all})
              </button>
              <button
                onClick={() => setFilter('standard')}
                className={`px-3 py-1.5 text-xs font-medium transition-all border ${
                  filter === 'standard' 
                    ? 'bg-[#ff950e] text-black border-[#ff950e]' 
                    : 'bg-[#1a1a1a] text-[#ff950e] hover:bg-[#222] border-[#333] hover:border-[#ff950e]/50'
                }`}
                style={{ borderRadius: '0.5rem' }}
              >
                Standard ({categoryCounts.standard})
              </button>
              <button
                onClick={() => setFilter('premium')}
                className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  filter === 'premium' 
                    ? 'bg-[#ff950e] text-black border-[#ff950e]' 
                    : 'bg-[#1a1a1a] text-[#ff950e] hover:bg-[#222] border-[#333] hover:border-[#ff950e]/50'
                }`}
                style={{ borderRadius: '0.5rem' }}
              >
                <Crown size={14} className={filter === 'premium' ? 'text-black' : 'text-[#ff950e]'} />
                Premium ({categoryCounts.premium})
              </button>
              <button
                onClick={() => setFilter('auction')}
                className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 border ${
                  filter === 'auction' 
                    ? 'bg-[#8b5cf6] text-black border-[#8b5cf6]' 
                    : 'bg-[#1a1a1a] text-[#8b5cf6] hover:bg-[#222] border-[#333] hover:border-[#8b5cf6]/50'
                }`}
                style={{ borderRadius: '0.5rem' }}
              >
                <Gavel size={14} className={filter === 'auction' ? 'text-black' : 'text-[#8b5cf6]'} />
                Auctions ({categoryCounts.auction})
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
                  const isLockedPremium = listing.isPremium && (!user?.username || !isSubscribed(user?.username, listing.seller));
                  const sellerUser = users?.[listing.seller];
                  const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
                  const hasAuction = isAuctionListing(listing);
                  const sellerSales = getSellerSalesCount(listing.seller);
                  
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
                    priceLabel = 'Buy Now';
                  }

                  return (
                    <div
                      key={listing.id}
                      className={`relative flex flex-col bg-[#1a1a1a] border ${
                        hasAuction ? 'border-purple-800' : 'border-gray-800'
                      } rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                        hasAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]'
                      } cursor-pointer group`}
                      onMouseEnter={() => setHoveredListing(listing.id)}
                      onMouseLeave={() => setHoveredListing(null)}
                      onClick={() => {
                        if (!isLockedPremium) router.push(`/browse/${listing.id}`);
                      }}
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
                        {hasAuction && (
                          <div className="absolute bottom-3 left-3 z-10">
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
                        {hasAuction && (
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
                        
                        {/* Price and seller - 100% larger */}
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
                })}
              </div>

              {/* Pagination */}
              {(filteredListings.length > PAGE_SIZE || page > 0) && (
                <div className="flex flex-col items-center mt-12 gap-2">
                  <div className="flex gap-4">
                    {page > 0 && (
                      <button
                        className="px-6 py-2.5 rounded-lg bg-[#1a1a1a] text-white font-medium hover:bg-[#222] transition border border-gray-800"
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </button>
                    )}
                    {filteredListings.length > PAGE_SIZE * (page + 1) && (
                      <button
                        className="px-6 py-2.5 rounded-lg bg-[#ff950e] text-black font-medium hover:bg-[#e88800] transition"
                        onClick={() => setPage(page + 1)}
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
