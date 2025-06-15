// src/hooks/useBrowseDetail.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import { useMessages } from '@/context/MessageContext';
import { useReviews } from '@/context/ReviewContext';
import { getUserProfileData } from '@/utils/profileUtils';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { 
  isAuctionActive, 
  calculateTotalPayable, 
  formatTimeRemaining, 
  formatRelativeTime,
  extractSellerInfo 
} from '@/utils/browseDetailUtils';
import { DetailState, ListingWithDetails } from '@/types/browseDetail';

const AUCTION_UPDATE_INTERVAL = 1000;
const FUNDING_CHECK_INTERVAL = 10000;
const NAVIGATION_DELAY = 500;

const initialState: DetailState = {
  purchaseStatus: '',
  isProcessing: false,
  showPurchaseSuccess: false,
  showAuctionSuccess: false,
  sellerProfile: { bio: null, pic: null, subscriptionPrice: null },
  showStickyBuy: false,
  bidAmount: '',
  bidStatus: {},
  biddingEnabled: false,
  bidsHistory: [],
  showBidHistory: false,
  forceUpdateTimer: {},
  viewCount: 0,
  isBidding: false,
  bidError: null,
  bidSuccess: null,
  currentImageIndex: 0
};

export const useBrowseDetail = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    listings, 
    users, 
    placeBid: contextPlaceBid, 
    isSubscribed, 
    updateListing,
    orderHistory
  } = useListings();
  const { purchaseListing, getBuyerBalance } = useWallet();
  const { markMessagesAsRead } = useMessages();
  const { getReviewsForSeller } = useReviews();
  
  // State
  const [state, setState] = useState<DetailState>(initialState);
  
  // Refs
  const lastProcessedPaymentRef = useRef<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const bidInputRef = useRef<HTMLInputElement>(null);
  const bidButtonRef = useRef<HTMLButtonElement>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fundingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMarkedRef = useRef(false);
  const viewIncrementedRef = useRef(false);

  // Core data
  const listingId = params?.id as string;
  const listing = listings.find(l => l.id === listingId) as ListingWithDetails | undefined;
  const currentUsername = user?.username || null;
  
  // Computed values
  const isAuctionListing = !!listing?.auction;
  const isAuctionEnded = isAuctionListing && listing?.auction && !isAuctionActive(listing.auction);
  const images = listing?.imageUrls || [];
  const currentHighestBid = listing?.auction?.highestBid || 0;
  const currentTotalPayable = isAuctionListing ? calculateTotalPayable(currentHighestBid) : 0;
  const didUserBid = listing?.auction?.bids?.some(bid => bid.bidder === currentUsername) ?? false;
  const isUserHighestBidder = listing?.auction?.highestBidder === currentUsername;
  const needsSubscription = listing?.isPremium && currentUsername && listing?.seller ? !isSubscribed(currentUsername, listing.seller) : false;

  // Add view count tracking
  useEffect(() => {
    if (listing && !viewIncrementedRef.current) {
      viewIncrementedRef.current = true;
      // Increment view count
      const viewKey = `listing_views_${listing.id}`;
      const currentViews = parseInt(localStorage.getItem(viewKey) || '0');
      const newViews = currentViews + 1;
      localStorage.setItem(viewKey, newViews.toString());
      setState(prev => ({ ...prev, viewCount: newViews }));
    }
  }, [listing]);

  // Get seller reviews
  const sellerReviews = useMemo(() => {
    if (!listing?.seller) return [];
    return getReviewsForSeller(listing.seller);
  }, [listing?.seller, getReviewsForSeller]);

  const sellerAverageRating = useMemo(() => {
    if (sellerReviews.length === 0) return null;
    const totalRating = sellerReviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / sellerReviews.length;
  }, [sellerReviews]);

  // Helper functions
  const updateState = useCallback((updates: Partial<DetailState>) => {
    if (!mountedRef.current) return;
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const getTimerProgress = useCallback(() => {
    if (!isAuctionListing || !listing?.auction?.endTime || isAuctionEnded) return 0;
    const now = new Date().getTime();
    const startTime = new Date(listing.date).getTime();
    const endTime = new Date(listing.auction.endTime).getTime();
    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  }, [isAuctionListing, listing?.auction?.endTime, listing?.date, isAuctionEnded]);

  const checkCurrentUserFunds = useCallback(() => {
    if (!user || user.role !== "buyer" || !isAuctionListing || !listing?.auction) return;

    const balance = getBuyerBalance(user.username);
    const startingBid = listing.auction.startingPrice || 0;
    const minimumBid = (listing.auction.highestBid || startingBid) + 1;
    const totalRequired = calculateTotalPayable(minimumBid);
    const hasEnoughFunds = balance >= totalRequired;

    updateState({ 
      biddingEnabled: hasEnoughFunds,
      bidStatus: hasEnoughFunds ? {} : {
        success: false,
        message: `Insufficient funds. You need $${totalRequired.toFixed(2)} to place this bid.`
      }
    });
  }, [user, isAuctionListing, listing?.auction, getBuyerBalance, updateState]);

  const formatBidDate = useCallback((date: string) => formatRelativeTime(date), []);

  // Suggested bid amount calculation
  const suggestedBidAmount = useMemo(() => {
    if (!isAuctionListing || !listing?.auction) return null;
    
    const currentBid = listing.auction.highestBid || 0;
    const startingBid = listing.auction.startingPrice || 0;
    const minBidAmount = currentBid > 0 ? currentBid + 1 : startingBid;
    
    return minBidAmount.toString();
  }, [isAuctionListing, listing?.auction]);

  // Action handlers
  const handlePurchase = useCallback(async () => {
    if (!user || !listing || state.isProcessing) return;
    
    if (user.role !== 'buyer') {
      updateState({ 
        purchaseStatus: 'Only buyers can make purchases',
        isProcessing: false 
      });
      return;
    }

    updateState({ isProcessing: true, purchaseStatus: 'Processing...' });

    try {
      // Convert price to string as purchaseListing expects a string
      const priceString = String(listing.markedUpPrice || listing.price);
      const success = await purchaseListing(listing, priceString);
      
      if (success) {
        updateState({ 
          showPurchaseSuccess: true,
          purchaseStatus: 'Purchase successful!',
          isProcessing: false 
        });
        
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }
        
        navigationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            router.push('/buyers/my-orders');
          }
        }, 10000);
      } else {
        updateState({ 
          purchaseStatus: 'Purchase failed. Please check your wallet balance.',
          isProcessing: false 
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      updateState({ 
        purchaseStatus: 'An error occurred. Please try again.',
        isProcessing: false 
      });
    }
  }, [user, listing, state.isProcessing, purchaseListing, router, updateState]);

  const handleBidSubmit = useCallback(async () => {
    if (!listing || state.isBidding || !user || user.role !== 'buyer') return;

    const bidValue = parseFloat(state.bidAmount);
    if (isNaN(bidValue) || bidValue <= 0) {
      updateState({ 
        bidError: 'Please enter a valid bid amount',
        bidSuccess: null 
      });
      return;
    }

    updateState({ 
      isBidding: true, 
      bidError: null, 
      bidSuccess: null 
    });

    try {
      const success = await contextPlaceBid(listing.id, user.username, bidValue);
      
      if (success) {
        updateState({ 
          bidAmount: '',
          bidSuccess: 'Bid placed successfully!',
          bidError: null,
          isBidding: false,
          bidStatus: {
            success: true,
            message: 'You are now the highest bidder!'
          }
        });

        setTimeout(() => {
          if (mountedRef.current) {
            updateState({ bidSuccess: null });
          }
        }, 3000);
      } else {
        updateState({ 
          bidError: 'Failed to place bid. Please try again.',
          bidSuccess: null,
          isBidding: false 
        });
      }
    } catch (error) {
      console.error('Bid submission error:', error);
      updateState({ 
        bidError: 'An error occurred while placing your bid.',
        bidSuccess: null,
        isBidding: false 
      });
    }
  }, [listing, state.isBidding, state.bidAmount, user, contextPlaceBid, updateState]);

  const handleImageNavigation = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < images.length) {
      updateState({ currentImageIndex: newIndex });
    }
  }, [images.length, updateState]);

  const validateBidAmount = useCallback(() => {
    if (!listing?.auction || !state.bidAmount) return true;
    
    const bidValue = parseFloat(state.bidAmount);
    const startingBid = listing.auction.startingPrice || 0;
    const minimumBid = (listing.auction.highestBid || startingBid) + 1;
    
    if (isNaN(bidValue) || bidValue < minimumBid) {
      updateState({
        bidStatus: {
          success: false,
          message: `Minimum bid is $${minimumBid}`
        }
      });
      return false;
    }

    const userBalance = user ? getBuyerBalance(user.username) : 0;
    const totalRequired = calculateTotalPayable(bidValue);
    
    if (userBalance < totalRequired) {
      updateState({
        bidStatus: {
          success: false,
          message: `Insufficient funds. You need $${totalRequired.toFixed(2)}`
        }
      });
      return false;
    }

    if (user?.username === listing.auction.highestBidder && listing.auction.highestBid) {
      if (bidValue <= listing.auction.highestBid) {
        updateState({
          bidStatus: {
            success: false,
            message: 'Your new bid must be higher than your current bid'
          }
        });
        return false;
      } else {
        if (state.bidStatus.message?.includes('Warning')) {
          updateState({
            bidStatus: {
              success: true,
              message: 'You are the highest bidder!'
            }
          });
        }
        return true;
      }
    }
    return true;
  }, [user?.username, listing?.auction, state.bidAmount, state.bidStatus.message, getBuyerBalance, updateState]);

  // Effects
  useEffect(() => {
    if (listing?.seller) {
      // Use the new getUserProfileData utility
      const profileData = getUserProfileData(listing.seller);
      if (profileData) {
        updateState({ 
          sellerProfile: { 
            bio: profileData.bio,
            pic: profileData.profilePic,
            subscriptionPrice: profileData.subscriptionPrice
          } 
        });
      } else {
        // Fallback to sessionStorage for backward compatibility
        const bio = sessionStorage.getItem(`profile_bio_${listing.seller}`);
        const pic = sessionStorage.getItem(`profile_pic_${listing.seller}`);
        const price = sessionStorage.getItem(`subscription_price_${listing.seller}`);
        updateState({ sellerProfile: { bio, pic, subscriptionPrice: price } });
      }
    }
  }, [listing?.seller, updateState]);

  // Listen for storage changes to update profile in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_profiles' && e.newValue && listing?.seller) {
        const profileData = getUserProfileData(listing.seller);
        if (profileData) {
          updateState({ 
            sellerProfile: { 
              bio: profileData.bio,
              pic: profileData.profilePic,
              subscriptionPrice: profileData.subscriptionPrice
            } 
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [listing?.seller, updateState]);

  useEffect(() => {
    if (listing?.seller && currentUsername && !hasMarkedRef.current) {
      markMessagesAsRead(currentUsername, listing.seller);
      hasMarkedRef.current = true;
    }
  }, [listing?.seller, currentUsername, markMessagesAsRead]);

  useEffect(() => {
    if (isAuctionListing && listing?.auction?.bids) {
      const sortedBids = [...listing.auction.bids].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      updateState({ bidsHistory: sortedBids });
    }
  }, [isAuctionListing, listing?.auction?.bids, updateState]);

  useEffect(() => {
    if (isAuctionListing && isAuctionEnded && user?.role === "buyer" && isUserHighestBidder && !state.showAuctionSuccess) {
      setTimeout(() => {
        updateState({ showAuctionSuccess: true });
        setTimeout(() => {
          router.push('/buyers/my-orders');
        }, 10000);
      }, 1000);
    }
  }, [isAuctionListing, isAuctionEnded, user?.role, isUserHighestBidder, state.showAuctionSuccess, router, updateState]);

  useEffect(() => {
    if (!isAuctionListing || isAuctionEnded) return;
    checkCurrentUserFunds();
    const interval = setInterval(() => {
      checkCurrentUserFunds();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuctionListing, isAuctionEnded, checkCurrentUserFunds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      updateState({ showStickyBuy: rect.bottom < 60 });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateState]);

  // Auto-update bid status
  useEffect(() => {
    if (isAuctionListing && listing?.auction?.highestBidder === user?.username) {
      const highestBid = listing.auction?.highestBid || 0;
      const userBalance = user ? getBuyerBalance(user.username) : 0;
      const totalPayable = calculateTotalPayable(highestBid);
      
      if (userBalance < totalPayable) {
        updateState({
          bidStatus: {
            success: false,
            message: `Warning: You need $${totalPayable.toFixed(2)} in your wallet to win this auction.`
          }
        });
      } else {
        updateState({
          bidStatus: {
            success: true,
            message: "You are the highest bidder!"
          }
        });
      }
    }
  }, [isAuctionListing, listing?.auction?.highestBidder, listing?.auction?.highestBid, user?.username, getBuyerBalance, updateState]);

  // Timer for auction updates
  useEffect(() => {
    if (!isAuctionListing || isAuctionEnded || !mountedRef.current) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      if (mountedRef.current) {
        updateState({ forceUpdateTimer: {} });
      }
    }, AUCTION_UPDATE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuctionListing, isAuctionEnded, updateState]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (fundingTimerRef.current) {
        clearInterval(fundingTimerRef.current);
      }
    };
  }, []);

  // Extract seller info
  const sellerInfo = useMemo(() => {
    if (!listing) return null;
    const info = extractSellerInfo(listing, users || {}, orderHistory);
    return info ? {
      ...info,
      averageRating: sellerAverageRating,
      reviewCount: sellerReviews.length
    } : null;
  }, [listing, users, orderHistory, sellerAverageRating, sellerReviews.length]);

  // Return everything
  return {
    // Data
    user,
    listing,
    listingId,
    images,
    isAuctionListing,
    isAuctionEnded: isAuctionEnded || false,
    didUserBid,
    isUserHighestBidder,
    currentHighestBid,
    currentTotalPayable,
    suggestedBidAmount,
    needsSubscription: needsSubscription || false,
    currentUsername: currentUsername || '',
    
    // State
    purchaseStatus: state.purchaseStatus,
    isProcessing: state.isProcessing,
    showPurchaseSuccess: state.showPurchaseSuccess,
    showAuctionSuccess: state.showAuctionSuccess,
    sellerProfile: state.sellerProfile,
    showStickyBuy: state.showStickyBuy,
    bidAmount: state.bidAmount,
    bidStatus: state.bidStatus,
    biddingEnabled: state.biddingEnabled,
    bidsHistory: state.bidsHistory,
    showBidHistory: state.showBidHistory,
    forceUpdateTimer: state.forceUpdateTimer,
    viewCount: state.viewCount,
    isBidding: state.isBidding,
    bidError: state.bidError,
    bidSuccess: state.bidSuccess,
    currentImageIndex: state.currentImageIndex,
    
    // Refs
    imageRef,
    bidInputRef,
    bidButtonRef,
    
    // Handlers
    handlePurchase,
    handleBidSubmit,
    handleImageNavigation,
    updateState,
    getTimerProgress,
    formatTimeRemaining: (endTime: string) => formatTimeRemaining(endTime),
    formatBidDate,
    calculateTotalPayable,
    
    // Navigation
    router,
    
    // Seller info
    sellerTierInfo: sellerInfo?.tierInfo,
    isVerified: sellerInfo?.isVerified || false,
    sellerAverageRating: sellerInfo?.averageRating,
    sellerReviewCount: sellerInfo?.reviewCount || 0
  };
};