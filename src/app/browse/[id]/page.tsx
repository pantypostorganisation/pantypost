// src/app/browse/[id]/page.tsx
'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import BanCheck from '@/components/BanCheck';
import DetailHeader from '@/components/browse-detail/DetailHeader';
import ImageGallery from '@/components/browse-detail/ImageGallery';
import ProductInfo from '@/components/browse-detail/ProductInfo';
import AuctionSection from '@/components/browse-detail/AuctionSection';
import PurchaseSection from '@/components/browse-detail/PurchaseSection';
import SellerProfile from '@/components/browse-detail/SellerProfile';
import TrustBadges from '@/components/browse-detail/TrustBadges';
import BidHistoryModal from '@/components/browse-detail/BidHistoryModal';
import AuctionEndedModal from '@/components/browse-detail/AuctionEndedModal';
import PurchaseSuccessModal from '@/components/browse-detail/PurchaseSuccessModal';
import StickyPurchaseBar from '@/components/browse-detail/StickyPurchaseBar';
import PremiumLockMessage from '@/components/browse-detail/PremiumLockMessage';
import { useBrowseDetail } from '@/hooks/useBrowseDetail';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function ListingDetailPage() {
  const { trackEvent, trackPurchase } = useAnalytics();
  const isMountedRef = useRef(true);
  const trackingRef = useRef({ hasTrackedView: false, hasTrackedPurchase: false });
  const [viewerCount, setViewerCount] = useState(Math.floor(Math.random() * 10) + 3);
  
  const {
    // Data
    user,
    listing,
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
    
    // Refs
    imageRef,
    bidInputRef,
    bidButtonRef,
    
    // Handlers
    handlePurchase,
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
  } = useBrowseDetail();

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

  // Simulate viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, prev + change);
      });
    }, Math.random() * 10000 + 5000);
    return () => clearInterval(interval);
  }, []);

  // Show toast notifications for bid events
  useEffect(() => {
    if (bidSuccess && isMountedRef.current) {
      toast.success(bidSuccess, {
        duration: 4000,
        icon: '🎉',
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #22c55e',
        },
      });
    }
  }, [bidSuccess]);

  useEffect(() => {
    if (bidError && isMountedRef.current) {
      toast.error(bidError, {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #ef4444',
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
            seller_verified: (listing.isSellerVerified ?? listing.isVerified) || false,
            is_premium: listing.isPremium || false,
            is_auction: isActualAuction || false
          }
        });
      } catch (error) {
        console.error('Failed to track view event:', error);
      }
    }
  }, [listing, listingId, isActualAuction, trackEvent]);

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
      const sellerTier = listing.sellerTierInfo?.tier || undefined;
      
      const success = await toggleFav({
        id: sellerId,
        username: listing.seller,
        profilePicture: sellerProfile?.pic || undefined,
        tier: sellerTier,
        isVerified: (listing.isSellerVerified ?? listing.isVerified) || false,
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
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #ff950e',
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
  }, [listing, sellerId, sellerProfile, isFavorited, toggleFav, trackEvent, favError]);

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

  const handlePurchaseWithAnalytics = useCallback(async () => {
    if (listing && listingId && isMountedRef.current) {
      try {
        trackEvent({
          action: 'begin_checkout',
          category: 'ecommerce',
          label: listingId,
          value: listing.price || 0
        });
      } catch (error) {
        console.error('Failed to track purchase attempt:', error);
      }
    }
    
    await handlePurchase();
  }, [listing, listingId, trackEvent, handlePurchase]);

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
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </BanCheck>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-4" />
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
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors"
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
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition-colors"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </BanCheck>
    );
  }

  const isLockedPremium = listing.isPremium && needsSubscription;

  return (
    <BanCheck>
      <Toaster position="top-center" />
      <main className="min-h-screen bg-black text-white">
        <DetailHeader onBack={() => router.push('/browse')} />

        <div className="max-w-7xl mx-auto px-4 py-6">
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
                  viewerCount={viewerCount}
                />
              )}

              {/* Price & Actions for Standard Listings - Show for non-auctions */}
              {!isActualAuction && (
                <PurchaseSection
                  listing={listing}
                  user={user}
                  handlePurchase={handlePurchaseWithAnalytics}
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

             {/* Premium Content Lock */}
             {needsSubscription && (
               <PremiumLockMessage listing={listing} userRole={user?.role} />
             )}

             {/* Seller Profile */}
             {user?.role === 'buyer' && (
               <SellerProfile
                 seller={listing.seller}
                 sellerProfile={sellerProfile}
                 sellerTierInfo={listing.sellerTierInfo}
                 sellerAverageRating={listing.sellerAverageRating}
                 sellerReviewCount={listing.sellerReviewCount || 0}
                 isVerified={(listing.isSellerVerified ?? listing.isVerified) || false}
               />
             )}

             {/* Trust & Safety */}
             <TrustBadges />
           </motion.div>
         </div>

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

         {/* Sticky Buy Button for Mobile */}
         <StickyPurchaseBar
           show={showStickyBuy}
           listing={listing}
           isProcessing={isProcessing}
           needsSubscription={needsSubscription}
           isAuctionListing={isActualAuction}
           userRole={user?.role}
           onPurchase={handlePurchaseWithAnalytics}
         />
       </div>
     </main>
   </BanCheck>
 );
}
