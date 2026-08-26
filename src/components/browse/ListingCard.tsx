// src/components/browse/ListingCard.tsx
'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import {
  Crown, Clock, Lock, Gavel, Eye, Package, Heart,
  ChevronLeft, ChevronRight, BadgeCheck, Star, Trash2, X,
  Layers
} from 'lucide-react';
import { ListingCardProps } from '@/types/browse';
import { isAuctionListing } from '@/utils/browseUtils';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { resolveApiUrl } from '@/utils/url';
import { listingsService, type DropInfo } from '@/services/listings.service';

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
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  // profilePic URLs can point at files that no longer exist (the DB row
  // outlives the upload), so a failed avatar drops to the seller's
  // initial rather than chaining to another image that can also 404.
  const [sellerPicFailed, setSellerPicFailed] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const isLockedPremium = listing.isLocked === true;
  const hasAuction = isAuctionListing(listing);
  const drop = (listing as { drop?: DropInfo }).drop;
  const isDrop = Boolean(drop?.isDrop);
  const dropSoldOut = Boolean(isDrop && ((drop?.unitsRemaining ?? 0) <= 0 || (listing as { status?: string }).status === 'sold'));
  const hasMultipleImages = !!listing.imageUrls && listing.imageUrls.length > 1;

  const { isFavorited, toggleFavorite } = useFavorites();
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const sellerId = `seller_${listing.seller}`;
  const isFav = user?.role === 'buyer' ? isFavorited(sellerId) : false;
  const resolvedSellerPic = resolveApiUrl(listing.sellerProfile?.pic);
  const isSellerVerified = (listing.isSellerVerified ?? listing.isVerified) || false;

  /* Seller rating, if the API supplies it.
     Renders only when present, so the card degrades cleanly rather than
     showing an empty or zeroed star row. */
  const sellerRating = (listing.sellerProfile as any)?.rating as number | undefined;
  const sellerReviewCount = (listing.sellerProfile as any)?.reviewCount as number | undefined;
  const hasRating = typeof sellerRating === 'number' && sellerRating > 0;

  useEffect(() => {
    setCurrentImageIndex(0);
    // Cards are recycled across pagination; a failure flag from the
    // previous seller must not hide the next seller's picture.
    setSellerPicFailed(false);
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

  /* Admin removal. The backend soft-deletes (status = 'deleted'), so a
     listing removed after a complaint remains evidenceable and an
     accidental removal is recoverable. listingsService dispatches
     'listingDeleted', which useBrowseListings already refreshes on. */
  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirmingRemove) {
      setConfirmingRemove(true);
      return;
    }

    setRemoving(true);
    const response = await listingsService.deleteListing(listing.id);

    if (response.success) {
      showSuccessToast('Listing removed from the marketplace');
    } else {
      showErrorToast('Could not remove listing');
      setRemoving(false);
      setConfirmingRemove(false);
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

  return (
    /* Marketplace-grid card, in the Etsy idiom: the image does the
       selling, and everything beneath it is compact scannable metadata.
       No card border or background -- the photo defines the tile, which
       keeps a dense grid from looking like a wall of boxes. */
    <article
      className={`group flex flex-col ${isGuest ? '' : 'cursor-pointer'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleCardClick}
    >
      {/* --- Image --- */}
      <div
        ref={imageContainerRef}
        className="relative aspect-square overflow-hidden rounded-lg bg-black"
      >
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <>
            <img
              src={listing.imageUrls[currentImageIndex]}
              alt={listing.title}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
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
                  className="absolute left-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-md transition hover:bg-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-md transition hover:bg-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center bg-[#1a1a1a]">
            <Package className="h-8 w-8 text-gray-700" />
          </div>
        )}

        {/* Status chips, top-left. Only ever one at a time. */}
        <div className="absolute left-2 top-2 z-20">
          {hasAuction ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-purple-500/90 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
              <Gavel className="h-3 w-3" /> Auction
            </span>
          ) : isDrop ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-[#ff950e] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-black">
              <Layers className="h-3 w-3" /> Drop
            </span>
          ) : listing.isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-[#ff950e] px-2 py-1 text-[11px] font-semibold text-black">
              <Crown className="h-3 w-3" /> Premium
            </span>
          ) : null}
        </div>

        {/* Favourite */}
        {user?.role === 'buyer' && !isLockedPremium && !isGuest && (
          <button
            onClick={handleFavoriteClick}
            className="absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-md transition hover:bg-white"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFav ? 'fill-[#ff950e] text-[#ff950e]' : 'text-gray-700'
              }`}
            />
          </button>
        )}

        {/* Admin removal. Two-step, so a stray tap cannot delete. */}
        {user?.role === 'admin' && !isGuest && (
          <div className="absolute right-2 top-2 z-30 flex items-center gap-1.5">
            {confirmingRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setConfirmingRemove(false);
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-black shadow-md transition hover:bg-white"
                aria-label="Cancel removal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleRemove}
              disabled={removing}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 shadow-md transition disabled:opacity-60 ${
                confirmingRemove
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-white/90 text-gray-700 hover:bg-red-600 hover:text-white'
              }`}
              aria-label={confirmingRemove ? 'Confirm removal' : 'Remove listing'}
            >
              <Trash2 className="h-4 w-4" />
              {confirmingRemove && (
                <span className="text-xs font-semibold">
                  {removing ? 'Removing...' : 'Confirm'}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Guest and premium locks */}
        {isGuest && !isLockedPremium && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            <Lock className="h-5 w-5 text-white/90" />
            <p className="text-xs font-medium text-white/90">Sign in to view</p>
          </div>
        )}

        {isLockedPremium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-sm">
            <Lock className="h-6 w-6 text-[#ff950e]" />
            <p className="px-4 text-center text-xs font-medium text-white">Subscribe to view</p>
          </div>
        )}

        {/* Drop inventory -- mirrors the auction countdown's slot */}
        {isDrop && drop && (
          <div className="absolute bottom-2 left-2 z-20">
            <span
              className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold backdrop-blur ${
                dropSoldOut ? 'bg-black/80 text-gray-300' : 'bg-black/80 text-white'
              }`}
            >
              <Layers className="h-3 w-3 text-[#ff950e]" />
              {dropSoldOut
                ? 'Sold out'
                : `${drop.unitsRemaining} of ${drop.totalUnits} left`}
            </span>
          </div>
        )}

        {/* Auction countdown */}
        {hasAuction && listing.auction && (
          <div
            className="absolute bottom-2 left-2 z-20"
            key={`timer-${listing.id}-${forceUpdateTimer}`}
          >
            <span className="inline-flex items-center gap-1 rounded-sm bg-black/80 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
              <Clock className="h-3 w-3 text-purple-300" />
              {formatTimeRemaining(listing.auction.endTime)}
            </span>
          </div>
        )}

        {isHovered && !isLockedPremium && !isGuest && (
          <button
            className="absolute bottom-2 right-2 z-20 hidden items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-md transition hover:bg-white/90 sm:inline-flex"
            onClick={onQuickView}
            aria-label="Quick view"
          >
            <Eye className="h-3.5 w-3.5" /> Quick view
          </button>
        )}
      </div>

      {/* --- Metadata ---
          Etsy ordering: title, then rating, then seller, then price.
          Rating sits above the seller name because social proof is what
          buyers scan for first. */}
      <div className="flex flex-1 flex-col gap-1 pt-2.5">
        {!isGuest ? (
          <h3 className="line-clamp-2 text-sm leading-snug text-gray-200 transition-colors group-hover:underline">
            {listing.title}
          </h3>
        ) : (
          <div className="space-y-1.5 py-1">
            <div className="h-3 w-3/4 rounded bg-[#1f1f1f]" />
            <div className="h-3 w-1/2 rounded bg-[#1a1a1a]" />
          </div>
        )}

        {!isGuest && (
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
            {hasRating && (
              <span className="inline-flex items-center gap-0.5">
                <span className="font-medium text-gray-300">{sellerRating!.toFixed(1)}</span>
                <Star className="h-3 w-3 fill-[#ff950e] text-[#ff950e]" />
                {typeof sellerReviewCount === 'number' && sellerReviewCount > 0 && (
                  <span className="text-gray-500">({sellerReviewCount})</span>
                )}
              </span>
            )}

            {/* Seller name links straight to the profile, as on Etsy.
                stopPropagation so it does not also open the listing. */}
            <Link
              href={`/sellers/${listing.seller}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-gray-500 transition-colors hover:text-gray-300 hover:underline"
            >
              {hasRating && <span className="text-gray-700">{'\u00B7'}</span>}
              {resolvedSellerPic && !sellerPicFailed ? (
                <img
                  src={resolvedSellerPic}
                  alt=""
                  loading="lazy"
                  onError={() => setSellerPicFailed(true)}
                  className="h-4 w-4 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-surface-overlay text-[9px] font-semibold text-ink-muted"
                >
                  {listing.seller?.charAt(0)?.toUpperCase()}
                </span>
              )}
              <span className="truncate">{listing.seller}</span>
              {isSellerVerified && (
                <BadgeCheck className="h-3 w-3 shrink-0 text-[#ff950e]" aria-label="Verified" />
              )}
            </Link>
          </div>
        )}

        {!isGuest ? (
          <p className="mt-0.5 text-base font-semibold text-white">
            ${String(displayPrice.price).replace(/\.00$/, '')}
            {hasAuction && (
              <span className="ml-1.5 text-xs font-normal text-gray-500">
                {displayPrice.label}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-gray-600">Sign in to view price</p>
        )}

        {hasAuction && listing.auction && !isGuest && (
          <p className="text-xs text-gray-500">
            {listing.auction.bids?.length || 0}{' '}
            {(listing.auction.bids?.length || 0) === 1 ? 'bid' : 'bids'}
          </p>
        )}
      </div>
    </article>
  );
}

