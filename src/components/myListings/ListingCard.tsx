'use client';

import { Eye, Edit, Trash2, Gavel, Crown, Clock, Calendar, X } from 'lucide-react';
import { ListingCardProps } from '@/types/myListings';
import { timeSinceListed, formatTimeRemaining, formatPrice } from '@/utils/myListingsUtils';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';

export default function ListingCard({
  listing,
  analytics,
  onEdit,
  onDelete,
  onCancelAuction,
}: ListingCardProps) {
  const isAuctionListing = !!listing.auction;

  // Safe, consistent currency formatting
  const currentBidValue =
    typeof listing.auction?.highestBid === 'number' && !Number.isNaN(listing.auction?.highestBid)
      ? (listing.auction!.highestBid as number)
      : (listing.auction?.startingPrice as number | undefined);

  const currentBidText = isAuctionListing && listing.auction ? formatPrice(currentBidValue ?? listing.auction.startingPrice) : '';

  const primaryPriceText = isAuctionListing && listing.auction
    ? `${formatPrice(listing.auction.startingPrice)} start`
    : formatPrice(listing.price);

  return (
    <div
      className={`border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition relative flex flex-col h-full ${
        isAuctionListing
          ? 'border-purple-700 bg-black'
          : listing.isPremium
          ? 'border-[#ff950e] bg-black'
          : 'border-gray-700 bg-black'
      }`}
    >
      {isAuctionListing && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
            <Gavel className="w-4 h-4 mr-1" /> Auction
          </span>
        </div>
      )}

      {!isAuctionListing && listing.isPremium && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
            <Crown className="w-4 h-4 mr-1" /> Premium
          </span>
        </div>
      )}

      <div className="relative w-full h-48 sm:h-56 overflow-hidden">
        {listing.imageUrls && listing.imageUrls.length > 0 && (
          <SecureImage
            src={listing.imageUrls[0]}
            alt={sanitizeStrict(listing.title)}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-white mb-2">{sanitizeStrict(listing.title)}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-grow">
          {sanitizeStrict(listing.description || '')}
        </p>

        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto mb-3">
            {listing.tags.map((tag, idx) => (
              <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                {sanitizeStrict(String(tag))}
              </span>
            ))}
          </div>
        )}

        {/* Auction info */}
        {isAuctionListing && listing.auction && (
          <div className="bg-purple-900 bg-opacity-20 rounded-lg p-3 mb-3 border border-purple-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-purple-300 flex items-center gap-1">
                <Gavel className="w-3 h-3" /> Current Bid:
              </span>
              <span className="font-bold text-white">{currentBidText}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-300 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Ends:
              </span>
              <span className="text-sm text-white">{formatTimeRemaining(listing.auction.endTime)}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {listing.auction.bids?.length || 0}{' '}
              {listing.auction.bids?.length === 1 ? 'bid' : 'bids'} placed
            </div>
          </div>
        )}

        {/* Analytics */}
        <div className="flex items-center justify-between text-sm text-gray-400 bg-gray-800 rounded-lg p-3 mt-auto">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-[#ff950e]" /> {analytics.views} views
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-500" /> {timeSinceListed(listing.date)}
          </span>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
          <p className={`font-bold text-xl ${isAuctionListing ? 'text-purple-400' : 'text-[#ff950e]'}`}>
            {primaryPriceText}
          </p>
          <div className="flex gap-2">
            {/* Cancel auction button */}
            {isAuctionListing && listing.auction?.status === 'active' && (
              <button
                onClick={() => onCancelAuction(listing.id)}
                className="text-red-400 p-2 rounded-full hover:bg-gray-800 transition"
                aria-label="Cancel auction"
                title="Cancel auction"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {/* Edit Button - only for standard listings or ended auctions */}
            {(!isAuctionListing || (listing.auction && listing.auction.status !== 'active')) && (
              <button
                onClick={() => onEdit(listing)}
                className="text-blue-400 p-2 rounded-full hover:bg-gray-800 transition"
                aria-label="Edit listing"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {/* Delete Button */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this listing?')) {
                  onDelete(listing.id);
                }
              }}
              className="text-red-500 p-2 rounded-full hover:bg-gray-800 transition"
              aria-label="Delete listing"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
