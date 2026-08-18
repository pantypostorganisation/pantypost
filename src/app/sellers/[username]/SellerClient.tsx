// src/app/sellers/[username]/SellerClient.tsx
//
// This was page.tsx. It is unchanged apart from the filename and the
// component name: page.tsx is now a SERVER component whose only job is
// generateMetadata, and it renders this.
//
// Splitting it that way is deliberate. Every seller shop previously
// shared the homepage title and description, so Google saw dozens of
// near-identical pages and indexed almost none of them -- the same
// failure that kept the blog guides out of the index. Metadata has to be
// server-rendered to exist for a crawler, but this page needs hooks, and
// a component cannot be both. So the server wrapper supplies the
// metadata and this file keeps the interactivity untouched.
'use client';

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

export default function SellerClient() {
  const rawParams = useParams() as Record<string, string | string[] | undefined> | null;
  const router = useRouter();
  const rawUsername = rawParams?.username;
  const usernameParam = Array.isArray(rawUsername) ? rawUsername[0] : rawUsername;
  const safeUsername = typeof usernameParam === 'string' ? sanitizeStrict(usernameParam) : '';

  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const { isFavorited: checkIsFavorited, toggleFavorite: toggleFav, error: favError } = useFavorites();

  // NOTE: the invalid-username guard used to sit here, above the hook
  // calls below, which meant React saw a different number of hooks on
  // different renders. The check now happens after every hook has run.
  // useSellerProfile('') is a no-op, so calling it costs nothing.
  const {
    // User data
    user,
    sellerUser,
    hasLoaded,
    isVerified,

    // Profile data
    bio,
    profilePic,
    coverPhoto,
    subscriptionPrice,
    galleryImages,
    sellerTierInfo,
    country,
    isLocationPublic,

    // Stats
    averageRating,
    reviews,
    reviewCount,
    totalSales,
    listingCount,
    memberSince,

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
    setSlideIndex,
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

  const isOwnProfile = Boolean(user?.username && user.username === safeUsername);

  // Who gets which actions:
  //   - own profile        → none
  //   - signed out         → none (all three require an account anyway)
  //   - buyer              → message, subscribe/unsubscribe, tip, favourite
  //   - other seller/admin → message and favourite only
  const canAct = Boolean(user) && !isOwnProfile;
  const canTransact = canAct && user?.role === 'buyer';

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

  // Buyers and sellers have separate inboxes, so the destination depends
  // on who is looking.
  const handleMessage = useCallback(() => {
    if (!safeUsername) return;
    const thread = encodeURIComponent(safeUsername);
    const inbox = user?.role === 'buyer' ? '/buyers/messages' : '/sellers/messages';
    router.push(`${inbox}?thread=${thread}`);
  }, [router, safeUsername, user?.role]);

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

  /* THIS GATE WAS BLOCKING EVERY LOGGED-OUT VISITOR.
   *
   * `user` is the VIEWER, from useAuth -- not the seller. So
   * `if (!user)` meant "if nobody is signed in", and the page returned a
   * spinner labelled "Loading profile..." that could never resolve,
   * because a signed-out visitor never becomes signed in by waiting.
   *
   * Anyone following a link to a seller's shop without an account saw a
   * permanent loading spinner. So did every crawler, which is the real
   * reason these pages could not rank no matter how good their metadata
   * was.
   *
   * The data was never the problem: useSellerProfile's fetch only guards
   * on `!username`, so seller data loads perfectly well without a token.
   *
   * The correct gate is on the SELLER, and only while genuinely still
   * loading. */
  if (!sellerUser && !hasLoaded) {
    return (
      <BanCheck>
        <main className="flex min-h-screen items-center justify-center bg-surface text-white">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary-line border-t-primary" />
            <p className="text-ink-muted">Loading profile...</p>
          </div>
        </main>
      </BanCheck>
    );
  }

  /* Loaded, but there is no such seller. Previously unreachable, because
     the gate above caught everyone first. */
  if (!sellerUser) {
    return (
      <BanCheck>
        <main className="flex min-h-screen items-center justify-center bg-surface px-4 text-white">
          <div className="text-center">
            <h1 className="mb-2 text-xl font-bold">Seller not found</h1>
            <p className="mb-6 text-sm text-ink-muted">
              This shop does not exist, or it is no longer available.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-hover"
            >
              <span className="text-black">Browse listings</span>
            </Link>
          </div>
        </main>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <main className="min-h-screen bg-black text-white">
        {showToast && (
          <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
            ✅ Subscribed to {safeUsername} successfully!
          </div>
        )}

        {/* Profile Header
            Sits outside the content container: the cover banner is
            full-bleed, and the header manages its own max-width for the
            identity row below it. */}
        <MemoizedProfileHeader
          username={safeUsername}
          profilePic={profilePic}
          coverPhoto={coverPhoto}
          bio={bio}
          isVerified={isVerified}
          sellerTierInfo={sellerTierInfo}
          averageRating={averageRating}
          reviewCount={reviewCount}
          totalSales={totalSales}
          listingCount={listingCount}
          memberSince={memberSince}
          location={isLocationPublic ? country : null}
          isOwnProfile={isOwnProfile}
          hasAccess={hasAccess}
          subscriptionPrice={subscriptionPrice}
          isFavorited={isFavorited}
          onToggleFavorite={canAct ? toggleFavorite : undefined}
          onMessage={canAct ? handleMessage : undefined}
          onSubscribe={canTransact ? modalHandlers.onShowSubscribeModal : undefined}
          onUnsubscribe={canTransact ? modalHandlers.onShowUnsubscribeModal : undefined}
          onTip={canTransact ? modalHandlers.onShowTipModal : undefined}
        />

        {/* Matches the header's max-w-6xl so the avatar and the listings
            grid share a left edge. */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          {/* Listings Grid */}
          <MemoizedListingsGrid
            standardListings={standardListings}
            premiumListings={premiumListings}
            hasAccess={hasAccess}
            username={safeUsername}
            user={user}
            onShowSubscribeModal={modalHandlers.onShowSubscribeModal}
          />

          {/* Gallery Section */}
          {galleryImages && galleryImages.length > 0 && (
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
          )}

          {/* Reviews Section */}
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