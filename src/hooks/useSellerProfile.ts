// src/hooks/useSellerProfile.ts

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usersService } from '@/services/users.service';
import { listingsService } from '@/services/listings.service';
import { reviewsService } from '@/services/reviews.service';
import { API_BASE_URL } from '@/services/api.config';
import { sanitizeUrl, sanitizeStrict } from '@/utils/security/sanitization';
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

/* Coercions used ONLY to seed state from the server payload. They mirror
   what the client fetch does further down, so a seeded value and the
   value that replaces it a moment later cannot disagree in format --
   which is also what keeps the server and client first renders
   byte-identical and avoids a hydration warning. */
function seedNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function seedCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function seedGallery(seller: any): string[] {
  if (!seller || !Array.isArray(seller.galleryImages)) return [];
  return seller.galleryImages
    .map((u: string) => normalizeImageUrl(u))
    .filter((u: string | null): u is string => !!u);
}

function seedCountry(seller: any): string | null {
  const raw = typeof seller?.country === 'string' ? seller.country : '';
  if (!raw) return null;
  return sanitizeStrict(raw) || null;
}

/* `initialSeller` is the seller record the SERVER already fetched for
   generateMetadata. Passing it in means the page renders with the
   seller's name, bio and avatar in the very first HTML -- no spinner for
   a real visitor, and real content for a crawler that does not run JS.
   
   It is a SEED, not a replacement: the client still fetches on mount for
   anything live (follower counts, the gallery, whether the viewer has
   purchased). This only removes the empty first paint. */
