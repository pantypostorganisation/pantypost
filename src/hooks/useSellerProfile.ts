// src/hooks/useSellerProfile.ts
import { useSellerProfileData } from './profile/useSellerProfileData';
import { useSellerSubscription } from './profile/useSellerSubscription';
import { useSellerListings } from './profile/useSellerListings';
import { useSellerGallery } from './profile/useSellerGallery';
import { useSellerReviews } from './profile/useSellerReviews';
import { useSellerTips } from './profile/useSellerTips';

export function useSellerProfile(username: string) {
  // Get profile data
  const profileData = useSellerProfileData(username);
  
  // Get subscription functionality
  const subscription = useSellerSubscription(username, profileData.subscriptionPrice);
  
  // Get listings
  const listings = useSellerListings(username);
  
  // Get gallery functionality - pass empty array if galleryImages is not loaded yet
  const gallery = useSellerGallery(profileData.galleryImages || []);
  
  // Get reviews functionality
  const reviews = useSellerReviews(username);
  
  // Get tips functionality
  const tips = useSellerTips(username);

  return {
    // User data
    user: profileData.user,
    sellerUser: profileData.sellerUser,
    isVerified: profileData.isVerified,
    
    // Profile data
    bio: profileData.bio,
    profilePic: profileData.profilePic,
    subscriptionPrice: profileData.subscriptionPrice,
    galleryImages: profileData.galleryImages || [],
    sellerTierInfo: profileData.sellerTierInfo,
    
    // Stats
    totalPhotos: profileData.totalPhotos,
    totalVideos: profileData.totalVideos,
    followers: profileData.followers,
    averageRating: reviews.averageRating,
    reviews: reviews.reviews,
    
    // Listings
    standardListings: listings.standardListings,
    premiumListings: listings.premiumListings,
    
    // Access control
    hasAccess: subscription.hasAccess,
    hasPurchased: reviews.hasPurchased,
    alreadyReviewed: reviews.alreadyReviewed,
    
    // Slideshow
    slideIndex: gallery.slideIndex,
    isPaused: gallery.isPaused,
    
    // Modals
    showSubscribeModal: subscription.showSubscribeModal,
    showUnsubscribeModal: subscription.showUnsubscribeModal,
    showTipModal: tips.showTipModal,
    showGalleryModal: gallery.showGalleryModal,
    selectedImage: gallery.selectedImage,
    currentImageIndex: gallery.currentImageIndex,
    showToast: subscription.showToast,
    
    // Form state
    tipAmount: tips.tipAmount,
    tipSuccess: tips.tipSuccess,
    tipError: tips.tipError,
    rating: reviews.rating,
    comment: reviews.comment,
    submitted: reviews.submitted,
    
    // Loading state
    isLoading: profileData.isLoading,
    
    // Handlers
    setShowSubscribeModal: subscription.setShowSubscribeModal,
    setShowUnsubscribeModal: subscription.setShowUnsubscribeModal,
    setShowTipModal: tips.setShowTipModal,
    setShowGalleryModal: gallery.setShowGalleryModal,
    setSlideIndex: gallery.setSlideIndex,
    setIsPaused: gallery.setIsPaused,
    setTipAmount: tips.setTipAmount,
    setRating: reviews.setRating,
    setComment: reviews.setComment,
    handleConfirmSubscribe: subscription.handleConfirmSubscribe,
    handleConfirmUnsubscribe: subscription.handleConfirmUnsubscribe,
    handleTipSubmit: tips.handleTipSubmit,
    handleReviewSubmit: reviews.handleReviewSubmit,
    handleImageClick: gallery.handleImageClick,
    handlePrevImage: gallery.handlePrevImage,
    handleNextImage: gallery.handleNextImage,
    closeGalleryModal: gallery.closeGalleryModal,
    togglePause: gallery.togglePause,
    goToPrevSlide: gallery.goToPrevSlide,
    goToNextSlide: gallery.goToNextSlide,
  };
}
