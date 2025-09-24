// src/components/homepage/FeaturedRandom.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Star, Lock, Clock, Gavel } from 'lucide-react';
import { listingsService } from '@/services/listings.service';
import type { Listing } from '@/context/ListingContext';
import { useAuth } from '@/context/AuthContext';

// Loading skeleton component
const ListingSkeleton = () => (
  <div className="bg-[#131313] rounded-xl border border-white/10 overflow-hidden">
    <div className="aspect-[4/3] bg-gray-800/50 animate-pulse"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-800/50 rounded animate-pulse"></div>
      <div className="h-3 bg-gray-800/30 rounded w-2/3 animate-pulse"></div>
      <div className="h-6 bg-gray-800/50 rounded w-1/3 animate-pulse"></div>
    </div>
  </div>
);

export default function FeaturedRandom() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRandomListings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all active listings
        const response = await listingsService.getListings({
          limit: 200,
          sortBy: 'date',
          sortOrder: 'desc',
        });

        if (response.success && response.data) {
          // Filter eligible listings client-side
          const eligible = response.data.filter((listing: any) => {
            // Type cast to any to handle the status property which may not exist in all listings
            const isActive = !('status' in listing) || listing.status === 'active';
            const hasImage = listing.imageUrls && listing.imageUrls.length > 0;
            const hasSeller = !!listing.seller;
            
            // Check if it's an auction
            const isAuction = !!(listing.auction?.isAuction || listing.auction?.startingPrice !== undefined);
            
            // For auctions, check starting price; for regular listings, check price
            const hasValidPrice = isAuction 
              ? (Number.isFinite(listing.auction?.startingPrice) && listing.auction?.startingPrice >= 0) ||
                (Number.isFinite(listing.auction?.highestBid) && listing.auction?.highestBid > 0)
              : (Number.isFinite(listing.price) && listing.price > 0);
            
            // Check if auction hasn't ended (if it's an auction)
            const auctionNotEnded = !isAuction || 
              (listing.auction && new Date(listing.auction.endTime) > new Date());

            return isActive && hasImage && hasSeller && hasValidPrice && auctionNotEnded;
          });

          // Random selection client-side
          const shuffled = [...eligible].sort(() => Math.random() - 0.5);
          
          // FIXED: Smart selection logic for rows
          // If we have 5+ listings, we can show 5-8 (filling 2nd row as available)
          // If we have 1-4 listings, show only those (1 row only)
          let selectedCount: number;
          if (shuffled.length <= 4) {
            // Show 1 row with whatever we have (1-4 listings)
            selectedCount = shuffled.length;
          } else {
            // We have 5+ listings, show up to 8 to fill both rows
            selectedCount = Math.min(8, shuffled.length);
          }
          
          const selected = shuffled.slice(0, selectedCount);
          
          setListings(selected);
        } else {
          setError('Failed to load listings');
        }
      } catch (err) {
        console.error('[FeaturedRandom] Error fetching listings:', err);
        setError('Failed to load featured listings');
      } finally {
        setLoading(false);
      }
    };

    fetchRandomListings();
  }, []); // Only run once on mount

  // Empty state
  if (!loading && listings.length === 0) {
    return (
      <section 
        aria-labelledby="featured-random-title" 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16"
      >
        <h2 
          id="featured-random-title" 
          className="text-2xl md:text-3xl font-bold text-white mb-2"
        >
          Featured Picks
        </h2>
        <p className="text-gray-400 text-sm">
          {error || 'No listings to feature yet. Check back soon!'}
        </p>
      </section>
    );
  }

  // Determine skeleton count based on loading state
  // Show 4 skeletons by default when loading
  const skeletonCount = 4;

  return (
    <section 
      aria-labelledby="featured-random-title" 
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-30"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 
            id="featured-random-title" 
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-white"
          >
            Featured Picks
          </h2>
          <p className="text-gray-400 mt-2">
            Discover unique items from our marketplace
          </p>
        </div>
        <Link 
          href="/browse" 
          className="text-[#ff950e] hover:text-[#ffb347] text-sm font-medium transition-colors hover:underline underline-offset-4"
        >
          View all →
        </Link>
      </div>

      {/* Listings Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          // Show skeletons while loading
          Array.from({ length: skeletonCount }).map((_, index) => (
            <ListingSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          // Show actual listings
          listings.map((listing) => {
            // FIXED: Check current verification status from the listing data
            // This matches the logic in ListingCard.tsx
            const isSellerVerified = (listing as any).isSellerVerified ?? (listing as any).isVerified ?? false;
            
            // FIXED: Use the server's isLocked field directly (same as browse page)
            const isPremiumLocked = listing.isLocked === true;
            
            // Check if this is an auction
            const isAuction = !!(listing.auction?.isAuction || listing.auction?.startingPrice !== undefined);
            
            // Format time remaining for auctions
            const formatTimeRemaining = (endTime: string) => {
              const now = Date.now();
              const end = new Date(endTime).getTime();
              const diff = end - now;
              
              if (diff <= 0) return 'Ended';
              
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              
              if (days > 0) return `${days}d ${hours}h`;
              if (hours > 0) return `${hours}h ${minutes}m`;
              return `${minutes}m`;
            };
            
            return (
              <article 
                key={listing.id} 
                className="group relative bg-[#131313] rounded-xl overflow-hidden border border-white/10 hover:border-[#ff950e]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#ff950e]/10"
              >
                <Link 
                  href={`/browse/${encodeURIComponent(listing.id)}`} 
                  className="block focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black rounded-xl"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
                    {listing.imageUrls && listing.imageUrls.length > 0 ? (
                      <Image
                        src={listing.imageUrls[0]}
                        alt={listing.title}
                        width={400}
                        height={300}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110`}
                        style={isPremiumLocked ? { filter: 'blur(2px)' } : {}}
                        loading="lazy"
                        unoptimized // Since these may be external URLs
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">No image</span>
                      </div>
                    )}
                    
                    {/* Overlay gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Premium lock overlay */}
                    {isPremiumLocked && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <Lock className="w-8 h-8 text-[#ff950e] mb-2" />
                        <p className="text-xs font-bold text-white text-center px-4">
                          Subscribe to view
                        </p>
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {listing.isPremium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs px-2 py-1 font-medium">
                          <Star className="w-3 h-3" />
                          Premium
                        </span>
                      )}
                      {isAuction && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 font-medium">
                          <Gavel className="w-3 h-3" />
                          Auction
                        </span>
                      )}
                    </div>
                    
                    {/* Auction timer */}
                    {isAuction && listing.auction && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="bg-black/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-bold flex items-center shadow-lg border border-purple-500/30">
                          <Clock className="w-3 h-3 mr-1 text-purple-400" />
                          {formatTimeRemaining(listing.auction.endTime)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    {/* Title and Seller */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-white line-clamp-1 group-hover:text-[#ff950e] transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        @{listing.seller}
                        {/* Also show verification badge next to seller name if verified */}
                        {isSellerVerified && (
                          <Image
                            src="/verification_badge.png"
                            alt="Verified"
                            width={12}
                            height={12}
                            className="w-3 h-3 inline-block"
                          />
                        )}
                      </p>
                    </div>
                    
                    {/* Price */}
                    <div className="flex items-end justify-between">
                      <div>
                        {isAuction ? (
                          <>
                            <div className="text-xs text-gray-400">
                              {listing.auction?.highestBid ? 'Current bid' : 'Starting at'}
                            </div>
                            <div className="text-lg font-bold text-purple-400">
                              ${(listing.auction?.highestBid || listing.auction?.startingPrice || 0).toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <>
                            {isPremiumLocked && (
                              <div className="text-xs text-gray-400">Premium</div>
                            )}
                            <div className="text-lg font-bold text-white">
                              ${listing.price.toFixed(2)}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Auction bid count */}
                      {isAuction && listing.auction?.bids && listing.auction.bids.length > 0 && (
                        <div className="text-xs text-gray-400">
                          {listing.auction.bids.length} bid{listing.auction.bids.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {/* Trust signals */}
                      {!isAuction && (listing as any).trustSignals?.rating && (listing as any).trustSignals.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-gray-400">
                            {(listing as any).trustSignals.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover effect - View Details */}
                    <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className={`${
                        isAuction 
                          ? 'bg-purple-600 text-white' 
                          : isPremiumLocked 
                            ? 'bg-gray-700 text-white'
                            : 'bg-[#ff950e] text-black'
                      } text-center py-2 rounded-lg font-medium text-sm`}>
                        {isPremiumLocked ? 'Subscribe to View' : 'View Details'}
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}