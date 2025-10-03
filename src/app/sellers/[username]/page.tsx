// src/app/sellers/[username]/page.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import BanCheck from '@/components/BanCheck';
import ProfileHeader from '@/components/seller-profile/ProfileHeader';
import ProfileGallery from '@/components/seller-profile/ProfileGallery';
import ReviewsSection from '@/components/seller-profile/ReviewsSection';
import ListingsGrid from '@/components/seller-profile/ListingsGrid';
import SubscribeModal from '@/components/seller-profile/modals/SubscribeModal';
import UnsubscribeModal from '@/components/seller-profile/modals/UnsubscribeModal';
import TipModal from '@/components/seller-profile/modals/TipModal';
import GalleryModal from '@/components/seller-profile/modals/GalleryModal';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Memoized components for better performance
const MemoizedProfileHeader = React.memo(ProfileHeader);
const MemoizedListingsGrid = React.memo(ListingsGrid);
const MemoizedProfileGallery = React.memo(ProfileGallery);
const MemoizedReviewsSection = React.memo(ReviewsSection);

export default function SellerProfilePage() {
  const rawParams = useParams();
  const rawUsername = (rawParams as any)?.username;
  const usernameParam = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;
  const safeUsername = typeof usernameParam === 'string' ? sanitizeStrict(usernameParam) : '';

  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { isFavorited: checkIsFavorited, toggleFavorite: toggleFav, error: favError } = useFavorites();

  // Validate username parameter
  if (!safeUsername) {
    return (
      <BanCheck>
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Profile</h1>
            <p className="text-gray-400">The username parameter is missing or invalid.</p>
          </div>
        </main>
      </BanCheck>
    );
  }

  const {
    // User data
    user,
    sellerUser,
    isVerified,

    // Profile data
    bio,
    profilePic,
    subscriptionPrice,
    galleryImages,
    sellerTierInfo,

    // Stats
    totalPhotos,
    totalVideos,
    followers,
    averageRating,
    reviews,

    // Listings
    standardListings,
    premiumListings,

    // Access control
    hasAccess,
    hasPurchased,
    alreadyReviewed,

    // Slideshow
    slideIndex,
    isPaused,

    // Modals
    showSubscribeModal,
    showUnsubscribeModal,
    showTipModal,
    showGalleryModal,
    selectedImage,
    currentImageIndex,
    showToast,

    // Form state
    tipAmount,
    tipSuccess,
    tipError,
    rating,
    comment,
    submitted,

    // Handlers
    setShowSubscribeModal,
    setShowUnsubscribeModal,
    setShowTipModal,
    setShowGalleryModal,
    setSlideIndex,
    setIsPaused,
    setTipAmount,
    setRating,
    setComment,
    handleConfirmSubscribe,
    handleConfirmUnsubscribe,
    handleTipSubmit,
    handleReviewSubmit,
    handleImageClick,
    handlePrevImage,
    handleNextImage,
    closeGalleryModal,
    togglePause,
    goToPrevSlide,
    goToNextSlide,
  } = useSellerProfile(safeUsername);

  // Memoize seller ID generation to prevent unnecessary recalculations
  const sellerId = useMemo(() => (safeUsername ? `seller_${safeUsername}` : ''), [safeUsername]);

  // Memoize favorite status check
  const isFavorited = useMemo(() => {
    try {
      return sellerId ? checkIsFavorited(sellerId) : false;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  }, [checkIsFavorited, sellerId]);

  // Memoized toggle favorite handler
  const toggleFavorite = useCallback(async () => {
    if (!sellerUser) {
      console.warn('Cannot toggle favorite: sellerUser not available');
      return;
    }

    try {
      const success = await toggleFav({
        id: sellerId,
        username: sellerUser.username,
        profilePicture: profilePic || undefined,
        tier: sellerTierInfo?.tier,
        isVerified: isVerified,
      });

      if (success) {
        showSuccessToast(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      } else if (favError) {
        showErrorToast(favError);
      } else {
        showErrorToast('Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showErrorToast('An error occurred while updating favorites');
    }
  }, [
    sellerUser,
    sellerId,
    profilePic,
    sellerTierInfo?.tier,
    isVerified,
    isFavorited,
    toggleFav,
    showSuccessToast,
    showErrorToast,
    favError,
  ]);

  // Memoized modal handlers to prevent unnecessary re-renders
  const modalHandlers = useMemo(
    () => ({
      onShowSubscribeModal: () => setShowSubscribeModal(true),
      onShowUnsubscribeModal: () => setShowUnsubscribeModal(true),
      onShowTipModal: () => setShowTipModal(true),
      onCloseSubscribeModal: () => setShowSubscribeModal(false),
      onCloseUnsubscribeModal: () => setShowUnsubscribeModal(false),
      onCloseTipModal: () => setShowTipModal(false),
    }),
    [setShowSubscribeModal, setShowUnsubscribeModal, setShowTipModal]
  );

  // Validate required data before rendering
  if (!user) {
    return (
      <BanCheck>
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </main>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <main className="min-h-screen bg-black text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#13030a] to-black" aria-hidden="true" />
          <div
            className="absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(circle_at_top,_rgba(255,149,14,0.35),_transparent_65%)] blur-3xl"
            aria-hidden="true"
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-12">
          {showToast && (
            <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
              ✅ Subscribed to {safeUsername} successfully!
            </div>
          )}

          {/* Profile Header */}
          <MemoizedProfileHeader
            username={safeUsername}
            profilePic={profilePic}
            bio={bio}
            isVerified={isVerified}
            sellerTierInfo={sellerTierInfo}
            user={user}
            onShowSubscribeModal={modalHandlers.onShowSubscribeModal}
            onShowUnsubscribeModal={modalHandlers.onShowUnsubscribeModal}
            onShowTipModal={modalHandlers.onShowTipModal}
            hasAccess={hasAccess}
            subscriptionPrice={subscriptionPrice}
            totalPhotos={totalPhotos}
            totalVideos={totalVideos}
            followers={followers}
            averageRating={averageRating}
            reviewsCount={reviews?.length || 0}
            isFavorited={isFavorited}
            onToggleFavorite={toggleFavorite}
          />

          <nav className="mt-10 flex justify-center">
            <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur">
              <a href="#listings" className="text-sm font-semibold tracking-wide text-gray-200 hover:text-white transition">
                Listings
              </a>
              {galleryImages && galleryImages.length > 0 && (
                <a href="#gallery" className="text-sm font-semibold tracking-wide text-gray-200 hover:text-white transition">
                  Gallery
                </a>
              )}
              <a href="#reviews" className="text-sm font-semibold tracking-wide text-gray-200 hover:text-white transition">
                Reviews
              </a>
            </div>
          </nav>

          {/* Listings Grid */}
          <section id="listings" className="scroll-mt-32">
            <MemoizedListingsGrid
              standardListings={standardListings}
              premiumListings={premiumListings}
              hasAccess={hasAccess}
              username={safeUsername}
              user={user}
              onShowSubscribeModal={modalHandlers.onShowSubscribeModal}
            />
          </section>

          {/* Gallery Section */}
          {galleryImages && galleryImages.length > 0 && (
            <section id="gallery" className="scroll-mt-32">
              <MemoizedProfileGallery
                galleryImages={galleryImages}
                slideIndex={slideIndex}
                isPaused={isPaused}
                onSlideChange={setSlideIndex}
                onTogglePause={togglePause}
                onImageClick={handleImageClick}
                onPrevSlide={goToPrevSlide}
                onNextSlide={goToNextSlide}
              />
            </section>
          )}

          {/* Reviews Section */}
          <section id="reviews" className="scroll-mt-32">
            <MemoizedReviewsSection
              reviews={reviews || []}
              canReview={hasPurchased && !alreadyReviewed && user?.role === 'buyer'}
              rating={rating}
              comment={comment}
              submitted={submitted}
              onRatingChange={setRating}
              onCommentChange={setComment}
              onSubmit={handleReviewSubmit}
            />
          </section>

          {/* Modals */}
          {showTipModal && (
            <TipModal
              show={showTipModal}
              username={safeUsername}
              tipAmount={tipAmount}
              tipSuccess={tipSuccess}
              tipError={tipError}
              onAmountChange={setTipAmount}
              onClose={modalHandlers.onCloseTipModal}
              onSubmit={handleTipSubmit}
            />
          )}

          {showSubscribeModal && (
            <SubscribeModal
              show={showSubscribeModal}
              username={safeUsername}
              subscriptionPrice={subscriptionPrice}
              onClose={modalHandlers.onCloseSubscribeModal}
              onConfirm={handleConfirmSubscribe}
            />
          )}

          {showUnsubscribeModal && (
            <UnsubscribeModal
              show={showUnsubscribeModal}
              username={safeUsername}
              onClose={modalHandlers.onCloseUnsubscribeModal}
              onConfirm={handleConfirmUnsubscribe}
            />
          )}

          {showGalleryModal && selectedImage && (
            <GalleryModal
              show={showGalleryModal}
              selectedImage={selectedImage}
              currentImageIndex={currentImageIndex}
              galleryImages={galleryImages || []}
              onClose={closeGalleryModal}
              onPrevious={handlePrevImage}
              onNext={handleNextImage}
            />
          )}
        </div>
      </main>
    </BanCheck>
  );
}
