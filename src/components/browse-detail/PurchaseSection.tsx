// src/components/browse-detail/PurchaseSection.tsx
import React, { useState } from 'react';
import { Heart, Crown, ShoppingBag, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney } from '@/utils/format';
import { Money } from '@/types/common';
import { Listing } from '@/context/ListingContext';
import { DeliveryAddress } from '@/types/order';

interface PurchaseSectionProps {
  listing: Listing;
  user: any;
  handlePurchase: () => void;
  isProcessing: boolean;
  isFavorited: boolean;
  toggleFavorite: () => void;
  onSubscribeClick: () => void;
}

// Mock delivery address for now - in production you'd get this from user profile
const DEFAULT_DELIVERY_ADDRESS: DeliveryAddress = {
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
};

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
  const { getBuyerBalance, purchaseListing, reloadData } = useWallet();
  const { showToast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const isUserSubscribed = user && isSubscribed(user.username, listing.seller);
  const isSeller = user?.username === listing.seller;
  
  // Get buyer's balance
  const buyerBalance = user ? getBuyerBalance(user.username) : 0;
  const purchasePrice = listing.markedUpPrice || listing.price;
  const canAfford = buyerBalance >= purchasePrice;

  // 🔧 NEW: Real purchase handler that calls backend API
  const handleRealPurchase = async () => {
    if (!user || isPurchasing || isProcessing) return;
    
    // Validation
    if (isSeller) {
      showToast({ type: 'error', title: 'You cannot purchase your own listing' });
      return;
    }
    
    if (listing.isPremium && !isUserSubscribed) {
      showToast({ type: 'error', title: 'You must be subscribed to purchase premium content' });
      return;
    }
    
    if (!canAfford) {
      showToast({ type: 'error', title: 'Insufficient balance. Please add funds to your wallet.' });
      router.push('/wallet/buyer');
      return;
    }

    setIsPurchasing(true);
    
    try {
      console.log('[PurchaseSection] Starting purchase:', {
        listing: listing.title,
        price: purchasePrice,
        buyer: user.username,
        seller: listing.seller,
        listingId: listing.id
      });
      
      // 🔧 ENHANCED: Call WalletContext.purchaseListing with better error handling
      const success = await purchaseListing(
        {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          markedUpPrice: purchasePrice,
          imageUrls: listing.imageUrls,
          seller: listing.seller,
          tags: listing.tags || [],
        } as any,
        user.username
      );
      
      console.log('[PurchaseSection] Purchase result:', success);
      
      if (success) {
        showToast({ type: 'success', title: 'Purchase successful! Your order has been created.' });
        
        // Reload wallet data to get updated balance and orders
        console.log('[PurchaseSection] Reloading wallet data...');
        await reloadData();
        
        // Wait a moment for the data to sync
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to orders page to see the new order
        router.push('/buyers/my-orders');
      } else {
        console.error('[PurchaseSection] Purchase failed - purchaseListing returned false');
        showToast({ type: 'error', title: 'Purchase failed. Please check your balance and try again.' });
      }
    } catch (error) {
      console.error('[PurchaseSection] Purchase error:', error);
      
      // Show more detailed error information
      let errorMessage = 'Purchase failed. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.log('[PurchaseSection] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      showToast({
        type: 'error',
        title: errorMessage
      });
    } finally {
      setIsPurchasing(false);
    }
  };

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
            {formatMoney(Money.fromDollars(purchasePrice))}
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
                You need {formatMoney(Money.fromDollars(purchasePrice - buyerBalance))} more to purchase this item
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
          onClick={handleRealPurchase}
          disabled={isPurchasing || isProcessing || !canAfford}
          className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            canAfford && !isPurchasing
              ? 'bg-[#ff950e] text-black hover:bg-[#e0850d]'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {isPurchasing ? 'Processing Purchase...' : isProcessing ? 'Processing...' : 'Purchase Now'}
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
