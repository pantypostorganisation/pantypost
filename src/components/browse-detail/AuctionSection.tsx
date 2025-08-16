// src/components/browse-detail/AuctionSection.tsx
'use client';

import { Gavel, Clock, ArrowUp, BarChart2, TrendingUp } from 'lucide-react';
import { AuctionSectionProps, BidHistoryItem } from '@/types/browseDetail';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { formatRelativeTime } from '@/utils/browseDetailUtils';

interface ExtendedAuctionSectionProps extends AuctionSectionProps {
  realtimeBids?: BidHistoryItem[];
  mergedBidsHistory?: BidHistoryItem[];
}

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
  bidButtonRef,
  realtimeBids,
  mergedBidsHistory
}: ExtendedAuctionSectionProps) {
  // Defensive checks
  if (!listing.auction) return null;

  const isActualAuction = !!(
    listing.auction.isAuction || 
    listing.auction.startingPrice !== undefined
  );
  
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

  // Get the latest 5 bids for inline display
  const recentBids = mergedBidsHistory?.slice(0, 5) || listing.auction.bids?.slice(0, 5) || [];
  const hasMoreBids = (mergedBidsHistory?.length || listing.auction.bids?.length || 0) > 5;

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
          <p className="text-gray-400 text-sm flex items-center gap-1">
            Current Bid 
            {listing.auction.highestBid && (
              <TrendingUp className="w-3 h-3 text-green-400" />
            )}
          </p>
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
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Total Payable */}
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

      {/* Seller earnings display */}
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
                sanitize={false}
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
          
          {/* Quick Bid Suggestions */}
          <div className="flex gap-2">
            {suggestedBidAmount && (
              <button
                onClick={() => handleSecureBidChange(suggestedBidAmount)}
                className="bg-purple-800/50 text-purple-300 px-3 py-1 rounded text-sm hover:bg-purple-700/50 transition"
              >
                Quick: ${suggestedBidAmount}
              </button>
            )}
          </div>
          
          {/* Status Messages */}
          {bidError && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded text-sm">
              {bidError}
            </div>
          )}
          
          {bidSuccess && (
            <div className="bg-green-900/30 border border-green-800 text-green-400 p-3 rounded text-sm animate-pulse">
              {bidSuccess}
            </div>
          )}
          
          {bidStatus?.message && (
            <div className={`p-3 rounded text-sm border ${
              bidStatus.success 
                ? 'bg-green-900/30 border-green-800 text-green-400' 
                : 'bg-yellow-900/30 border-yellow-800 text-yellow-400'
            }`}>
              {bidStatus.message}
            </div>
          )}
        </div>
      )}

      {/* Recent Bids Section - MOVED BELOW BID INPUT */}
      {recentBids.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
              Recent Bids
              {realtimeBids && realtimeBids.length > 0 && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full animate-pulse">
                  LIVE
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">{bidsCount || recentBids.length} total</p>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentBids.map((bid, index) => (
              <div 
                key={`${bid.bidder}-${bid.amount}-${index}`}
                className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${
                  index === 0 
                    ? 'bg-gradient-to-r from-green-900/20 to-green-800/10' 
                    : 'bg-gray-800/20 hover:bg-gray-800/30'
                } ${bid.bidder === username ? 'relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-purple-500 before:rounded-l-lg' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 
                      ? 'bg-green-500/30 text-green-400 ring-1 ring-green-500/30' 
                      : bid.bidder === username 
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {bid.bidder === username ? '•' : bid.bidder.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className={`font-medium ${
                      bid.bidder === username ? 'text-purple-400' : 'text-gray-300'
                    }`}>
                      {bid.bidder === username ? 'You' : bid.bidder}
                    </span>
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                        Leading
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${
                    index === 0 ? 'text-green-400 text-base' : 'text-white'
                  }`}>
                    ${bid.amount.toFixed(2)}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatRelativeTime(bid.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* View Full History Button - Only show if more than 5 bids */}
          {hasMoreBids && (
            <button
              onClick={onShowBidHistory}
              className="mt-3 w-full bg-gray-800/30 text-gray-400 px-3 py-2 rounded-lg text-sm hover:bg-gray-800/40 hover:text-gray-300 transition flex items-center justify-center gap-2 font-medium"
            >
              <BarChart2 className="w-4 h-4" />
              View Full History ({bidsCount || listing.auction.bids?.length || 0} bids)
            </button>
          )}
        </div>
      )}
    </div>
  );
}