// src/components/myListings/ListingCard.tsx
'use client';

import { Eye, Edit, Trash2, Gavel, Crown, Tag, Clock, Calendar, X } from 'lucide-react';
import { ListingCardProps } from '@/types/myListings';
import { timeSinceListed, formatTimeRemaining } from '@/utils/myListingsUtils';

export default function ListingCard({ 
  listing, 
  analytics, 
  onEdit, 
  onDelete, 
  onCancelAuction 
}: ListingCardProps) {
  const isAuction = !!listing.auction;
  const isPremium = listing.isPremium ?? false;
  const timeRemaining = isAuction && listing.auction?.endTime 
    ? formatTimeRemaining(listing.auction.endTime)
    : null;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition">
      {/* Image Section */}
      <div className="relative aspect-square">
        <img
          src={listing.imageUrls?.[0] || '/placeholder.jpg'}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          {isAuction ? (
            <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Gavel className="w-3 h-3" />
              Auction
            </div>
          ) : isPremium ? (
            <div className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          ) : (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Standard
            </div>
          )}
        </div>

        {/* Views Counter */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {analytics.views}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="font-medium text-white mb-1 truncate">{listing.title}</h3>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{listing.description}</p>

        {/* Price/Auction Info */}
        <div className="mb-3">
          {isAuction ? (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Current Bid:</span>
                <span className="text-lg font-bold text-purple-400">
                  ${listing.auction?.highestBid?.toFixed(2) || listing.auction?.startingPrice.toFixed(2)}
                </span>
              </div>
              {timeRemaining && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Ends: {timeRemaining}
                </div>
              )}
              {listing.auction?.bids && listing.auction.bids.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {listing.auction.bids.length} bid{listing.auction.bids.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Price:</span>
              <span className="text-lg font-bold text-[#ff950e]">
                ${listing.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {listing.tags.length > 3 && (
              <span className="text-xs text-gray-500">+{listing.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(listing)}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          
          {isAuction && listing.auction?.status === 'active' ? (
            <button
              onClick={() => onCancelAuction(listing.id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this listing?')) {
                  onDelete(listing.id);
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Listed {timeSinceListed(listing.date)}
        </div>
      </div>
    </div>
  );
}
