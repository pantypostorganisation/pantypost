// src/hooks/useSellerProfile.ts
import { useMemo, useCallback } from 'react';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { z } from 'zod';
import { useSellerProfileData } from './profile/useSellerProfileData';
import { useSellerSubscription } from './profile/useSellerSubscription';
import { useSellerListings } from './profile/useSellerListings';
import { useSellerGallery } from './profile/useSellerGallery';
import { useSellerReviews } from './profile/useSellerReviews';
import { useSellerTips } from './profile/useSellerTips';

// Username validation schema
const UsernameSchema = z.string()
  .min(3, 'Username too short')
  .max(30, 'Username too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid username format');

interface UseSellerProfileError {
  error: string;
  component?: string;
}

export function useSellerProfile(username: string) {
  // Validate and sanitize username
  const { sanitizedUsername, usernameError } = useMemo(() => {
    try {
      // First sanitize
      const sanitized = sanitizeUsername(username);
      
      // Then validate
      const validated = UsernameSchema.parse(sanitized);
      
      return { sanitizedUsername: validated, usernameError: null };
    } catch (error) {
      console.error('Invalid username provided to useSellerProfile:', error);
      return { 
        sanitizedUsername: '', 
        usernameError: error instanceof z.ZodError ? error.errors[0].message : 'Invalid username'
      };
    }
  }, [username]);

  // Get profile data with error handling
  const profileData = useSellerProfileData(sanitizedUsername || 'invalid');
  
  // Get subscription functionality with safe defaults
  const subscription = useSellerSubscription(
    sanitizedUsername || 'invalid', 
    profileData.subscriptionPrice || 0
  );
  
  // Get listings with error handling
  const listings = useSellerListings(sanitizedUsername || 'invalid');
  
  // Get gallery functionality with safe array
  const gallery = useSellerGallery(
    Array.isArray(profileData.galleryImages) ? profileData.galleryImages : []
  );
  
  // Get reviews functionality
  const reviews = useSellerReviews(sanitizedUsername || 'invalid');
  
  // Get tips functionality
  const tips = useSellerTips(sanitizedUsername || 'invalid');

  // Aggregate errors from all hooks
  const errors = useMemo<UseSellerProfileError[]>(() => {
    const errorList: UseSellerProfileError[] = [];
    
    if (usernameError) {
      errorList.push({ error: usernameError, component: 'username' });
    }
    
    // Since the sub-hooks don't expose error properties, we can check for invalid states
    // For example, if username is invalid, we know there will be issues
    if (!sanitizedUsername) {
      errorList.push({ error: 'Invalid username provided', component: 'general' });
    }
    
    return errorList;
  }, [usernameError, sanitizedUsername]);

  // Compute safe total photos/videos with validation
  const safeStats = useMemo(() => {
    const totalPhotos = typeof profileData.totalPhotos === 'number' && 
                       profileData.totalPhotos >= 0 ? 
                       profileData.totalPhotos : 0;
                       
    const totalVideos = typeof profileData.totalVideos === 'number' && 
                       profileData.totalVideos >= 0 ? 
                       profileData.totalVideos : 0;
                       
    const followers = typeof profileData.followers === 'number' && 
                     profileData.followers >= 0 ? 
                     profileData.followers : 0;
                     
    return { totalPhotos, totalVideos, followers };
  }, [profileData.totalPhotos, profileData.totalVideos, profileData.followers]);

  // Wrap handlers with error boundaries
  const safeHandleConfirmSubscribe = useCallback(async () => {
    try {
      if (!sanitizedUsername) {
        throw new Error('Invalid username');
      }
      await subscription.handleConfirmSubscribe();
    } catch (error) {
      console.error('Subscribe error:', error);
      // The subscription hook should handle its own error state
    }
  }, [sanitizedUsername, subscription.handleConfirmSubscribe]);

  const safeHandleConfirmUnsubscribe = useCallback(async () => {
    try {
      if (!sanitizedUsername) {
        throw new Error('Invalid username');
      }
      await subscription.handleConfirmUnsubscribe();
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  }, [sanitizedUsername, subscription.handleConfirmUnsubscribe]);

  const safeHandleTipSubmit = useCallback(async () => {
    try {
      if (!sanitizedUsername) {
        throw new Error('Invalid username');
      }
      await tips.handleTipSubmit();
    } catch (error) {
      console.error('Tip submit error:', error);
    }
  }, [sanitizedUsername, tips.handleTipSubmit]);

  const safeHandleReviewSubmit = useCallback(async () => {
    try {
      if (!sanitizedUsername) {
        throw new Error('Invalid username');
      }
      await reviews.handleReviewSubmit();
    } catch (error) {
      console.error('Review submit error:', error);
    }
  }, [sanitizedUsername, reviews.handleReviewSubmit]);

  // Safe setters that validate input
  const safeSetTipAmount = useCallback((amount: string) => {
    // Validate tip amount is a positive number
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount >= 0 && numAmount <= 10000) {
      tips.setTipAmount(amount);
    }
  }, [tips.setTipAmount]);

  const safeSetRating = useCallback((rating: number) => {
    // Validate rating is between 1 and 5
    if (rating >= 1 && rating <= 5 && Number.isInteger(rating)) {
      reviews.setRating(rating);
    }
  }, [reviews.setRating]);

  const safeSetComment = useCallback((comment: string) => {
    // Limit comment length
    const trimmed = comment.slice(0, 1000);
    reviews.setComment(trimmed);
  }, [reviews.setComment]);

  return {
    // User data
    user: profileData.user,
    sellerUser: profileData.sellerUser,
    isVerified: !!profileData.isVerified,
    
    // Profile data
    bio: profileData.bio || '',
    profilePic: profileData.profilePic || null,
    subscriptionPrice: profileData.subscriptionPrice || 0,
    galleryImages: Array.isArray(profileData.galleryImages) ? profileData.galleryImages : [],
    sellerTierInfo: profileData.sellerTierInfo || null,
    
    // Stats (validated)
    totalPhotos: safeStats.totalPhotos,
    totalVideos: safeStats.totalVideos,
    followers: safeStats.followers,
    averageRating: typeof reviews.averageRating === 'number' ? reviews.averageRating : 0,
    reviews: Array.isArray(reviews.reviews) ? reviews.reviews : [],
    
    // Listings (with safe defaults)
    standardListings: Array.isArray(listings.standardListings) ? listings.standardListings : [],
    premiumListings: Array.isArray(listings.premiumListings) ? listings.premiumListings : [],
    
    // Access control
    hasAccess: !!subscription.hasAccess,
    hasPurchased: !!reviews.hasPurchased,
    alreadyReviewed: !!reviews.alreadyReviewed,
    
    // Slideshow
    slideIndex: gallery.slideIndex || 0,
    isPaused: !!gallery.isPaused,
    
    // Modals
    showSubscribeModal: !!subscription.showSubscribeModal,
    showUnsubscribeModal: !!subscription.showUnsubscribeModal,
    showTipModal: !!tips.showTipModal,
    showGalleryModal: !!gallery.showGalleryModal,
    selectedImage: gallery.selectedImage || null,
    currentImageIndex: gallery.currentImageIndex || 0,
    showToast: !!subscription.showToast,
    
    // Form state
    tipAmount: tips.tipAmount || '',
    tipSuccess: !!tips.tipSuccess,
    tipError: tips.tipError || '', // Changed from null to empty string
    rating: reviews.rating || 0,
    comment: reviews.comment || '',
    submitted: !!reviews.submitted,
    
    // Loading state
    isLoading: !!profileData.isLoading,
    
    // Error state
    errors,
    hasErrors: errors.length > 0,
    
    // Sanitized username
    username: sanitizedUsername,
    
    // Handlers (wrapped with error boundaries)
    setShowSubscribeModal: subscription.setShowSubscribeModal,
    setShowUnsubscribeModal: subscription.setShowUnsubscribeModal,
    setShowTipModal: tips.setShowTipModal,
    setShowGalleryModal: gallery.setShowGalleryModal,
    setSlideIndex: gallery.setSlideIndex,
    setIsPaused: gallery.setIsPaused,
    setTipAmount: safeSetTipAmount,
    setRating: safeSetRating,
    setComment: safeSetComment,
    handleConfirmSubscribe: safeHandleConfirmSubscribe,
    handleConfirmUnsubscribe: safeHandleConfirmUnsubscribe,
    handleTipSubmit: safeHandleTipSubmit,
    handleReviewSubmit: safeHandleReviewSubmit,
    handleImageClick: gallery.handleImageClick,
    handlePrevImage: gallery.handlePrevImage,
    handleNextImage: gallery.handleNextImage,
    closeGalleryModal: gallery.closeGalleryModal,
    togglePause: gallery.togglePause,
    goToPrevSlide: gallery.goToPrevSlide,
    goToNextSlide: gallery.goToNextSlide,
  };
}
