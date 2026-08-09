// src/components/homepage/FeaturedRandom.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Star, Lock, Clock, Gavel } from 'lucide-react';
import { listingsService } from '@/services/listings.service';
import type { Listing } from '@/context/ListingContext';
import { useAuth } from '@/context/AuthContext';
import { resolveApiUrl } from '@/utils/url';

// Enhanced loading skeleton component - matching browse page dimensions
const ListingSkeleton = React.memo(() => (
  /* Mirrors the real card exactly — square image, title, two-line
     description slot, price, seller footer — so nothing shifts when the
     data lands. */
  <div className="overflow-hidden rounded-lg border border-line bg-surface-raised">
    <div className="aspect-square animate-pulse bg-surface-overlay" />
    <div className="p-3 sm:p-4">
      <div className="h-4 w-3/4 animate-pulse rounded-sm bg-surface-overlay" />
      <div className="mt-1 min-h-[2.5rem] space-y-1">
        <div className="h-3 w-full animate-pulse rounded-sm bg-surface-overlay" />
        <div className="h-3 w-2/3 animate-pulse rounded-sm bg-surface-overlay" />
      </div>
      <div className="mt-3 h-5 w-1/3 animate-pulse rounded-sm bg-surface-overlay" />
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-overlay" />
        <div className="h-3 w-20 animate-pulse rounded-sm bg-surface-overlay" />
      </div>
    </div>
  </div>
));
ListingSkeleton.displayName = 'ListingSkeleton';

// Optimized ListingCard component with regular img tag (like it was before)
const ListingCard = React.memo(({ listing }: { listing: Listing }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [sellerPicFailed, setSellerPicFailed] = useState(false);

  /* GET /api/listings populates sellerProfile.pic via
     populateSellerProfile(), so the photo is already in the payload —
     this card just never rendered it and always drew the initial.
     resolveApiUrl turns a relative /uploads/... path into an absolute
     one, the same way the browse card does. */
  const resolvedSellerPic = useMemo(
    () => resolveApiUrl((listing as any).sellerProfile?.pic),
    [listing]
  );

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
    /* ---- ONE STRUCTURE FOR EVERY CARD ----
       Previously auctions and standard listings laid out differently:
       auctions put price in a purple box ABOVE the seller, standard
       listings put price on the SAME row as the seller, right-aligned.
       Two cards side by side therefore agreed on nothing and the eye had
       nowhere to settle.

       Fixed order now, both variants:
         image -> title -> description -> price line -> seller row

       The content column is flex with the seller row on `mt-auto`, so it
       pins to the bottom of every card regardless of how long the title
       or description runs. That is what makes a row of cards line up. */
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface-raised transition-colors duration-200 hover:border-primary-line">
      <Link
        href={`/browse/${encodeURIComponent(listing.id)}`}
        className="flex h-full flex-col rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        prefetch={false}
      >
        {/* Type badge */}
        <div className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3">
          {isAuction && (
            <span className="flex items-center rounded-sm bg-auction px-2 py-1 text-[10px] font-bold text-white sm:text-xs">
              <Gavel className="mr-1 h-3 w-3" aria-hidden="true" /> AUCTION
            </span>
          )}

          {!isAuction && listing.isPremium && (
            <span className="flex items-center rounded-sm bg-primary px-2 py-1 text-[10px] font-bold text-black sm:text-xs">
              <Star className="mr-1 h-3 w-3" aria-hidden="true" /> PREMIUM
            </span>
          )}
        </div>

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-black">
          {firstImage ? (
            <>
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 animate-pulse bg-surface-overlay" />
              )}

              {!imageError ? (
                <img
                  src={firstImage}
                  alt={listing.title}
                  className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    isPremiumLocked ? 'blur-md' : ''
                  } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-overlay">
                  <span className="text-xs text-ink-faint">Image unavailable</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-overlay">
              <span className="text-xs text-ink-faint">No image</span>
            </div>
          )}

          {isPremiumLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-sm">
              <Lock className="h-8 w-8 text-primary" aria-hidden="true" />
              <p className="px-4 text-center text-xs font-semibold text-white">
                Subscribe to view premium content
              </p>
            </div>
          )}

          {/* Auction countdown, bottom-left of the image — the one place
              auction cards may differ, because it is time-critical and
              belongs on the photo, not in the text column. */}
          {isAuction && listing.auction && formatTimeRemaining && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="flex items-center rounded-sm bg-black/80 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm sm:text-xs">
                <Clock className="mr-1 h-3 w-3 text-auction" aria-hidden="true" />
                {formatTimeRemaining(listing.auction.endTime)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h3 className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-primary sm:text-base">
            {listing.title}
          </h3>

          {/* Fixed two-line slot: reserving the height means cards with a
              one-line description do not ride up relative to their
              neighbours. */}
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-snug text-ink-muted">
            {listing.description}
          </p>

          {/* Price — same position and shape on both variants. Auctions
              add a label and bid count instead of changing the layout. */}
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary sm:text-xl">
                ${displayPrice.toFixed(2)}
              </span>
              <span className="text-[11px] font-medium text-ink-faint">
                {isAuction
                  ? listing.auction?.highestBid
                    ? 'Current bid'
                    : 'Starting bid'
                  : 'Buy now'}
              </span>
            </div>

            {isAuction && listing.auction && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px]">
                <span className="inline-flex items-center gap-1 text-ink-faint">
                  <Gavel className="h-3 w-3" aria-hidden="true" />
                  {listing.auction.bids?.length || 0}{' '}
                  {(listing.auction.bids?.length || 0) === 1 ? 'bid' : 'bids'}
                </span>
                {listing.auction.reservePrice ? (
                  <span
                    className={
                      !listing.auction.highestBid ||
                      listing.auction.highestBid < listing.auction.reservePrice
                        ? 'font-medium text-warning'
                        : 'font-medium text-success'
                    }
                  >
                    {!listing.auction.highestBid ||
                    listing.auction.highestBid < listing.auction.reservePrice
                      ? 'Reserve not met'
                      : 'Reserve met'}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Seller — pinned to the bottom of every card by mt-auto, with
              a hairline separator so it reads as the card's footer. */}
          <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
            {resolvedSellerPic && !sellerPicFailed ? (
              <img
                src={resolvedSellerPic}
                alt=""
                loading="lazy"
                onError={() => setSellerPicFailed(true)}
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-overlay text-xs font-bold text-primary"
              >
                {listing.seller?.charAt(0)?.toUpperCase()}
              </span>
            )}
            <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-ink-muted">
              <span className="truncate">{listing.seller}</span>
              {isSellerVerified && (
                <Image
                  src="/verification_badge.png"
                  alt="Verified"
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5 shrink-0"
                />
              )}
            </span>
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
        <p className="text-sm text-ink-muted">{error || 'No listings to feature yet. Check back soon!'}</p>
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
          <p className="mt-1 text-sm text-ink-muted sm:mt-2 sm:text-base">Discover unique items from our marketplace</p>
        </div>
        <Link
          href="/browse"
          className="text-xs font-medium text-primary transition-colors hover:text-primary-hover hover:underline underline-offset-4 sm:text-sm"
          prefetch={false}
        >
          View all â†’
        </Link>
      </div>

      {/* Listings Grid - 2 columns on mobile matching browse page gap */}
      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
        {loading
          ? // Show skeletons while loading
            Array.from({ length: skeletonCount }).map((_, index) => <ListingSkeleton key={`skeleton-${index}`} />)
          : // Show actual listings
            listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </section>
  );
}