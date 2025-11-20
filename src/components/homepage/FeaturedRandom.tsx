// src/components/homepage/FeaturedRandom.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Star, Lock, Clock, Gavel } from 'lucide-react';
import { listingsService } from '@/services/listings.service';
import type { Listing } from '@/context/ListingContext';
import { useAuth } from '@/context/AuthContext';

// Enhanced loading skeleton component - matching browse page dimensions
const ListingSkeleton = React.memo(() => (
  <div className="bg-[#131313] rounded-lg sm:rounded-xl border border-white/10 overflow-hidden">
    <div className="aspect-[4/5] sm:aspect-square bg-gray-800/50 animate-pulse"></div>
    <div className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
      <div className="h-4 sm:h-5 bg-gray-800/50 rounded animate-pulse"></div>
      <div className="h-3 bg-gray-800/30 rounded w-2/3 animate-pulse"></div>
      <div className="h-5 sm:h-6 bg-gray-800/50 rounded w-1/3 animate-pulse"></div>
    </div>
  </div>
));
ListingSkeleton.displayName = 'ListingSkeleton';

// Optimized ListingCard component with regular img tag (like it was before)
const ListingCard = React.memo(({ listing }: { listing: Listing }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Memoize computed values
  const isSellerVerified = useMemo(
    () => (listing as any).isSellerVerified ?? (listing as any).isVerified ?? false,
    [listing]
  );

  const isPremiumLocked = useMemo(() => listing.isLocked === true, [listing.isLocked]);

  const isAuction = useMemo(
    () => !!(listing.auction?.isAuction || listing.auction?.startingPrice !== undefined),
    [listing.auction]
  );

  // FIXED: Calculate the display price with markup for non-auction listings
  const displayPrice = useMemo(() => {
    if (isAuction) {
      return listing.auction?.highestBid || listing.auction?.startingPrice || 0;
    }
    // Use markedUpPrice if available, otherwise calculate it
    if ((listing as any).markedUpPrice) {
      return (listing as any).markedUpPrice;
    }
    // Fallback: calculate 10% markup manually
    return Math.round(listing.price * 1.1 * 100) / 100;
  }, [isAuction, listing]);

  // Format time remaining for auctions
  const formatTimeRemaining = useMemo(() => {
    if (!isAuction || !listing.auction) return null;

    return (endTime: string) => {
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
  }, [isAuction, listing.auction]);

  const firstImage = useMemo(() => listing.imageUrls?.[0], [listing.imageUrls]);

  return (
    <article className="group relative bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-gray-800 rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-[#ff950e] cursor-pointer hover:transform hover:scale-[1.02] overflow-hidden">
      <Link
        href={`/browse/${encodeURIComponent(listing.id)}`}
        className="block focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black rounded-lg sm:rounded-xl"
        prefetch={false}
      >
        {/* Type Badge - Matching browse page positioning */}
        <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-10">
          {isAuction && (
            <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-bold flex items-center shadow-lg">
              <Gavel className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" /> AUCTION
            </span>
          )}

          {!isAuction && listing.isPremium && (
            <span className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg font-bold flex items-center shadow-lg">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" /> PREMIUM
            </span>
          )}
        </div>

        {/* Image Container - REVERTED to regular img tag like before */}
        <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-black">
          {firstImage ? (
            <>
              {/* Loading skeleton */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse" />
              )}

              {/* Regular img tag - like it was working before */}
              {!imageError ? (
                <img
                  src={firstImage}
                  alt={listing.title}
                  className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                    isPremiumLocked ? 'blur-md' : ''
                  } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-gray-600 text-xs sm:text-sm">Image unavailable</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-gray-600 text-xs sm:text-sm">No image</span>
            </div>
          )}

          {/* Enhanced bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* Premium lock overlay */}
          {isPremiumLocked && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
              <Lock className="w-8 h-8 sm:w-12 sm:h-12 text-[#ff950e] mb-2 sm:mb-4" />
              <p className="text-xs sm:text-sm font-bold text-white text-center px-2 sm:px-4">
                Subscribe to view premium content
              </p>
            </div>
          )}

          {/* Auction timer */}
          {isAuction && listing.auction && formatTimeRemaining && (
            <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4 z-10">
              <span className="bg-black/90 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-lg font-bold flex items-center shadow-lg border border-purple-500/30">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-400" />
                {formatTimeRemaining(listing.auction.endTime)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
          <div>
            <h3 className="text-sm sm:text-base md:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-1 group-hover:text-[#ff950e] transition-colors">
              {listing.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 line-clamp-1 sm:line-clamp-2 leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Auction info */}
          {isAuction && listing.auction && (
            <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 mb-2 sm:mb-4 border border-purple-700/30 backdrop-blur-sm">
              <div className="flex justify-between items-center text-xs sm:text-sm mb-1 sm:mb-2">
                <span className="text-purple-300 font-medium text-[10px] sm:text-xs">
                  {listing.auction?.highestBid ? 'Current bid' : 'Starting at'}
                </span>
                <span className="font-bold text-white flex items-center text-sm sm:text-base md:text-lg">
                  ${displayPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-gray-400 flex items-center gap-0.5 sm:gap-1">
                  <Gavel className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {listing.auction.bids?.length || 0} bids
                </span>
                {listing.auction.reservePrice && (
                  <span
                    className={`font-medium text-[10px] sm:text-xs ${
                      !listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice
                      ? '⚠️ Reserve not met'
                      : '✅ Reserve met'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Price & Seller */}
          <div className="flex justify-between items-end mt-auto">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-400 hover:text-[#ff950e] transition-colors max-w-[60%]">
              <span className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-xs sm:text-sm md:text-lg font-bold text-[#ff950e] border-2 border-gray-700 flex-shrink-0">
                {listing.seller.charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs sm:text-sm md:text-base flex items-center gap-1 sm:gap-2 truncate">
                  <span className="truncate">{listing.seller}</span>
                  {isSellerVerified && (
                    <Image
                      src="/verification_badge.png"
                      alt="Verified"
                      width={16}
                      height={16}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0"
                    />
                  )}
                </span>
              </div>
            </div>

            {/* FIXED: Display the calculated price with markup for non-auction listings */}
            {!isAuction && (
              <div className="text-right">
                <p className="font-bold text-[#ff950e] text-base sm:text-xl md:text-2xl">
                  ${displayPrice.toFixed(2)}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium hidden sm:block">
                  Buy Now
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
});
ListingCard.displayName = 'ListingCard';

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

        // OPTIMIZED: Reduce initial fetch limit for faster load
        const response = await listingsService.getListings({
          limit: 50,
          sortBy: 'date',
          sortOrder: 'desc',
        });

        if (response.success && response.data) {
          // Filter eligible listings client-side
          const eligible = response.data.filter((listing: any) => {
            const isActive = !('status' in listing) || listing.status === 'active';
            const hasImage = listing.imageUrls && listing.imageUrls.length > 0;
            const hasSeller = !!listing.seller;

            const isAuction = !!(listing.auction?.isAuction || listing.auction?.startingPrice !== undefined);

            const hasValidPrice = isAuction
              ? Number.isFinite(listing.auction?.startingPrice) && listing.auction?.startingPrice >= 0 ||
                Number.isFinite(listing.auction?.highestBid) && listing.auction?.highestBid > 0
              : Number.isFinite(listing.price) && listing.price > 0;

            const auctionNotEnded =
              !isAuction || (listing.auction && new Date(listing.auction.endTime) > new Date());

            return isActive && hasImage && hasSeller && hasValidPrice && auctionNotEnded;
          });

          // Random selection client-side
          const shuffled = [...eligible].sort(() => Math.random() - 0.5);

          // Smart selection logic for rows
          let selectedCount: number;
          if (shuffled.length <= 4) {
            selectedCount = shuffled.length;
          } else {
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
  }, []);

  // Determine skeleton count
  const skeletonCount = 4;

  // Empty state
  if (!loading && listings.length === 0) {
    return (
      <section aria-labelledby="featured-random-title" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 id="featured-random-title" className="text-2xl md:text-3xl font-bold text-white mb-2">
          Featured Picks
        </h2>
        <p className="text-gray-400 text-sm">{error || 'No listings to feature yet. Check back soon!'}</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-random-title" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h2 id="featured-random-title" className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
            Featured Picks
          </h2>
          <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Discover unique items from our marketplace</p>
        </div>
        <Link
          href="/browse"
          className="text-[#ff950e] hover:text-[#ffb347] text-xs sm:text-sm font-medium transition-colors hover:underline underline-offset-4"
          prefetch={false}
        >
          View all →
        </Link>
      </div>

      {/* Listings Grid - 2 columns on mobile matching browse page gap */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        {loading
          ? // Show skeletons while loading
            Array.from({ length: skeletonCount }).map((_, index) => <ListingSkeleton key={`skeleton-${index}`} />)
          : // Show actual listings
            listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </section>
  );
}
