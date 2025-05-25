// src/app/browse/[id]/page.tsx - Updated with Seller Star Rating
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import { useReviews } from '@/context/ReviewContext'; // Import reviews context
import Link from 'next/link';
import {
  Clock, User, ArrowLeft, AlertTriangle, Crown, MessageCircle,
  DollarSign, ShoppingBag, Lock, ChevronLeft, ChevronRight, Gavel, Calendar,
  BarChart2, ArrowUp, History, AlertCircle, CheckCircle, X, Info, Award,
  ShoppingCart, Shield, Truck, CreditCard, Gift, Package, Eye, Star
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import AddressConfirmationModal, { DeliveryAddress } from '@/components/AddressConfirmationModal';
import TierBadge from '@/components/TierBadge';
import StarRating from '@/components/StarRating'; // Import StarRating component
import { getSellerTierMemoized } from '@/utils/sellerTiers';

// FIXED: Add custom hook for interval with proper TypeScript typing and memory leak prevention
function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<(() => void) | null>(null);

  // Remember the latest callback without causing re-renders
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval with proper cleanup
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
    
    // Return undefined when delay is null (no cleanup needed)
    return undefined;
  }, [delay]); // Only depend on delay, not callback
}

export default function ListingDetailPage() {
  const { listings, user, removeListing, addSellerNotification, isSubscribed, users, placeBid, orderHistory } = useListings();
  const { getReviewsForSeller } = useReviews(); // Get reviews function
  const { id } = useParams();
  const listingId = Array.isArray(id) ? id[0] : id as string;
  const listing = listings.find((item) => item.id === listingId);
  const { purchaseListing, getBuyerBalance, updateOrderAddress } = useWallet();
  const { sendMessage, getMessagesForSeller, markMessagesAsRead } = useMessages();
  const { addRequest } = useRequests();
  const router = useRouter();

  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [showAuctionSuccess, setShowAuctionSuccess] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<{ bio?: string | null; pic?: string | null; subscriptionPrice?: string | null; }>({});
  const [showStickyBuy, setShowStickyBuy] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidStatus, setBidStatus] = useState<{success?: boolean; message?: string}>({});
  const [biddingEnabled, setBiddingEnabled] = useState(true);
  const [bidsHistory, setBidsHistory] = useState<{bidder: string, amount: number, date: string}[]>([]);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [forceUpdateTimer, setForceUpdateTimer] = useState<Record<string, unknown>>({});
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 100) + 20); // Mock view count

  // Enhanced bid validation and submission with debouncing
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const bidButtonRef = useRef<HTMLButtonElement>(null);
  const bidInputRef = useRef<HTMLInputElement>(null);
  const lastBidTime = useRef<number>(0);

  const currentUsername = user?.username || '';
  const hasMarkedRef = useRef(false);
  const isSubscribedToSeller = user?.username && listing?.seller ? isSubscribed(user.username, listing.seller) : false;
  const needsSubscription = listing?.isPremium && !isSubscribedToSeller;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Is this an auction listing?
  const isAuctionListing = !!listing?.auction;
  
  // Has the auction ended?
  const isAuctionEnded = isAuctionListing && 
    (listing?.auction?.status === 'ended' || listing?.auction?.status === 'cancelled' || 
     new Date(listing?.auction?.endTime || '') <= new Date());

  // Did current user place any bids?
  const didUserBid = useMemo(() => {
    if (!isAuctionListing || !listing?.auction?.bids || !user?.username) return false;
    return listing.auction.bids.some(bid => bid.bidder === user.username);
  }, [isAuctionListing, listing?.auction?.bids, user?.username]);

  // Is current user the highest bidder?
  const isUserHighestBidder = useMemo(() => {
    if (!isAuctionListing || !listing?.auction?.highestBidder || !user?.username) return false;
    return listing.auction.highestBidder === user.username;
  }, [isAuctionListing, listing?.auction?.highestBidder, user?.username]);

  // Calculate the seller tier for display
  const sellerTierInfo = useMemo(() => {
    if (!listing?.seller) return null;
    return getSellerTierMemoized(listing.seller, orderHistory);
  }, [listing?.seller, orderHistory]);

  // Get seller reviews and calculate average rating
  const sellerReviews = useMemo(() => {
    if (!listing?.seller) return [];
    return getReviewsForSeller(listing.seller);
  }, [listing?.seller, getReviewsForSeller]);

  const sellerAverageRating = useMemo(() => {
    if (sellerReviews.length === 0) return null;
    const totalRating = sellerReviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / sellerReviews.length;
  }, [sellerReviews]);
  
  // Calculate total payable amount (bid + 10% markup) for display purposes
  const calculateTotalPayable = (bidPrice: number): number => {
    return Math.round(bidPrice * 1.1 * 100) / 100;
  };
  
  // For current highest bid display
  const currentHighestBid = isAuctionListing && listing?.auction?.highestBid 
    ? listing.auction.highestBid 
    : isAuctionListing && listing?.auction 
      ? listing.auction.startingPrice 
      : 0;
      
  // Calculate total payable for current highest bid
  const currentTotalPayable = calculateTotalPayable(currentHighestBid);
     
  // Auto-suggest bid amounts - simplified to just +$10
  const suggestedBidAmount = useMemo(() => {
    if (!isAuctionListing || !listing?.auction) return null;
    
    const currentBid = listing.auction.highestBid || listing.auction.startingPrice;
    return (currentBid + 10).toFixed(2);
  }, [isAuctionListing, listing?.auction]);

  // Sticky Buy Now logic
  const imageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      setShowStickyBuy(rect.bottom < 60); // 60px from top
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (listing?.seller) {
      const bio = sessionStorage.getItem(`profile_bio_${listing.seller}`);
      const pic = sessionStorage.getItem(`profile_pic_${listing.seller}`);
      const price = sessionStorage.getItem(`subscription_price_${listing.seller}`);
      setSellerProfile({ bio, pic, subscriptionPrice: price });
    }
  }, [listing?.seller]);

  useEffect(() => {
    if (
      listing?.seller &&
      currentUsername &&
      !hasMarkedRef.current
    ) {
      markMessagesAsRead(listing.seller, currentUsername);
      hasMarkedRef.current = true;
    }
  }, [listing?.seller, currentUsername, markMessagesAsRead]);
  
  // Initialize bids history
  useEffect(() => {
    if (isAuctionListing && listing?.auction?.bids) {
      // Sort bids by date, newest first
      const sortedBids = [...listing.auction.bids].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setBidsHistory(sortedBids);
    }
  }, [isAuctionListing, listing?.auction?.bids]);
  
  // Check if current user has sufficient funds for their bid
  const checkCurrentUserFunds = useCallback(() => {
    if (!user?.username || !isAuctionListing || !listing?.auction?.highestBidder) return true;
    
    // Only check if the current user is the highest bidder
    if (listing.auction.highestBidder === user.username) {
      const highestBid = listing.auction.highestBid || 0;
      const userBalance = getBuyerBalance(user.username);
      
      // Update bid status based on available funds
      if (userBalance < highestBid) {
        setBidStatus({
          success: false,
          message: 'Warning: You do not have sufficient funds to win this auction.'
        });
        return false;
      } else {
        // Clear any previous warnings if funds are now sufficient
        if (bidStatus.message?.includes('Warning')) {
          setBidStatus({
            success: true,
            message: 'You are the highest bidder!'
          });
        }
        return true;
      }
    }
    return true;
  }, [user?.username, isAuctionListing, listing?.auction?.highestBidder, listing?.auction?.highestBid, getBuyerBalance, bidStatus.message]);
  
  // Periodically check if highest bidder has sufficient funds
  useEffect(() => {
    if (!isAuctionListing || isAuctionEnded) return;
    
    checkCurrentUserFunds();
    
    const interval = setInterval(() => {
      checkCurrentUserFunds();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [isAuctionListing, isAuctionEnded, checkCurrentUserFunds]);
  
  // NEW: Check if auction just ended and user won
  useEffect(() => {
    if (isAuctionListing && isAuctionEnded && user?.role === "buyer" && isUserHighestBidder && !showAuctionSuccess) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        setShowAuctionSuccess(true);
        // Auto redirect after 10 seconds (reduced from 15)
        setTimeout(() => {
          router.push('/buyers/my-orders');
        }, 10000);
      }, 1000);
    }
  }, [isAuctionListing, isAuctionEnded, user?.role, isUserHighestBidder, showAuctionSuccess, router]);
  
  // Memoize and optimize time remaining calculation for better performance
  const timeCache = useRef<{[key: string]: {formatted: string, expires: number}}>({});
  
  // Format time remaining for auction
  const formatTimeRemaining = useCallback((endTimeStr: string) => {
    const now = new Date();
    const nowTime = now.getTime();
    
    // Check cache first to avoid repetitive calculations
    if (timeCache.current[endTimeStr] && timeCache.current[endTimeStr].expires > nowTime) {
      return timeCache.current[endTimeStr].formatted;
    }
    
    const endTime = new Date(endTimeStr);
    
    if (endTime <= now) {
      return 'Auction ended';
    }
    
    const diffMs = endTime.getTime() - nowTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    let formatted;
    if (diffDays > 0) {
      formatted = `${diffDays}d ${diffHours}h remaining`;
    } else if (diffHours > 0) {
      formatted = `${diffHours}h ${diffMinutes}m remaining`;
    } else if (diffMinutes > 0) {
      formatted = `${diffMinutes}m ${diffSeconds}s remaining`;
    } else {
      formatted = `${diffSeconds}s remaining`;
    }
    
    // Cache the result based on granularity - shorter times need more frequent updates
    const cacheTime = diffDays > 0 ? 60000 : // 1 minute for days remaining
                      diffHours > 0 ? 30000 : // 30 seconds for hours remaining
                      diffMinutes > 0 ? 5000 : // 5 seconds for minutes remaining
                      1000; // 1 second for seconds remaining
                      
    timeCache.current[endTimeStr] = {
      formatted,
      expires: nowTime + cacheTime
    };
    
    return formatted;
  }, []);
  
  // Set up real-time countdown timer with useInterval
  useInterval(
    () => {
      if (!isAuctionListing || isAuctionEnded || !listing?.auction?.endTime) return;
      
      // Force re-render by updating state
      setForceUpdateTimer({});
      
      // Check if auction has ended
      if (new Date(listing.auction.endTime) <= new Date()) {
        setBiddingEnabled(false);
      }
    },
    // Update more frequently when less time remains
    isAuctionListing && !isAuctionEnded && listing?.auction?.endTime ? 
      (() => {
        const now = new Date();
        const endTime = new Date(listing.auction.endTime);
        const diffMs = endTime.getTime() - now.getTime();
        
        if (diffMs <= 0) return null; // Stop interval if auction ended
        if (diffMs < 60000) return 1000; // Every second for last minute
        if (diffMs < 300000) return 5000; // Every 5 seconds for last 5 minutes
        if (diffMs < 3600000) return 15000; // Every 15 seconds for last hour
        return 60000; // Every minute otherwise
      })() : 
      null // No interval if not an auction or already ended
  );
  
  // Automatically update bid status when the listing updates
  useEffect(() => {
    if (isAuctionListing && listing?.auction?.highestBidder === user?.username) {
      // Check if user has sufficient funds for their highest bid
      const highestBid = listing.auction?.highestBid || 0;
      const userBalance = user ? getBuyerBalance(user.username) : 0;
      
      if (userBalance < highestBid) {
        setBidStatus({
          success: false,
          message: 'Warning: You do not have sufficient funds to win this auction.'
        });
      } else {
        setBidStatus({
          success: true,
          message: 'You are the highest bidder!'
        });
      }
    } else if (bidStatus.success && isAuctionListing && listing?.auction?.highestBidder !== user?.username) {
      // If user was highest bidder but got outbid
      setBidStatus({
        success: false,
        message: 'You have been outbid!'
      });
    }
  }, [isAuctionListing, listing?.auction?.highestBidder, user?.username, bidStatus.success, listing?.auction?.highestBid, getBuyerBalance]);

  const sellerUser = users?.[listing?.seller ?? ''];
  const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

  if (!listingId) {
    return <div className="text-white text-center p-10">Invalid listing URL.</div>;
  }

  if (!listing) {
    return <div className="p-10 text-lg font-medium text-center text-white">Listing not found.</div>;
  }

  const images = listing.imageUrls || [];

  // Image navigation (looping)
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  // Format date for bid history
  const formatBidDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Handle keypress in bid input
  const handleBidKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBidSubmit();
    }
  };
  
  // Handle purchase for standard (non-auction) listings
  const handlePurchase = () => {
    if (!user?.username || !listing || isProcessing) return;
    
    setIsProcessing(true);
    const success = purchaseListing(listing, user.username);
    
    if (success) {
      // Show success overlay first, then redirect
      setShowPurchaseSuccess(true);
      addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
      
      // Remove listing and redirect after showing success message
      setTimeout(() => {
        removeListing(listing.id);
        router.push('/buyers/my-orders');
      }, 10000); // Reduced from 15 seconds
    } else {
      setPurchaseStatus('Insufficient balance. Please top up your wallet.');
      setIsProcessing(false);
    }
  };
  
  // Handle bid submission with improved validation
  const handleBidSubmit = async () => {
    if (isBidding) return; // Prevent multiple submissions
    
    // Clear previous messages
    setBidError(null);
    setBidSuccess(null);
    
    if (!user?.username || user.role !== 'buyer' || !listing || !isAuctionListing || !listing.auction) {
      setBidError('You must be logged in as a buyer to place bids.');
      return;
    }
    
    // Check if auction has ended since page load
    if (listing.auction.endTime && new Date(listing.auction.endTime) <= new Date()) {
      setBidError('This auction has ended.');
      setBiddingEnabled(false);
      return;
    }
    
    // Check for bid cooldown (5 second limit between bids)
    const now = Date.now();
    if (now - lastBidTime.current < 5000) {
      setBidError('Please wait a moment before placing another bid.');
      return;
    }
    
    // Validate bid amount
    const numericBid = parseFloat(bidAmount);
    if (isNaN(numericBid) || numericBid <= 0) {
      setBidError('Please enter a valid bid amount.');
      if (bidInputRef.current) bidInputRef.current.focus();
      return;
    }
    
    // Ensure bid is higher than starting price
    if (numericBid < listing.auction.startingPrice) {
      setBidError(`Your bid must be at least $${listing.auction.startingPrice.toFixed(2)}.`);
      return;
    }
    
    // Ensure bid is higher than current highest bid
    const currentHighestBid = listing.auction.highestBid || 0;
    if (numericBid <= currentHighestBid) {
      setBidError(`Your bid must be higher than the current highest bid of $${currentHighestBid.toFixed(2)}.`);
      return;
    }
    
    // Check if user has sufficient funds to place this bid
    const userBalance = getBuyerBalance(user.username);
    if (userBalance < numericBid) {
      setBidError(`Insufficient funds. Your wallet balance is $${userBalance.toFixed(2)}.`);
      return;
    }
    
    // Set bidding state
    setIsBidding(true);
    
    try {
      // Place the bid
      const success = placeBid(listing.id, user.username, numericBid);
      lastBidTime.current = Date.now();
      
      if (success) {
        setBidSuccess(`Your bid of $${numericBid.toFixed(2)} has been placed successfully!`);
        setBidAmount(''); // Clear the input
        
        // Add the new bid to history
        const newBid = {
          bidder: user.username,
          amount: numericBid,
          date: new Date().toISOString()
        };
        setBidsHistory(prev => [newBid, ...prev]);
        
        // Calculate the total with markup
        const totalPayable = calculateTotalPayable(numericBid);
        
        // Update bid status to show highest bidder status with total payable amount
        setBidStatus({
          success: true,
          message: `You are the highest bidder! Total payable if you win: $${totalPayable.toFixed(2)}`
        });
        
        // Auto-focus input for another bid
        setTimeout(() => {
          if (bidInputRef.current) bidInputRef.current.focus();
        }, 500);
      } else {
        setBidError('Failed to place your bid. You may not have sufficient funds or the auction has ended.');
      }
    } catch (error) {
      console.error('Bid error:', error);
      setBidError('An error occurred while placing your bid. Please try again.');
    } finally {
      setIsBidding(false);
    }
  };

  // AUCTION ENDING SCREENS
  // Check if we should show one of the auction ending screens
  const renderAuctionEndedScreen = () => {
    if (!isAuctionListing || !isAuctionEnded || !listing.auction) return null;
    
    const hasBids = listing.auction.bids && listing.auction.bids.length > 0;
    const isHighestBidder = isUserHighestBidder;
    const isSeller = user?.username === listing.seller;
    const hasUserBid = didUserBid && !isHighestBidder;
    
    // Don't show generic screens if the user won (they'll see the winner modal)
    if (user?.role === "buyer" && isHighestBidder) {
      return null; // The winner modal will handle this case
    }
    
    // Generic auction ended screen (for sellers and non-bidders)
    if ((isSeller || (!hasUserBid && !isHighestBidder))) {
      return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-md w-full text-center">
            <div className="mb-6">
              {listing.auction.status === 'cancelled' ? (
                <AlertCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
              ) : hasBids ? (
                <Gavel className="mx-auto w-16 h-16 text-purple-500 mb-4" />
              ) : (
                <Clock className="mx-auto w-16 h-16 text-[#ff950e] mb-4" />
              )}
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {listing.auction.status === 'cancelled' 
                  ? 'Auction Cancelled' 
                  : 'Auction Ended'}
              </h2>
              
              <div className="text-gray-300">
                {listing.auction.status === 'cancelled' ? (
                  <p>This auction was cancelled by the seller.</p>
                ) : isSeller ? (
                  hasBids ? (
                    <p>
                      Your auction for "<span className="text-[#ff950e]">{listing.title}</span>" has ended 
                      with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span> 
                      from <span className="font-bold">{listing.auction.highestBidder}</span>.
                    </p>
                  ) : (
                    <p>
                      Your auction for "<span className="text-[#ff950e]">{listing.title}</span>" has ended without 
                      receiving any bids.
                    </p>
                  )
                ) : (
                  hasBids ? (
                    <p>
                      This auction has ended with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span>.
                    </p>
                  ) : (
                    <p>
                      This auction has ended without receiving any bids.
                    </p>
                  )
                )}
              </div>
            </div>
            
            <button
              onClick={() => router.push('/browse')}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-full hover:bg-purple-500 font-bold transition text-lg shadow"
            >
              Return to Browse
            </button>
          </div>
        </div>
      );
    }
    
    // Screen for users who bid but didn't win
    if (hasUserBid) {
      return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Auction Ended
              </h2>
              
              <div className="text-gray-300">
                <p className="mb-2">
                  Your bid of <span className="font-bold text-yellow-400">
                    ${bidsHistory.find(bid => bid.bidder === user?.username)?.amount.toFixed(2) || '0.00'}
                  </span> was not the highest bid.
                </p>
                
                <p>
                  The auction for "<span className="text-[#ff950e]">{listing.title}</span>" ended 
                  with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span> 
                  from <span className="font-bold">{listing.auction.highestBidder}</span>.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/browse')}
              className="w-full bg-purple-600 text-white px-4 py-3 rounded-full hover:bg-purple-500 font-bold transition text-lg shadow"
            >
              Browse More Auctions
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Back Button - Positioned above entire layout */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link 
          href="/browse" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff950e] transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            {/* Main Image Container */}
            <div ref={imageRef} className="relative group">
              <div className="relative w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden bg-gray-900 shadow-xl">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                    
                    {/* Image Navigation */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No Image Available</p>
                    </div>
                  </div>
                )}
                
                {/* Type Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {isAuctionListing && (
                    <span className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center">
                      <Gavel className="w-3 h-3 mr-1.5" />
                      {isAuctionEnded ? 'Ended' : 'Live Auction'}
                    </span>
                  )}
                  {listing.isPremium && (
                    <span className="bg-yellow-600 text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center">
                      <Crown className="w-3 h-3 mr-1.5" />
                      Premium
                    </span>
                  )}
                </div>
                
                {/* View Count */}
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {viewCount}
                </div>
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-[#ff950e]' 
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details - Now aligned with image top */}
          <div className="space-y-4">
            {/* Title & Basic Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{listing.title}</h1>
              
              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {listing.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full border border-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Hours Worn */}
              {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{listing.hoursWorn} hours worn</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{listing.description}</p>
            </div>

            {/* Auction Details */}
            {isAuctionListing && listing.auction && (
              <div className={`rounded-xl border p-5 ${
                isAuctionEnded 
                  ? 'border-gray-700 bg-gray-900/30' 
                  : 'border-purple-700 bg-purple-900/20'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <Gavel className={`w-5 h-5 ${isAuctionEnded ? 'text-gray-400' : 'text-purple-400'}`} />
                  <h3 className="text-lg font-bold text-white">
                    {isAuctionEnded ? 'Auction Ended' : 'Live Auction'}
                  </h3>
                </div>
                
                {/* Auction Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Starting Bid</p>
                    <p className="text-xl font-bold text-white">${listing.auction.startingPrice.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Current Bid</p>
                    {listing.auction.highestBid ? (
                      <p className="text-xl font-bold text-green-400">${listing.auction.highestBid.toFixed(2)}</p>
                    ) : (
                      <p className="text-gray-400 italic">No bids yet</p>
                    )}
                  </div>
                </div>
                
                {/* Time Remaining */}
                {!isAuctionEnded && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-1">Time Remaining</p>
                    <p className="font-bold text-green-400">
                      {formatTimeRemaining(listing.auction.endTime)}
                    </p>
                  </div>
                )}
                
                {/* Total Payable */}
                <div className="bg-purple-900/30 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200 text-sm">Total if you win</span>
                    <span className="text-lg font-bold text-white">
                      ${currentTotalPayable.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Includes 10% platform fee
                  </p>
                </div>

                {/* Bidding Section */}
                {!isAuctionEnded && user?.role === 'buyer' && user.username !== listing.seller && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          ref={bidInputRef}
                          type="number"
                          placeholder="Enter your bid"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          onKeyPress={handleBidKeyPress}
                          min={listing.auction.highestBid ? (listing.auction.highestBid + 0.01).toFixed(2) : listing.auction.startingPrice.toFixed(2)}
                          step="0.01"
                          className="w-full px-3 py-2 rounded-lg bg-black/50 border border-purple-700 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <button
                        ref={bidButtonRef}
                        onClick={handleBidSubmit}
                        disabled={isBidding || !biddingEnabled}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isBidding ? 'Placing...' : 'Bid'}
                      </button>
                    </div>
                    
                    {/* Quick Bid + History */}
                    <div className="flex gap-2">
                      {suggestedBidAmount && (
                        <button
                          onClick={() => setBidAmount(suggestedBidAmount)}
                          className="bg-purple-800/50 text-purple-300 px-3 py-1 rounded text-sm hover:bg-purple-700/50 transition"
                        >
                          ${suggestedBidAmount}
                        </button>
                      )}
                      <button
                        onClick={() => setShowBidHistory(true)}
                        className="flex-1 bg-gray-800/50 text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-700/50 transition flex items-center justify-center gap-1"
                      >
                        <BarChart2 className="w-3 h-3" />
                        Bid history ({listing.auction.bids?.length || 0})
                      </button>
                    </div>
                    
                    {/* Status Messages */}
                    {bidError && (
                      <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded text-sm">
                        {bidError}
                      </div>
                    )}
                    
                    {bidSuccess && (
                      <div className="bg-green-900/30 border border-green-800 text-green-400 p-3 rounded text-sm">
                        {bidSuccess}
                      </div>
                    )}
                    
                    {bidStatus.message && (
                      <div className={`p-3 rounded text-sm border ${
                        bidStatus.success 
                          ? 'bg-green-900/20 border-green-800/40 text-green-400' 
                          : 'bg-yellow-900/20 border-yellow-800/40 text-yellow-400'
                      }`}>
                        {bidStatus.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Price & Actions for Standard Listings */}
            {!isAuctionListing && (
              <div className="space-y-3">
                {/* Compact Price Display */}
                <div className="bg-[#ff950e] text-black px-4 py-2 rounded-lg text-center">
                  <div className="text-lg font-bold">
                    ${listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}
                  </div>
                  <p className="text-xs opacity-75">Includes platform fee</p>
                </div>
                
                {/* Compact Action Buttons */}
                {user?.role === 'buyer' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handlePurchase}
                      disabled={isProcessing}
                      className="bg-[#ff950e] text-black px-3 py-2 rounded-lg font-medium hover:bg-[#e88800] transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full"></div>
                          Processing
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          Buy Now
                        </>
                      )}
                    </button>
                    
                    <Link
                      href={`/buyers/messages?thread=${listing.seller}`}
                      className="flex items-center justify-center gap-1.5 bg-gray-800 text-white px-3 py-2 rounded-lg font-medium border border-gray-700 hover:bg-gray-700 transition text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Purchase Status */}
            {purchaseStatus && (
              <div className={`p-4 rounded-xl font-medium ${
                purchaseStatus.includes('successful') 
                  ? 'bg-green-900/30 border border-green-800 text-green-400' 
                  : 'bg-red-900/30 border border-red-800 text-red-400'
              }`}>
                {purchaseStatus}
              </div>
            )}

            {/* Premium Content Lock */}
            {needsSubscription && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-1">Premium Content</h3>
                    <p className="text-gray-300 mb-2 text-xs">
                      Subscribe to {listing.seller} to view full details and make purchases.
                    </p>
                    {user?.role === 'buyer' && (
                      <Link
                        href={`/sellers/${listing.seller}`}
                        className="inline-flex items-center gap-1.5 bg-yellow-600 text-black font-medium px-3 py-1.5 rounded-lg hover:bg-yellow-500 transition text-xs"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Subscribe Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Seller Profile with Star Rating */}
            {user?.role === 'buyer' && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  {/* LARGER Profile Photo */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-[#ff950e] bg-gray-700 flex items-center justify-center overflow-hidden">
                      {sellerProfile.pic ? (
                        <img src={sellerProfile.pic} alt={listing.seller} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-[#ff950e]">
                          {listing.seller?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {/* Tier Badge */}
                    {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
                      <div className="absolute -bottom-1.5 -right-1.5" style={{ transform: 'translate(6px, 6px)' }}>
                        <TierBadge tier={sellerTierInfo.tier} size="md" showTooltip={true} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium">{listing.seller}</h3>
                      {isSellerVerified && (
                        <img src="/verification_badge.png" alt="Verified" className="w-4 h-4" />
                      )}
                    </div>
                    
                    {/* Star Rating Display */}
                    {sellerAverageRating !== null ? (
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={sellerAverageRating} size="sm" />
                        <span className="text-yellow-400 text-sm font-medium">
                          {sellerAverageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({sellerReviews.length} review{sellerReviews.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Star className="w-4 h-4" />
                          <span className="text-xs">No reviews yet</span>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {sellerProfile.bio || 'No bio provided.'}
                    </p>
                  </div>
                  
                  <Link
                    href={`/sellers/${listing.seller}`}
                    className="text-[#ff950e] text-sm font-medium hover:text-[#e88800] transition-colors whitespace-nowrap"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            )}

            {/* Compact Trust & Safety */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
              <div className="text-center">
                <Shield className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Secure Payment</p>
              </div>
              <div className="text-center">
                <Truck className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Discreet Shipping</p>
              </div>
              <div className="text-center">
                <Gift className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Quality Guaranteed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bid History Modal */}
        {showBidHistory && isAuctionListing && listing.auction && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl border border-purple-800 w-full max-w-2xl max-h-[70vh] p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  Bid History
                </h3>
                <button
                  onClick={() => setShowBidHistory(false)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {bidsHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No bids placed yet</p>
                  <p className="text-gray-500 text-sm">Be the first to bid on this item!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bidsHistory.map((bid, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${
                        bid.bidder === currentUsername 
                          ? 'bg-purple-900/30 border-purple-700' 
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            bid.bidder === currentUsername ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {bid.bidder === currentUsername ? 'You' : bid.bidder.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">
                              {bid.bidder === currentUsername ? 'Your bid' : bid.bidder}
                            </p>
                            <p className="text-xs text-gray-400">{formatBidDate(bid.date)}</p>
                          </div>
                          {index === 0 && (
                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded font-medium">
                              Highest
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${index === 0 ? 'text-green-400' : 'text-white'}`}>
                            ${bid.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Total: ${calculateTotalPayable(bid.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowBidHistory(false)}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-500 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auction Winner Modal */}
        {showAuctionSuccess && isAuctionListing && listing && user?.role === "buyer" && isUserHighestBidder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 p-6 rounded-2xl border border-yellow-500/30 max-w-md w-full text-center">
              <div className="mb-4">
                <Award className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white mb-2">🏆 Congratulations! 🏆</h2>
                <p className="text-lg text-white mb-3">You Won the Auction!</p>
                
                <div className="bg-black/40 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Winning Bid:</span>
                    <span className="font-bold text-yellow-400">${listing.auction?.highestBid?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform Fee:</span>
                    <span className="font-bold text-gray-300">${((listing.auction?.highestBid || 0) * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between">
                      <span className="text-white font-semibold">Total Paid:</span>
                      <span className="text-xl font-bold text-[#ff950e]">
                        ${calculateTotalPayable(listing.auction?.highestBid || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/buyers/my-orders')}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-500 font-bold transition"
                >
                  View My Orders
                </button>
                
                <button
                  onClick={() => router.push('/browse')}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-500 font-bold transition"
                >
                  Browse More Auctions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Success Modal */}
        {showPurchaseSuccess && !isAuctionListing && listing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 p-6 rounded-2xl border border-[#ff950e]/30 max-w-md w-full text-center">
              <div className="mb-4">
                <ShoppingBag className="w-16 h-16 text-[#ff950e] mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white mb-2">🎉 Purchase Successful!</h2>
                
                <div className="bg-black/40 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Seller:</span>
                    <span className="font-bold text-white">{listing.seller}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Paid:</span>
                    <span className="text-xl font-bold text-[#ff950e]">
                      ${listing.markedUpPrice?.toFixed(2) ?? (listing.price * 1.1).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/buyers/my-orders')}
                className="w-full bg-[#ff950e] text-black px-4 py-3 rounded-xl hover:bg-[#e88800] font-bold transition"
              >
                Go to My Orders
              </button>
            </div>
          </div>
        )}

        {/* Render auction ended screens */}
        {renderAuctionEndedScreen()}

        {/* Sticky Buy Button for Mobile */}
        {user?.role === 'buyer' && !needsSubscription && !isAuctionListing && (
          <div className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${
            showStickyBuy ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}>
            <div className="bg-black/95 p-4">
              <button
                onClick={handlePurchase}
                className="w-full bg-[#ff950e] text-black px-6 py-3 rounded-xl font-bold text-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Buy Now • ${listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
