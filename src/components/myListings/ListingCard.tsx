// src/components/myListings/ListingCard.tsx
'use client';

import { Eye, Edit, Trash2, Gavel, Crown, Clock, Calendar, X } from 'lucide-react';
import { ListingCardProps } from '@/types/myListings';
import { timeSinceListed, formatTimeRemaining } from '@/utils/myListingsUtils';
import { useConfirmation } from '@/components/ui/ConfirmationModal';

export default function ListingCard({
  listing,
  analytics,
  onEdit,
  onDelete,
  onCancelAuction,
}: ListingCardProps) {
  const { confirm, ConfirmationModal } = useConfirmation();
  const isAuctionListing = !!listing.auction;

  const cover = listing.imageUrls?.[0] ?? '';

  const currentBid = (() => {
    if (!isAuctionListing || !listing.auction) return null;
    const bid =
      typeof listing.auction.highestBid === 'number' && listing.auction.highestBid > 0
        ? listing.auction.highestBid
        : listing.auction.startingPrice;
    return `$${Number(bid).toFixed(2)}`;
  })();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Listing',
      message: 'Are you sure you want to delete this listing? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    
    if (confirmed) {
      onDelete(listing.id);
    }
  };

  const handleCancelAuction = async () => {
    const confirmed = await confirm({
      title: 'Cancel Auction',
      message: 'Are you sure you want to cancel this auction? All bids will be voided and this action cannot be undone.',
      confirmText: 'Cancel Auction',
      cancelText: 'Keep Active',
      type: 'warning',
    });
    
    if (confirmed) {
      onCancelAuction(listing.id);
    }
  };

  return (
    <>
      {ConfirmationModal}
      <div
        className={`border rounded-xl overflow-hidden transition relative flex flex-col h-full ${
          isAuctionListing ? 'border-purple-700 bg-black' : listing.isPremium ? 'border-[#ff950e] bg-black' : 'border-gray-700 bg-black'
        }`}
      >
        {isAuctionListing && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center">
              <Gavel className="w-4 h-4 mr-1" /> Auction
            </span>
          </div>
        )}

        {!isAuctionListing && listing.isPremium && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center">
              <Crown className="w-4 h-4 mr-1" /> Premium
            </span>
          </div>
        )}

        <div className="relative w-full h-48 sm:h-56 overflow-hidden">
          {cover ? (
            <img 
              src={cover} 
              alt={listing.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', cover);
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-600">No image</span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-white mb-2">{listing.title}</h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2 flex-grow">{listing.description}</p>

          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto mb-3">
              {listing.tags.map((tag, idx) => (
                <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {isAuctionListing && listing.auction && (
            <div className="bg-purple-900/20 rounded-lg p-3 mb-3 border border-purple-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-purple-300 flex items-center gap-1">
                  <Gavel className="w-3 h-3" /> Current Bid:
                </span>
                <span className="font-bold text-white">{currentBid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Ends:
                </span>
                <span className="text-sm text-white">{formatTimeRemaining(listing.auction.endTime)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {(listing.auction.bids?.length ?? 0)} {listing.auction.bids?.length === 1 ? 'bid' : 'bids'} placed
              </div>
            </div>
          )}

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
              {isAuctionListing && listing.auction
                ? `$${Number(listing.auction.startingPrice).toFixed(2)} start`
                : `$${Number(listing.price).toFixed(2)}`}
            </p>
            <div className="flex gap-2">
              {isAuctionListing && listing.auction?.status === 'active' && (
                <button
                  onClick={handleCancelAuction}
                  className="text-red-400 p-2 rounded-full hover:bg-gray-800 transition"
                  aria-label="Cancel auction"
                  title="Cancel auction"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {(!isAuctionListing || (listing.auction && listing.auction.status !== 'active')) && (
                <button
                  onClick={() => onEdit(listing)}
                  className="text-blue-400 p-2 rounded-full hover:bg-gray-800 transition"
                  aria-label="Edit listing"
                  title="Edit listing"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="text-red-500 p-2 rounded-full hover:bg-gray-800 transition"
                aria-label="Delete listing"
                title="Delete listing"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
