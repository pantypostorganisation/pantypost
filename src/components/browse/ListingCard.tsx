// src/components/browse/ListingCard.tsx
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
  Crown, Clock, Lock, Gavel, ArrowUp, Eye, Package, Heart,
  ChevronLeft, ChevronRight, BadgeCheck
} from 'lucide-react';
import { ListingCardProps } from '@/types/browse';
import { isAuctionListing } from '@/utils/browseUtils';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { resolveApiUrl } from '@/utils/url';

interface ExtendedListingCardProps extends ListingCardProps {
  isGuest?: boolean;
}

export default function ListingCard({
  listing,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onQuickView,
  user,
  isSubscribed,
  displayPrice,
  forceUpdateTimer,
  formatTimeRemaining,
  isGuest = false
}: ExtendedListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const isLockedPremium = listing.isLocked === true;
  const hasAuction = isAuctionListing(listing);
  const hasMultipleImages = !!listing.imageUrls && listing.imageUrls.length > 1;

  const { isFavorited, toggleFavorite } = useFavorites();
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const sellerId = `seller_${listing.seller}`;
  const isFav = user?.role === 'buyer' ? isFavorited(sellerId) : false;
  const resolvedSellerPic = resolveApiUrl(listing.sellerProfile?.pic);
  const isSellerVerified = (listing.isSellerVerified ?? listing.isVerified) || false;

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [listing.id]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (user?.role !== 'buyer') {
      showErrorToast('Only buyers can add favorites');
      return;
    }

    const success = await toggleFavorite({
      id: sellerId,
      username: listing.seller,
      profilePicture: listing.sellerProfile?.pic || undefined,
      tier: undefined,
      isVerified: isSellerVerified,
    });

    if (success) {
      showSuccessToast(isFav ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev === 0 ? listing.imageUrls.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev === listing.imageUrls.length - 1 ? 0 : prev + 1));
  };

  const handleCardClick = () => {
    if (!isGuest) onClick();
  };

  /* Seller identity block. Rendered once and reused for both the linked
     (member) and unlinked (guest) variants, rather than duplicating the
     whole markup as before. */
  const sellerBlock = (
    <>
      {resolvedSellerPic ? (
        <img
          src={resolvedSellerPic}
          alt={listing.seller}
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
          onError={(e) => {
            const target = e.currentTarget;
            target.src = '/default-avatar.png';
            target.onerror = null;
          }}
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-primary ring-1 ring-white/10">
          {listing.seller.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="flex min-w-0 items-center gap-1">
        <span className="truncate text-sm font-medium text-ink">{listing.seller}</span>
        {isSellerVerified && (
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified seller" />
        )}
      </span>
    </>
  );

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface-raised transition-all duration-200 ${
        isGuest ? '' : 'cursor-pointer'
      } hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleCardClick}
    >
      {/* --- Badges and favourite ---
          Tinted pills rather than solid gradient fills. The colour still
          reads clearly but no longer competes with the product image. */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5">
        {hasAuction && (
          <span className="pill pill-auction">
            <Gavel className="h-3 w-3" /> Auction
          </span>
        )}
        {!hasAuction && listing.isPremium && (
          <span className="pill pill-primary">
            <Crown className="h-3 w-3" /> Premium
          </span>
        )}
        {/* Authentic scarcity. Worn garments are inherently unique, so
            this is true by definition rather than a manufactured
            urgency device — which is what keeps it credible. */}
        {!hasAuction && !listing.isPremium && !isGuest && (
          <span className="pill border-white/15 bg-black/60 text-white/80 backdrop-blur">
            One of one
          </span>
        )}
      </div>

      {user?.role === 'buyer' && !isLockedPremium && !isGuest && (
        <button
          onClick={handleFavoriteClick}
          className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full bg-black/60 backdrop-blur transition-colors hover:bg-black/80"
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFav ? 'fill-primary text-primary' : 'text-white'
            }`}
          />
        </button>
      )}

      {/* --- Image --- */}
      {/* Pure black behind product photography — the one place it is
          justified, because it makes images pop. Everywhere else uses
          the layered near-black scale. */}
      <div ref={imageContainerRef} className="relative aspect-[4/5] overflow-hidden bg-surface-photo">
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <>
            <img
              src={listing.imageUrls[currentImageIndex]}
              alt={listing.title}
              /* Single hover effect. Previously the image scaled 1.10
                 while the card scaled 1.02 — two simultaneous zooms. */
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                isGuest ? 'blur-[10px] scale-105' : isLockedPremium ? 'blur-xl scale-105' : ''
              }`}
              onError={(e) => {
                const target = e.currentTarget;
                target.src = '/placeholder-panty.png';
                target.onerror = null;
              }}
            />

            {hasMultipleImages && isHovered && !isLockedPremium && !isGuest && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition-colors hover:bg-black/80"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {hasMultipleImages && (
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1">
                {listing.imageUrls.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentImageIndex ? 'w-4 bg-white' : 'w-1 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center bg-surface-overlay">
            <div className="text-center text-ink-faint">
              <Package className="mx-auto mb-2 h-8 w-8" />
              <p className="text-xs">No image</p>
            </div>
          </div>
        )}

        {/* Guest and premium locks */}
        {isGuest && !isLockedPremium && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            <Lock className="h-5 w-5 text-white/90" />
            <p className="text-xs font-medium text-white/90">Sign in to view</p>
          </div>
        )}

        {isLockedPremium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-sm">
            <Lock className="h-7 w-7 text-primary" />
            <p className="px-4 text-center text-xs font-medium text-white">
              Subscribe to view
            </p>
          </div>
        )}

        {/* Auction countdown */}
        {hasAuction && listing.auction && (
          <div
            className="absolute bottom-3 left-3 z-20"
            key={`timer-${listing.id}-${forceUpdateTimer}`}
          >
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/75 px-2 py-1 text-xs font-medium text-white backdrop-blur">
              <Clock className="h-3 w-3 text-auction" />
              {formatTimeRemaining(listing.auction.endTime)}
            </span>
          </div>
        )}

        {isHovered && !isLockedPremium && !isGuest && (
          <div className="absolute bottom-3 right-3 z-20 hidden sm:block">
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-white/90"
              onClick={onQuickView}
              aria-label="Quick view"
            >
              <Eye className="h-3.5 w-3.5" /> Quick view
            </button>
          </div>
        )}
      </div>

      {/* --- Body --- */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {!isGuest ? (
          <div className="space-y-1">
            <h3 className="font-display line-clamp-1 text-base text-ink transition-colors group-hover:text-primary">
              {listing.title}
            </h3>
            <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">
              {listing.description}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-surface-overlay" />
            <div className="h-3 w-full rounded bg-surface-overlay/60" />
          </div>
        )}

        {listing.tags && listing.tags.length > 0 && !isGuest && (
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {listing.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded bg-surface-overlay px-2 py-0.5 text-[11px] text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Auction detail */}
        {hasAuction && listing.auction && !isGuest && (
          <div className="rounded-md border border-line bg-surface-overlay/50 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wide text-ink-faint">
                {displayPrice.label}
              </span>
              <span className="flex items-center gap-1 text-base font-semibold text-ink">
                {listing.auction.bids && listing.auction.bids.length > 0 && (
                  <ArrowUp className="h-3.5 w-3.5 text-success" />
                )}
                ${displayPrice.price}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-ink-faint">
                {listing.auction.bids?.length || 0} bids
              </span>
              {listing.auction.reservePrice && (
                <span
                  className={
                    !listing.auction.highestBid ||
                    listing.auction.highestBid < listing.auction.reservePrice
                      ? 'text-warning'
                      : 'text-success'
                  }
                >
                  {!listing.auction.highestBid ||
                  listing.auction.highestBid < listing.auction.reservePrice
                    ? 'Reserve not met'
                    : 'Reserve met'}
                </span>
              )}
            </div>
          </div>
        )}

        {hasAuction && listing.auction && isGuest && (
          <div className="rounded-md border border-line bg-surface-overlay/50 p-3 text-center">
            <span className="text-xs text-ink-faint">Log in to view auction details</span>
          </div>
        )}

        {/* Seller and price */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
          {!isGuest ? (
            <Link
              href={`/sellers/${listing.seller}`}
              className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
              onClick={(e) => e.stopPropagation()}
            >
              {sellerBlock}
            </Link>
          ) : (
            <div className="flex min-w-0 items-center gap-2">{sellerBlock}</div>
          )}

          {!hasAuction && !isGuest && (
            <div className="shrink-0 text-right">
              {/* Prestige pricing: clean numerals, display face, no
                  decimal noise. Charm pricing signals "deal"; whole
                  numbers signal "desirable". */}
              <p className="font-display text-xl leading-none text-ink">
                ${String(displayPrice.price).replace(/\.00$/, '')}
              </p>
            </div>
          )}

          {!hasAuction && isGuest && (
            <span className="shrink-0 text-xs text-ink-faint">Log in to view</span>
          )}
        </div>

        {user?.role === 'buyer' && isLockedPremium && !isGuest && (
          <Link
            href={`/sellers/${listing.seller}`}
            className="flex items-center justify-center gap-2 rounded-md border border-line bg-surface-overlay px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <Lock className="h-3.5 w-3.5" /> Subscribe to unlock
          </Link>
        )}
      </div>
    </article>
  );
}
