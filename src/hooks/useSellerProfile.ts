// src/hooks/useSellerProfile.ts

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService } from '@/services/users.service';
import { listingsService } from '@/services/listings.service';
import { reviewsService } from '@/services/reviews.service';
import { tipService } from '@/services/tip.service';
import { API_BASE_URL } from '@/services/api.config';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { getSellerTierMemoized, TierInfo } from '@/utils/sellerTiers';
import { useWallet } from '@/context/WalletContext';

// Subscription service mock implementation
const subscriptionService = {
  async checkSubscription(username: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/check/${username}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Subscription check error:', error);
      return { success: false, data: { hasAccess: false } };
    }
  },
  
  async subscribe(username: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ seller: username })
      });
      return await response.json();
    } catch (error) {
      console.error('Subscribe error:', error);
      return { success: false };
    }
  },
  
  async unsubscribe(username: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ seller: username })
      });
      return await response.json();
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return { success: false };
    }
  }
};

export function useSellerProfile(username: string) {
  const { user, token } = useAuth();
  const { orderHistory } = useWallet();
  
  // Profile data
  const [sellerUser, setSellerUser] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [sellerTierInfo, setSellerTierInfo] = useState<TierInfo | null>(null);
  
  // Stats
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalVideos] = useState(0);
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
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  
  // Modal states
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  
  // Form states
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Fetch seller profile data
  useEffect(() => {
    const fetchSellerData = async () => {
      if (!username) return;

      try {
        // Fetch user profile with gallery from backend
        let userData = null;
        let profileData = null;
        let gallery: string[] = [];

        // Try backend first
        if (token) {
          try {
            const response = await fetch(`${API_BASE_URL}/api/users/${username}/profile/full`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                userData = result.data;
                
                // Extract gallery images and convert URLs
                if (userData.galleryImages && Array.isArray(userData.galleryImages)) {
                  gallery = userData.galleryImages
                    .map((url: string) => {
                      // Handle both relative and absolute URLs
                      if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                      } else if (url.startsWith('/uploads/')) {
                        // Convert relative upload paths to full URLs
                        return `${API_BASE_URL}${url}`;
                      } else {
                        return sanitizeUrl(url);
                      }
                    })
                    .filter((url: string | null): url is string => url !== null && url !== '');
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch from backend:', error);
          }
        }

        // Fallback to service if backend fails
        if (!userData) {
          const userResult = await usersService.getUser(username);
          if (userResult.success && userResult.data) {
            userData = userResult.data;
            
            // Get profile data separately
            const profileResult = await usersService.getUserProfile(username);
            if (profileResult.success && profileResult.data) {
              profileData = profileResult.data;
              
              // Extract gallery from profile
              if (profileData.galleryImages && Array.isArray(profileData.galleryImages)) {
                gallery = profileData.galleryImages
                  .map((url: string) => {
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                      return url;
                    } else if (url.startsWith('/uploads/')) {
                      return `${API_BASE_URL}${url}`;
                    } else {
                      return sanitizeUrl(url);
                    }
                  })
                  .filter((url: string | null): url is string => url !== null && url !== '');
              }
            }
          }
        }

        if (!userData) {
          console.error('User not found:', username);
          return;
        }

        // Set user data
        setSellerUser(userData);
        setBio(userData.bio || profileData?.bio || '');
        setProfilePic(userData.profilePic || profileData?.profilePic || null);
        setSubscriptionPrice(
          parseFloat(userData.subscriptionPrice || profileData?.subscriptionPrice || '0') || null
        );
        setGalleryImages(gallery);
        setIsVerified(userData.isVerified || false);
        setFollowers(userData.subscriberCount || 0);
        setAverageRating(userData.rating || null);

        // Calculate tier info using getSellerTierMemoized
        const tierInfo = getSellerTierMemoized(username, orderHistory);
        setSellerTierInfo(tierInfo);

        // Fetch listings
        const listingsResult = await listingsService.getListingsBySeller(username);
        if (listingsResult.success && listingsResult.data) {
          const listings = listingsResult.data;
          setStandardListings(listings.filter((l: any) => !l.isPremium));
          setPremiumListings(listings.filter((l: any) => l.isPremium));
          
          // Calculate total photos (gallery + listing images)
          setTotalPhotos(gallery.length + listings.length);
        }

        // Check subscription access
        if (user?.role === 'buyer' && user.username !== username) {
          const subResult = await subscriptionService.checkSubscription(username);
          setHasAccess(subResult.success && subResult.data?.hasAccess);
        } else if (user?.username === username) {
          setHasAccess(true);
        }

        // Fetch reviews using the correct method name
        const reviewsResult = await reviewsService.getSellerReviews(username);
        if (reviewsResult.success && reviewsResult.data) {
          setReviews(reviewsResult.data.reviews || []);
          setAverageRating(reviewsResult.data.stats?.avgRating || null);
          
          // Check if current user has already reviewed
          if (user?.username) {
            const userReview = reviewsResult.data.reviews.find(
              (r: any) => r.reviewer === user.username
            );
            setAlreadyReviewed(!!userReview);
          }
        }

        // Check if user has purchased from seller (for review eligibility)
        // Find an order from this seller that the current user made
        if (user?.username && orderHistory.length > 0) {
          const userOrder = orderHistory.find(
            order => order.seller === username && 
                     order.buyer === user.username && 
                     order.shippingStatus === 'shipped' // Use shippingStatus instead of status
          );
          if (userOrder) {
            setHasPurchased(true);
            setCurrentOrderId(userOrder.id); // Order type always has 'id' field
          }
        }

      } catch (error) {
        console.error('Error fetching seller profile:', error);
      }
    };

    fetchSellerData();
  }, [username, user, token, orderHistory]);

  // Slideshow effect
  useEffect(() => {
    if (galleryImages.length > 1 && !isPaused && !showGalleryModal) {
      slideshowRef.current = setInterval(() => {
        setSlideIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
      }, 4000);
    }
    
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, [galleryImages.length, isPaused, showGalleryModal]);

  // Handlers
  const handleConfirmSubscribe = async () => {
    try {
      const result = await subscriptionService.subscribe(username);
      if (result.success) {
        setShowSubscribeModal(false);
        setHasAccess(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const handleConfirmUnsubscribe = async () => {
    try {
      const result = await subscriptionService.unsubscribe(username);
      if (result.success) {
        setShowUnsubscribeModal(false);
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  };

  const handleTipSubmit = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      setTipError('Please enter a valid amount');
      return;
    }

    try {
      const result = await tipService.sendTip(username, parseFloat(tipAmount));
      if (result.success) {
        setTipSuccess(true);
        setTimeout(() => {
          setShowTipModal(false);
          setTipSuccess(false);
          setTipAmount('');
        }, 2000);
      }
    } catch (error) {
      setTipError('Failed to send tip');
    }
  };

  const handleReviewSubmit = async () => {
    if (!comment || comment.trim().length < 10) {
      return;
    }

    if (!currentOrderId) {
      console.error('No order ID available for review');
      return;
    }

    try {
      // Use the correct CreateReviewRequest structure
      const result = await reviewsService.createReview({
        orderId: currentOrderId,
        rating,
        comment: comment.trim(),
        asDescribed: true,
        fastShipping: true,
        wouldBuyAgain: true
      });
      
      if (result.success) {
        setSubmitted(true);
        setAlreadyReviewed(true);
        
        // Refresh reviews using the correct method name
        const reviewsResult = await reviewsService.getSellerReviews(username);
        if (reviewsResult.success && reviewsResult.data) {
          setReviews(reviewsResult.data.reviews || []);
          setAverageRating(reviewsResult.data.stats?.avgRating || null);
        }
      }
    } catch (error) {
      console.error('Review submission error:', error);
    }
  };

  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setShowGalleryModal(true);
    setIsPaused(true);
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setSelectedImage(null);
    setIsPaused(false);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const prevIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(galleryImages[prevIndex]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextIndex = (currentImageIndex + 1) % galleryImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(galleryImages[nextIndex]);
  };

  const togglePause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPaused(prev => !prev);
  };

  const goToPrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };
  
  const goToNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
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
