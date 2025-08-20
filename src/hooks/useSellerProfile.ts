// src/hooks/useSellerProfile.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService } from '@/services/users.service';
import { listingsService } from '@/services/listings.service';
import { subscriptionService } from '@/services/subscription.service';
import { reviewsService } from '@/services/reviews.service';
import { tipService } from '@/services/tip.service';
import { getTierInfo } from '@/utils/sellerTiers';
import { apiCall, API_BASE_URL } from '@/services/api.config';

export function useSellerProfile(username: string) {
  const { user } = useAuth();
  const [sellerUser, setSellerUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [sellerTierInfo, setSellerTierInfo] = useState<any>(null);
  
  // Stats
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Listings
  const [standardListings, setStandardListings] = useState<any[]>([]);
  const [premiumListings, setPremiumListings] = useState<any[]>([]);
  
  // Access control
  const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  
  // Slideshow
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideshowIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Modals
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  
  // Form state
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Load seller data
  useEffect(() => {
    const loadSellerData = async () => {
      if (!username) return;

      try {
        // Get seller user data
        const userResponse = await usersService.getUser(username);
        if (userResponse.success && userResponse.data) {
          const seller = userResponse.data;
          setSellerUser(seller);
          setIsVerified(seller.isVerified || false);
          setBio(seller.bio || '');
          setProfilePic(seller.profilePicture || null);
          
          // Get tier info
          if (seller.tier) {
            const tierInfo = getTierInfo(seller.tier);
            setSellerTierInfo(tierInfo);
          }
        }

        // Get seller profile data (includes gallery)
        const profileResponse = await usersService.getUserProfile(username);
        if (profileResponse.success && profileResponse.data) {
          setSubscriptionPrice(parseFloat(profileResponse.data.subscriptionPrice) || null);
        }

        // Get gallery images from backend - fix the URL construction
        try {
          const galleryUrl = `${API_BASE_URL}/api/users/${encodeURIComponent(username)}/gallery`;
          const galleryResponse = await apiCall(galleryUrl);
          if (galleryResponse.success && galleryResponse.data) {
            const data = galleryResponse.data as any;
            setGalleryImages(data.galleryImages || []);
            setTotalPhotos(data.totalImages || 0);
          }
        } catch (error) {
          console.log('Gallery endpoint not available, using profile data');
          // Fallback to profile data if gallery endpoint doesn't exist
          if (profileResponse.success && profileResponse.data?.galleryImages) {
            setGalleryImages(profileResponse.data.galleryImages);
            setTotalPhotos(profileResponse.data.galleryImages.length);
          }
        }

        // Check subscription status
        if (user?.role === 'buyer' && user.username !== username) {
          const subResponse = await subscriptionService.checkSubscription(username);
          if (subResponse.success) {
            setHasAccess(subResponse.data);
          }
        } else if (user?.username === username) {
          setHasAccess(true);
        }

        // Get listings - use getListingsBySeller which exists in the service
        const listingsResponse = await listingsService.getListingsBySeller(username);
        if (listingsResponse.success && listingsResponse.data) {
          const allListings = Array.isArray(listingsResponse.data) ? listingsResponse.data : [];
          setStandardListings(allListings.filter((l: any) => !l.isPremium));
          setPremiumListings(allListings.filter((l: any) => l.isPremium));
        }

        // Get reviews
        const reviewsResponse = await reviewsService.getSellerReviews(username);
        if (reviewsResponse.success && reviewsResponse.data) {
          // Handle the reviews data properly
          const reviewsArray = Array.isArray(reviewsResponse.data) 
            ? reviewsResponse.data 
            : (reviewsResponse.data as any).reviews || [];
          
          setReviews(reviewsArray);
          
          // Calculate average rating
          if (reviewsArray.length > 0) {
            const avg = reviewsArray.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsArray.length;
            setAverageRating(avg);
          }
          
          // Check if current user already reviewed
          if (user?.username) {
            const userReview = reviewsArray.find((r: any) => r.reviewer === user.username);
            setAlreadyReviewed(!!userReview);
          }
        }

        // Get subscriber count - Fixed: Only call if we have a username
        if (username) {
          try {
            const subscribersResponse = await subscriptionService.getSubscriberCount(username);
            if (subscribersResponse.success && subscribersResponse.data) {
              setFollowers(subscribersResponse.data.count);
            }
          } catch (error) {
            console.log('Could not get subscriber count:', error);
            setFollowers(0);
          }
        }

      } catch (error) {
        console.error('Failed to load seller data:', error);
      }
    };

    loadSellerData();
  }, [username, user]);

  // Slideshow effect
  useEffect(() => {
    if (galleryImages.length > 1 && !isPaused && !showGalleryModal) {
      slideshowIntervalRef.current = setInterval(() => {
        setSlideIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
      }, 3000);
    } else {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
        slideshowIntervalRef.current = null;
      }
    }

    return () => {
      if (slideshowIntervalRef.current) {
        clearInterval(slideshowIntervalRef.current);
      }
    };
  }, [galleryImages.length, isPaused, showGalleryModal]);

  // Handlers
  const handleConfirmSubscribe = async () => {
    if (!user || !username) return;

    try {
      const response = await subscriptionService.subscribe(username);
      if (response.success) {
        setHasAccess(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setShowSubscribeModal(false);
    }
  };

  const handleConfirmUnsubscribe = async () => {
    if (!user || !username) return;

    try {
      const response = await subscriptionService.unsubscribe(username);
      if (response.success) {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    } finally {
      setShowUnsubscribeModal(false);
    }
  };

  const handleTipSubmit = async () => {
    if (!user || !username || !tipAmount) return;

    setTipError('');
    try {
      const response = await tipService.sendTip(username, parseFloat(tipAmount));
      if (response.success) {
        setTipSuccess(true);
        setTimeout(() => {
          setShowTipModal(false);
          setTipAmount('');
          setTipSuccess(false);
        }, 2000);
      } else {
        // Handle the response properly - check for error in the ApiResponse structure
        const errorMessage = (response as any).error?.message || 'Failed to send tip';
        setTipError(errorMessage);
      }
    } catch (error) {
      setTipError('Failed to send tip. Please try again.');
    }
  };

  const handleReviewSubmit = async () => {
    if (!user || !username || !comment || submitted) return;

    try {
      // For seller reviews, we might need to handle this differently
      // Let's check if there's a way to create a review without a listingId
      // or use a different endpoint
      const reviewData: any = {
        rating,
        comment,
        asDescribed: true,
        fastShipping: true,
        wouldBuyAgain: true
      };

      // If the service requires a listing or order ID, we might need to handle seller reviews differently
      // For now, let's try to call it without listingId
      const response = await reviewsService.createReview(reviewData);

      if (response.success) {
        setSubmitted(true);
        // Reload reviews
        const reviewsResponse = await reviewsService.getSellerReviews(username);
        if (reviewsResponse.success && reviewsResponse.data) {
          const reviewsArray = Array.isArray(reviewsResponse.data) 
            ? reviewsResponse.data 
            : (reviewsResponse.data as any).reviews || [];
          
          setReviews(reviewsArray);
          // Recalculate average
          if (reviewsArray.length > 0) {
            const avg = reviewsArray.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsArray.length;
            setAverageRating(avg);
          }
        }
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setShowGalleryModal(true);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : galleryImages.length - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newIndex = currentImageIndex < galleryImages.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setSelectedImage(null);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const goToPrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(slideIndex > 0 ? slideIndex - 1 : galleryImages.length - 1);
  };

  const goToNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(slideIndex < galleryImages.length - 1 ? slideIndex + 1 : 0);
  };

  return {
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
  };
}
