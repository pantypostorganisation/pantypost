// src/components/browse-detail/AuctionEndedModal.tsx
'use client';

import { AlertCircle, Gavel, Clock, AlertTriangle } from 'lucide-react';
import { AuctionEndedModalProps } from '@/types/browseDetail';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function AuctionEndedModal({
  isAuctionListing,
  isAuctionEnded,
  listing,
  isUserHighestBidder,
  didUserBid,
  userRole,
  username,
  bidsHistory,
  onNavigate
}: AuctionEndedModalProps) {
  if (!isAuctionListing || !isAuctionEnded || !listing.auction) return null;
  
  const hasBids = listing.auction.bids && listing.auction.bids.length > 0;
  const isSeller = username === listing.seller;
  const hasUserBid = didUserBid && !isUserHighestBidder;
  
  // Don't show generic screens if the user won (they'll see the winner modal)
  if (userRole === "buyer" && isUserHighestBidder) {
    return null;
  }
  
  // Generic auction ended screen (for sellers and non-bidders)
  if ((isSeller || (!hasUserBid && !isUserHighestBidder))) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-md w-full text-center">
          <div className="mb-6">
            {listing.auction.status === 'cancelled' ? (
              <AlertCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
            ) : hasBids ? (
              <Gavel className="mx-auto w-16 h-16 text-purple-500 mb-4" />
            ) : (
              <Clock className="mx-auto w-16 h-16 text-[#ff950e] mb-4" />
            )}
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {listing.auction.status === 'cancelled' 
                ? 'Auction Cancelled' 
                : 'Auction Ended'}
            </h2>
            
            <div className="text-gray-300">
              {listing.auction.status === 'cancelled' ? (
                <p>This auction was cancelled by the seller.</p>
              ) : isSeller ? (
                hasBids ? (
                  <div>
                    Your auction for "<SecureMessageDisplay 
                      content={listing.title}
                      allowBasicFormatting={false}
                      className="text-[#ff950e] inline"
                    />" has ended 
                    with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span> 
                    from <SecureMessageDisplay 
                      content={listing.auction.highestBidder || ''}
                      allowBasicFormatting={false}
                      className="font-bold inline"
                    />.
                  </div>
                ) : (
                  <div>
                    Your auction for "<SecureMessageDisplay 
                      content={listing.title}
                      allowBasicFormatting={false}
                      className="text-[#ff950e] inline"
                    />" has ended without 
                    receiving any bids.
                  </div>
                )
              ) : (
                hasBids ? (
                  <p>
                    This auction has ended with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span>.
                  </p>
                ) : (
                  <p>
                    This auction has ended without receiving any bids.
                  </p>
                )
              )}
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('/browse')}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-full hover:bg-purple-500 font-bold transition text-lg shadow"
          >
            Return to Browse
          </button>
        </div>
      </div>
    );
  }
  
  // Screen for users who bid but didn't win
  if (hasUserBid) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-md w-full text-center">
          <div className="mb-6">
            <AlertTriangle className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Auction Ended
            </h2>
            
            <div className="text-gray-300">
              <p className="mb-2">
                Your bid of <span className="font-bold text-yellow-400">
                  ${bidsHistory.find(bid => bid.bidder === username)?.amount.toFixed(2) || '0.00'}
                </span> was not the highest bid.
              </p>
              
              <div>
                The auction for "<SecureMessageDisplay 
                  content={listing.title}
                  allowBasicFormatting={false}
                  className="text-[#ff950e] inline"
                />" ended 
                with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span> 
                from <SecureMessageDisplay 
                  content={listing.auction.highestBidder || ''}
                  allowBasicFormatting={false}
                  className="font-bold inline"
                />.
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('/browse')}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-full hover:bg-purple-500 font-bold transition text-lg shadow"
          >
            Browse More Auctions
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}
