// src/hooks/useSellerProfile.ts
import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';
import { getSellerTierMemoized } from '@/utils/sellerTiers';

export function useSellerProfile(username: string) {
  const { user } = useAuth();
  const {
    listings,
    users,
    isSubscribed,
    subscribeToSeller,
    unsubscribeFromSeller,
    subscriptions,
  } = useListings();
  const { orderHistory, sendTip } = useWallet();
  const { getReviewsForSeller, addReview, hasReviewed } = useReviews();

  // Profile state
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Gallery modal state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowInterval = 4000;
  const [isPaused, setIsPaused] = useState(false);

  // Modal state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Tip state
  const [tipAmount, setTipAmount] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [tipError, setTipError] = useState('');

  // Review state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Computed values
  const hasAccess = user?.username ? isSubscribed(user.username, username) : undefined;
  const standardListings = listings.filter(
    (listing) => listing.seller === username && !listing.isPremium
  );
  const premiumListings = listings.filter(
    (listing) => listing.seller === username && listing.isPremium
  );

  const reviews = getReviewsForSeller(username);
  const hasPurchased = orderHistory.some(
    (order) => order.seller === username && order.buyer === user?.username
  );
  const alreadyReviewed = user?.username ? hasReviewed(username, user.username) : false;

  const sellerListings = listings.filter(listing => listing.seller === username);
  const totalPhotos = sellerListings.filter(listing => listing.imageUrls && listing.imageUrls.length > 0).length;
  const totalVideos = 0;

  const followers = Object.entries(subscriptions)
    .filter(([_, sellers]) => Array.isArray(sellers) && sellers.includes(username))
    .length;

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : null;

  const sellerUser = users?.[username];
  const isVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

  const sellerTierInfo = useMemo(() => {
    return getSellerTierMemoized(username, orderHistory);
  }, [username, orderHistory]);

  // Load profile data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBio = sessionStorage.getItem(`profile_bio_${username}`);
      const storedPic = sessionStorage.getItem(`profile_pic_${username}`);
      const storedSub = sessionStorage.getItem(`subscription_price_${username}`);
      const storedGallery = localStorage.getItem(`profile_gallery_${username}`);

      if (storedBio) setBio(storedBio);
      if (storedPic) setProfilePic(storedPic);
      if (storedSub) setSubscriptionPrice(parseFloat(storedSub));
      if (storedGallery) {
        try {
          const parsedGallery = JSON.parse(storedGallery);
          if (Array.isArray(parsedGallery)) {
            setGalleryImages(parsedGallery);
          } else {
            setGalleryImages([]);
          }
        } catch (error) {
          console.error('Failed to parse stored gallery data:', error);
          setGalleryImages([]);
        }
      } else {
        setGalleryImages([]);
      }
    }
  }, [username]);

  // Slideshow effect
  useEffect(() => {
    if (galleryImages.length > 1 && !isPaused) {
      slideshowRef.current = setInterval(() => {
        setSlideIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
      }, slideshowInterval);
    }
    
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, [galleryImages.length, isPaused]);

  // Auto-hide submitted message
  useEffect(() => {
    if (submitted) {
      const timeout = setTimeout(() => setSubmitted(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [submitted]);

  // Handlers
  const handleConfirmSubscribe = () => {
    if (!user?.username || user.role !== 'buyer' || subscriptionPrice === null) {
      alert('Cannot subscribe. Please check your login status and seller subscription price.');
      return;
    }
    const success = subscribeToSeller(user.username, username, subscriptionPrice);
    if (success) {
      setShowSubscribeModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert('Subscription failed. Insufficient balance or another error occurred.');
      setShowSubscribeModal(false);
    }
  };

  const handleConfirmUnsubscribe = () => {
    if (!user?.username || user.role !== 'buyer') return;
    unsubscribeFromSeller(user.username, username);
    setShowUnsubscribeModal(false);
  };

  const handleTipSubmit = () => {
    setTipError('');
    setTipSuccess(false);
    if (!user?.username || user.role !== 'buyer') {
      setTipError('You must be logged in as a buyer to tip.');
      return;
    }
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipError('Enter a valid tip amount.');
      return;
    }
    const success = sendTip(user.username, username, amount);
    if (!success) {
      setTipError('Insufficient wallet balance.');
      return;
    }
    setTipSuccess(true);
    setTipAmount('');
    setTimeout(() => {
      setShowTipModal(false);
      setTipSuccess(false);
    }, 1500);
  };

  const handleReviewSubmit = () => {
    if (!user?.username || rating < 1 || rating > 5 || !comment.trim()) return;
    addReview(username, {
      reviewer: user.username,
      rating,
      comment,
      date: new Date().toISOString(),
    });
    setSubmitted(true);
    setComment('');
    setRating(5);
  };

  const handleImageClick = (image: string, index: number) => {
    if (image) {
      setCurrentImageIndex(index);
      setSelectedImage(image);
      setShowGalleryModal(true);
      setIsPaused(true);
    }
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setSelectedImage(null);
    setIsPaused(false);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryImages.length === 0) return;
    const prevIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(galleryImages[prevIndex]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryImages.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % galleryImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(galleryImages[nextIndex]);
  };

  const goToPrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
    
    // Reset the timer and pause temporarily
    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds of inactivity
    }
  };
  
  const goToNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
    
    // Reset the timer and pause temporarily
    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds of inactivity
    }
  };

  const togglePause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPaused(prev => !prev);
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
