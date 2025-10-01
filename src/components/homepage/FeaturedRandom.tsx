// src/components/homepage/FeaturedRandom.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Star, Lock, Clock, Gavel, Sparkles } from 'lucide-react';
import { listingsService } from '@/services/listings.service';
import type { Listing } from '@/context/ListingContext';
import { useAuth } from '@/context/AuthContext';

// Loading skeleton component - matching browse page dimensions
const ListingSkeleton = () => (
  <div className="bg-[#131313] rounded-xl border border-white/10 overflow-hidden">
    <div className="aspect-[4/5] sm:aspect-square bg-gray-800/50 animate-pulse" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-800/50 rounded animate-pulse" />
      <div className="h-3 bg-gray-800/30 rounded w-2/3 animate-pulse" />
      <div className="h-6 bg-gray-800/50 rounded w-1/3 animate-pulse" />
    </div>
  </div>
);

const DISCOVERY_LINKS = [
  { label: 'Fresh drops', href: '/browse?sort=date' },
  { label: 'Premium only', href: '/browse?filter=premium' },
  { label: 'Auctions live', href: '/browse?filter=auctions' },
  { label: 'Verified sellers', href: '/browse?filter=verified' },
] as const;

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

          // Determine grid sizing for responsive layout
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
          Featured picks
        </h2>
        <p className="text-gray-400 text-sm">
          {error || 'No listings to feature yet. Check back soon!'}
        </p>
      </section>
    );
  }

  const skeletonCount = 4;

  return (
    <section
      aria-labelledby="featured-random-title"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-30"
    >
      {/* Section Header */}
      <div className="flex flex-col gap-6 mb-8 sm:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#ff950e] font-semibold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Curated marketplace
            </p>
            <h2
              id="featured-random-title"
              className="mt-2 text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight"
            >
              Featured picks updated hourly
            </h2>
            <p className="mt-3 text-gray-400 text-sm sm:text-base max-w-2xl">
              Discover authentic listings that meet our quality bar. We surface a balanced mix of auctions, premium drops and trending storefronts so your feed always feels alive.
            </p>
          </div>
          <Link
            href="/browse"
            className="self-start sm:self-auto text-[#ff950e] hover:text-[#ffb347] text-xs sm:text-sm font-medium transition-colors hover:underline underline-offset-4"
          >
            View full marketplace →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {DISCOVERY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs sm:text-sm text-gray-200 transition-colors hover:border-[#ff950e] hover:text-white"
            >
              <Shield className="h-3.5 w-3.5 text-[#ff950e]" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
        {loading ? (
          Array.from({ length: skeletonCount }).map((_, index) => (
            <ListingSkeleton key={`skeleton-${index}`} />
          ))
        ) : (
          listings.map((listing) => {
            const isSellerVerified = (listing as any).isSellerVerified ?? (listing as any).isVerified ?? false;
            const isPremiumLocked = listing.isLocked === true;
            const isAuction = !!(listing.auction?.isAuction || listing.auction?.startingPrice !== undefined);

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
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#ff950e]/15"
              >
                <Link
                  href={`/browse/${encodeURIComponent(listing.id)}`}
                  className="flex h-full flex-col focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-offset-2 focus:ring-offset-black"
                >
                  {/* Type Badge */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                    {isAuction && (
                      <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                        <Gavel className="h-3.5 w-3.5" /> AUCTION
                      </span>
                    )}

                    {!isAuction && listing.isPremium && (
                      <span className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#ff950e] to-[#ff6b00] px-3 py-1 text-xs font-semibold text-black shadow-lg">
                        <Star className="h-3.5 w-3.5" /> PREMIUM
                      </span>
                    )}
                  </div>

                  <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden bg-black">
                    {listing.imageUrls && listing.imageUrls.length > 0 ? (
                      <Image
                        src={listing.imageUrls[0]}
                        alt={listing.title}
                        width={400}
                        height={500}
                        className={`h-full w-full object-cover transition-transform duration-500 ${
                          isPremiumLocked ? 'blur-md' : 'group-hover:scale-110'
                        }`}
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <span className="text-gray-600 text-sm">No image</span>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    {isPremiumLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                        <Lock className="h-10 w-10 text-[#ff950e]" />
                        <p className="mt-2 text-center text-xs font-semibold text-white px-4">
                          Subscribe to unlock premium media
                        </p>
                      </div>
                    )}

                    {isAuction && listing.auction && (
                      <div className="absolute bottom-4 left-4 z-20">
                        <span className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-black/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                          <Clock className="h-4 w-4 text-purple-300" />
                          {formatTimeRemaining(listing.auction.endTime)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white transition-colors group-hover:text-[#ff950e] line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-gray-400 line-clamp-2">
                        {listing.description}
                      </p>
                    </div>

                    {isAuction && listing.auction && (
                      <div className="mt-4 rounded-xl border border-purple-700/30 bg-gradient-to-r from-purple-900/30 to-purple-800/20 p-3 text-xs text-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 font-medium">
                            {listing.auction?.highestBid ? 'Current bid' : 'Starting at'}
                          </span>
                          <span className="text-sm font-bold text-white">
                            ${(listing.auction?.highestBid || listing.auction?.startingPrice || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-gray-400">
                            <Gavel className="h-3 w-3" />
                            {listing.auction.bids?.length || 0} bids
                          </span>
                          {listing.auction.reservePrice && (
                            <span
                              className={`font-medium ${
                                (!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                            >
                              {(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
                                ? '⚠️ Reserve not met'
                                : '✅ Reserve met'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-700 text-sm font-bold text-[#ff950e]">
                          {listing.seller.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-white truncate">
                            <span className="truncate">{listing.seller}</span>
                            {isSellerVerified && (
                              <Image
                                src="/verification_badge.png"
                                alt="Verified"
                                width={16}
                                height={16}
                                className="h-4 w-4 flex-shrink-0"
                              />
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500">Rated safe by the community</p>
                        </div>
                      </div>

                      {!isAuction && (
                        <div className="text-right">
                          <p className="text-lg sm:text-xl font-bold text-[#ff950e]">
                            ${listing.price.toFixed(2)}
                          </p>
                          {user ? (
                            <p className="text-[11px] text-gray-500">Instant checkout available</p>
                          ) : (
                            <p className="text-[11px] text-gray-500">Login to purchase</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-10 rounded-3xl border border-white/10 bg-[#111]/80 p-6 text-sm text-gray-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Sparkles className="h-4 w-4 text-[#ff950e]" aria-hidden="true" />
            Buyer tip
          </p>
          <span className="text-xs uppercase tracking-[0.25em] text-[#ff950e]">Refreshed every 30 minutes</span>
        </div>
        <p className="mt-3 leading-relaxed">
          Save sellers you like to receive instant notifications when they list something new. Premium subscribers see private drops two hours before they hit the public feed.
        </p>
      </div>
    </section>
  );
}
