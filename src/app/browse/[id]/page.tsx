// src/app/browse/[id]/page.tsx
'use client';

import { useState } from 'react';
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
import { AlertCircle } from 'lucide-react';

export default function ListingDetailPage() {
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

  // Local state for favorites (you might want to move this to a context or hook)
  const [isFavorited, setIsFavorited] = useState(false);

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: Implement actual favorite saving logic
  };

  const handleSubscribeClick = () => {
    if (listing?.seller) {
      router.push(`/sellers/${listing.seller}`);
    }
  };

  if (!listingId) {
    return (
      <BanCheck>
        <div className="text-white text-center p-10">Invalid listing URL.</div>
      </BanCheck>
    );
  }

  if (!listing) {
    return (
      <BanCheck>
        <div className="p-10 text-lg font-medium text-center text-white">Listing not found.</div>
      </BanCheck>
    );
  }

  const isLockedPremium = listing.isPremium && needsSubscription;

  return (
    <BanCheck>
      <main className="min-h-screen bg-black text-white">
        <DetailHeader onBack={() => router.push('/browse')} />

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Rate Limit Error */}
          {rateLimitError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{rateLimitError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Image Gallery */}
            <div ref={imageRef}>
              <ImageGallery
                images={images}
                currentIndex={currentImageIndex}
                onIndexChange={(index) => handleImageNavigation(index)}
                listing={listing}
                isLockedPremium={isLockedPremium}
                viewCount={viewCount}
                isAuctionListing={isAuctionListing}
                isAuctionEnded={isAuctionEnded}
                formatTimeRemaining={formatTimeRemaining}
                forceUpdateTimer={forceUpdateTimer}
              />
            </div>

            {/* Right: Product Details */}
            <div className="space-y-4">
              <ProductInfo listing={listing} />

              {/* Auction Details */}
              {isAuctionListing && listing.auction && (
                <AuctionSection
                  listing={listing}
                  isAuctionEnded={isAuctionEnded}
                  formatTimeRemaining={formatTimeRemaining}
                  currentHighestBid={currentHighestBid}
                  currentTotalPayable={currentTotalPayable}
                  getTimerProgress={getTimerProgress}
                  bidAmount={bidAmount}
                  onBidAmountChange={handleBidAmountChange}
                  onBidSubmit={handleBidSubmit}
                  onBidKeyPress={(e) => e.key === 'Enter' && handleBidSubmit()}
                  isBidding={isBidding}
                  biddingEnabled={biddingEnabled}
                  bidError={bidError}
                  bidSuccess={bidSuccess}
                  bidStatus={bidStatus}
                  suggestedBidAmount={suggestedBidAmount}
                  onShowBidHistory={() => updateState({ showBidHistory: true })}
                  bidsCount={listing.auction.bids?.length || 0}
                  userRole={user?.role}
                  username={user?.username}
                  bidInputRef={bidInputRef}
                  bidButtonRef={bidButtonRef}
                />
              )}

              {/* Price & Actions for Standard Listings */}
              {!isAuctionListing && (
                <PurchaseSection
                  listing={listing}
                  user={user}
                  handlePurchase={handlePurchase}
                  isProcessing={isProcessing}
                  isFavorited={isFavorited}
                  toggleFavorite={toggleFavorite}
                  onSubscribeClick={handleSubscribeClick}
                />
              )}

              {/* Purchase Status */}
              {purchaseStatus && (
                <div className={`p-4 rounded-xl font-medium ${
                  purchaseStatus.includes('successful') 
                    ? 'bg-green-900/30 border border-green-800 text-green-400' 
                    : 'bg-red-900/30 border border-red-800 text-red-400'
                }`}>
                  {purchaseStatus}
                </div>
              )}

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
                  isVerified={listing.isSellerVerified || false}
                />
              )}

              {/* Trust & Safety */}
              <TrustBadges />
            </div>
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
            isAuctionListing={isAuctionListing}
            listing={listing}
            isUserHighestBidder={isUserHighestBidder}
            userRole={user?.role}
            calculateTotalPayable={calculateTotalPayable}
            onNavigate={router.push}
          />

          <AuctionEndedModal
            isAuctionListing={isAuctionListing}
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
            isAuctionListing={isAuctionListing}
            userRole={user?.role}
            onPurchase={handlePurchase}
          />
        </div>
      </main>
    </BanCheck>
  );
}
