// src/components/browse-detail/PurchaseSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Crown, ShoppingBag, AlertCircle, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { formatMoney } from '@/utils/format';
import { Money } from '@/types/common';
import { Listing } from '@/context/ListingContext';
import { DeliveryAddress } from '@/types/order';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface PurchaseSectionProps {
  listing: Listing;
  user: any;
  handlePurchase: () => void; // kept for compatibility
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
  handlePurchase, // eslint-disable-line @typescript-eslint/no-unused-vars
  isProcessing,
  isFavorited,
  toggleFavorite,
  onSubscribeClick,
}: PurchaseSectionProps) {
  const router = useRouter();
  const { isSubscribed, listings } = useListings();
  const { getBuyerBalance, purchaseListing, reloadData, orderHistory } = useWallet();
  const { showToast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // CRITICAL FIX: Add state to track if purchase was successful
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);

  const isSeller = user?.username === listing.seller;
  const isAdmin = user?.role === 'admin';
  const isUserSubscribed = user && isSubscribed(user.username, listing.seller);

  // Check if listing is locked for premium content
  const isPremiumLocked = listing.isPremium && !isUserSubscribed && !isSeller && listing.isLocked;

  // FIX: Check if listing still exists in active listings (if not, it's been sold)
  const isListingStillActive = listings.some(l => l.id === listing.id);
  
  // FIX: Check if current user has this item in their order history
  useEffect(() => {
    if (user?.username && orderHistory) {
      const userPurchasedThis = orderHistory.some(order => 
        order.buyer === user.username && 
        (order.listingId === listing.id || order.title === listing.title)
      );
      if (userPurchasedThis) {
        setPurchaseCompleted(true);
      }
    }
  }, [user?.username, orderHistory, listing.id, listing.title]);

  // FIX: Use cents for comparison to avoid floating-point issues
  const buyerBalanceInCents = user ? Math.round(getBuyerBalance(user.username) * 100) : 0;
  const purchasePriceInCents = Math.round((listing.markedUpPrice || listing.price) * 100);
  
  // Compare in cents (integers) to avoid floating-point issues
  const canAfford = buyerBalanceInCents >= purchasePriceInCents;
  
  // FIX: Calculate the actual difference in dollars
  const balanceNeeded = Math.max(0, (purchasePriceInCents - buyerBalanceInCents) / 100);
  
  // CRITICAL FIX: Don't show warning if purchase completed or listing not active
  const shouldShowInsufficientBalance = !canAfford && 
                                        balanceNeeded > 0.01 &&
                                        !isSeller && 
                                        !purchaseCompleted && 
                                        !isPurchasing && 
                                        !isProcessing &&
                                        isListingStillActive &&
                                        !isPremiumLocked;

  // Real purchase handler with validation and admin guardrails
  const handleRealPurchase = async () => {
    if (!user || isPurchasing || isProcessing || purchaseCompleted || !isListingStillActive) return;

    // Admins cannot act as buyers
    if (isAdmin) {
      showToast({
        type: 'error',
        title: 'Admins cannot purchase items. Please use the Crown Admin portal.',
      });
      return;
    }

    if (isSeller) {
      showToast({ type: 'error', title: 'You cannot purchase your own listing' });
      return;
    }

    // UPDATED: Check for premium content with server-side lock
    if (isPremiumLocked) {
      showToast({ 
        type: 'error', 
        title: 'Premium content locked', 
        message: 'You must be subscribed to this seller to purchase premium content' 
      });
      return;
    }

    if (!canAfford) {
      showToast({ type: 'error', title: 'Insufficient balance. Please add funds to your wallet.' });
      router.push('/wallet/buyer');
      return;
    }

    setIsPurchasing(true);

    try {
      // UPDATED: Include isPremium flag in purchase request
      await purchaseListing(
        {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          markedUpPrice: purchasePriceInCents / 100,
          imageUrls: listing.imageUrls,
          seller: listing.seller,
          tags: listing.tags || [],
          isPremium: listing.isPremium, // NEW: Include premium flag
        } as any,
        user.username
      );

      // FIX: Mark purchase as completed to prevent warning from showing
      setPurchaseCompleted(true);
      
      showToast({ type: 'success', title: 'Purchase successful! Your order has been created.' });

      // Reload wallet/orders
      await reloadData();
      
      // Small delay to ensure state updates are visible
      await new Promise((r) => setTimeout(r, 500));

      router.push('/buyers/my-orders');
    } catch (error: any) {
      setIsPurchasing(false);
      setPurchaseCompleted(false);
      
      let errorMessage = 'Purchase failed. Please try again.';
      
      // UPDATED: Handle premium content errors
      if (error.message?.includes('subscribe') || error.requiresSubscription) {
        errorMessage = 'You must be subscribed to this seller to purchase premium content.';
        setTimeout(() => {
          router.push(`/sellers/${listing.seller}`);
        }, 2000);
      } else if (error.message?.includes('Missing required fields')) {
        errorMessage = 'Order creation failed due to missing information. Please try again.';
      } else if (error.message?.includes('Insufficient balance')) {
        errorMessage = 'Insufficient balance. Please add funds to your wallet.';
        setTimeout(() => router.push('/wallet/buyer'), 1500);
      } else if (error.message?.includes('Rate limit exceeded')) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      showToast({ type: 'error', title: errorMessage });
    }
  };

  // If auction is active, purchase controls are handled by AuctionSection instead
  if (listing.auction && listing.auction.status === 'active') return null;

  // If listing is no longer in active listings and user didn't purchase it
  if (!isListingStillActive && !purchaseCompleted) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 space-y-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-gray-400 font-semibold">This item has been sold</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      {/* Admin notice */}
      {user && isAdmin && (
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-3 -mt-1">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400 mt-0.5" />
            <p className="text-sm text-purple-200">
              Admin accounts cannot make purchases or act as buyers. Please use the{' '}
              <span className="font-semibold text-purple-300">Crown Admin</span> tools.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400">Price</p>
          <p className="text-3xl font-bold text-white">${(purchasePriceInCents / 100).toFixed(2)}</p>
        </div>

        {user?.role === 'buyer' && isListingStillActive && (
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={20} className={isFavorited ? 'fill-[#ff950e] text-[#ff950e]' : 'text-gray-400'} />
          </button>
        )}
      </div>

      {/* UPDATED: Premium content lock message with server-side indication */}
      {isPremiumLocked && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-2">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-500 font-semibold">Premium Content Locked</p>
              <p className="text-sm text-yellow-400 mt-1">
                This content is restricted. Subscribe to{' '}
                <SecureMessageDisplay content={listing.seller} allowBasicFormatting={false} className="inline font-semibold" /> to unlock and purchase.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FIX: Only show insufficient balance warning if truly insufficient and listing active */}
      {user && !isAdmin && shouldShowInsufficientBalance && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-500 font-semibold">Insufficient Balance</p>
              <p className="text-sm text-red-400 mt-1">
                You need ${balanceNeeded.toFixed(2)} more to purchase this item
              </p>
              <button onClick={() => router.push('/wallet/buyer')} className="text-sm text-[#ff950e] hover:underline mt-2">
                Add funds to wallet →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIX: Show success state if purchase completed */}
      {purchaseCompleted && (
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-2">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-green-500 font-semibold">Purchase Complete!</p>
              <p className="text-sm text-green-400 mt-1">
                You own this item
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Call-to-action */}
      {!user ? (
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-[#ff950e] text-black py-3 rounded-lg font-semibold hover:bg-[#e0850d] transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Login to Purchase
        </button>
      ) : isSeller ? (
        <button disabled className="w-full bg-gray-700 text-gray-400 py-3 rounded-lg font-semibold cursor-not-allowed">
          Your Listing
        </button>
      ) : isAdmin ? (
        <button disabled className="w-full bg-purple-900/40 text-purple-300 py-3 rounded-lg font-semibold cursor-not-allowed">
          Admin accounts cannot purchase
        </button>
      ) : isPremiumLocked ? (
        <button
          onClick={onSubscribeClick}
          className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition flex items-center justify-center gap-2"
        >
          <Crown className="w-5 h-5" />
          Subscribe to Unlock & Purchase
        </button>
      ) : purchaseCompleted || !isListingStillActive ? (
        <button
          disabled
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          {purchaseCompleted ? 'You Own This Item ✓' : 'Item Sold'}
        </button>
      ) : (
        <button
          onClick={handleRealPurchase}
          disabled={isPurchasing || isProcessing || !canAfford}
          className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
            canAfford && !isPurchasing && !isProcessing
              ? 'bg-[#ff950e] text-black hover:bg-[#e0850d]'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Purchase now"
        >
          <ShoppingBag className="w-5 h-5" />
          {isPurchasing ? 'Processing Purchase...' : isProcessing ? 'Processing...' : 'Purchase Now'}
        </button>
      )}

      {user && user.role === 'buyer' && !purchaseCompleted && isListingStillActive && !isPremiumLocked && (
        <div className="text-sm text-gray-400 text-center">
          Your balance: ${(buyerBalanceInCents / 100).toFixed(2)}
        </div>
      )}
    </div>
  );
}
