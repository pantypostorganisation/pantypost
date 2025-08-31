// src/hooks/useBrowseDetail.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuction } from '@/context/AuctionContext';
import { WebSocketEvent } from '@/types/websocket';
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
import { getBuyerDebitAmount, hasSufficientBalance, getAmountNeeded, getAuctionTotalPayable } from '@/utils/pricing';
import { DetailState, ListingWithDetails, BidHistoryItem } from '@/types/browseDetail';
import { securityService, sanitize } from '@/services/security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { financialSchemas } from '@/utils/validation/schemas';
import { ApiResponse } from '@/services/api.config';
import { isAdmin } from '@/utils/security/permissions';

const AUCTION_UPDATE_INTERVAL = 1000;
const FUNDING_CHECK_INTERVAL = 10000;
const NAVIGATION_DELAY = 500;
const AUCTION_EXPIRY_CHECK_INTERVAL = 5000;

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
  const { processEndedAuction } = useAuction();
  
  const wsContext = useWebSocket();
  const subscribe = wsContext?.subscribe || (() => () => {});
  const isConnected = wsContext?.isConnected || false;
  
  const rateLimiter = getRateLimiter();
  
  // State
  const [state, setState] = useState<DetailState>(initialState);
  const [listing, setListing] = useState<ListingWithDetails | undefined>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [auctionExpiryProcessed, setAuctionExpiryProcessed] = useState(false);
  const [realtimeBids, setRealtimeBids] = useState<BidHistoryItem[]>([]);
  const [lastBidUpdate, setLastBidUpdate] = useState<number>(Date.now());
  
  // Refs
  const isPurchasingRef = useRef(false);
  const hasPurchasedRef = useRef(false);
  const lastProcessedPaymentRef = useRef<string | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const bidInputRef = useRef<HTMLInputElement>(null);
  const bidButtonRef = useRef<HTMLButtonElement>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fundingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const auctionExpiryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMarkedRef = useRef(false);
  const viewIncrementedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isProcessingAuctionEndRef = useRef(false);

  // Core data
  const rawListingId = params?.id as string;
  const listingId = rawListingId ? sanitize.strict(rawListingId) : '';
  const currentUsername = user?.username || null;

  // Determine if auction
  const isAuction = !!(listing?.auction?.isAuction || (listing?.auction && listing.auction.startingPrice !== undefined));
  const isAuctionListing = isAuction;
  const isAuctionEnded = isAuction && listing?.auction && !isAuctionActive(listing.auction);

  // Reserve price checks
  const hasReserve = !!listing?.auction?.reservePrice;
  const currentBid = listing?.auction?.highestBid || 0;
  const reserveMet = hasReserve && listing?.auction?.reservePrice ? currentBid >= listing.auction.reservePrice : true;

  // Role guards
  const userIsAdmin = !!isAdmin(user as any);
  const isSellerOfListing = !!(user?.username && listing?.seller && user.username === listing.seller);
  const canEndAuction = userIsAdmin || isSellerOfListing;
  const isBidderView = !!(user?.role === 'buyer' && !canEndAuction);

  // Helper functions
  const updateState = useCallback((updates: Partial<DetailState> | ((prev: DetailState) => Partial<DetailState>)) => {
    if (!mountedRef.current) return;
    setState(prev => {
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...newUpdates };
    });
  }, []);

  // WebSocket subscriptions for real-time updates
  useEffect(() => {
    if (!isConnected || !isAuction || !listingId || !mountedRef.current || !subscribe) return;

    const unsubscribeBid = subscribe(WebSocketEvent.AUCTION_BID, (data: any) => {
      if (data.listingId !== listingId) return;

      console.log('[BrowseDetail] Real-time bid received:', data);

      const newBidForHistory: BidHistoryItem = {
        bidder: data.bidder || data.username,
        amount: data.amount || 0,
        date: data.timestamp || new Date().toISOString()
      };

      const newBidForListing = {
        id: data.id || `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bidder: data.bidder || data.username,
        amount: data.amount || 0,
        date: data.timestamp || new Date().toISOString()
      };

      setListing(prev => {
        if (!prev || !prev.auction) return prev;
        
        const updatedBids = [...(prev.auction.bids || []), newBidForListing]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 20);
        
        return {
          ...prev,
          auction: {
            ...prev.auction,
            highestBid: newBidForListing.amount,
            highestBidder: newBidForListing.bidder,
            bids: updatedBids
          }
        } as ListingWithDetails;
      });

      setRealtimeBids(prev => {
        const updated = [newBidForHistory, ...prev]
          .filter((bid, index, self) => 
            index === self.findIndex(b => b.bidder === bid.bidder && b.amount === bid.amount)
          )
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        return updated;
      });

      updateState(prevState => ({
        bidsHistory: [newBidForHistory, ...prevState.bidsHistory]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));

      setLastBidUpdate(Date.now());

      if (newBidForHistory.bidder === currentUsername) {
        updateState({ 
          bidSuccess: 'Your bid was placed successfully!',
          bidError: null 
        });
      }
    });

    const unsubscribeEnded = subscribe(WebSocketEvent.AUCTION_ENDED, (data: any) => {
      if (data.listingId === listingId) {
        console.log('[BrowseDetail] Auction ended event received');
        
        setListing(prev => {
          if (!prev || !prev.auction) return prev;
          
          return {
            ...prev,
            auction: {
              ...prev.auction,
              status: data.status === 'reserve_not_met' ? 'reserve_not_met' : 'ended'
            }
          } as ListingWithDetails;
        });
        
        refreshListings();
      }
    });

    const unsubscribeReserve = subscribe('auction:reserve_not_met' as WebSocketEvent, (data: any) => {
      if (data.listingId === listingId) {
        console.log('[BrowseDetail] Reserve not met event received');
        
        setListing(prev => {
          if (!prev || !prev.auction) return prev;
          
          return {
            ...prev,
            auction: {
              ...prev.auction,
              status: 'reserve_not_met'
            }
          } as ListingWithDetails;
        });
      }
    });

    // Listen for auction won event
    const unsubscribeWon = subscribe('auction:won' as WebSocketEvent, (data: any) => {
      console.log('[BrowseDetail] Auction won event received:', data);
      
      // Check if this is for the current listing and user
      if (data.listingId === listingId || data.listingId === listing?.id) {
        if (currentUsername && (data.winner === currentUsername || data.winnerId === currentUsername)) {
          console.log('[BrowseDetail] Current user won the auction!');
          updateState({ showAuctionSuccess: true });
          
          // Navigate to orders after a delay
          setTimeout(() => {
            if (mountedRef.current) {
              router.push('/buyers/my-orders');
            }
          }, 5000);
        }
      }
    });

    return () => {
      unsubscribeBid();
      unsubscribeEnded();
      unsubscribeReserve();
      unsubscribeWon();
    };
  }, [isConnected, isAuction, listingId, currentUsername, subscribe, updateState, refreshListings, router, listing?.id]);

  // Auto-check and process expired auctions
  useEffect(() => {
    if (!isAuction || !listing?.auction || auctionExpiryProcessed || !mountedRef.current) return;
    if (isProcessingAuctionEndRef.current) return;

    const checkAuctionExpiry = async () => {
      if (!listing.auction?.endTime) return;
      
      const now = new Date();
      const endTime = new Date(listing.auction.endTime);
      
      if (endTime <= now && listing.auction.status === 'active') {
        console.log('[BrowseDetail] Auction has expired, needs processing');
        
        if (isProcessingAuctionEndRef.current) {
          console.log('[BrowseDetail] Already processing auction end');
          return;
        }
        
        isProcessingAuctionEndRef.current = true;
        setAuctionExpiryProcessed(true);

        setListing(prev => {
          if (!prev || !prev.auction) return prev;
          return {
            ...prev,
            auction: {
              ...prev.auction,
              status: reserveMet ? 'ended' : ('reserve_not_met' as any)
            }
          } as ListingWithDetails;
        });

        updateState({ biddingEnabled: false });

        // Always trigger backend processing
        try {
          console.log('[BrowseDetail] Triggering backend auction end processing');
          const response = await listingsService.endAuction(listing.id);
          
          if (response.success) {
            console.log('[BrowseDetail] Auction end processed successfully');
            await refreshListings();
            
            if (listing.auction.highestBidder === currentUsername && reserveMet) {
              updateState({ showAuctionSuccess: true });
              setTimeout(() => {
                if (mountedRef.current) {
                  router.push('/buyers/my-orders');
                }
              }, 5000);
            }
          } else {
            const msg = (response.error?.message || '').toLowerCase();
            if (msg.includes('already processed') || msg.includes('auction is not active')) {
              console.log('[BrowseDetail] Auction already processed on backend');
              await refreshListings();
            } else {
              console.warn('[BrowseDetail] Failed to process auction end:', response.error);
            }
          }
        } catch (error) {
          const m = (error as any)?.message?.toLowerCase?.() || '';
          if (m.includes('already processed') || m.includes('auction is not active')) {
            console.log('[BrowseDetail] Auction already ended, refreshing');
            try { await refreshListings(); } catch {}
          } else {
            console.warn('[BrowseDetail] Error processing auction end:', error);
          }
        } finally {
          isProcessingAuctionEndRef.current = false;
        }
      }
    };

    checkAuctionExpiry();
    auctionExpiryTimerRef.current = setInterval(checkAuctionExpiry, AUCTION_EXPIRY_CHECK_INTERVAL);

    return () => {
      if (auctionExpiryTimerRef.current) {
        clearInterval(auctionExpiryTimerRef.current);
        auctionExpiryTimerRef.current = null;
      }
    };
  }, [isAuction, listing, auctionExpiryProcessed, currentUsername, refreshListings, router, updateState, reserveMet]);

  // Load listing
  useEffect(() => {
    const loadListing = async () => {
      if (!listingId) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const contextListing = listings.find(l => l.id === listingId);
        
        if (contextListing) {
          setListing(contextListing as ListingWithDetails);
          setState(prev => ({ ...prev, viewCount: contextListing.views || 0 }));
          setIsLoading(false);
        } else {
          const result = await listingsService.getListing(listingId);
          
          if (!mountedRef.current) return;

          if (result.success && result.data) {
            setListing(result.data as ListingWithDetails);
            setState(prev => ({ ...prev, viewCount: result.data?.views || 0 }));
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
        const reviewsData = await storageService.getItem<Review[]>('reviews', []);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading additional data:', error);
      }
    };

    loadData();
  }, []);

  // Merge realtime bids with existing bids
  const mergedBidsHistory = useMemo(() => {
    const allBids = [...realtimeBids, ...state.bidsHistory];
    const uniqueBids = allBids.filter((bid, index, self) =>
      index === self.findIndex(b => 
        b.bidder === bid.bidder && 
        b.amount === bid.amount && 
        Math.abs(new Date(b.date).getTime() - new Date(bid.date).getTime()) < 1000
      )
    );
    return uniqueBids.sort((a, b) => b.amount - a.amount);
  }, [realtimeBids, state.bidsHistory]);

  // Computed values
  const images = listing?.imageUrls || [];
  const currentHighestBid = listing?.auction?.highestBid || 0;
  const currentTotalPayable = isAuction ? getAuctionTotalPayable(currentHighestBid) : 0;
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
      if (!listing) return;
      
      if (listing.views !== undefined && !viewIncrementedRef.current) {
        setState(prev => ({ ...prev, viewCount: listing.views || 0 }));
      }
      
      if (!viewIncrementedRef.current) {
        viewIncrementedRef.current = true;
        
        try {
          if (user && user.username !== listing.seller) {
            await listingsService.updateViews({
              listingId: listing.id,
              viewerId: user.username,
            });
          } else if (!user) {
            await listingsService.updateViews({
              listingId: listing.id,
            });
          }
          
          const viewsResponse: ApiResponse<number> = await listingsService.getListingViews(listing.id);
          if (viewsResponse.success && viewsResponse.data !== undefined) {
            setState(prev => ({ ...prev, viewCount: viewsResponse.data as number }));
          }
        } catch (error) {
          console.error('Error tracking view:', error);
          if (listing.views !== undefined) {
            setState(prev => ({ ...prev, viewCount: listing.views || 0 }));
          }
        }
      }
    };
    
    trackView();
  }, [listing, user]);

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

  const getTimerProgress = useCallback(() => {
    if (!isAuction || !listing?.auction?.endTime || isAuctionEnded) return 0;
    const now = new Date().getTime();
    const startTime = new Date(listing.date).getTime();
    const endTime = new Date(listing.auction.endTime).getTime();
    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  }, [isAuction, listing?.auction?.endTime, listing?.date, isAuctionEnded]);

  // Check current user funds
  const checkCurrentUserFunds = useCallback(() => {
    if (!isAuction || !listing?.auction) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }
    
    if (!user || user.role !== "buyer") return;
    
    if (isPurchasingRef.current || hasPurchasedRef.current || state.isProcessing) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }

    const balance = getBuyerBalance(user.username);
    console.log('[useBrowseDetail] Checking funds - current balance:', balance);
    
    const startingBid = listing.auction.startingPrice || 0;
    const minimumBid = (listing.auction.highestBid || startingBid) + 1;
    const totalRequired = getAuctionTotalPayable(minimumBid);
    const hasEnoughFunds = balance >= totalRequired;

    console.log('[useBrowseDetail] Fund check:', {
      balance,
      minimumBid,
      totalRequired,
      hasEnoughFunds
    });

    updateState({ 
      biddingEnabled: hasEnoughFunds,
      bidStatus: hasEnoughFunds ? {} : {
        success: false,
        message: `Insufficient funds. You need $${totalRequired.toFixed(2)} to place this bid.`
      }
    });
  }, [user, isAuction, listing?.auction, getBuyerBalance, updateState, state.isProcessing]);

  const formatBidDate = useCallback((date: string) => formatRelativeTime(date), []);

  // Suggested bid amount calculation
  const suggestedBidAmount = useMemo(() => {
    if (!isAuction || !listing?.auction) return null;
    
    const currentBid = listing.auction.highestBid || 0;
    const startingBid = listing.auction.startingPrice || 0;
    const minBidAmount = currentBid > 0 ? currentBid + 1 : startingBid;
    
    return minBidAmount.toString();
  }, [isAuction, listing?.auction]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (receiverUsername: string, senderUsername: string) => {
    try {
      const messagesKey = `messages`;
      const allMessages = await storageService.getItem<Record<string, Message[]>>(messagesKey, {});
      
      const conversationKey = [receiverUsername, senderUsername].sort().join('-');
      const messages = allMessages[conversationKey] || [];
      
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

  // Listen for wallet balance updates and refunds
  useEffect(() => {
    if (!isAuction || !user || user.role !== 'buyer') return;
    
    const handleBalanceUpdate = (event: CustomEvent) => {
      console.log('[useBrowseDetail] Balance update received:', event.detail);
      
      if (event.detail.username === user.username) {
        checkCurrentUserFunds();
        updateState({ 
          bidError: null,
          bidSuccess: null
        });
      }
    };
    
    const handleUserRefunded = (event: CustomEvent) => {
      console.log('[useBrowseDetail] User refunded:', event.detail);
      
      if (event.detail.username === user.username && 
          event.detail.listingId === listing?.id) {
        updateState({ 
          bidStatus: {
            success: true,
            message: `You were outbid! Your funds ($${event.detail.amount.toFixed(2)}) have been refunded.`
          },
          bidError: null,
          bidSuccess: null
        });
        
        setTimeout(() => {
          checkCurrentUserFunds();
        }, 100);
      }
    };
    
    const handleCheckBidStatus = () => {
      console.log('[useBrowseDetail] Checking bid status after balance change');
      checkCurrentUserFunds();
    };
    
    window.addEventListener('wallet:buyer-balance-updated', handleBalanceUpdate as EventListener);
    window.addEventListener('wallet:user-refunded', handleUserRefunded as EventListener);
    window.addEventListener('auction:check-bid-status', handleCheckBidStatus);
    
    return () => {
      window.removeEventListener('wallet:buyer-balance-updated', handleBalanceUpdate as EventListener);
      window.removeEventListener('wallet:user-refunded', handleUserRefunded as EventListener);
      window.removeEventListener('auction:check-bid-status', handleCheckBidStatus);
    };
  }, [isAuction, user, listing?.id, checkCurrentUserFunds, updateState]);

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

    setRateLimitError(null);

    const rateLimitResult = rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many requests. Please wait ${rateLimitResult.waitTime} seconds.`);
      updateState({ 
        purchaseStatus: `Please wait ${rateLimitResult.waitTime} seconds before trying again.`,
        isProcessing: false 
      });
      return;
    }

    const freshBalance = getBuyerBalance(user.username);
    const requiredAmount = getBuyerDebitAmount(listing);
    
    if (!hasSufficientBalance(freshBalance, listing)) {
      const amountNeeded = getAmountNeeded(freshBalance, listing);
      updateState({ 
        purchaseStatus: `Insufficient balance. You need ${amountNeeded.toFixed(2)} more.`,
        isProcessing: false 
      });
      return;
    }

    isPurchasingRef.current = true;
    hasPurchasedRef.current = false;

    updateState({ 
      isProcessing: true, 
      purchaseStatus: 'Processing...', 
      bidStatus: {},
      biddingEnabled: true,
      bidError: null,
      bidSuccess: null
    });

    try {
      const success = await purchaseListingAndRemove(listing, user.username);
      
      if (success) {
        hasPurchasedRef.current = true;
        updateState({ 
          showPurchaseSuccess: true,
          purchaseStatus: 'Purchase successful!',
          isProcessing: false,
          bidStatus: {},
          biddingEnabled: true
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
        isPurchasingRef.current = false;
        updateState({ 
          purchaseStatus: 'Purchase failed. Please check your wallet balance.',
          isProcessing: false 
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      isPurchasingRef.current = false;
      updateState({ 
        purchaseStatus: 'An error occurred. Please try again.',
        isProcessing: false 
      });
    }
  }, [user, listing, state.isProcessing, purchaseListingAndRemove, router, updateState, rateLimiter, getBuyerBalance]);

  const handleBidSubmit = useCallback(async () => {
    if (!isAuction || !listing || state.isBidding || !user || user.role !== 'buyer') return;

    setRateLimitError(null);
    updateState({ bidError: null, bidSuccess: null });

    const bidValidation = securityService.validateAmount(state.bidAmount, {
      min: 0.01,
      max: 10000
    });

    if (!bidValidation.valid || !bidValidation.value) {
      updateState({ 
        bidError: bidValidation.error || 'Please enter a valid bid amount',
        bidSuccess: null 
      });
      return;
    }

    const bidValue = bidValidation.value;

    const currentBid = listing.auction?.highestBid || 0;
    const startingBid = listing.auction?.startingPrice || 0;
    const minBidAmount = currentBid > 0 ? currentBid + 1 : startingBid;

    if (bidValue < minBidAmount) {
      updateState({ 
        bidError: `Minimum bid is $${minBidAmount.toFixed(2)}`,
        bidSuccess: null 
      });
      return;
    }

    const rateLimitResult = rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many bids. Please wait ${rateLimitResult.waitTime} seconds.`);
      updateState({ 
        bidError: `Please wait ${rateLimitResult.waitTime} seconds before bidding again.`,
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

        const result = await listingsService.getListing(listing.id);
        if (result.success && result.data) {
          setListing(result.data as ListingWithDetails);
          setState(prev => ({ ...prev, viewCount: result.data?.views || prev.viewCount }));
        }

        setTimeout(() => {
          if (mountedRef.current) {
            updateState({ bidSuccess: null });
          }
        }, 3000);
      } else {
        updateState({ 
          bidError: 'Failed to place bid. Please check your balance and try again.',
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
  }, [isAuction, listing, state.isBidding, state.bidAmount, user, listingsPlaceBid, updateState, rateLimiter]);

  const handleImageNavigation = useCallback((newIndex: number) => {
    const sanitizedIndex = Math.floor(newIndex);
    if (sanitizedIndex >= 0 && sanitizedIndex < images.length) {
      updateState({ currentImageIndex: sanitizedIndex });
    }
  }, [images.length, updateState]);

  const handleBidAmountChange = useCallback((value: string) => {
    updateState({ bidAmount: value });
  }, [updateState]);

  // Effects
  useEffect(() => {
    const loadProfileData = async () => {
      if (listing?.seller) {
        try {
          const profileData = await getUserProfileData(listing.seller);
          if (profileData) {
            updateState({ 
              sellerProfile: { 
                bio: profileData.bio ? sanitize.strict(profileData.bio) : null,
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
    if (isAuction && listing?.auction?.bids) {
      const historyItems: BidHistoryItem[] = listing.auction.bids.map(bid => ({
        bidder: bid.bidder,
        amount: bid.amount,
        date: bid.date
      }));
      
      const sortedBids = historyItems.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      updateState({ bidsHistory: sortedBids });
    } else {
      updateState({ bidsHistory: [] });
    }
  }, [isAuction, listing?.auction?.bids, updateState]);

  useEffect(() => {
    if (isAuction && isAuctionEnded && user?.role === "buyer" && isUserHighestBidder && !state.showAuctionSuccess) {
      setTimeout(() => {
        updateState({ showAuctionSuccess: true });
        setTimeout(() => {
          router.push('/buyers/my-orders');
        }, 10000);
      }, 1000);
    }
  }, [isAuction, isAuctionEnded, user?.role, isUserHighestBidder, state.showAuctionSuccess, router, updateState]);

  useEffect(() => {
    if (!isAuction) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }
    
    if (isAuctionEnded) return;
    
    if (isPurchasingRef.current || hasPurchasedRef.current || state.isProcessing) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }
    
    checkCurrentUserFunds();
    
    fundingTimerRef.current = setInterval(() => {
      checkCurrentUserFunds();
    }, FUNDING_CHECK_INTERVAL);
    
    return () => {
      if (fundingTimerRef.current) {
        clearInterval(fundingTimerRef.current);
        fundingTimerRef.current = null;
      }
    };
  }, [isAuction, isAuctionEnded, state.isProcessing, checkCurrentUserFunds, updateState]);

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

  useEffect(() => {
    if (!isAuction || isAuctionEnded || !mountedRef.current) {
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
  }, [isAuction, isAuctionEnded, updateState]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      isPurchasingRef.current = false;
      hasPurchasedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (fundingTimerRef.current) {
        clearInterval(fundingTimerRef.current);
      }
      if (auctionExpiryTimerRef.current) {
        clearInterval(auctionExpiryTimerRef.current);
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

  const calculateTotalPayableFixed = useCallback((amount: number) => {
    return getAuctionTotalPayable(amount);
  }, []);

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
      realtimeBids: [],
      mergedBidsHistory: [],
      lastBidUpdate: Date.now(),
      hasReserve: false,
      reserveMet: true,
      ...initialState,
      imageRef,
      bidInputRef,
      bidButtonRef,
      handlePurchase: () => {},
      handleBidSubmit: () => {},
      handleImageNavigation: () => {},
      handleBidAmountChange: () => {},
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
      error: null,
      rateLimitError: null
    };
  }

  // Return everything
  return {
    user,
    listing,
    listingId,
    images,
    isAuctionListing: isAuction,
    isAuctionEnded: isAuctionEnded || false,
    didUserBid,
    isUserHighestBidder,
    currentHighestBid,
    currentTotalPayable,
    suggestedBidAmount,
    needsSubscription: needsSubscription || false,
    currentUsername: currentUsername || '',
    buyerBalance,
    realtimeBids,
    mergedBidsHistory,
    lastBidUpdate,
    hasReserve,
    reserveMet,
    purchaseStatus: state.purchaseStatus,
    isProcessing: state.isProcessing,
    showPurchaseSuccess: state.showPurchaseSuccess,
    showAuctionSuccess: state.showAuctionSuccess,
    sellerProfile: state.sellerProfile,
    showStickyBuy: state.showStickyBuy,
    bidAmount: state.bidAmount,
    bidStatus: (isAuction && !isPurchasingRef.current && !hasPurchasedRef.current && !state.isProcessing) ? state.bidStatus : {},
    biddingEnabled: state.biddingEnabled,
    bidsHistory: state.bidsHistory,
    showBidHistory: state.showBidHistory,
    forceUpdateTimer: state.forceUpdateTimer,
    viewCount: state.viewCount,
    isBidding: state.isBidding,
    bidError: state.bidError,
    bidSuccess: state.bidSuccess,
    currentImageIndex: state.currentImageIndex,
    imageRef,
    bidInputRef,
    bidButtonRef,
    handlePurchase,
    handleBidSubmit,
    handleImageNavigation,
    handleBidAmountChange,
    updateState,
    getTimerProgress,
    formatTimeRemaining: (endTime: string) => formatTimeRemaining(endTime),
    formatBidDate,
    calculateTotalPayable: calculateTotalPayableFixed,
    router,
    sellerTierInfo: sellerInfo?.tierInfo,
    isVerified: sellerInfo?.isVerified || false,
    sellerAverageRating: sellerInfo?.averageRating,
    sellerReviewCount: sellerInfo?.reviewCount || 0,
    isLoading: false,
    error,
    rateLimitError
  };
};
