'use client';

import React, { useState } from 'react';
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
  const { isSubscribed } = useListings();
  const { getBuyerBalance, purchaseListing, reloadData } = useWallet();
  const { showToast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const isSeller = user?.username === listing.seller;
  const isAdmin = user?.role === 'admin';
  const isUserSubscribed = user && isSubscribed(user.username, listing.seller);

  // Get buyer's balance
  const buyerBalance = user ? getBuyerBalance(user.username) : 0;
  const purchasePrice = listing.markedUpPrice || listing.price;
  const canAfford = buyerBalance >= purchasePrice;

  // Real purchase handler with validation and admin guardrails
  const handleRealPurchase = async () => {
    if (!user || isPurchasing || isProcessing) return;

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
      await purchaseListing(
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

      showToast({ type: 'success', title: 'Purchase successful! Your order has been created.' });

      // Reload wallet/orders
      await reloadData();
      await new Promise((r) => setTimeout(r, 1000));

      router.push('/buyers/my-orders');
    } catch (error) {
      let errorMessage = 'Purchase failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Missing required fields')) {
          errorMessage = 'Order creation failed due to missing information. Please try again.';
        } else if (error.message.includes('Insufficient balance')) {
          errorMessage = 'Insufficient balance. Please add funds to your wallet.';
          setTimeout(() => router.push('/wallet/buyer'), 1500);
        } else if (error.message.includes('Rate limit exceeded')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      showToast({ type: 'error', title: errorMessage });
    } finally {
      setIsPurchasing(false);
    }
  };

  // If auction is active, purchase controls are handled by AuctionSection instead
  if (listing.auction && listing.auction.status === 'active') return null;

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
          <p className="text-3xl font-bold text-white">{formatMoney(Money.fromDollars(purchasePrice))}</p>
        </div>

        {user?.role === 'buyer' && (
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-lg bg-[#222] hover:bg-[#333] transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={20} className={isFavorited ? 'fill-[#ff950e] text-[#ff950e]' : 'text-gray-400'} />
          </button>
        )}
      </div>

      {listing.isPremium && !isUserSubscribed && !isSeller && !isAdmin && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-2">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-500 font-semibold">Premium Content</p>
              <p className="text-sm text-yellow-400 mt-1">
                Subscribe to{' '}
                <SecureMessageDisplay content={listing.seller} allowBasicFormatting={false} className="inline font-semibold" /> to purchase
                this item.
              </p>
            </div>
          </div>
        </div>
      )}

      {user && !isAdmin && !canAfford && !isSeller && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-500 font-semibold">Insufficient Balance</p>
              <p className="text-sm text-red-400 mt-1">
                You need {formatMoney(Money.fromDollars(Math.max(0, purchasePrice - buyerBalance)))} more to purchase this item
              </p>
              <button onClick={() => router.push('/wallet/buyer')} className="text-sm text-[#ff950e] hover:underline mt-2">
                Add funds to wallet →
              </button>
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

      {user && user.role === 'buyer' && (
        <div className="text-sm text-gray-400 text-center">
          Your balance: {formatMoney(Money.fromDollars(buyerBalance))}
        </div>
      )}
    </div>
  );
}
