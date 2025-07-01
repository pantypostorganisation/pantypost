// src/hooks/useBrowseDetail.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { getUserProfileData } from '@/utils/profileUtils';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { storageService, listingsService } from '@/services';
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

// Type definitions
interface Review {
  seller: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
}

interface Message {
  id?: string;
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
  isRead?: boolean;
}

export const useBrowseDetail = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { 
    getBuyerBalance,
    orderHistory
  } = useWallet();
  const { 
    listings,
    users,
    subscriptions,
    placeBid: listingsPlaceBid,
    purchaseListingAndRemove,
    refreshListings
  } = useListings();
  
  // State
  const [state, setState] = useState<DetailState>(initialState);
  const [listing, setListing] = useState<ListingWithDetails | undefined>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Core data
  const listingId = params?.id as string;
  const currentUsername = user?.username || null;

  // Load listing using the service
  useEffect(() => {
    const loadListing = async () => {
      if (!listingId) return;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        // First, check if listing is in the context
        const contextListing = listings.find(l => l.id === listingId);
        
        if (contextListing) {
          setListing(contextListing as ListingWithDetails);
          setIsLoading(false);
        } else {
          // If not in context, fetch from service
          const result = await listingsService.getListing(listingId);
          
          if (!mountedRef.current) return;

          if (result.success && result.data) {
            setListing(result.data as ListingWithDetails);
            
            // Refresh listings context to include this listing
            await refreshListings();
          } else {
            setError(result.error?.message || 'Listing not found');
          }
          
          setIsLoading(false);
        }
      } catch (error: any) {
        if (!mountedRef.current) return;
        
        if (error.name === 'AbortError') {
          console.log('Request was cancelled');
          return;
        }

        console.error('Error loading listing:', error);
        setError(error.message || 'Failed to load listing');
        setIsLoading(false);
      }
    };

    loadListing();
  }, [listingId, listings, refreshListings]);

  // Load additional data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load reviews
        const reviewsData = await storageService.getItem<Review[]>('reviews', []);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading additional data:', error);
      }
    };

    loadData();
  }, []);

  // Computed values
  const isAuctionListing = !!listing?.auction;
  const isAuctionEnded = isAuctionListing && listing?.auction && !isAuctionActive(listing.auction);
  const images = listing?.imageUrls || [];
  const currentHighestBid = listing?.auction?.highestBid || 0;
  const currentTotalPayable = isAuctionListing ? calculateTotalPayable(currentHighestBid) : 0;
  const didUserBid = listing?.auction?.bids?.some(bid => bid.bidder === currentUsername) ?? false;
  const isUserHighestBidder = listing?.auction?.highestBidder === currentUsername;
  const buyerBalance = user ? getBuyerBalance(user.username) : 0;
  
  // Check subscription
  const isSubscribed = useCallback((buyerUsername: string, sellerUsername: string): boolean => {
    const buyerSubs = subscriptions[buyerUsername] || [];
    return buyerSubs.includes(sellerUsername);
  }, [subscriptions]);

  const needsSubscription = listing?.isPremium && currentUsername && listing?.seller ? !isSubscribed(currentUsername, listing.seller) : false;

  // Track view count
  useEffect(() => {
    const trackView = async () => {
      if (listing && !viewIncrementedRef.current) {
        viewIncrementedRef.current = true;
        
        try {
          // Update view count
          await listingsService.updateViews({ 
            listingId: listing.id, 
            viewerId: currentUsername || undefined 
          });
          
          // Get updated view count
          const viewsResponse = await listingsService.getListingViews(listing.id);
          if (viewsResponse.success && viewsResponse.data !== undefined) {
            setState(prev => ({ ...prev, viewCount: viewsResponse.data as number }));
          }
        } catch (error) {
          console.error('Error tracking view:', error);
        }
      }
    };
    
    trackView();
  }, [listing, currentUsername]);

  // Get seller reviews
  const sellerReviews = useMemo(() => {
    if (!listing?.seller) return [];
    return reviews.filter(review => review.seller === listing.seller);
  }, [listing?.seller, reviews]);

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

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (receiverUsername: string, senderUsername: string) => {
    try {
      const messagesKey = `messages`;
      const allMessages = await storageService.getItem<Record<string, Message[]>>(messagesKey, {});
      
      // Get conversation key
      const conversationKey = [receiverUsername, senderUsername].sort().join('-');
      const messages = allMessages[conversationKey] || [];
      
      // Mark messages as read
      const updatedMessages = messages.map(msg => {
        if (msg.receiver === receiverUsername && msg.sender === senderUsername && !msg.read) {
          return { ...msg, read: true, isRead: true };
        }
        return msg;
      });
      
      allMessages[conversationKey] = updatedMessages;
      await storageService.setItem(messagesKey, allMessages);
    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }, []);

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
      // Use the new purchaseListingAndRemove method that handles both purchase and removal
      const success = await purchaseListingAndRemove(listing, user.username);
      
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
        }, 3000);
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
  }, [user, listing, state.isProcessing, purchaseListingAndRemove, router, updateState]);

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
      // Use ListingContext's placeBid method
      const success = await listingsPlaceBid(listing.id, user.username, bidValue);
      
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

        // Refresh listing to get updated bid data
        const result = await listingsService.getListing(listing.id);
        if (result.success && result.data) {
          setListing(result.data as ListingWithDetails);
        }

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
  }, [listing, state.isBidding, state.bidAmount, user, listingsPlaceBid, updateState]);

  const handleImageNavigation = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < images.length) {
      updateState({ currentImageIndex: newIndex });
    }
  }, [images.length, updateState]);

  // Effects
  useEffect(() => {
    const loadProfileData = async () => {
      if (listing?.seller) {
        try {
          const profileData = await getUserProfileData(listing.seller);
          if (profileData) {
            updateState({ 
              sellerProfile: { 
                bio: profileData.bio,
                pic: profileData.profilePic,
                subscriptionPrice: profileData.subscriptionPrice
              } 
            });
          }
        } catch (error) {
          console.error('Error loading seller profile:', error);
        }
      }
    };

    loadProfileData();
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Extract seller info
  const sellerInfo = useMemo(() => {
    if (!listing) return null;
    const info = extractSellerInfo(listing, users || {}, orderHistory as any);
    return info ? {
      ...info,
      averageRating: sellerAverageRating,
      reviewCount: sellerReviews.length
    } : null;
  }, [listing, users, orderHistory, sellerAverageRating, sellerReviews.length]);

  // If loading, return loading state
  if (isLoading) {
    return {
      user,
      listing: undefined,
      listingId,
      images: [],
      isAuctionListing: false,
      isAuctionEnded: false,
      didUserBid: false,
      isUserHighestBidder: false,
      currentHighestBid: 0,
      currentTotalPayable: 0,
      suggestedBidAmount: null,
      needsSubscription: false,
      currentUsername: '',
      buyerBalance,
      ...initialState,
      imageRef,
      bidInputRef,
      bidButtonRef,
      handlePurchase: () => {},
      handleBidSubmit: () => {},
      handleImageNavigation: () => {},
      updateState: () => {},
      getTimerProgress: () => 0,
      formatTimeRemaining: () => '',
      formatBidDate: () => '',
      calculateTotalPayable: () => 0,
      router,
      sellerTierInfo: null,
      isVerified: false,
      sellerAverageRating: null,
      sellerReviewCount: 0,
      isLoading: true,
      error: null
    };
  }

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
    buyerBalance,
    
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
    sellerReviewCount: sellerInfo?.reviewCount || 0,
    
    // Loading/error state
    isLoading: false,
    error
  };
};
