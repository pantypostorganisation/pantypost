// src/app/browse/[id]/ListingClient.tsx
//
// This was page.tsx, unchanged apart from the filename and component
// name. page.tsx is now a SERVER component that supplies
// generateMetadata and wraps this in its own Suspense boundary.
'use client';

import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import BanCheck from '@/components/BanCheck';
import DetailHeader from '@/components/browse-detail/DetailHeader';
import ImageGallery from '@/components/browse-detail/ImageGallery';
import ProductInfo from '@/components/browse-detail/ProductInfo';
import AuctionSection from '@/components/browse-detail/AuctionSection';
import PurchaseSection from '@/components/browse-detail/PurchaseSection';
import SellerProfile from '@/components/browse-detail/SellerProfile';
import SellerReviews from '@/components/browse-detail/SellerReviews';
import RelatedListings from '@/components/browse-detail/RelatedListings';
import TrustBadges from '@/components/browse-detail/TrustBadges';
import BidHistoryModal from '@/components/browse-detail/BidHistoryModal';
import AuctionEndedModal from '@/components/browse-detail/AuctionEndedModal';
import PurchaseSuccessModal from '@/components/browse-detail/PurchaseSuccessModal';
import StickyPurchaseBar from '@/components/browse-detail/StickyPurchaseBar';
import CheckoutModal, { type CheckoutItem } from '@/components/browse-detail/CheckoutModal';
import AddressConfirmationModal from '@/components/AddressConfirmationModal';
import { deliveryAddressService } from '@/services/deliveryAddress.service';
import { useWallet } from '@/context/WalletContext';
import type { DeliveryAddress } from '@/types/order';
import PremiumLockMessage from '@/components/browse-detail/PremiumLockMessage';
import { useBrowseDetail } from '@/hooks/useBrowseDetail';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { listingsService, type DropInfo } from '@/services/listings.service';

/* `initialListing` comes from page.tsx, which already fetched it for
   generateMetadata. Reusing it costs nothing and puts the real listing
   in the first HTML. */
