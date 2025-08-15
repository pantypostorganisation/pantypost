// src/components/browse-detail/AuctionSection.tsx
'use client';

import { Gavel, Clock, ArrowUp, BarChart2 } from 'lucide-react';
import { AuctionSectionProps } from '@/types/browseDetail';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeCurrency } from '@/utils/security/sanitization';

export default function AuctionSection({
  listing,
  isAuctionEnded,
  formatTimeRemaining,
  currentHighestBid,
  currentTotalPayable,
  getTimerProgress,
  bidAmount,
  onBidAmountChange,
  onBidSubmit,
  onBidKeyPress,
  isBidding,
  biddingEnabled,
  bidError,
  bidSuccess,
  bidStatus,
  suggestedBidAmount,
  onShowBidHistory,
  bidsCount,
  userRole,
  username,
  bidInputRef,
  bidButtonRef
}: AuctionSectionProps) {
  // DEFENSIVE CHECK 1: Return null if no auction data
  if (!listing.auction) return null;

  // DEFENSIVE CHECK 2: Verify this is actually an auction listing
  const isActualAuction = !!(
    listing.auction.isAuction || 
    listing.auction.startingPrice !== undefined
  );
  
  // Return null if not actually an auction
  if (!isActualAuction) return null;

  const isUserSeller = username === listing.seller;
  const canBid = !isAuctionEnded && userRole === 'buyer' && !isUserSeller;

  // Handle secure bid amount change
  const handleSecureBidChange = (value: string) => {
    if (value === '') {
      onBidAmountChange('');
    } else {
      const sanitized = sanitizeCurrency(value);
      onBidAmountChange(sanitized.toString());
    }
  };

  return (
    <div className={`rounded-xl border p-5 ${
      isAuctionEnded 
        ? 'border-gray-700 bg-gray-900/30' 
        : 'border-purple-700 bg-purple-900/20'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <Gavel className={`w-5 h-5 ${isAuctionEnded ? 'text-gray-400' : 'text-purple-400'}`} />
        <h3 className="text-lg font-bold text-white">
          {isAuctionEnded ? 'Auction Ended' : 'Live Auction'}
        </h3>
      </div>
      
      {/* Auction Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm">Starting Bid</p>
          <p className="text-xl font-bold text-white">${listing.auction.startingPrice.toFixed(2)}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm">Current Bid</p>
          {listing.auction.highestBid ? (
            <p className="text-xl font-bold text-green-400">${listing.auction.highestBid.toFixed(2)}</p>
          ) : (
            <p className="text-gray-400 italic">No bids yet</p>
          )}
        </div>
      </div>
      
      {/* Time Remaining */}
      {!isAuctionEnded && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-1">Time Remaining</p>
          <p className="font-bold text-green-400 mb-2">
            {formatTimeRemaining(listing.auction.endTime)}
          </p>
          
          {/* Timer Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${getTimerProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Total Payable - Updated for new fee structure */}
      <div className="bg-purple-900/30 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-purple-200 text-sm">Amount if you win</span>
          <span className="text-lg font-bold text-white">
            ${currentTotalPayable.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          No additional fees
        </p>
      </div>

      {/* Show seller earnings if user is the seller */}
      {userRole === 'seller' && username === listing.seller && listing.auction.highestBid && (
        <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">You'll receive (after 20% fee)</span>
            <span className="text-lg font-bold text-green-400">
              ${(listing.auction.highestBid * 0.8).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Platform fee: ${(listing.auction.highestBid * 0.2).toFixed(2)}
          </p>
        </div>
      )}

      {/* Bidding Section */}
      {canBid && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <SecureInput
                ref={bidInputRef}
                type="number"
                placeholder="Enter your bid"
                value={bidAmount}
                onChange={handleSecureBidChange}
                onKeyPress={onBidKeyPress}
                min={listing.auction.highestBid ? (listing.auction.highestBid + 0.01).toString() : listing.auction.startingPrice.toString()}
                step="0.01"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-purple-700 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm"
                sanitize={false} // We handle sanitization in handleSecureBidChange
              />
            </div>
            <button
              ref={bidButtonRef}
              onClick={onBidSubmit}
              disabled={isBidding || !biddingEnabled}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isBidding ? 'Placing...' : 'Bid'}
            </button>
          </div>
          
          {/* Quick Bid + History */}
          <div className="flex gap-2">
            {suggestedBidAmount && (
              <button
                onClick={() => handleSecureBidChange(suggestedBidAmount)}
                className="bg-purple-800/50 text-purple-300 px-3 py-1 rounded text-sm hover:bg-purple-700/50 transition"
              >
                ${suggestedBidAmount}
              </button>
            )}
            <button
              onClick={onShowBidHistory}
              className="flex-1 bg-gray-800/50 text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-700/50 transition flex items-center justify-center gap-1"
            >
              <BarChart2 className="w-3 h-3" />
              Bid history ({bidsCount})
            </button>
          </div>
          
          {/* Status Messages - DEFENSIVE: Only show for actual auctions */}
          {bidError && isActualAuction && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded text-sm">
              {bidError}
            </div>
          )}
          
          {bidSuccess && isActualAuction && (
            <div className="bg-green-900/30 border border-green-800 text-green-400 p-3 rounded text-sm">
              {bidSuccess}
            </div>
          )}
          
          {/* DEFENSIVE: Only show bidStatus messages for actual auctions */}
          {bidStatus?.message && isActualAuction && (
            <div className={`p-3 rounded text-sm border ${
              bidStatus.success 
                ? 'bg-green-900/20 border-green-800/40 text-green-400' 
                : 'bg-yellow-900/20 border-yellow-800/40 text-yellow-400'
            }`}>
              {bidStatus.message}
            </div>
          )}
        </div>
      )}

      {/* Reserve Price Info */}
      {listing.auction.reservePrice && (
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-gray-400 flex items-center gap-1">
            <Gavel className="w-3 h-3" />
            Reserve Price
          </span>
          <span className={`font-medium ${
            (!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
              ? 'text-yellow-400'
              : 'text-green-400'
          }`}>
            {(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice)
              ? '⚠️ Not met'
              : '✅ Met'
            }
          </span>
        </div>
      )}
    </div>
  );
}