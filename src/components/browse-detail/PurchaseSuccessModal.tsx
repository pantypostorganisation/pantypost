// src/components/browse-detail/PurchaseSuccessModal.tsx
'use client';

import { Award, ShoppingBag } from 'lucide-react';
import { PurchaseSuccessModalProps } from '@/types/browseDetail';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function PurchaseSuccessModal({
  showPurchaseSuccess,
  showAuctionSuccess,
  isAuctionListing,
  listing,
  isUserHighestBidder,
  userRole,
  calculateTotalPayable,
  onNavigate
}: PurchaseSuccessModalProps) {
  // Auction Winner Modal
  if (showAuctionSuccess && isAuctionListing && listing && userRole === "buyer" && isUserHighestBidder) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 rounded-2xl border border-yellow-500/30 max-w-md w-full text-center">
          <div className="mb-4">
            <Award className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">🏆 Congratulations! 🏆</h2>
            <p className="text-lg text-white mb-3">You Won the Auction!</p>
            
            <div className="bg-black/40 p-4 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Winning Bid:</span>
                <span className="font-bold text-yellow-400">${listing.auction?.highestBid?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform Fee:</span>
                <span className="font-bold text-gray-300">${((listing.auction?.highestBid || 0) * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-600 pt-2">
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total Paid:</span>
                  <span className="text-xl font-bold text-[#ff950e]">
                    ${calculateTotalPayable(listing.auction?.highestBid || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('/buyers/my-orders')}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-500 font-bold transition"
            >
              View My Orders
            </button>
            
            <button
              onClick={() => onNavigate('/browse')}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-500 font-bold transition"
            >
              Browse More Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Purchase Success Modal (for standard listings)
  if (showPurchaseSuccess && !isAuctionListing && listing) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gray-900 p-6 rounded-2xl border border-[#ff950e]/30 max-w-md w-full text-center">
          <div className="mb-4">
            <ShoppingBag className="w-16 h-16 text-[#ff950e] mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">🎉 Purchase Successful!</h2>
            
            <div className="bg-black/40 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Seller:</span>
                <SecureMessageDisplay 
                  content={listing.seller}
                  allowBasicFormatting={false}
                  className="font-bold text-white"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Paid:</span>
                <span className="text-xl font-bold text-[#ff950e]">
                  ${listing.markedUpPrice?.toFixed(2) ?? (listing.price * 1.1).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('/buyers/my-orders')}
            className="w-full bg-[#ff950e] text-black px-4 py-3 rounded-xl hover:bg-[#e88800] font-bold transition"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  return null;
}