export function useSellerProfile(username: string, initialSeller?: any) {
  const { user, token } = useAuth();
  const { orderHistory } = useWallet();

  const [sellerUser, setSellerUser] = useState<any>(initialSeller ?? null);

  /* Whether the seller fetch has finished, regardless of outcome.
     The hook had no loading flag, so SellerClient used `!user` as a
     stand-in -- and `user` is the VIEWER, not the seller. That made the
     page show "Loading profile..." forever to anyone signed out,
     including every crawler. A real flag lets the page distinguish
     "still fetching" from "no such seller". */
  const [hasLoaded, setHasLoaded] = useState(false);

  /* Seeded from the server payload where available.

     Previously only sellerUser, bio and isVerified were seeded, so the
     server-rendered HTML carried the name and bio and then left the
     header's credentials line -- rating, review count, sales, years --
     blank, with no avatar and no cover photo. page.tsx had already
     fetched every one of those fields to build the metadata, and they
     were being thrown away and re-requested on the client.

     That costs more than a crawler impression: the OG preview for a shop
     link pasted into Reddit or X is built from this first render, and
     that link is the growth channel.

     Every value below is still overwritten by the client fetch, which
     remains the source of truth for anything live. */
  const [bio, setBio] = useState<any>(initialSeller?.bio ?? '');
  const [profilePic, setProfilePic] = useState<string | null>(() =>
    normalizeImageUrl(initialSeller?.profilePic ?? initialSeller?.profilePicture ?? null)
  );
  const [coverPhoto, setCoverPhoto] = useState<string | null>(() =>
    normalizeImageUrl(initialSeller?.coverPhoto ?? null)
  );
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(() =>
    seedNumber(initialSeller?.subscriptionPrice)
  );
  const [galleryImages, setGalleryImages] = useState<string[]>(() => seedGallery(initialSeller));
  const [isVerified, setIsVerified] = useState<any>(Boolean(initialSeller?.isVerified));
  const [sellerTierInfo, setSellerTierInfo] = useState<TierInfo | null>(null);
  const [country, setCountry] = useState<string | null>(() => seedCountry(initialSeller));
  const [isLocationPublic, setIsLocationPublic] = useState<boolean>(() =>
    typeof initialSeller?.isLocationPublic === 'boolean' ? initialSeller.isLocationPublic : true
  );

  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalVideos] = useState(0);
  const [followers, setFollowers] = useState(() => seedCount(initialSeller?.subscriberCount));
  const [averageRating, setAverageRating] = useState<number | null>(() =>
    typeof initialSeller?.rating === 'number' ? initialSeller.rating : null
  );
  const [reviews, setReviews] = useState<any[]>([]);

  // Shop-header stats. These come from the profile endpoint, which
  // aggregates them from the Review and Order collections rather than
  // reading the User counters (which nothing writes to).
  const [reviewCount, setReviewCount] = useState(() => seedCount(initialSeller?.reviewCount));
  const [totalSales, setTotalSales] = useState(() => seedCount(initialSeller?.totalSales));
  const [listingCount, setListingCount] = useState(0);
  const [memberSince, setMemberSince] = useState<string | null>(() => {
    const raw = initialSeller?.createdAt ?? initialSeller?.joinedDate ?? null;
    return raw ? String(raw) : null;
  });

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

            /* getUserProfile() hits /users/:username/profile/full, which
               requires auth. Called without a token it 401s, the api
               client's interceptor treats that as a session expiry and
               fires a logout, and the resulting throw was caught by the
               outer handler below -- so setSellerUser() never ran and the
               page sat on "Loading profile..." forever.

               Every logged-out visitor to every seller shop hit this.

               The data was already in hand from getUser() above; the full
               profile only adds the gallery. So it is an enhancement, not
               a requirement: skipped entirely when signed out, and its
               own failure can no longer take the page down. */
            if (token) {
              try {
                const profileResult: any = await usersService.getUserProfile(username);
                if (profileResult?.success && profileResult.data) {
                  profileData = coerceProfileData(profileResult.data);
                  if (profileData?.galleryImages && Array.isArray(profileData.galleryImages)) {
                    gallery = profileData.galleryImages
                      .map((u: string) => normalizeImageUrl(u))
                      .filter((u: string | null): u is string => !!u);
                  }
                }
              } catch (profileError) {
                console.warn('[SellerProfile] Full profile unavailable, using public data:', profileError);
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

        const resolvedCover = userData?.coverPhoto ?? profileData?.coverPhoto ?? null;
        setCoverPhoto(normalizeImageUrl(resolvedCover));

        // "X years on Panty Post". createdAt is the account's real
        // creation date; joinedDate is kept as a fallback for older
        // records where it was set and createdAt was not.
        const rawJoined =
          userData?.createdAt ??
          profileData?.createdAt ??
          userData?.joinedDate ??
          profileData?.joinedDate ??
          null;
        setMemberSince(rawJoined ? String(rawJoined) : null);

        const rawSales = Number(userData?.totalSales ?? profileData?.totalSales ?? 0);
        setTotalSales(Number.isFinite(rawSales) ? rawSales : 0);

        const rawReviewCount = Number(userData?.reviewCount ?? profileData?.reviewCount ?? 0);
        setReviewCount(Number.isFinite(rawReviewCount) ? rawReviewCount : 0);

        const rawPrice =
          userData?.subscriptionPrice ??
          profileData?.subscriptionPrice ??
          '0';
        const parsedPrice = parseFloat(String(rawPrice));
        setSubscriptionPrice(Number.isFinite(parsedPrice) ? parsedPrice : null);

        setGalleryImages(gallery);
        setIsVerified(Boolean(userData.isVerified));
        const resolvedCountrySource =
          typeof profileData?.country === 'string'
            ? profileData.country
            : typeof userData?.country === 'string'
              ? userData.country
              : '';
        const sanitizedCountry = resolvedCountrySource ? sanitizeStrict(resolvedCountrySource) : '';
        setCountry(sanitizedCountry || null);

        const rawLocationPublic =
          typeof profileData?.isLocationPublic === 'boolean'
            ? profileData.isLocationPublic
            : typeof userData?.isLocationPublic === 'boolean'
              ? userData.isLocationPublic
              : undefined;
        const normalizedLocationPublic =
          rawLocationPublic === undefined ? true : Boolean(rawLocationPublic);
        setIsLocationPublic(normalizedLocationPublic);
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
          // Counts premium listings too — the header says "items", and a
          // locked item is still an item in the shop.
          setListingCount(listings.length);
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
          const statTotal = reviewsResult.data.stats?.totalReviews;
          setReviewCount(
            typeof statTotal === 'number'
              ? statTotal
              : (reviewsResult.data.reviews || []).length
          );
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

    fetchSellerData().finally(() => {
      setHasLoaded(true);
    });
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
    hasLoaded,
    isVerified,
    bio,
    profilePic,
    coverPhoto,
    subscriptionPrice,
    galleryImages,
    sellerTierInfo,
    totalPhotos,
    totalVideos,
    followers,
    averageRating,
    reviews,
    reviewCount,
    totalSales,
    listingCount,
    memberSince,
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
    country,
    isLocationPublic,
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

