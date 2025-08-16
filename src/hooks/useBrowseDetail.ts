// src/hooks/useBrowseDetail.ts

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useWebSocket } from '@/context/WebSocketContext';
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
  
  // Add WebSocket hook
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
  
  // Add new state for real-time bid updates
  const [realtimeBids, setRealtimeBids] = useState<BidHistoryItem[]>([]);
  const [lastBidUpdate, setLastBidUpdate] = useState<number>(Date.now());
  
  // Refs - CRITICAL: Add isPurchasingRef to track purchase state
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
  const hasMarkedRef = useRef(false);
  const viewIncrementedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Core data - sanitize ID
  const rawListingId = params?.id as string;
  const listingId = rawListingId ? sanitize.strict(rawListingId) : '';
  const currentUsername = user?.username || null;

  // CRITICAL: Determine if this is actually an auction
  const isAuction = !!(listing?.auction?.isAuction || (listing?.auction && listing.auction.startingPrice !== undefined));
  const isAuctionListing = isAuction; // Keep old variable name for compatibility
  const isAuctionEnded = isAuction && listing?.auction && !isAuctionActive(listing.auction);

  // Helper functions - Define updateState early
  const updateState = useCallback((updates: Partial<DetailState> | ((prev: DetailState) => Partial<DetailState>)) => {
    if (!mountedRef.current) return;
    setState(prev => {
      const newUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...newUpdates };
    });
  }, []);

  // WebSocket subscription for real-time bid updates
  useEffect(() => {
    if (!isConnected || !isAuction || !listingId || !mountedRef.current || !subscribe) return;

    const unsubscribe = subscribe(WebSocketEvent.AUCTION_BID, (data: any) => {
      // Only process bids for this specific listing
      if (data.listingId !== listingId) return;

      console.log('[BrowseDetail] Real-time bid received:', data);

      // Create new bid object for history display
      const newBidForHistory: BidHistoryItem = {
        bidder: data.bidder || data.username,
        amount: data.amount || 0,
        date: data.timestamp || new Date().toISOString()
      };

      // Create proper Bid object for listing auction
      const newBidForListing = {
        id: data.id || `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bidder: data.bidder || data.username,
        amount: data.amount || 0,
        date: data.timestamp || new Date().toISOString()
      };

      // Update the listing's auction data
      setListing(prev => {
        if (!prev || !prev.auction) return prev;
        
        const updatedBids = [...(prev.auction.bids || []), newBidForListing]
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 20); // Keep top 20 bids in memory
        
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

      // Update realtime bids for inline display
      setRealtimeBids(prev => {
        const updated = [newBidForHistory, ...prev]
          .filter((bid, index, self) => 
            index === self.findIndex(b => b.bidder === bid.bidder && b.amount === bid.amount)
          )
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5); // Keep only last 5 for inline display
        return updated;
      });

      // Update the state's bid history
      updateState(prevState => ({
        bidsHistory: [newBidForHistory, ...prevState.bidsHistory]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }));

      // Trigger re-render
      setLastBidUpdate(Date.now());

      // Show success message if it's from current user
      if (newBidForHistory.bidder === currentUsername) {
        updateState({ 
          bidSuccess: 'Your bid was placed successfully!',
          bidError: null 
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, isAuction, listingId, currentUsername, subscribe, updateState]);

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
      if (listing && !viewIncrementedRef.current) {
        viewIncrementedRef.current = true;
        
        try {
          // Track views if user is logged in
          if (user && user.username !== listing.seller) {
            await listingsService.updateViews({
              listingId: listing.id,
              viewerId: user.username,
            });

            const viewsResponse: ApiResponse<number> = await listingsService.getListingViews(listing.id);
            if (viewsResponse.success && viewsResponse.data !== undefined) {
              setState(prev => ({ ...prev, viewCount: viewsResponse.data as number }));
            }
          }
        } catch (error) {
          console.error('Error tracking view:', error);
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

  // UPDATED: Check current user funds with fresh balance
  const checkCurrentUserFunds = useCallback(() => {
    // GATE 1: Not an auction? Clear bid status and return
    if (!isAuction || !listing?.auction) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }
    
    // GATE 2: Skip if not a buyer
    if (!user || user.role !== "buyer") return;
    
    // GATE 3: Skip if currently purchasing or already purchased
    if (isPurchasingRef.current || hasPurchasedRef.current || state.isProcessing) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }

    // CRITICAL: Always get fresh balance, not cached
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

  // Suggested bid amount calculation - ONLY for auctions
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

  // NEW: Listen for wallet balance updates and refunds
  useEffect(() => {
    if (!isAuction || !user || user.role !== 'buyer') return;
    
    const handleBalanceUpdate = (event: CustomEvent) => {
      console.log('[useBrowseDetail] Balance update received:', event.detail);
      
      // Re-check funds when balance is updated
      if (event.detail.username === user.username) {
        checkCurrentUserFunds();
        
        // Clear any bid errors since balance has changed
        updateState({ 
          bidError: null,
          bidSuccess: null
        });
      }
    };
    
    const handleUserRefunded = (event: CustomEvent) => {
      console.log('[useBrowseDetail] User refunded:', event.detail);
      
      // If this refund is for the current listing, show a message
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
        
        // Re-check funds after refund
        setTimeout(() => {
          checkCurrentUserFunds();
        }, 100);
      }
    };
    
    const handleCheckBidStatus = () => {
      console.log('[useBrowseDetail] Checking bid status after balance change');
      checkCurrentUserFunds();
    };
    
    // Listen for balance update events
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

    // Clear rate limit error
    setRateLimitError(null);

    // Check rate limit
    const rateLimitResult = rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
    if (!rateLimitResult.allowed) {
      setRateLimitError(`Too many requests. Please wait ${rateLimitResult.waitTime} seconds.`);
      updateState({ 
        purchaseStatus: `Please wait ${rateLimitResult.waitTime} seconds before trying again.`,
        isProcessing: false 
      });
      return;
    }

    // FIX 2: Get FRESH balance at click time (not from render)
    const freshBalance = getBuyerBalance(user.username);
    const requiredAmount = getBuyerDebitAmount(listing);
    
    // FIX 3: Use shared pricing utility for consistent calculation
    if (!hasSufficientBalance(freshBalance, listing)) {
      const amountNeeded = getAmountNeeded(freshBalance, listing);
      updateState({ 
        purchaseStatus: `Insufficient balance. You need ${amountNeeded.toFixed(2)} more.`,
        isProcessing: false 
      });
      return;
    }

    // CRITICAL: Set purchase flags BEFORE any state updates
    isPurchasingRef.current = true;
    hasPurchasedRef.current = false;

    // Clear all bid-related state immediately
    updateState({ 
      isProcessing: true, 
      purchaseStatus: 'Processing...', 
      bidStatus: {},  // Clear any bid status
      biddingEnabled: true,  // Reset bidding state
      bidError: null,
      bidSuccess: null
    });

    try {
      // Use the new purchaseListingAndRemove method that handles both purchase and removal
      const success = await purchaseListingAndRemove(listing, user.username);
      
      if (success) {
        hasPurchasedRef.current = true;
        updateState({ 
          showPurchaseSuccess: true,
          purchaseStatus: 'Purchase successful!',
          isProcessing: false,
          bidStatus: {}, // Keep bid status clear
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
    // GATE: Only allow bidding on actual auctions
    if (!isAuction || !listing || state.isBidding || !user || user.role !== 'buyer') return;

    // Clear errors
    setRateLimitError(null);
    updateState({ bidError: null, bidSuccess: null });

    // Validate and sanitize bid amount
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

    // Additional validation for auction rules
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

    // Check rate limit
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
    // Validate index
    const sanitizedIndex = Math.floor(newIndex);
    if (sanitizedIndex >= 0 && sanitizedIndex < images.length) {
      updateState({ currentImageIndex: sanitizedIndex });
    }
  }, [images.length, updateState]);

  // Handle bid amount change with sanitization
  const handleBidAmountChange = useCallback((value: string) => {
    // Allow typing but sanitize for display
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

  // CRITICAL: Only populate bid history for actual auctions
  useEffect(() => {
    if (isAuction && listing?.auction?.bids) {
      // Convert Bid[] to BidHistoryItem[]
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

  // CRITICAL: Only check funds for actual auctions, with all proper gates
  useEffect(() => {
    // GATE: Not an auction? Don't even set up the interval
    if (!isAuction) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }
    
    // Skip if auction has ended
    if (isAuctionEnded) return;
    
    // Skip if purchase is in progress or already purchased
    if (isPurchasingRef.current || hasPurchasedRef.current || state.isProcessing) {
      updateState({ 
        biddingEnabled: true,
        bidStatus: {}
      });
      return;
    }
    
    checkCurrentUserFunds();
    
    // FIX 4: Properly use and clean up the funding timer ref
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

  // Timer for auction updates - ONLY for actual auctions
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

  // FIX: Use the updated calculateTotalPayable that doesn't add 10%
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
    // Data
    user,
    listing,
    listingId,
    images,
    isAuctionListing: isAuction, // Use the properly gated value
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
    
    // State - CRITICAL: Only return bidStatus for actual auctions and when not purchasing
    purchaseStatus: state.purchaseStatus,
    isProcessing: state.isProcessing,
    showPurchaseSuccess: state.showPurchaseSuccess,
    showAuctionSuccess: state.showAuctionSuccess,
    sellerProfile: state.sellerProfile,
    showStickyBuy: state.showStickyBuy,
    bidAmount: state.bidAmount,
    // GATE bidStatus: only for auctions, and clear during any purchase flow
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
    
    // Refs
    imageRef,
    bidInputRef,
    bidButtonRef,
    
    // Handlers
    handlePurchase,
    handleBidSubmit,
    handleImageNavigation,
    handleBidAmountChange,
    updateState,
    getTimerProgress,
    formatTimeRemaining: (endTime: string) => formatTimeRemaining(endTime),
    formatBidDate,
    calculateTotalPayable: calculateTotalPayableFixed, // Use the fixed version
    
    // Navigation
    router,
    
    // Seller info
    sellerTierInfo: sellerInfo?.tierInfo,
    isVerified: sellerInfo?.isVerified || false,
    sellerAverageRating: sellerInfo?.averageRating,
    sellerReviewCount: sellerInfo?.reviewCount || 0,
    
    // Loading/error state
    isLoading: false,
    error,
    rateLimitError
  };
};
