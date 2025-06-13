// src/hooks/useBrowseDetail.ts

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useReviews } from '@/context/ReviewContext';
import { v4 as uuidv4 } from 'uuid';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { 
  calculateTotalPayable, 
  formatBidDate, 
  getTimerProgress as getTimerProgressUtil,
  formatTimeRemaining as formatTimeRemainingUtil,
  validateBidAmount
} from '@/utils/browseDetailUtils';
import { DetailState, BidHistoryItem, ListingWithDetails } from '@/types/browseDetail';

// Custom hook for interval with proper cleanup
function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => {
        clearInterval(id);
      };
    }
    
    return undefined;
  }, [delay]);
}

export const useBrowseDetail = () => {
  const { user } = useAuth();
  const { listings, removeListing, addSellerNotification, isSubscribed, users, placeBid, orderHistory } = useListings();
  const { getReviewsForSeller } = useReviews();
  const { id } = useParams();
  const listingId = Array.isArray(id) ? id[0] : id as string;
  const listing = listings.find((item) => item.id === listingId);
  const { purchaseListing, getBuyerBalance, updateOrderAddress } = useWallet();
  const { sendMessage, getMessagesForUsers, markMessagesAsRead } = useMessages();
  const { addRequest } = useRequests();
  const router = useRouter();

  // State
  const [state, setState] = useState<DetailState>({
    purchaseStatus: '',
    isProcessing: false,
    showPurchaseSuccess: false,
    showAuctionSuccess: false,
    sellerProfile: {},
    showStickyBuy: false,
    bidAmount: '',
    bidStatus: {},
    biddingEnabled: true,
    bidsHistory: [],
    showBidHistory: false,
    forceUpdateTimer: {},
    viewCount: Math.floor(Math.random() * 100) + 20,
    isBidding: false,
    bidError: null,
    bidSuccess: null,
    currentImageIndex: 0
  });

  // Refs
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  const hasMarkedRef = useRef(false);
  const bidButtonRef = useRef<HTMLButtonElement>(null);
  const bidInputRef = useRef<HTMLInputElement>(null);
  const lastBidTime = useRef<number>(0);
  const imageRef = useRef<HTMLDivElement | null>(null);

  // Computed values
  const currentUsername = user?.username || '';
  const isSubscribedToSeller = user?.username && listing?.seller ? isSubscribed(user.username, listing.seller) : false;
  const needsSubscription = listing?.isPremium && !isSubscribedToSeller;
  const images = listing?.imageUrls || [];
  
  const isAuctionListing = !!listing?.auction;
  const isAuctionEnded = isAuctionListing && 
    (listing?.auction?.status === 'ended' || listing?.auction?.status === 'cancelled' || 
     new Date(listing?.auction?.endTime || '') <= new Date());

  const didUserBid = useMemo(() => {
    if (!isAuctionListing || !listing?.auction?.bids || !user?.username) return false;
    return listing.auction.bids.some(bid => bid.bidder === user.username);
  }, [isAuctionListing, listing?.auction?.bids, user?.username]);

  const isUserHighestBidder = useMemo(() => {
    if (!isAuctionListing || !listing?.auction?.highestBidder || !user?.username) return false;
    return listing.auction.highestBidder === user.username;
  }, [isAuctionListing, listing?.auction?.highestBidder, user?.username]);

  const sellerTierInfo = useMemo(() => {
    if (!listing?.seller) return null;
    return getSellerTierMemoized(listing.seller, orderHistory);
  }, [listing?.seller, orderHistory]);

  const sellerReviews = useMemo(() => {
    if (!listing?.seller) return [];
    return getReviewsForSeller(listing.seller);
  }, [listing?.seller, getReviewsForSeller]);

  const sellerAverageRating = useMemo(() => {
    if (sellerReviews.length === 0) return null;
    const totalRating = sellerReviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / sellerReviews.length;
  }, [sellerReviews]);

  const currentHighestBid = isAuctionListing && listing?.auction?.highestBid 
    ? listing.auction.highestBid 
    : isAuctionListing && listing?.auction 
      ? listing.auction.startingPrice 
      : 0;
      
  const currentTotalPayable = calculateTotalPayable(currentHighestBid);
  
  const suggestedBidAmount = useMemo(() => {
    if (!isAuctionListing || !listing?.auction) return null;
    const currentBid = listing.auction.highestBid || listing.auction.startingPrice;
    return (currentBid + 10).toFixed(2);
  }, [isAuctionListing, listing?.auction]);

  const sellerUser = users?.[listing?.seller ?? ''];
  const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

  // Create enhanced listing object
  const listingWithDetails: ListingWithDetails | undefined = listing ? {
    ...listing,
    sellerProfile: state.sellerProfile,
    isSellerVerified,
    sellerTierInfo,
    sellerAverageRating,
    sellerReviewCount: sellerReviews.length
  } : undefined;

  // Handlers
  const updateState = useCallback((updates: Partial<DetailState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const getTimerProgress = useCallback(() => {
    return getTimerProgressUtil(isAuctionListing, listing, isAuctionEnded);
  }, [isAuctionListing, listing, isAuctionEnded]);

  const formatTimeRemaining = useCallback((endTime: string) => {
    return formatTimeRemainingUtil(endTime, timeCache);
  }, []);

  const handleImageNavigation = useCallback((direction: 'prev' | 'next') => {
    setState(prev => ({
      ...prev,
      currentImageIndex: direction === 'prev' 
        ? (prev.currentImageIndex - 1 + images.length) % images.length
        : (prev.currentImageIndex + 1) % images.length
    }));
  }, [images.length]);

  const handlePurchase = useCallback(() => {
    if (!user?.username || !listing || state.isProcessing) return;
    
    updateState({ isProcessing: true });
    const success = purchaseListing(listing, user.username);
    
    if (success) {
      updateState({ showPurchaseSuccess: true });
      addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
      
      setTimeout(() => {
        removeListing(listing.id);
        router.push('/buyers/my-orders');
      }, 10000);
    } else {
      updateState({ 
        purchaseStatus: 'Insufficient balance. Please top up your wallet.',
        isProcessing: false 
      });
    }
  }, [user, listing, state.isProcessing, purchaseListing, addSellerNotification, removeListing, router, updateState]);

  const handleBidSubmit = useCallback(async () => {
    if (state.isBidding) return;
    
    updateState({ bidError: null, bidSuccess: null });
    
    if (!user?.username || user.role !== 'buyer' || !listing || !isAuctionListing || !listing.auction) {
      updateState({ bidError: 'You must be logged in as a buyer to place bids.' });
      return;
    }
    
    if (listing.auction.endTime && new Date(listing.auction.endTime) <= new Date()) {
      updateState({ bidError: 'This auction has ended.', biddingEnabled: false });
      return;
    }
    
    const now = Date.now();
    if (now - lastBidTime.current < 5000) {
      updateState({ bidError: 'Please wait a moment before placing another bid.' });
      return;
    }
    
    const userBalance = getBuyerBalance(user.username);
    const validation = validateBidAmount(state.bidAmount, listing, userBalance);
    
    if (!validation.isValid) {
      updateState({ bidError: validation.error || 'Invalid bid' });
      if (bidInputRef.current) bidInputRef.current.focus();
      return;
    }
    
    updateState({ isBidding: true });
    
    try {
      const numericBid = parseFloat(state.bidAmount);
      const success = placeBid(listing.id, user.username, numericBid);
      lastBidTime.current = Date.now();
      
      if (success) {
        updateState({ 
          bidSuccess: `Your bid of $${numericBid.toFixed(2)} has been placed successfully!`,
          bidAmount: '',
          bidStatus: {
            success: true,
            message: `You are the highest bidder! Total payable if you win: $${calculateTotalPayable(numericBid).toFixed(2)}`
          }
        });
        
        const newBid: BidHistoryItem = {
          bidder: user.username,
          amount: numericBid,
          date: new Date().toISOString()
        };
        setState(prev => ({
          ...prev,
          bidsHistory: [newBid, ...prev.bidsHistory]
        }));
        
        setTimeout(() => {
          if (bidInputRef.current) bidInputRef.current.focus();
        }, 500);
      } else {
        updateState({ bidError: 'Failed to place your bid. You may not have sufficient funds or the auction has ended.' });
      }
    } catch (error) {
      console.error('Bid error:', error);
      updateState({ bidError: 'An error occurred while placing your bid. Please try again.' });
    } finally {
      updateState({ isBidding: false });
    }
  }, [state.isBidding, state.bidAmount, user, listing, isAuctionListing, getBuyerBalance, placeBid, updateState]);

  const checkCurrentUserFunds = useCallback(() => {
    if (!user?.username || !isAuctionListing || !listing?.auction?.highestBidder) return true;
    
    if (listing.auction.highestBidder === user.username) {
      const highestBid = listing.auction.highestBid || 0;
      const userBalance = getBuyerBalance(user.username);
      
      if (userBalance < highestBid) {
        updateState({
          bidStatus: {
            success: false,
            message: 'Warning: You do not have sufficient funds to win this auction.'
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
  }, [user?.username, isAuctionListing, listing?.auction?.highestBidder, listing?.auction?.highestBid, getBuyerBalance, state.bidStatus.message, updateState]);

  // Effects
  useEffect(() => {
    if (listing?.seller) {
      const bio = sessionStorage.getItem(`profile_bio_${listing.seller}`);
      const pic = sessionStorage.getItem(`profile_pic_${listing.seller}`);
      const price = sessionStorage.getItem(`subscription_price_${listing.seller}`);
      updateState({ sellerProfile: { bio, pic, subscriptionPrice: price } });
    }
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
      
      if (userBalance < highestBid) {
        updateState({
          bidStatus: {
            success: false,
            message: 'Warning: You do not have sufficient funds to win this auction.'
          }
        });
      } else {
        updateState({
          bidStatus: {
            success: true,
            message: 'You are the highest bidder!'
          }
        });
      }
    } else if (state.bidStatus.success && isAuctionListing && listing?.auction?.highestBidder !== user?.username) {
      updateState({
        bidStatus: {
          success: false,
          message: 'You have been outbid!'
        }
      });
    }
  }, [isAuctionListing, listing?.auction?.highestBidder, user?.username, state.bidStatus.success, listing?.auction?.highestBid, getBuyerBalance, updateState]);

  // Timer update interval
  useInterval(
    () => {
      if (!isAuctionListing || isAuctionEnded || !listing?.auction?.endTime) return;
      updateState({ forceUpdateTimer: {} });
      if (new Date(listing.auction.endTime) <= new Date()) {
        updateState({ biddingEnabled: false });
      }
    },
    isAuctionListing && !isAuctionEnded && listing?.auction?.endTime ? 1000 : null
  );

  return {
    // Data
    user,
    listing: listingWithDetails,
    listingId,
    images,
    isAuctionListing,
    isAuctionEnded,
    didUserBid,
    isUserHighestBidder,
    currentHighestBid,
    currentTotalPayable,
    suggestedBidAmount,
    needsSubscription,
    isSubscribedToSeller,
    currentUsername,
    
    // State
    ...state,
    
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
    formatTimeRemaining,
    formatBidDate,
    calculateTotalPayable,
    
    // Navigation
    router
  };
};