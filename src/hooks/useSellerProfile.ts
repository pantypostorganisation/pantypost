// src/hooks/useSellerProfile.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService } from '@/services/users.service';
import { listingsService } from '@/services/listings.service';
import { reviewsService } from '@/services/reviews.service';
import { API_BASE_URL } from '@/services/api.config';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { getSellerTierMemoized, TierInfo } from '@/utils/sellerTiers';
import { useWallet } from '@/context/WalletContext';
import { subscriptionsService } from '@/services/subscriptions.service';

const apiBaseWithApi = (() => {
  const raw = (API_BASE_URL || '').replace(/\/+$/, '');
  return /\/api$/.test(raw) ? raw : `${raw}/api`;
})();

const joinApi = (path: string) =>
  `${apiBaseWithApi}/${path.replace(/^\//, '')}`;

function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${apiBaseWithApi.replace(/\/api$/, '')}${url}`;
  return sanitizeUrl(url);
}

function coerceProfileData(profileRespData: any): any {
  if (profileRespData && typeof profileRespData === 'object' && 'profile' in profileRespData) {
    return profileRespData.profile;
  }
  return profileRespData;
}

export function useSellerProfile(username: string) {
  const { user, token } = useAuth();
  const { orderHistory } = useWallet();

  const [sellerUser, setSellerUser] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [sellerTierInfo, setSellerTierInfo] = useState<TierInfo | null>(null);

  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalVideos] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  const [standardListings, setStandardListings] = useState<any[]>([]);
  const [premiumListings, setPremiumListings] = useState<any[]>([]);

  const [hasAccess, setHasAccess] = useState<boolean | undefined>(undefined);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);

  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!username) return;

      try {
        let userData: any = null;
        let profileData: any = null;
        let gallery: string[] = [];

        if (token) {
          try {
            const response = await fetch(
              joinApi(`/users/${encodeURIComponent(username)}/profile/full`),
              { headers: { Authorization: `Bearer ${token}` } as Record<string, string> }
            );
            if (response.ok) {
              const result = await response.json();
              if (result?.success && result.data) {
                userData = result.data;
                if (userData.galleryImages && Array.isArray(userData.galleryImages)) {
                  gallery = userData.galleryImages
                    .map((u: string) => normalizeImageUrl(u))
                    .filter((u: string | null): u is string => !!u);
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch from backend:', error);
          }
        }

        if (!userData) {
          const userResult: any = await usersService.getUser(username);
          if (userResult?.success && userResult.data) {
            userData = userResult.data;
            const profileResult: any = await usersService.getUserProfile(username);
            if (profileResult?.success && profileResult.data) {
              profileData = coerceProfileData(profileResult.data);
              if (profileData?.galleryImages && Array.isArray(profileData.galleryImages)) {
                gallery = profileData.galleryImages
                  .map((u: string) => normalizeImageUrl(u))
                  .filter((u: string | null): u is string => !!u);
              }
            }
          }
        }

        if (!userData) {
          console.error('User not found:', username);
          return;
        }

        setSellerUser(userData);
        setBio(profileData?.bio ?? userData.bio ?? '');

        const resolvedPic =
          userData?.profilePicture ??
          profileData?.profilePicture ??
          profileData?.profilePic ??
          userData?.profilePic ??
          null;
        setProfilePic(normalizeImageUrl(resolvedPic));

        const rawPrice =
          userData?.subscriptionPrice ??
          profileData?.subscriptionPrice ??
          '0';
        const parsedPrice = parseFloat(String(rawPrice));
        setSubscriptionPrice(Number.isFinite(parsedPrice) ? parsedPrice : null);

        setGalleryImages(gallery);
        setIsVerified(Boolean(userData.isVerified));
        setFollowers(userData.subscriberCount || 0);
        setAverageRating(userData.rating ?? null);

        const tierInfo = getSellerTierMemoized(username, orderHistory);
        setSellerTierInfo(tierInfo);

        const listingsResult = await listingsService.getListingsBySeller(username);
        if (listingsResult.success && listingsResult.data) {
          const listings = listingsResult.data;
          setStandardListings(listings.filter((l: any) => !l.isPremium));
          setPremiumListings(listings.filter((l: any) => l.isPremium));
          setTotalPhotos(gallery.length + listings.length);
        }

        if (user?.role === 'buyer' && user.username !== username) {
          const check = await subscriptionsService.check({
            subscriber: user.username,
            creator: username,
            token: token ?? undefined,
          });
          setHasAccess(Boolean(check?.isSubscribed));
        } else if (user?.username === username) {
          setHasAccess(true);
        }

        const reviewsResult = await reviewsService.getSellerReviews(username);
        if (reviewsResult.success && reviewsResult.data) {
          setReviews(reviewsResult.data.reviews || []);
          setAverageRating(reviewsResult.data.stats?.avgRating || null);
          if (user?.username) {
            const userReview = reviewsResult.data.reviews.find(
              (r: any) => r.reviewer === user.username
            );
            setAlreadyReviewed(!!userReview);
          }
        }

        if (user?.username && orderHistory.length > 0) {
          const userOrder = orderHistory.find(
            (order) =>
              order.seller === username &&
              order.buyer === user.username &&
              order.shippingStatus === 'shipped'
          );
          if (userOrder) {
            setHasPurchased(true);
            setCurrentOrderId(userOrder.id);
          }
        }
      } catch (error) {
        console.error('Error fetching seller profile:', error);
      }
    };

    fetchSellerData();
  }, [username, user, token, orderHistory]);

  useEffect(() => {
    if (galleryImages.length > 1 && !isPaused && !showGalleryModal) {
      slideshowRef.current = setInterval(() => {
        setSlideIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
      }, 4000);
    }
    return () => {
      if (slideshowRef.current) clearInterval(slideshowRef.current);
    };
  }, [galleryImages.length, isPaused, showGalleryModal]);

  const handleConfirmSubscribe = async () => {
    try {
      if (!token) {
        console.error('No auth token; please log in.');
        return;
      }
      const price =
        typeof subscriptionPrice === 'number' && subscriptionPrice > 0
          ? Math.round(subscriptionPrice * 100) / 100
          : 0;

      if (price <= 0) {
        console.error('Invalid subscription price');
        return;
      }

      const result = await subscriptionsService.subscribe({
        seller: username,
        price,
        token: token ?? undefined,
      });

      if (result?.success) {
        setShowSubscribeModal(false);
        setHasAccess(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Fire custom event for subscription change
        if (typeof window !== 'undefined' && user?.username) {
          window.dispatchEvent(new CustomEvent('subscription:changed', { 
            detail: { 
              seller: username, 
              action: 'subscribed',
              buyer: user.username 
            } 
          }));
          console.log('[useSellerProfile] Fired subscription:changed event for subscribe');
        }
      } else {
        console.error('Subscribe failed:', JSON.stringify(result?.error ?? result));
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const handleConfirmUnsubscribe = async () => {
    try {
      if (!token) {
        console.error('No auth token; please log in.');
        return;
      }
      const result = await subscriptionsService.unsubscribe({
        seller: username,
        token: token ?? undefined,
      });
      if (result?.success) {
        setShowUnsubscribeModal(false);
        setHasAccess(false);
        
        // Fire custom event for subscription change
        if (typeof window !== 'undefined' && user?.username) {
          window.dispatchEvent(new CustomEvent('subscription:changed', { 
            detail: { 
              seller: username, 
              action: 'unsubscribed',
              buyer: user.username 
            } 
          }));
          console.log('[useSellerProfile] Fired subscription:changed event for unsubscribe');
        }
      } else {
        console.error('Unsubscribe failed:', JSON.stringify(result?.error ?? result));
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  };

  // FIXED: Removed duplicate tip sending logic - now just a placeholder
  // The actual tip sending is handled in the TipModal component
  const handleTipSubmit = () => {
    // This is just a placeholder function
    // The actual tip sending logic is in the TipModal component
    console.log('Tip submit handler called - handled by TipModal component');
  };

  const handleReviewSubmit = async () => {
    if (!comment || comment.trim().length < 10) return;
    if (!currentOrderId) {
      console.error('No order ID available for review');
      return;
    }

    try {
      const result = await reviewsService.createReview({
        orderId: currentOrderId,
        rating,
        comment: comment.trim(),
        asDescribed: true,
        fastShipping: true,
        wouldBuyAgain: true,
      });

      if (result.success) {
        setSubmitted(true);
        setAlreadyReviewed(true);
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
    setIsPaused((prev) => !prev);
  };

  const goToPrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex((prevIndex) => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const goToNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  return {
    user,
    sellerUser,
    isVerified,
    bio,
    profilePic,
    subscriptionPrice,
    galleryImages,
    sellerTierInfo,
    totalPhotos,
    totalVideos,
    followers,
    averageRating,
    reviews,
    standardListings,
    premiumListings,
    hasAccess,
    hasPurchased,
    alreadyReviewed,
    slideIndex,
    isPaused,
    showSubscribeModal,
    showUnsubscribeModal,
    showTipModal,
    showGalleryModal,
    selectedImage,
    currentImageIndex,
    showToast,
    tipAmount,
    tipSuccess,
    tipError,
    rating,
    comment,
    submitted,
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