export default function ListingClient({ initialListing }: { initialListing?: any }) {
  const { trackEvent, trackPurchase } = useAnalytics();
  const isMountedRef = useRef(true);
  const trackingRef = useRef({ hasTrackedView: false, hasTrackedPurchase: false });
  const [localListing, setLocalListing] = useState<any>(null);
  
  const {
    // Data
    user,
    listing: contextListing,
    listingId,
    images,
    isAuctionListing,
    isAuctionEnded,
    didUserBid,
    isUserHighestBidder,
    currentHighestBid,
    currentTotalPayable,
    suggestedBidAmount,
    needsSubscription,
    currentUsername,
    realtimeBids,
    mergedBidsHistory,
    lastBidUpdate,
    
    // State
    purchaseStatus,
    isProcessing,
    showPurchaseSuccess,
    showAuctionSuccess,
    sellerProfile,
    showStickyBuy,
    bidAmount,
    bidStatus,
    biddingEnabled,
    bidsHistory,
    showBidHistory,
    forceUpdateTimer,
    viewCount,
    isBidding,
    bidError,
    bidSuccess,
    currentImageIndex,
    
    // Loading and error states
    isLoading,
    error,
    
    // Seller info - ADD THESE
    sellerTierInfo,
    isVerified,
    sellerAverageRating,
    sellerReviewCount,
    
    // Refs
    imageRef,
    bidInputRef,
    bidButtonRef,
    
    // Handlers
    handlePurchase,
    needsBidAddress,
    dismissBidAddressPrompt,
    handleBidSubmit,
    handleImageNavigation,
    handleBidAmountChange,
    updateState,
    getTimerProgress,
    formatTimeRemaining,
    formatBidDate,
    calculateTotalPayable,
    
    // Navigation
    router,
    
    // Error state
    rateLimitError
  } = useBrowseDetail(initialListing);

  // Use local listing state that can be updated
  const listing = localListing || contextListing;
  
  // Update local listing when context changes
  useEffect(() => {
    if (contextListing) {
      setLocalListing(contextListing);
    }
  }, [contextListing]);

  // Favorites functionality
  const { isFavorited: checkIsFavorited, toggleFavorite: toggleFav, error: favError } = useFavorites();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Generate consistent seller ID with null safety
  const sellerId = listing?.seller ? `seller_${listing.seller}` : null;
  const isFavorited = sellerId ? checkIsFavorited(sellerId) : false;

  // CRITICAL FIX: Properly determine if this is an auction
  const isActualAuction = !!(
    isAuctionListing && 
    listing?.auction && 
    (listing.auction.isAuction || listing.auction.startingPrice !== undefined)
  );

  // FIXED: Use the server's isLocked field directly instead of needsSubscription
  const isLockedPremium = listing?.isLocked === true;

  // Listen for subscription changes and refresh listing
  useEffect(() => {
    const handleSubscriptionChange = async (event: Event) => {
      // Type guard to check if it's a CustomEvent
      if (!(event instanceof CustomEvent)) return;
      
      console.log('[ListingDetailPage] Subscription changed:', event.detail);
      
      // Check if this affects the current listing
      if (listing && event.detail.seller === listing.seller && user && event.detail.buyer === user.username) {
        // Small delay to ensure backend has processed the change
        setTimeout(async () => {
          try {
            // Refresh the specific listing
            const result = await listingsService.getListing(listingId);
            if (result.success && result.data) {
              setLocalListing(result.data);
              
              // Show toast notification
              if (event.detail.action === 'subscribed') {
                toast.success('Premium content unlocked', {
                  duration: 3000,
                  style: {
                    background: 'var(--color-surface-raised)',
                    color: 'var(--color-ink)',
                    border: '1px solid var(--color-success)',
                  },
                });
              } else {
                toast('Premium content locked', {
                  duration: 3000,
                  style: {
                    background: 'var(--color-surface-raised)',
                    color: 'var(--color-ink)',
                    border: '1px solid var(--color-danger)',
                  },
                });
              }
            }
          } catch (error) {
            console.error('Failed to refresh listing:', error);
          }
        }, 500);
      }
    };

    window.addEventListener('subscription:changed', handleSubscriptionChange);
    
    return () => {
      window.removeEventListener('subscription:changed', handleSubscriptionChange);
    };
  }, [listing, listingId, user]);

  // Show toast notifications for bid events
  useEffect(() => {
    if (bidSuccess && isMountedRef.current) {
      toast.success(bidSuccess, {
        duration: 4000,
        style: {
          background: 'var(--color-surface-raised)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-success)',
        },
      });
    }
  }, [bidSuccess]);

  useEffect(() => {
    if (bidError && isMountedRef.current) {
      toast.error(bidError, {
        duration: 4000,
        style: {
          background: 'var(--color-surface-raised)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-danger)',
        },
      });
    }
  }, [bidError]);

  // Track component mount/unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Track product view when listing loads (with deduplication)
  useEffect(() => {
    if (listing && listingId && !trackingRef.current.hasTrackedView && isMountedRef.current) {
      trackingRef.current.hasTrackedView = true;
      
      try {
        trackEvent({
          action: 'view_item',
          category: 'browse',
          label: listingId,
          value: listing.price || 0,
          customData: {
            item_name: listing.title || 'Unknown',
            seller_name: listing.seller || 'Unknown',
            seller_verified: isVerified || false,
            is_premium: listing.isPremium || false,
            is_auction: isActualAuction || false
          }
        });
      } catch (error) {
        console.error('Failed to track view event:', error);
      }
    }
  }, [listing, listingId, isActualAuction, isVerified, trackEvent]);

  // Track purchase success (with deduplication)
  useEffect(() => {
    if (showPurchaseSuccess && listing && listingId && !trackingRef.current.hasTrackedPurchase && isMountedRef.current) {
      trackingRef.current.hasTrackedPurchase = true;
      
      try {
        trackPurchase({
          transactionId: `${listingId}_${Date.now()}`,
          value: listing.price || 0,
          currency: 'USD',
          items: [{
            id: listingId,
            name: listing.title || 'Unknown',
            category: listing.isPremium ? 'premium' : (listing.auction ? 'auction' : 'standard'),
            price: listing.price || 0,
            quantity: 1
          }]
        });
      } catch (error) {
        console.error('Failed to track purchase:', error);
      }
    }
  }, [showPurchaseSuccess, listing, listingId, trackPurchase]);

  // Track auction bid success
  useEffect(() => {
    if (bidSuccess && listing && listingId && isMountedRef.current) {
      try {
        trackEvent({
          action: 'add_to_cart',
          category: 'auction',
          label: listingId,
          value: parseFloat(bidAmount) || 0,
          customData: {
            item_name: listing.title || 'Unknown',
            seller_name: listing.seller || 'Unknown'
          }
        });
      } catch (error) {
        console.error('Failed to track bid success:', error);
      }
    }
  }, [bidSuccess, listing, listingId, bidAmount, trackEvent]);

  const toggleFavorite = useCallback(async () => {
    if (!listing || !sellerId || !isMountedRef.current) return;
    
    try {
      const sellerTier = sellerTierInfo?.tier || undefined;
      
      const success = await toggleFav({
        id: sellerId,
        username: listing.seller,
        profilePicture: sellerProfile?.pic || undefined,
        tier: sellerTier,
        isVerified: isVerified || false,
      });
      
      if (success && isMountedRef.current) {
        trackEvent({
          action: isFavorited ? 'remove_from_favorites' : 'add_to_favorites',
          category: 'engagement',
          label: listing.seller,
          customData: {
            seller_id: sellerId
          }
        });
        
        toast.success(
          isFavorited ? 'Removed from favorites' : 'Added to favorites',
          {
            duration: 3000,
            style: {
              background: 'var(--color-surface-raised)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-primary)',
            },
          }
        );
      } else if (favError && isMountedRef.current) {
        toast.error(favError);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      if (isMountedRef.current) {
        toast.error('Failed to update favorites');
      }
    }
  }, [listing, sellerId, sellerProfile, sellerTierInfo, isVerified, isFavorited, toggleFav, trackEvent, favError]);

  const handleSubscribeClick = useCallback(() => {
    if (listing?.seller && isMountedRef.current) {
      try {
        trackEvent({
          action: 'subscription_click',
          category: 'engagement',
          label: listing.seller
        });
        router.push(`/sellers/${listing.seller}`);
      } catch (error) {
        console.error('Failed to handle subscribe click:', error);
      }
    }
  }, [listing, trackEvent, router]);

  /* CHECKOUT BEFORE PAYMENT
   *
   * This used to call handlePurchase() directly, charging the buyer
   * immediately and collecting the shipping address afterwards from a
   * panel in My Orders.
   *
   * It now opens a confirmation step instead. The modal lives HERE, at
   * page level, on purpose: there are three ways to buy on this page --
   * PurchaseSection's button, the sticky bar, and the drop claim -- and a
   * modal owned by any one of them would leave the others charging with
   * no address.
   */
  /* Checkout needs the buyer's balance to show "wallet balance" and to
     disable Confirm when there are not enough funds. useBrowseDetail
     computes a balance internally but does not expose it, so the page
     reads the same source directly rather than duplicating the number. */
  const { getBuyerBalance } = useWallet();
  const buyerBalance = user?.username ? getBuyerBalance(user.username) : 0;

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const openCheckout = useCallback(() => {
    if (!listing) return;

    if (listingId) {
      trackEvent({
        action: 'begin_checkout',
        category: 'ecommerce',
        label: listingId,
        value: listing.price || 0,
      });
    }

    setCheckoutError(null);
    setCheckoutOpen(true);
  }, [listing, listingId, trackEvent]);

  const checkoutItem: CheckoutItem | null = useMemo(() => {
    if (!listing) return null;

    /* Auction listings carry no `price` -- it is stripped at creation --
       so a Buy Now checkout reads the auction's buyNowPrice instead.
       The server derives the real charge the same way and ignores
       anything the client sends, so this is display only. */
    const buyNow = Number((listing.auction as { buyNowPrice?: number } | undefined)?.buyNowPrice) || 0;
    const price = buyNow || Number(listing.price) || 0;
    const total = Number(listing.markedUpPrice) || Math.round(price * 1.1 * 100) / 100;
    const drop = (listing as { drop?: { isDrop?: boolean; unitsSold?: number; totalUnits?: number } }).drop;

    return {
      title: listing.title,
      imageUrl: listing.imageUrls?.[0] || null,
      seller: listing.seller,
      price,
      total,
      note: drop?.isDrop
        ? `Unit #${(drop.unitsSold ?? 0) + 1} of ${drop.totalUnits ?? 0}`
        : null,
    };
  }, [listing]);

  const handleCheckoutConfirm = useCallback(
    async (address: DeliveryAddress) => {
      if (!listing) return;

      setCheckoutError(null);

      try {
        if (listingId) {
          trackEvent({
            action: 'purchase_confirmed',
            category: 'ecommerce',
            label: listingId,
            value: listing.price || 0,
          });
        }
        // One purchase path now, and it carries the address the buyer
        // just confirmed.
        await handlePurchase(address);
        setCheckoutOpen(false);
      } catch (error) {
        console.error('Checkout failed:', error);
        setCheckoutError('Something went wrong. Your wallet has not been charged.');
      }
    },
    [listing, listingId, trackEvent, handlePurchase]
  );

  const handleBidSubmitWithAnalytics = useCallback(async () => {
    if (listing && bidAmount && listingId && isMountedRef.current) {
      try {
        trackEvent({
          action: 'place_bid',
          category: 'auction',
          label: listingId,
          value: parseFloat(bidAmount) || 0
        });
      } catch (error) {
        console.error('Failed to track bid attempt:', error);
      }
    }
    
    await handleBidSubmit();
  }, [listing, bidAmount, listingId, trackEvent, handleBidSubmit]);

  // Handle invalid listing ID
  if (!listingId) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Invalid Listing</h1>
            <p className="text-gray-400 mb-4">The listing URL is invalid or malformed.</p>
            <button
              onClick={() => router.push('/browse')}
              className="rounded-md bg-primary px-4 py-2 font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </BanCheck>
    );
  }

  /* Only spin when there is genuinely nothing to show. With a
     server-supplied listing the page renders immediately and the live
     data (current bid, drop counts) fills in underneath. */
  if (isLoading && !listing) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-gray-400">Loading listing details...</p>
          </motion.div>
        </div>
      </BanCheck>
    );
  }

  // Error state
  if (error) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Error Loading Listing</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/browse')}
              className="rounded-md bg-primary px-4 py-2 font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </BanCheck>
    );
  }

  // Not found state
  if (!listing) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
            <p className="text-gray-400 mb-4">This listing may have been removed or sold.</p>
            <button
              onClick={() => router.push('/browse')}
              className="rounded-md bg-primary px-4 py-2 font-semibold text-black transition-colors hover:bg-primary-hover"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <Toaster position="top-center" />
      <main className="min-h-screen bg-black text-white">
        <DetailHeader onBack={() => router.push('/browse')} />

        <div className="mx-auto max-w-6xl px-4 py-6">
          {/* Rate Limit Error */}
          <AnimatePresence>
            {rateLimitError && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{rateLimitError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Image Gallery */}
            <motion.div 
              ref={imageRef}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ImageGallery
                images={images}
                currentIndex={currentImageIndex}
                onIndexChange={(index) => handleImageNavigation(index)}
                listing={listing}
                isLockedPremium={isLockedPremium}
                viewCount={viewCount}
                isAuctionListing={isActualAuction}
                isAuctionEnded={isAuctionEnded}
                formatTimeRemaining={formatTimeRemaining}
                forceUpdateTimer={forceUpdateTimer}
              />
            </motion.div>

            {/* Right: Product Details */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <ProductInfo listing={listing} />

              {/* CRITICAL FIX: Only render AuctionSection for ACTUAL auctions */}
              {isActualAuction && listing.auction && (
                <AuctionSection
                  listing={listing}
                  isAuctionEnded={isAuctionEnded}
                  formatTimeRemaining={formatTimeRemaining}
                  currentHighestBid={currentHighestBid}
                  currentTotalPayable={currentTotalPayable}
                  getTimerProgress={getTimerProgress}
                  bidAmount={bidAmount}
                  onBidAmountChange={handleBidAmountChange}
                  onBidSubmit={handleBidSubmitWithAnalytics}
                  onBuyNow={openCheckout}
                  onBidKeyPress={(e) => e.key === 'Enter' && handleBidSubmitWithAnalytics()}
                  isBidding={isBidding}
                  biddingEnabled={biddingEnabled}
                  bidError={bidError}
                  bidSuccess={bidSuccess}
                  bidStatus={bidStatus}
                  suggestedBidAmount={suggestedBidAmount}
                  onShowBidHistory={() => updateState({ showBidHistory: true })}
                  bidsCount={mergedBidsHistory?.length || bidsHistory?.length || 0}
                  userRole={user?.role}
                  username={user?.username}
                  bidInputRef={bidInputRef}
                  bidButtonRef={bidButtonRef}
                  realtimeBids={realtimeBids}
                  mergedBidsHistory={mergedBidsHistory}
                />
              )}

              {/* DROP STATUS  --  one listing, N numbered units. Counters
                  arrive live over the `drop:update` websocket event, so
                  this bar moves while people watch. */}
              {(() => {
                const drop = (listing as { drop?: DropInfo }).drop;
                if (!drop?.isDrop) return null;
                const soldOut = drop.unitsRemaining <= 0 || (listing as any).status === 'sold';
                const opensAt = drop.scheduledFor ? new Date(drop.scheduledFor) : null;
                const notOpenYet = !!opensAt && opensAt.getTime() > Date.now();
                const pct = drop.totalUnits > 0
                  ? Math.round((drop.unitsSold / drop.totalUnits) * 100)
                  : 0;
                return (
                  <div className="rounded-lg border border-primary-line bg-surface-raised p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-black">
                        Drop
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-ink">
                        {soldOut
                          ? 'Sold out'
                          : `${drop.unitsRemaining} of ${drop.totalUnits} remaining`}
                      </span>
                    </div>
                    <div
                      className="mt-3 h-2 overflow-hidden rounded-full bg-surface-overlay"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Units claimed"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">
                      {notOpenYet
                        ? `Opens ${opensAt!.toLocaleString()}`
                        : soldOut
                          ? `All ${drop.totalUnits} numbered units claimed.`
                          : `Each purchase claims the next numbered unit  --  put on during the seller's filmed drop.`}
                    </p>
                  </div>
                );
              })()}

              {/* Price & Actions for Standard Listings - Show for non-auctions */}
              {!isActualAuction && (
                <PurchaseSection
                  listing={listing}
                  user={user}
                  handlePurchase={openCheckout}
                  onRequestCheckout={openCheckout}
                  isProcessing={isProcessing}
                  isFavorited={isFavorited}
                  toggleFavorite={toggleFavorite}
                  onSubscribeClick={handleSubscribeClick}
                />
              )}

              {/* Purchase Status */}
              <AnimatePresence>
                {purchaseStatus && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl font-medium ${
                      purchaseStatus.includes('successful') 
                        ? 'bg-green-900/30 border border-green-800 text-green-400' 
                        : 'bg-red-900/30 border border-red-800 text-red-400'
                    }`}
                  >
                    {purchaseStatus}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Premium Content Lock - FIXED: Use isLocked field */}
              {isLockedPremium && (
                <PremiumLockMessage listing={listing} userRole={user?.role} />
              )}

              {/* Seller card.
                  Previously gated behind user?.role === 'buyer', so
                  sellers, admins and signed-out visitors saw no seller
                  at all on a listing page. Who made this is the single
                  most important thing on the page  --  it shows for
                  everyone. */}
              <SellerProfile
                seller={listing.seller}
                sellerProfile={sellerProfile}
                sellerTierInfo={sellerTierInfo}
                sellerAverageRating={sellerAverageRating}
                sellerReviewCount={sellerReviewCount}
                isVerified={isVerified}
              />

              {/* Renders nothing until the seller has a review, so a new
                  seller's page does not carry an empty heading. */}
              <SellerReviews seller={listing.seller} />

              {/* Trust & Safety */}
              <TrustBadges />
            </motion.div>
          </div>

          <RelatedListings
            currentListingId={listingId}
            seller={listing.seller}
            tags={listing.tags}
          />

          {/* Modals */}
          <BidHistoryModal
            show={showBidHistory}
            onClose={() => updateState({ showBidHistory: false })}
            bidsHistory={bidsHistory}
            currentUsername={currentUsername}
            formatBidDate={formatBidDate}
            calculateTotalPayable={calculateTotalPayable}
          />

          <PurchaseSuccessModal
            showPurchaseSuccess={showPurchaseSuccess}
            showAuctionSuccess={showAuctionSuccess}
            isAuctionListing={isActualAuction}
            listing={listing}
            isUserHighestBidder={isUserHighestBidder}
            userRole={user?.role}
            calculateTotalPayable={calculateTotalPayable}
            onNavigate={router.push}
          />

          <AuctionEndedModal
            isAuctionListing={isActualAuction}
            isAuctionEnded={isAuctionEnded}
            listing={listing}
            isUserHighestBidder={isUserHighestBidder}
            didUserBid={didUserBid}
            userRole={user?.role}
            username={user?.username}
            bidsHistory={bidsHistory}
            onNavigate={router.push}
          />

          {/* Sticky Buy Button for Mobile - FIXED: Use isLocked field */}
          <StickyPurchaseBar
            show={showStickyBuy}
            listing={listing}
            isProcessing={isProcessing}
            needsSubscription={isLockedPremium}
            isAuctionListing={isActualAuction}
            userRole={user?.role}
            onPurchase={openCheckout}
          />
        </div>

        <CheckoutModal
          open={checkoutOpen}
          item={checkoutItem}
          balance={typeof buyerBalance === 'number' ? buyerBalance : 0}
          isProcessing={isProcessing}
          error={checkoutError}
          onCancel={() => setCheckoutOpen(false)}
          onConfirm={handleCheckoutConfirm}
        />

        {/* Post-bid address prompt. Fires AFTER a bid succeeds, never
            before -- auctions are won by seconds and a form in front of
            the bid would cost people listings. Asked once: the address
            saves to the account, so re-bidding stays silent and auction
            settlement can ship the win. */}
        {/* Post-bid prompt only. Gated on !checkoutOpen so it can never
            stack on top of checkout: both render fixed overlays at z-50,
            and whichever mounts last wins -- which is how checkout ended
            up flashing and then being replaced by this dialog. Checkout
            now collects the address inline anyway, so the two never need
            to be open together. */}
        <AddressConfirmationModal
          isOpen={needsBidAddress && !checkoutOpen}
          onClose={dismissBidAddressPrompt}
          onConfirm={async (address: DeliveryAddress) => {
            await deliveryAddressService.save(address);
            dismissBidAddressPrompt();
          }}
          existingAddress={null}
          orderId="bid"
        />
      </main>
    </BanCheck>
  );
}

