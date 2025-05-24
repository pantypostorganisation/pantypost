// src/app/browse/[id]/page.tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { useRequests } from '@/context/RequestContext';
import Link from 'next/link';
import {
  Clock, User, ArrowRight, BadgeCheck, AlertTriangle, Crown, MessageCircle,
  DollarSign, ShoppingBag, Lock, ChevronLeft, ChevronRight, Gavel, Calendar,
  BarChart2, ArrowUp, History, AlertCircle, CheckCircle, X, Info, Award,
  ExternalLink, ShoppingCart, MapPin, Star, Heart, Share2, Eye, Package,
  Shield, Truck, CreditCard, Gift
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import AddressConfirmationModal, { DeliveryAddress } from '@/components/AddressConfirmationModal';
import TierBadge from '@/components/TierBadge';
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
  const [isLiked, setIsLiked] = useState(false);
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
     
  // Auto-suggest bid amounts
  const suggestedBidAmount = useMemo(() => {
    if (!isAuctionListing || !listing?.auction) return null;
    
    const currentBid = listing.auction.highestBid || listing.auction.startingPrice;
    let increment = 0;
    
    // Scale increment based on current bid
    if (currentBid < 10) increment = 0.5;
    else if (currentBid < 50) increment = 1;
    else if (currentBid < 100) increment = 2;
    else if (currentBid < 250) increment = 5;
    else if (currentBid < 500) increment = 10;
    else increment = 20;
    
    return (Math.ceil(currentBid / increment) * increment + increment).toFixed(2);
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
      formatted = `${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      formatted = `${diffHours} hour${diffHours !== 1 ? 's' : ''}, ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} remaining`;
    } else if (diffMinutes > 0) {
      formatted = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}, ${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} remaining`;
    } else {
      formatted = `${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} remaining`;
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
      }, 15000); // 15 second delay to show success message
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
    
    // Generic auction ended screen (for sellers and non-bidders)
    if ((isSeller || (!hasUserBid && !isHighestBidder)) && !(user?.role === "buyer" && isHighestBidder)) {
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
    
    // Screen for auction winner - show success modal
    if (user?.role === "buyer" && isHighestBidder) {
      // Trigger the auction success modal instead of immediate redirect
      if (!showAuctionSuccess) {
        setShowAuctionSuccess(true);
        // Auto redirect after 15 seconds
        setTimeout(() => {
          router.push('/buyers/my-orders');
        }, 15000);
        return null; // Don't render the old modal
      }
    }
    
    return null;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white">
      {/* Enhanced Header with Breadcrumbs */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-sm border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm">
              <Link href="/browse" className="flex items-center gap-2 text-gray-400 hover:text-[#ff950e] transition">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Browse
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300 truncate max-w-xs">{listing.title}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full transition ${isLiked ? 'bg-red-500/20 text-red-400' : 'bg-gray-800/50 text-gray-400 hover:text-red-400'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 rounded-full bg-gray-800/50 text-gray-400 hover:text-blue-400 transition">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Enhanced Image Gallery */}
          <div className="space-y-6">
            {/* Main Image Container */}
            <div ref={imageRef} className="relative group">
              <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Image Navigation */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                    
                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No Image Available</p>
                    </div>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {isAuctionListing && (
                    <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm px-4 py-2 rounded-full font-bold flex items-center shadow-lg">
                      <Gavel className="w-4 h-4 mr-2" />
                      {isAuctionEnded ? 'Auction Ended' : 'Live Auction'}
                    </span>
                  )}
                  {listing.isPremium && (
                    <span className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black text-sm px-4 py-2 rounded-full font-bold flex items-center shadow-lg">
                      <Crown className="w-4 h-4 mr-2" />
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      index === currentImageIndex 
                        ? 'border-[#ff950e] ring-2 ring-[#ff950e]/30' 
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

          {/* Right: Enhanced Product Details */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent leading-tight">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Eye className="w-4 h-4" />
                  {viewCount} views
                </div>
              </div>
              
              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 text-sm px-4 py-2 rounded-full border border-gray-600 hover:border-[#ff950e]/50 transition"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Seller Card */}
            {user?.role === 'buyer' && (
              <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-3 border-[#ff950e] bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center overflow-hidden shadow-lg">
                      {sellerProfile.pic ? (
                        <img src={sellerProfile.pic} alt={listing.seller} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-[#ff950e]">
                          {listing.seller?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {/* Tier Badge */}
                    {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
                      <div className="absolute -bottom-1 -right-1">
                        <TierBadge tier={sellerTierInfo.tier} size="lg" showTooltip={true} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{listing.seller}</h3>
                      {isSellerVerified && (
                        <div className="relative group">
                          <img src="/verification_badge.png" alt="Verified" className="w-5 h-5" />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                            Verified Seller
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {sellerProfile.bio || 'No bio provided.'}
                    </p>
                    
                    <Link
                      href={`/sellers/${listing.seller}`}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff950e] to-[#e0850d] text-black font-bold px-4 py-2 rounded-full text-sm hover:shadow-lg hover:shadow-[#ff950e]/20 transition-all"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Hours Worn Info */}
            {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{listing.hoursWorn} hours worn</p>
                    <p className="text-gray-400 text-sm">Wear time verified by seller</p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">Description</h3>
              <p className="text-gray-300 leading-relaxed text-lg">{listing.description}</p>
            </div>

            {/* Enhanced Auction Details */}
            {isAuctionListing && listing.auction && (
              <div className={`rounded-2xl border backdrop-blur-sm p-6 ${
                isAuctionEnded 
                  ? 'border-gray-700 bg-gray-900/30' 
                  : 'border-purple-700 bg-gradient-to-br from-purple-900/20 to-blue-900/20'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-full ${isAuctionEnded ? 'bg-gray-700' : 'bg-purple-500/20'}`}>
                    <Gavel className={`w-6 h-6 ${isAuctionEnded ? 'text-gray-400' : 'text-purple-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">
                      {isAuctionEnded ? 'Auction Ended' : 'Live Auction'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isAuctionEnded ? 'This auction has concluded' : 'Place your bid now'}
                    </p>
                  </div>
                  
                  {/* Status Badge */}
                  {isAuctionEnded ? (
                    <span className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm font-medium">
                      {listing.auction.status === 'cancelled' ? 'Cancelled' : 'Ended'}
                    </span>
                  ) : (
                    <span className="bg-green-500/20 text-green-300 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      Active
                    </span>
                  )}
                </div>
                
                {/* Auction Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/30 rounded-xl p-4 border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Starting Bid</p>
                    <p className="text-2xl font-bold text-white">${listing.auction.startingPrice.toFixed(2)}</p>
                  </div>
                  
                  <div className={`rounded-xl p-4 border ${
                    listing.auction.highestBid 
                      ? 'bg-green-900/20 border-green-800/40' 
                      : 'bg-black/30 border-gray-800'
                  }`}>
                    <p className="text-gray-400 text-sm mb-1">Current Bid</p>
                    {listing.auction.highestBid ? (
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-5 h-5 text-green-400" />
                        <p className="text-2xl font-bold text-green-400">
                          ${listing.auction.highestBid.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic text-lg">No bids yet</p>
                    )}
                  </div>
                </div>
                
                {/* Time Remaining */}
                {!isAuctionEnded && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        Time Remaining
                      </span>
                      <span className="font-bold text-green-400">
                        {formatTimeRemaining(listing.auction.endTime)}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      {(() => {
                        const startTime = new Date(listing.date).getTime();
                        const endTime = new Date(listing.auction.endTime).getTime();
                        const currentTime = new Date().getTime();
                        const totalDuration = endTime - startTime;
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                        
                        return (
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Total Payable */}
                <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-800/40 mb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                      <span className="text-purple-200">Total if you win</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      ${currentTotalPayable.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Includes 10% platform fee added to winning bid
                  </p>
                </div>

                {/* Bidding Section */}
                {!isAuctionEnded && user?.role === 'buyer' && user.username !== listing.seller && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            ref={bidInputRef}
                            type="number"
                            placeholder="Enter your bid"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            onKeyPress={handleBidKeyPress}
                            min={listing.auction.highestBid ? (listing.auction.highestBid + 0.01).toFixed(2) : listing.auction.startingPrice.toFixed(2)}
                            step="0.01"
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/50 border border-purple-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
                          />
                        </div>
                      </div>
                      <button
                        ref={bidButtonRef}
                        onClick={handleBidSubmit}
                        disabled={isBidding || !biddingEnabled}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 whitespace-nowrap"
                      >
                        {isBidding ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            Placing...
                          </>
                        ) : (
                          <>
                            <Gavel className="w-5 h-5" />
                            Place Bid
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Quick Bid Buttons */}
                    {suggestedBidAmount && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBidAmount(suggestedBidAmount)}
                          className="flex-1 bg-purple-900/50 text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-800/50 transition border border-purple-700/50 text-sm font-medium"
                        >
                          ${suggestedBidAmount}
                        </button>
                        <button
                          onClick={() => setBidAmount((parseFloat(suggestedBidAmount) * 1.5).toFixed(2))}
                          className="flex-1 bg-purple-900/50 text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-800/50 transition border border-purple-700/50 text-sm font-medium"
                        >
                          ${(parseFloat(suggestedBidAmount) * 1.5).toFixed(2)}
                        </button>
                      </div>
                    )}
                    
                    {/* Status Messages */}
                    {bidError && (
                      <div className="bg-red-900/30 border border-red-800 text-red-400 p-4 rounded-xl text-sm">
                        {bidError}
                      </div>
                    )}
                    
                    {bidSuccess && (
                      <div className="bg-green-900/30 border border-green-800 text-green-400 p-4 rounded-xl text-sm">
                        {bidSuccess}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Price & Actions */}
            {!isAuctionListing && (
              <div className="space-y-6">
                {/* Price Display */}
                <div className="text-center">
                  <div className="bg-gradient-to-r from-[#ff950e] to-[#e0850d] text-black px-8 py-4 rounded-2xl inline-flex items-center gap-3 shadow-lg shadow-[#ff950e]/20">
                    <DollarSign className="w-8 h-8" />
                    <span className="text-4xl font-bold">
                      {listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Includes platform fee</p>
                </div>
                
                {/* Action Buttons */}
                {user?.role === 'buyer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handlePurchase}
                      disabled={isProcessing}
                      className="group relative bg-gradient-to-r from-[#ff950e] to-[#e0850d] text-black px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-[#ff950e]/30 transition-all disabled:opacity-50 overflow-hidden"
                    >
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        {isProcessing ? (
                          <>
                            <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-6 h-6" />
                            Buy Now
                          </>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                    
                    <Link
                      href={`/buyers/messages?thread=${listing.seller}`}
                      className="flex items-center justify-center gap-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-8 py-4 rounded-2xl font-bold text-lg border border-gray-600 hover:border-[#ff950e]/50 hover:shadow-lg transition-all"
                    >
                      <MessageCircle className="w-6 h-6" />
                      Message Seller
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Purchase Status */}
            {purchaseStatus && (
              <div className={`p-4 rounded-xl font-semibold text-lg ${
                purchaseStatus.includes('successful') 
                  ? 'bg-green-900/30 border border-green-800 text-green-400' 
                  : 'bg-red-900/30 border border-red-800 text-red-400'
              }`}>
                {purchaseStatus}
              </div>
            )}

            {/* Premium Content Lock */}
            {needsSubscription && (
              <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-full">
                    <Lock className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">Premium Content</h3>
                    <p className="text-gray-300 mb-4">
                      This is a premium listing. Subscribe to {listing.seller} to view full details and make purchases.
                    </p>
                    {user?.role === 'buyer' && (
                      <Link
                        href={`/sellers/${listing.seller}`}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
                      >
                        <Crown className="w-5 h-5" />
                        Subscribe Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Trust & Safety Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-800">
              <div className="text-center">
                <div className="p-3 bg-green-500/20 rounded-full w-fit mx-auto mb-2">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-sm text-gray-400">Secure Payment</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-blue-500/20 rounded-full w-fit mx-auto mb-2">
                  <Truck className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-gray-400">Discreet Shipping</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-purple-500/20 rounded-full w-fit mx-auto mb-2">
                  <Gift className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-sm text-gray-400">Quality Guaranteed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bid History Modal */}
        {showBidHistory && isAuctionListing && listing.auction && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-purple-800 w-full max-w-2xl p-8 relative shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-800 via-purple-500 to-purple-800 rounded-t-2xl"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <History className="w-6 h-6 text-purple-400" />
                  Bid History
                </h3>
                <button
                  onClick={() => setShowBidHistory(false)}
                  className="text-gray-400 hover:text-white bg-gray-800/50 p-2 rounded-full hover:bg-gray-700/50 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {bidsHistory.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-700">
                  <Gavel className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-xl mb-2">No bids placed yet</p>
                  <p className="text-gray-500">Be the first to bid on this item!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {bidsHistory.map((bid, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl border transition-all ${
                        bid.bidder === currentUsername 
                          ? 'bg-purple-900/30 border-purple-700' 
                          : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            bid.bidder === currentUsername ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {bid.bidder === currentUsername ? 'You' : bid.bidder.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {bid.bidder === currentUsername ? 'Your bid' : bid.bidder}
                            </p>
                            <p className="text-sm text-gray-400">{formatBidDate(bid.date)}</p>
                          </div>
                          {index === 0 && (
                            <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full font-medium">
                              Highest
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${index === 0 ? 'text-green-400' : 'text-white'}`}>
                            ${bid.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-400">
                            Total: ${calculateTotalPayable(bid.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between">
                {bidsHistory.length > 0 && user?.role === 'buyer' && user.username !== listing.seller && !isAuctionEnded && (
                  <button
                    onClick={() => {
                      setShowBidHistory(false);
                      setTimeout(() => {
                        if (bidInputRef.current) {
                          bidInputRef.current.focus();
                          if (suggestedBidAmount) {
                            setBidAmount(suggestedBidAmount);
                          }
                        }
                      }, 100);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition flex-1 mr-3"
                  >
                    Place My Bid
                  </button>
                )}
                <button
                  onClick={() => setShowBidHistory(false)}
                  className={`${bidsHistory.length > 0 && user?.role === 'buyer' && user.username !== listing.seller && !isAuctionEnded ? 'bg-gray-700 text-white' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'} py-3 px-6 rounded-xl font-bold hover:opacity-90 transition ${bidsHistory.length > 0 && user?.role === 'buyer' && user.username !== listing.seller && !isAuctionEnded ? '' : 'w-full'}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Auction Success Modal */}
        {showAuctionSuccess && isAuctionListing && listing && user?.role === "buyer" && isUserHighestBidder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-yellow-900/20 via-gray-900 to-purple-900/20 p-8 rounded-3xl shadow-2xl border border-yellow-500/30 max-w-lg w-full text-center relative overflow-hidden">
              {/* Animated background effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-yellow-500/10 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-purple-500 to-yellow-500"></div>
              
              <div className="relative z-10 mb-6">
                <div className="relative mx-auto w-28 h-28 mb-6">
                  {/* Animated trophy with multiple rings */}
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-2 bg-yellow-500/30 rounded-full animate-ping animation-delay-200"></div>
                  <div className="relative bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full p-6 shadow-lg">
                    <Award className="w-16 h-16 text-black" />
                  </div>
                  <CheckCircle className="absolute -bottom-1 -right-1 w-12 h-12 text-green-500 bg-gray-900 rounded-full p-2 border-2 border-gray-900" />
                  
                  {/* Floating particles */}
                  <div className="absolute -top-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute -top-1 -right-3 w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-300"></div>
                  <div className="absolute -bottom-2 -left-3 w-2 h-2 bg-yellow-400 rounded-full animate-bounce animation-delay-500"></div>
                </div>
                
                <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent mb-2">
                  🏆 CONGRATULATIONS! 🏆
                </h2>
                
                <p className="text-xl font-semibold text-white mb-4">
                  You Won the Auction!
                </p>
                
                <div className="text-gray-300 space-y-4">
                  <div className="bg-gradient-to-r from-yellow-900/30 to-purple-900/30 p-6 rounded-xl border border-yellow-500/30">
                    <p className="text-lg mb-3">
                      Your winning bid of <span className="font-bold text-yellow-400 text-2xl">${listing.auction?.highestBid?.toFixed(2)}</span>
                    </p>
                    <p className="text-base">
                      secured <span className="text-[#ff950e] font-bold">"{listing.title}"</span> from <span className="font-bold text-white">{listing.seller}</span>
                    </p>
                  </div>
                  
                  <div className="bg-black/40 p-6 rounded-xl border border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Winning Bid:</span>
                      <span className="font-bold text-yellow-400">${listing.auction?.highestBid?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Platform Fee (10%):</span>
                      <span className="font-bold text-gray-300">${((listing.auction?.highestBid || 0) * 0.1).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">Total Paid:</span>
                        <span className="text-2xl font-bold text-[#ff950e]">
                          ${calculateTotalPayable(listing.auction?.highestBid || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 text-green-400 bg-green-900/20 p-4 rounded-xl border border-green-700/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Payment Processed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      <span>Order Created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      <span>Seller Notified</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Progress bar with auction theme */}
              <div className="relative mb-6">
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden border border-yellow-500/30">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-full transition-all duration-[15000ms] ease-linear shadow-lg"
                    style={{
                      animation: 'progress 15s linear forwards'
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Redirecting to your orders in 15 seconds...
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/buyers/my-orders')}
                  className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-2xl hover:shadow-lg hover:shadow-green-500/25 font-bold transition-all text-lg flex items-center justify-center gap-3 group"
                >
                  <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  View My Orders
                </button>
                
                <button
                  onClick={() => router.push('/browse')}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-4 rounded-2xl hover:shadow-lg hover:shadow-purple-500/25 font-bold transition-all text-lg flex items-center justify-center gap-3 group"
                >
                  <Gavel className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  More Auctions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Render Purchase Success Screen for Standard Listings */}
        {showPurchaseSuccess && !isAuctionListing && listing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-[#ff950e]/30 max-w-md w-full text-center relative overflow-hidden">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff950e]/10 to-transparent animate-pulse"></div>
              
              <div className="relative z-10 mb-6">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-[#ff950e]/20 rounded-full animate-ping"></div>
                  <div className="relative bg-gradient-to-br from-[#ff950e] to-[#e0850d] rounded-full p-4">
                    <ShoppingBag className="w-16 h-16 text-black" />
                  </div>
                  <CheckCircle className="absolute -bottom-2 -right-2 w-10 h-10 text-green-500 bg-gray-900 rounded-full p-1" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  🎉 Purchase Successful!
                </h2>
                
                <div className="text-gray-300 space-y-4">
                  <p className="text-lg">
                    You successfully purchased <span className="text-[#ff950e] font-bold">"{listing.title}"</span>
                  </p>
                  
                  <div className="bg-black/30 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Seller:</span>
                      <span className="font-bold text-white">{listing.seller}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-400">Total Paid:</span>
                      <span className="text-2xl font-bold text-[#ff950e]">
                        ${listing.markedUpPrice?.toFixed(2) ?? (listing.price * 1.1).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      ✓ Includes 10% platform fee • ✓ Payment processed securely
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Truck className="w-5 h-5" />
                    <span>Order added to your history</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Progress bar */}
              <div className="relative mb-6">
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#ff950e] to-[#e0850d] rounded-full transition-all duration-[15000ms] ease-linear shadow-lg"
                    style={{
                      animation: 'progress 15s linear forwards'
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Redirecting to your orders in 15 seconds...
                </p>
              </div>
              
              <button
                onClick={() => router.push('/buyers/my-orders')}
                className="w-full bg-gradient-to-r from-[#ff950e] to-[#e0850d] text-black px-6 py-4 rounded-2xl hover:shadow-lg hover:shadow-[#ff950e]/30 font-bold transition-all text-lg flex items-center justify-center gap-3 group"
              >
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Go to My Orders Now
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Sticky Buy Button for Mobile */}
        {user?.role === 'buyer' && !needsSubscription && !isAuctionListing && (
          <div className={`fixed bottom-0 left-0 right-0 z-40 pointer-events-none lg:hidden`}>
            <div className={`transition-all duration-300 ${showStickyBuy ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
              <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-4">
                <div className="max-w-md mx-auto">
                  <button
                    onClick={handlePurchase}
                    className="w-full bg-gradient-to-r from-[#ff950e] to-[#e0850d] text-black px-6 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-[#ff950e]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-6 h-6" />
                        Buy Now • ${listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Sticky Auction Bidding for Mobile */}
        {user?.role === 'buyer' && !isAuctionEnded && isAuctionListing && listing.auction && user.username !== listing.seller && (
          <div className={`fixed bottom-0 left-0 right-0 z-40 pointer-events-none lg:hidden`}>
            <div className={`transition-all duration-300 ${showStickyBuy ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
              <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-4">
                <div className="max-w-md mx-auto">
                  <div className="bg-gradient-to-r from-purple-900/90 to-blue-900/90 backdrop-blur-lg rounded-2xl p-4 border border-purple-700 shadow-xl">
                    {/* Auction Status */}
                    <div className="flex justify-between items-center mb-3 text-sm text-purple-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimeRemaining(listing.auction.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-4 h-4" />
                        Current: ${listing.auction.highestBid?.toFixed(2) ?? listing.auction.startingPrice.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Bid Input */}
                    <div className="flex gap-3 mb-3">
                      <div className="flex-1">
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="number"
                            placeholder="Enter bid"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            onKeyPress={handleBidKeyPress}
                            min={listing.auction.highestBid ? (listing.auction.highestBid + 0.01).toFixed(2) : listing.auction.startingPrice.toFixed(2)}
                            step="0.01"
                            className="w-full pl-10 pr-3 py-3 rounded-xl bg-black/50 border border-purple-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleBidSubmit}
                        disabled={isBidding || !biddingEnabled}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {isBidding ? (
                          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <>
                            <Gavel className="w-5 h-5" />
                            Bid
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Quick Actions */}
                    {suggestedBidAmount && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBidAmount(suggestedBidAmount)}
                          className="flex-1 bg-purple-800/50 text-purple-300 px-3 py-2 rounded-lg text-sm font-medium border border-purple-700/50"
                        >
                          ${suggestedBidAmount}
                        </button>
                        <button
                          onClick={() => setBidAmount((parseFloat(suggestedBidAmount) * 1.5).toFixed(2))}
                          className="flex-1 bg-purple-800/50 text-purple-300 px-3 py-2 rounded-lg text-sm font-medium border border-purple-700/50"
                        >
                          ${(parseFloat(suggestedBidAmount) * 1.5).toFixed(2)}
                        </button>
                        <button
                          onClick={() => setShowBidHistory(true)}
                          className="bg-gray-800/50 text-gray-300 px-3 py-2 rounded-lg text-sm flex items-center border border-gray-700/50"
                        >
                          <History className="w-4 h-4 mr-1" />
                          {listing.auction.bids?.length || 0}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
          
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    </main>
  );
}
