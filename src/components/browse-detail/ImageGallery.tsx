// src/components/browse-detail/ImageGallery.tsx
'use client';

import { Crown, Clock, Lock, Gavel, Eye, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageGalleryProps } from '@/types/browseDetail';

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
  const handlePrevImage = () => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    onIndexChange((currentIndex + 1) % images.length);
  };

  const isLocked = isLockedPremium ?? false;

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative group">
        <div className="relative w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden bg-gray-900 shadow-xl">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentIndex]}
                alt={`${listing.title} - Image ${currentIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-300"
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              
              {/* Image Counter */}
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
          
          {/* Type Badges */}
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
          
          {/* View Count */}
          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {viewCount}
          </div>

          {/* Premium Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
              <Lock className="w-12 h-12 text-[#ff950e] mb-4" />
              <p className="text-sm font-bold text-white text-center px-4">
                Subscribe to view premium content
              </p>
            </div>
          )}
          
          {/* Auction Timer */}
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
      
      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((url, index) => (
            <div
              key={index}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                index === currentIndex 
                  ? 'border-[#ff950e]' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onIndexChange(index)}
            >
              <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}