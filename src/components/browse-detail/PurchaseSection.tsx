// src/components/browse-detail/PurchaseSection.tsx
import React from 'react';
import { Heart, Crown, ShoppingBag, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { formatMoney } from '@/utils/format';
import { Money } from '@/types/common';
import { Listing } from '@/context/ListingContext';

interface PurchaseSectionProps {
  listing: Listing;
  user: any;
  handlePurchase: () => void;
  isProcessing: boolean;
  isFavorited: boolean;
  toggleFavorite: () => void;
  onSubscribeClick: () => void;
}

export default function PurchaseSection({
  listing,
  user,
  handlePurchase,
  isProcessing,
  isFavorited,
  toggleFavorite,
  onSubscribeClick,
}: PurchaseSectionProps) {
  const router = useRouter();
  const { isSubscribed } = useListings();
  const { getBuyerBalance } = useWallet();
  
  const isUserSubscribed = user && isSubscribed(user.username, listing.seller);
  const isSeller = user?.username === listing.seller;
  
  // Get buyer's balance
  const buyerBalance = user ? getBuyerBalance(user.username) : 0;
  const canAfford = buyerBalance >= (listing.markedUpPrice || listing.price);

  if (listing.auction && listing.auction.status === 'active') {
    // Auction listing - show in AuctionSection instead
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">Price</p>
          <p className="text-3xl font-bold text-white">
            {formatMoney(Money.fromDollars(listing.markedUpPrice))}
          </p>
        </div>
        {user?.role === 'buyer' && (
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              size={20} 
              className={isFavorited ? 'fill-[#ff950e] text-[#ff950e]' : 'text-gray-400'} 
            />
          </button>
        )}
      </div>

      {listing.isPremium && !isUserSubscribed && !isSeller && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-500 font-semibold">Premium Content</p>
              <p className="text-sm text-yellow-400 mt-1">
                Subscribe to {listing.seller} to purchase this item
              </p>
            </div>
          </div>
        </div>
      )}

      {user && !canAfford && !isSeller && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-500 font-semibold">Insufficient Balance</p>
              <p className="text-sm text-red-400 mt-1">
                You need {formatMoney(Money.fromDollars(listing.markedUpPrice - buyerBalance))} more to purchase this item
              </p>
              <button
                onClick={() => router.push('/wallet/buyer')}
                className="text-sm text-[#ff950e] hover:underline mt-2"
              >
                Add funds to wallet →
              </button>
            </div>
          </div>
        </div>
      )}

      {!user ? (
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-[#ff950e] text-black py-3 rounded-lg font-semibold hover:bg-[#e0850d] transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Login to Purchase
        </button>
      ) : isSeller ? (
        <button
          disabled
          className="w-full bg-gray-700 text-gray-400 py-3 rounded-lg font-semibold cursor-not-allowed"
        >
          Your Listing
        </button>
      ) : listing.isPremium && !isUserSubscribed ? (
        <button
          onClick={onSubscribeClick}
          className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition flex items-center justify-center gap-2"
        >
          <Crown className="w-5 h-5" />
          Subscribe to Purchase
        </button>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={isProcessing || !canAfford}
          className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            canAfford
              ? 'bg-[#ff950e] text-black hover:bg-[#e0850d]'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {isProcessing ? 'Processing...' : 'Purchase Now'}
        </button>
      )}

      {user && user.role === 'buyer' && (
        <div className="text-sm text-gray-400 text-center">
          Your balance: {formatMoney(Money.fromDollars(buyerBalance))}
        </div>
      )}
    </div>
  );
}
