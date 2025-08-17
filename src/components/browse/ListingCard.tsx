'use client';

import Link from 'next/link';
import {
  Crown, Clock, Lock, CheckCircle, Gavel, ArrowUp, Eye, Package, Heart
} from 'lucide-react';
import { ListingCardProps } from '@/types/browse';
import { isAuctionListing } from '@/utils/browseUtils';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';

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
  formatTimeRemaining
}: ListingCardProps) {
  const isLockedPremium = listing.isPremium && (!user?.username || !isSubscribed);
  const hasAuction = isAuctionListing(listing);

  // Favorites functionality
  const { isFavorited, toggleFavorite } = useFavorites();
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  // Generate consistent seller ID
  const sellerId = `seller_${listing.seller}`;
  const isFav = user?.role === 'buyer' ? isFavorited(sellerId) : false;

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
      isVerified: listing.isSellerVerified || false,
    });

    if (success) {
      showSuccessToast(isFav ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  return (
    <div
      className={`relative flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#111] border ${
        hasAuction ? 'border-purple-800' : 'border-gray-800'
      } rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
        hasAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]'
      } cursor-pointer group hover:transform hover:scale-[1.02]`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Type Badge and Favorite Button */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Favorite Button for Buyers */}
        {user?.role === 'buyer' && !isLockedPremium && (
          <button
            onClick={handleFavoriteClick}
            className="p-2 bg-black/70 backdrop-blur-sm rounded-lg hover:bg-black/90 transition-all group/fav"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={16}
              className={`transition-all group-hover/fav:scale-110 ${
                isFav ? 'fill-[#ff950e] text-[#ff950e]' : 'text-white hover:text-[#ff950e]'
              }`}
            />
          </button>
        )}

        {/* Type Badges */}
        {hasAuction && (
          <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center shadow-lg">
            <Gavel className="w-3.5 h-3.5 mr-1.5" /> AUCTION
          </span>
        )}

        {!hasAuction && listing.isPremium && (
          <span className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-xs px-3 py-1.5 rounded-lg font-bold flex items-center shadow-lg">
            <Crown className="w-3.5 h-3.5 mr-1.5" /> PREMIUM
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-black">
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <img
            src={listing.imageUrls[0]}
            alt={listing.title}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
              isLockedPremium ? 'blur-md' : ''
            }`}
            onError={(e) => {
              const target = e.currentTarget;
              target.src = '/placeholder-panty.png';
              target.onerror = null;
              console.warn('Image failed to load:', listing.imageUrls?.[0]);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No Image Available</p>
            </div>
          </div>
        )}

        {/* Enhanced bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {isLockedPremium && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
            <Lock className="w-12 h-12 text-[#ff950e] mb-4" />
            <p className="text-sm font-bold text-white text-center px-4">
              Subscribe to view premium content
            </p>
          </div>
        )}

        {/* Enhanced auction timer */}
        {hasAuction && listing.auction && (
          <div className="absolute bottom-4 left-4 z-10" key={`timer-${listing.id}-${forceUpdateTimer}`}>
            <span className="bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center shadow-lg border border-purple-500/30">
              <Clock className="w-4 h-4 mr-2 text-purple-400" />
              {formatTimeRemaining(listing.auction.endTime)}
            </span>
          </div>
        )}

        {/* Enhanced quick view button */}
        {isHovered && !isLockedPremium && (
          <div className="absolute bottom-4 right-4 z-10">
            <button
              className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xl hover:from-[#e88800] hover:to-[#ff950e] transition-all transform hover:scale-105"
              onClick={onQuickView}
              aria-label="Quick view"
            >
              <Eye className="w-4 h-4" /> Quick View
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-[#ff950e] transition-colors">
            {listing.title}
          </h2>
          <p className="text-sm text-gray-400 mb-3 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {listing.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="bg-black/50 text-[#ff950e] text-xs px-3 py-1 rounded-full font-medium border border-[#ff950e]/20">
                #{tag}
              </span>
            ))}
            {listing.tags.length > 3 && (
              <span className="text-gray-500 text-xs px-2 py-1">
                +{listing.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Auction info */}
        {hasAuction && listing.auction && (
          <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 rounded-xl p-4 mb-4 border border-purple-700/30 backdrop-blur-sm">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-purple-300 font-medium">{displayPrice.label}</span>
              <span className="font-bold text-white flex items-center text-lg">
                {listing.auction.bids && listing.auction.bids.length > 0 && (
                  <ArrowUp className="w-4 h-4 text-green-400 mr-1" />
                )}
                ${displayPrice.price}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Gavel className="w-3 h-3" />
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
                    : '✅ Reserve met'
                  }
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price & seller */}
        <div className="flex justify-between items-end mt-auto">
          <Link
            href={`/sellers/${listing.seller}`}
            className="flex items-center gap-3 text-base text-gray-400 hover:text-[#ff950e] transition-colors group/seller"
            onClick={e => e.stopPropagation()}
          >
            {listing.sellerProfile?.pic ? (
              <img
                src={listing.sellerProfile.pic}
                alt={listing.seller}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = '/default-avatar.png';
                  target.onerror = null;
                }}
              />
            ) : (
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-8 00 to-gray-700 flex items-center justify-center text-lg font-bold text-[#ff950e] border-2 border-gray-700 group-hover/seller:border-[#ff950e] transition-colors">
                {listing.seller.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-base flex items-center gap-2">
                {listing.seller}
                {listing.isSellerVerified && (
                  <img
                    src="/verification_badge.png"
                    alt="Verified"
                    className="w-5 h-5"
                  />
                )}
              </span>
              {(listing.sellerSalesCount ?? 0) > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {listing.sellerSalesCount} completed sales
                </span>
              )}
            </div>
          </Link>

          {!hasAuction && (
            <div className="text-right">
              <p className="font-bold text-[#ff950e] text-2xl">
                ${displayPrice.price}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                {displayPrice.label}
              </p>
            </div>
          )}
        </div>

        {/* Locked premium CTA */}
        {user?.role === 'buyer' && isLockedPremium && (
          <Link
            href={`/sellers/${listing.seller}`}
            className="mt-4 w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-3 rounded-xl hover:from-gray-600 hover:to-gray-500 font-bold transition-all text-sm text-center flex items-center justify-center gap-2 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <Lock className="w-4 h-4" /> Subscribe to Unlock
          </Link>
        )}
      </div>
    </div>
  );
}
