// src/components/browse-detail/ImageGallery.tsx
'use client';

import { Crown, Clock, Lock, Gavel, Eye, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageGalleryProps } from '@/types/browseDetail';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSpring } from 'framer-motion';

function useAnimatedCount(value: number) {
  const sanitizedValue = Number.isFinite(value) ? value : 0;
  const spring = useSpring(sanitizedValue, {
    stiffness: 120,
    damping: 18,
    mass: 0.6
  });
  const [displayValue, setDisplayValue] = useState(() => Math.max(0, Math.round(sanitizedValue)));

  useEffect(() => {
    spring.set(Math.max(0, sanitizedValue));
  }, [spring, sanitizedValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', latest => {
      setDisplayValue(Math.max(0, Math.round(latest)));
    });

    return () => unsubscribe();
  }, [spring]);

  return useMemo(() => displayValue, [displayValue]);
}

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
  const animatedViewCount = useAnimatedCount(viewCount ?? 0);
  const formattedViewCount = useMemo(() => animatedViewCount.toLocaleString(), [animatedViewCount]);
  const [showViewPulse, setShowViewPulse] = useState(false);

  useEffect(() => {
    setShowViewPulse(true);
    const timeout = setTimeout(() => setShowViewPulse(false), 550);
    return () => clearTimeout(timeout);
  }, [animatedViewCount]);

  const viewBadgeClassName = useMemo(
    () =>
      `absolute top-3 right-3 px-2 py-1 rounded-full text-xs flex items-center gap-1 border transition-all duration-300 ${
        showViewPulse
          ? 'bg-black/80 text-[#ffb347] border-[#ff950e]/60 shadow-[0_0_14px_rgba(255,149,14,0.35)]'
          : 'bg-black/70 text-white border-transparent'
      }`,
    [showViewPulse]
  );

  const handlePrevImage = useCallback(() => {
    if (!images.length) return;
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const handleNextImage = useCallback(() => {
    if (!images.length) return;
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const handleMainImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.src.includes('placeholder-panty.png')) {
      target.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="16"%3EImage Not Available%3C/text%3E%3C/svg%3E';
    } else {
      target.src = '/placeholder-panty.png';
    }
    target.onerror = null;
    // eslint-disable-next-line no-console
    console.warn('Image failed to load:', images[currentIndex]);
  };

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement>, originalUrl: string) => {
    const target = e.currentTarget;
    if (target.src.includes('placeholder-panty.png')) {
      target.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
    } else {
      target.src = '/placeholder-panty.png';
    }
    target.onerror = null;
    // eslint-disable-next-line no-console
    console.warn('Thumbnail failed to load:', originalUrl);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative group">
        <div className="relative w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden bg-gray-900 shadow-xl">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentIndex]}
                alt={`${listing.title} - Image ${currentIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-300"
                onError={handleMainImageError}
              />

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No Image Available</p>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isAuctionListing && (
              <span className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center">
                <Gavel className="w-3 h-3 mr-1.5" />
                {isAuctionEnded ? 'Ended' : 'Live Auction'}
              </span>
            )}
            {listing.isPremium && (
              <span className="bg-yellow-600 text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center">
                <Crown className="w-3 h-3 mr-1.5" />
                Premium
              </span>
            )}
          </div>

          {/* View count */}
          <div className={viewBadgeClassName}>
            <Eye className="w-3 h-3" />
            {formattedViewCount}
          </div>

          {/* Premium lock */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
              <Lock className="w-12 h-12 text-[#ff950e] mb-4" />
              <p className="text-sm font-bold text-white text-center px-4">Subscribe to view premium content</p>
            </div>
          )}

          {/* Timer */}
          {isAuctionListing && listing.auction && (
            <div className="absolute bottom-4 left-4 z-10" key={`timer-${listing.id}-${forceUpdateTimer}`}>
              <span className="bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center shadow-lg border border-purple-500/30">
                <Clock className="w-4 h-4 mr-2 text-purple-400" />
                {formatTimeRemaining(listing.auction.endTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <button
              type="button"
              key={index}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                index === currentIndex ? 'border-[#ff950e]' : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onIndexChange(index)}
              aria-label={`View image ${index + 1}`}
            >
              <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" onError={(e) => handleThumbnailError(e, url)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
