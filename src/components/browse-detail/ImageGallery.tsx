// src/components/browse-detail/ImageGallery.tsx
'use client';

import { Crown, Clock, Lock, Gavel, Eye, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageGalleryProps } from '@/types/browseDetail';
import { useCallback } from 'react';
import AnimatedViewCounter from './AnimatedViewCounter';

export default function ImageGallery({
  images,
  currentIndex,
  onIndexChange,
  listing,
  isLockedPremium,
  viewCount,
  isAuctionListing,
  isAuctionEnded,
  formatTimeRemaining,
  forceUpdateTimer
}: ImageGalleryProps) {
  const isLocked = isLockedPremium ?? false;

  const handlePrevImage = useCallback(() => {
    if (!images.length) return;
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const handleNextImage = useCallback(() => {
    if (!images.length) return;
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  /* Shared fallback for both main image and thumbnails. Previously two
     near-identical handlers with inline SVG data URLs. */
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.src = '/placeholder-panty.png';
    target.onerror = null;
  };

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-black lg:aspect-[4/3]">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentIndex]}
              alt={`${listing.title} — image ${currentIndex + 1} of ${images.length}`}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-all hover:bg-black/80 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-all hover:bg-black/80 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center bg-surface-overlay">
            <div className="text-center text-ink-faint">
              <Package className="mx-auto mb-2 h-10 w-10" />
              <p className="text-sm">No image available</p>
            </div>
          </div>
        )}

        {/* Badges — tinted pills, consistent with the browse grid. */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isAuctionListing && (
            <span className="pill pill-auction backdrop-blur">
              <Gavel className="h-3 w-3" />
              {isAuctionEnded ? 'Ended' : 'Live auction'}
            </span>
          )}
          {listing.isPremium && (
            <span className="pill pill-primary backdrop-blur">
              <Crown className="h-3 w-3" /> Premium
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur">
          <Eye className="h-3 w-3" />
          <AnimatedViewCounter value={viewCount} />
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 backdrop-blur-sm">
            <Lock className="h-8 w-8 text-primary" />
            <p className="px-6 text-center text-sm font-medium text-white">
              Subscribe to view premium content
            </p>
          </div>
        )}

        {isAuctionListing && listing.auction && (
          <div
            className="absolute bottom-3 left-3"
            key={`timer-${listing.id}-${forceUpdateTimer}`}
          >
            <span className="inline-flex items-center gap-1.5 rounded-md bg-black/75 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur">
              <Clock className="h-3.5 w-3.5 text-auction" />
              {formatTimeRemaining(listing.auction.endTime)}
            </span>
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {images.map((url, index) => (
            <button
              type="button"
              key={index}
              onClick={() => onIndexChange(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md transition-all ${
                index === currentIndex
                  ? 'ring-2 ring-primary'
                  : 'opacity-60 ring-1 ring-line hover:opacity-100'
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={index === currentIndex}
            >
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
