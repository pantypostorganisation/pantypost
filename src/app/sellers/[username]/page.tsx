// src/app/sellers/[username]/page.tsx
'use client';

import React from 'react';
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

// Optional: Memoize components for better performance
const MemoizedProfileHeader = React.memo(ProfileHeader);
const MemoizedListingsGrid = React.memo(ListingsGrid);
const MemoizedProfileGallery = React.memo(ProfileGallery);
const MemoizedReviewsSection = React.memo(ReviewsSection);

export default function SellerProfilePage() {
  const { username } = useParams<{ username: string }>();
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
  } = useSellerProfile(username);

  return (
    <BanCheck>
      <main className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {showToast && (
            <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
              ✅ Subscribed to {username} successfully!
            </div>
          )}

          {/* Profile Header */}
          <MemoizedProfileHeader
            username={username}
            profilePic={profilePic}
            bio={bio}
            isVerified={isVerified}
            sellerTierInfo={sellerTierInfo}
            user={user}
            onShowSubscribeModal={() => setShowSubscribeModal(true)}
            onShowUnsubscribeModal={() => setShowUnsubscribeModal(true)}
            onShowTipModal={() => setShowTipModal(true)}
            hasAccess={hasAccess}
            subscriptionPrice={subscriptionPrice}
            totalPhotos={totalPhotos}
            totalVideos={totalVideos}
            followers={followers}
            averageRating={averageRating}
            reviewsCount={reviews.length}
          />

          {/* Listings Grid */}
          <MemoizedListingsGrid
            standardListings={standardListings}
            premiumListings={premiumListings}
            hasAccess={hasAccess}
            username={username}
            user={user}
            onShowSubscribeModal={() => setShowSubscribeModal(true)}
          />

          {/* Gallery Section */}
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

          {/* Reviews Section */}
          <MemoizedReviewsSection
            reviews={reviews}
            canReview={hasPurchased && !alreadyReviewed && user?.role === 'buyer'}
            rating={rating}
            comment={comment}
            submitted={submitted}
            onRatingChange={setRating}
            onCommentChange={setComment}
            onSubmit={handleReviewSubmit}
          />

          {/* Modals - These don't need memoization as they're conditionally rendered */}
          <TipModal
            show={showTipModal}
            username={username}
            tipAmount={tipAmount}
            tipSuccess={tipSuccess}
            tipError={tipError}
            onAmountChange={setTipAmount}
            onClose={() => setShowTipModal(false)}
            onSubmit={handleTipSubmit}
          />

          <SubscribeModal
            show={showSubscribeModal}
            username={username}
            subscriptionPrice={subscriptionPrice}
            onClose={() => setShowSubscribeModal(false)}
            onConfirm={handleConfirmSubscribe}
          />

          <UnsubscribeModal
            show={showUnsubscribeModal}
            username={username}
            onClose={() => setShowUnsubscribeModal(false)}
            onConfirm={handleConfirmUnsubscribe}
          />

          <GalleryModal
            show={showGalleryModal}
            selectedImage={selectedImage}
            currentImageIndex={currentImageIndex}
            galleryImages={galleryImages}
            onClose={closeGalleryModal}
            onPrevious={handlePrevImage}
            onNext={handleNextImage}
          />
        </div>
      </main>
    </BanCheck>
  );
}