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
  ExternalLink, ShoppingCart, MapPin
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
  const [sellerProfile, setSellerProfile] = useState<{ bio?: string | null; pic?: string | null; subscriptionPrice?: string | null; }>({});
  const [showStickyBuy, setShowStickyBuy] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidStatus, setBidStatus] = useState<{success?: boolean; message?: string}>({});
  const [biddingEnabled, setBiddingEnabled] = useState(true);
  const [bidsHistory, setBidsHistory] = useState<{bidder: string, amount: number, date: string}[]>([]);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [forceUpdateTimer, setForceUpdateTimer] = useState<Record<string, unknown>>({});
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);

  // Enhanced bid validation and submission with debouncing
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);
  const bidButtonRef = useRef<HTMLButtonElement>(null);
  const bidInputRef = useRef<HTMLInputElement>(null);
  const lastBidTime = useRef<number>(0);
  const purchasedOrderId = useRef<string | null>(null);

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

  // Handle address confirmation
  const handleAddressConfirm = (address: DeliveryAddress) => {
    setDeliveryAddress(address);
    if (purchasedOrderId.current) {
      updateOrderAddress(purchasedOrderId.current, address);
    }
    setAddressModalOpen(false);
  };
  
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
      // Find the order ID that was just created
      const newOrderId = `${listing.id}-${new Date().toISOString()}`;
      purchasedOrderId.current = newOrderId;
      
      removeListing(listing.id);
      addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
      setPurchaseStatus('Purchase successful! 🎉');
      
      // Show the address modal after successful purchase
      setAddressModalOpen(true);
      setShowPurchaseSuccess(true);
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
    
    // Screen for auction winner
    if (user?.role === "buyer" && isHighestBidder) {
      return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="relative mx-auto w-20 h-20 mb-4">
                <Award className="w-20 h-20 text-yellow-500 animate-pulse" />
                <CheckCircle className="absolute bottom-0 right-0 w-8 h-8 text-green-500 bg-[#1a1a1a] rounded-full p-1" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Congratulations! You Won!
              </h2>
              
              <div className="text-gray-300">
                <p className="mb-4">
                  Your winning bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span> secured 
                  "<span className="text-[#ff950e]">{listing.title}</span>" from <span className="font-bold">{listing.seller}</span>.
                </p>
                
                <div className="bg-black/30 p-4 rounded-xl border border-gray-700 mb-4">
                  <p className="text-sm mb-2">Your purchase has been processed and added to your order history.</p>
                  <p className="text-sm text-[#ff950e] font-medium">
                    Total paid: ${calculateTotalPayable(listing.auction.highestBid || 0).toFixed(2)} 
                    <span className="text-gray-500 font-normal"> (includes 10% platform fee)</span>
                  </p>
                </div>
                
                {/* Add address button if no address is set yet */}
                {!deliveryAddress && (
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg mb-4 hover:bg-yellow-500 font-bold transition text-lg shadow flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" /> Add Delivery Address
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/buyers/my-orders')}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-full hover:bg-green-500 font-bold transition text-lg shadow flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" /> View My Orders
              </button>
              
              <button
                onClick={() => router.push('/browse')}
                className="w-full bg-purple-600 text-white px-4 py-3 rounded-full hover:bg-purple-500 font-bold transition text-lg shadow"
              >
                Browse More Items
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Render purchase success screen for standard (non-auction) listings
  const renderPurchaseSuccessScreen = () => {
    if (!showPurchaseSuccess || !listing) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl border border-gray-800 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <ShoppingBag className="w-20 h-20 text-[#ff950e] animate-pulse" />
              <CheckCircle className="absolute bottom-0 right-0 w-8 h-8 text-green-500 bg-[#1a1a1a] rounded-full p-1" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Purchase Successful!
            </h2>
            
            <div className="text-gray-300">
              <p className="mb-4">
                You have successfully purchased <span className="text-[#ff950e] font-medium">"{listing.title}"</span> from <span className="font-bold">{listing.seller}</span>.
              </p>
              
              <div className="bg-black/30 p-4 rounded-xl border border-gray-700 mb-4">
                <p className="text-sm mb-2">Your order has been added to your order history.</p>
                <p className="text-sm text-[#ff950e] font-medium">
                  Total paid: ${listing.markedUpPrice?.toFixed(2) ?? (listing.price * 1.1).toFixed(2)}
                  <span className="text-gray-500 font-normal"> (includes 10% platform fee)</span>
                </p>
              </div>
              
              {/* Show delivery address confirmation if not set yet */}
              {!deliveryAddress && (
                <div className="mb-4">
                  <p className="text-yellow-400 text-sm mb-2 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Please confirm your delivery address
                  </p>
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-500 font-bold transition flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" /> Add Delivery Address
                  </button>
                </div>
              )}
              
              <p className="text-sm text-green-400">
                The seller has been notified and will contact you soon.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/buyers/my-orders')}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-full hover:bg-green-500 font-bold transition text-lg shadow flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" /> View My Orders
            </button>
            
            <button
              onClick={() => router.push('/browse')}
              className="w-full bg-[#ff950e] text-black px-4 py-3 rounded-full hover:bg-[#e0850d] font-bold transition text-lg shadow"
            >
              Browse More Items
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-black text-white py-6 px-2 sm:px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/browse" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff950e] transition text-sm">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Browse
          </Link>
        </div>

        {/* Listing Detail Card */}
        <div className={`bg-gradient-to-br from-[#181818] via-black to-[#181818] border ${isAuctionListing ? 'border-purple-800' : 'border-gray-800'} rounded-3xl shadow-2xl flex flex-col lg:flex-row gap-8 overflow-hidden p-0`}>
          {/* Left: Image Gallery */}
          <div className="flex-1 flex flex-col items-center lg:items-start p-4 sm:p-6 lg:p-6">
            {/* Main Image with arrows only (no orange pill) */}
            <div ref={imageRef} className="relative w-full max-w-md lg:max-w-none pb-0">
              <div className="relative w-full h-[520px] rounded-3xl overflow-hidden shadow-xl bg-[#232323] border border-[#232323] flex items-center justify-center">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover rounded-3xl"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          aria-label="Previous image"
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-transparent text-[#ff950e] rounded-full z-10 transition"
                          style={{ opacity: 0.6, padding: 0 }}
                        >
                          <ChevronLeft className="w-10 h-10" />
                        </button>
                        <button
                          aria-label="Next image"
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent text-[#ff950e] rounded-full z-10 transition"
                          style={{ opacity: 0.6, padding: 0 }}
                        >
                          <ChevronRight className="w-10 h-10" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 rounded-3xl">
                    No Image Available
                  </div>
                )}
                
                {/* Auction Badge */}
                {isAuctionListing && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
                      <Gavel className="w-4 h-4 mr-1" /> 
                      {isAuctionEnded ? 'Auction Ended' : 'Auction'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="w-full max-w-md lg:max-w-none overflow-x-auto flex gap-3 pb-2 mt-2">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition ${index === currentImageIndex ? 'border-[#ff950e]' : 'border-gray-700 hover:border-gray-600'}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Actions */}
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-6">
            <div className="text-left">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">{listing.title}</h1>

              {/* Tags */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {listing.tags.map((tag, i) => (
                    <span key={i} className="bg-[#232323] text-[#ff950e] text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Seller Info Card with larger profile picture and badge overlay */}
              {user?.role === 'buyer' && (
                <div className="flex items-start gap-6 bg-[#181818]/80 border border-[#232323] rounded-2xl p-5 mt-6 mb-4 shadow-inner w-full">
                  {/* Seller profile picture section - increased size by 70% */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-full border-2 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden shadow-lg">
                      {sellerProfile.pic ? (
                        <img
                          src={sellerProfile.pic}
                          alt={listing.seller}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-4xl font-bold">
                          {listing.seller ? listing.seller.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    
                    {/* Tier badge overlay on profile picture */}
                    {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
                      <div className="absolute -bottom-1 -right-2">
                        <TierBadge tier={sellerTierInfo.tier} size="lg" showTooltip={true} />
                      </div>
                    )}
                  </div>
                  
                  {/* Seller info content - shifted right */}
                  <div className="flex-1 min-w-0">
                    {/* Seller Name and Verified Badge */}
                    <div className="flex items-center gap-2 mb-1 group">
                      <span className="font-bold text-xl text-white truncate">{listing.seller}</span>
                      {isSellerVerified && (
                        <div className="relative">
                          <img
                            src="/verification_badge.png"
                            alt="Verified"
                            className="w-5 h-5"
                          />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                            Verified Seller
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400 mt-1 mb-3 line-clamp-2">
                      {sellerProfile.bio || 'No bio provided.'}
                    </p>
                    
                    <Link
                      href={`/sellers/${listing.seller}`}
                      className="inline-block mt-1 bg-black border border-[#ff950e] text-[#ff950e] font-bold px-3 py-1.5 rounded-full text-xs hover:bg-[#ff950e] hover:text-black transition"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              )}

              {/* Info Row: Hours worn */}
              {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
                <div className="flex items-center mb-6">
                  <span className="flex items-center gap-2 bg-[#181818]/80 border border-[#232323] rounded-xl px-5 py-3 shadow-inner text-sm text-gray-300 font-semibold w-fit">
                    <Clock className="w-4 h-4 text-[#ff950e]" />
                    {listing.hoursWorn} hours worn
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-base text-gray-300 leading-relaxed mb-6">{listing.description}</p>

              {/* Auction Details Section with Enhanced UI */}
              {isAuctionListing && listing.auction && (
                <div className={`mb-6 p-5 rounded-2xl border ${isAuctionEnded ? 'border-gray-700 bg-gray-900/30' : 'border-purple-700 bg-purple-900/20'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Gavel className={`w-5 h-5 ${isAuctionEnded ? 'text-gray-400' : 'text-purple-400'}`} />
                    <h3 className="text-lg font-bold text-white">
                      {isAuctionEnded ? 'Auction Ended' : 'Auction Details'}
                    </h3>
                    
                    {/* Auction status badge */}
                    {isAuctionEnded ? (
                      <span className="ml-auto text-sm bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                        {listing.auction.status === 'cancelled' ? 'Cancelled' : 'Ended'}
                      </span>
                    ) : (
                      <span className="ml-auto text-sm bg-green-800/70 text-green-300 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-black/30 rounded-xl p-4 border border-gray-800 space-y-3">
                    {/* Time remaining with progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-400" /> Time Remaining:
                        </span>
                        <span className={`font-semibold ${
                          isAuctionEnded ? 'text-gray-400' : 'text-green-400'
                        }`}>
                          {isAuctionEnded ? (
                            listing.auction.status === 'cancelled' ? 'Auction Cancelled' : 'Auction Ended'
                          ) : (
                            formatTimeRemaining(listing.auction.endTime)
                          )}
                        </span>
                      </div>
                      
                      {!isAuctionEnded && (
                        <>
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            {(() => {
                              // Calculate progress percentage
                              const startTime = new Date(listing.date).getTime();
                              const endTime = new Date(listing.auction.endTime).getTime();
                              const currentTime = new Date().getTime();
                              const totalDuration = endTime - startTime;
                              const elapsed = currentTime - startTime;
                              const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                              
                              return (
                                <div
                                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                                  style={{ width: `${progress}%` }}
                                />
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Bid information with price + markup display */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/40 p-3 rounded-lg border border-gray-800">
                        <div className="text-xs text-gray-400 mb-1">Starting Bid</div>
                        <div className="font-bold text-white text-lg">${listing.auction.startingPrice.toFixed(2)}</div>
                      </div>
                      
                      <div className={`p-3 rounded-lg border ${
                        listing.auction.highestBid ? 'bg-green-900/20 border-green-800/40' : 'bg-black/40 border-gray-800'
                      }`}>
                        <div className="text-xs text-gray-400 mb-1">Current Bid</div>
                        {listing.auction.highestBid ? (
                          <div className="font-bold text-green-400 text-lg flex items-center gap-1">
                            <ArrowUp className="w-4 h-4" />
                            ${listing.auction.highestBid.toFixed(2)}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic">No bids yet</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Total payable amount (with markup) */}
                    <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-800/40">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-purple-200 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" /> Total Payable (incl. 10% fee):
                        </div>
                        <div className="font-bold text-white text-lg">
                          ${currentTotalPayable.toFixed(2)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        A 10% fee is added to the final bid amount at auction end.
                      </p>
                    </div>
                    
                    {/* Reserve price and bid count */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <BarChart2 className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-300">
                          {listing.auction.bids?.length || 0} {listing.auction.bids?.length === 1 ? 'bid' : 'bids'} placed
                        </span>
                      </div>
                      
                      {listing.auction.reservePrice && (
                        <div>
                          {(!listing.auction.highestBid || listing.auction.highestBid < listing.auction.reservePrice) ? (
                            <span className="flex items-center gap-1.5 text-yellow-400 text-sm">
                              <AlertTriangle className="w-4 h-4" />
                              Reserve price not met
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-green-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Reserve price met
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Highest bidder information */}
                    {listing.auction.highestBidder && (
                      <div className="border-t border-gray-800/60 pt-3 mt-2">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-300">Highest Bidder:</div>
                          <div className="font-medium text-white">
                            {listing.auction.highestBidder === user?.username ? (
                              <span className="text-green-400 flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> You
                              </span>
                            ) : (
                              listing.auction.highestBidder
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Additional auction information */}
                    {listing.auction.highestBidder && listing.auction.highestBidder === user?.username && (
                      <div className={`rounded-lg p-3 text-sm flex items-start gap-2 ${
                        bidStatus.success 
                          ? 'bg-green-900/30 border border-green-800/50 text-green-300' 
                          : 'bg-yellow-900/30 border border-yellow-800/50 text-yellow-300'
                      }`}>
                        {bidStatus.success ? (
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                        <span>
                          {bidStatus.message || (bidStatus.success 
                            ? `You are the highest bidder! Total payable if you win: $${currentTotalPayable.toFixed(2)}`
                            : 'Warning: Please check your wallet balance.')}
                        </span>
                      </div>
                    )}
                    
                    {/* Bid history button */}
                    {listing.auction.bids && listing.auction.bids.length > 0 && (
                      <button 
                        className="mt-1 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
                        onClick={() => setShowBidHistory(true)}
                      >
                        <History className="w-4 h-4" />
                        View complete bid history
                      </button>
                    )}
                  </div>
                  
                  {/* Bid input form - only show if auction is active */}
                  {!isAuctionEnded && user?.role === 'buyer' && user.username !== listing.seller && (
                    <div className="mt-4 pt-4 border-t border-purple-800/50">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                            <input
                              ref={bidInputRef}
                              type="number"
                              placeholder={`${listing.auction.highestBid ? 'Enter higher bid amount' : 'Enter bid amount'}`}
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              onKeyPress={handleBidKeyPress}
                              min={listing.auction.highestBid ? (listing.auction.highestBid + 0.01).toFixed(2) : listing.auction.startingPrice.toFixed(2)}
                              step="0.01"
                              className="w-full pl-8 pr-3 py-2 rounded-lg bg-black border border-purple-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <button
                          ref={bidButtonRef}
                          onClick={handleBidSubmit}
                          disabled={isBidding || !biddingEnabled}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                        >
                          {isBidding ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                              Placing...
                            </>
                          ) : (
                            <>
                              <Gavel className="w-4 h-4" /> Place Bid
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Total payable with fee for this bid */}
                      {bidAmount && !isNaN(parseFloat(bidAmount)) && parseFloat(bidAmount) > 0 && (
                        <p className="text-xs text-purple-300 mt-2 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          If you win with this bid, you'll pay: ${calculateTotalPayable(parseFloat(bidAmount)).toFixed(2)} (includes 10% fee)
                        </p>
                      )}
                      
                      {/* Suggested bid buttons */}
                      {suggestedBidAmount && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => setBidAmount(suggestedBidAmount)}
                            className="text-xs bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-800/50 transition border border-purple-700/50"
                          >
                            Bid ${suggestedBidAmount}
                          </button>
                          <button
                            onClick={() => setBidAmount((parseFloat(suggestedBidAmount) * 1.5).toFixed(2))}
                            className="text-xs bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-800/50 transition border border-purple-700/50"
                          >
                            Bid ${(parseFloat(suggestedBidAmount) * 1.5).toFixed(2)}
                          </button>
                          <button
                            onClick={() => setBidAmount((parseFloat(suggestedBidAmount) * 2).toFixed(2))}
                            className="text-xs bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-800/50 transition border border-purple-700/50"
                          >
                            Bid ${(parseFloat(suggestedBidAmount) * 2).toFixed(2)}
                          </button>
                        </div>
                      )}
                      
                      {/* Minimum bid hint */}
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {listing.auction.highestBid
                          ? `Minimum bid: $${(listing.auction.highestBid + 0.01).toFixed(2)}`
                          : `Minimum bid: $${listing.auction.startingPrice.toFixed(2)}`}
                      </p>
                      
                      {/* Error message */}
                      {bidError && (
                        <div className="mt-3 p-2 rounded-lg text-sm bg-red-900/40 text-red-400 border border-red-800">
                          {bidError}
                        </div>
                      )}
                      
                      {/* Success message */}
                      {bidSuccess && (
                        <div className="mt-3 p-2 rounded-lg text-sm bg-green-900/40 text-green-400 border border-green-800">
                          {bidSuccess}
                        </div>
                      )}
                      
                      {/* Status message */}
                      {bidStatus.message && !bidError && !bidSuccess && (
                        <div className={`mt-3 p-2 rounded-lg text-sm ${
                          bidStatus.success ? 'bg-green-900/40 text-green-400 border border-green-800' : 'bg-red-900/40 text-red-400 border border-red-800'
                        }`}>
                          {bidStatus.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Price and Action Buttons */}
              <div className="w-full max-w-sm mx-0 flex flex-col items-center mb-6">
                {!isAuctionListing && (
                  <div className="flex justify-center w-full mb-4">
                    <span className="flex items-center gap-2 text-3xl font-extrabold text-[#ff950e] bg-[#232323] px-6 py-3 rounded-full shadow border border-[#232323] w-fit mx-auto">
                      <DollarSign className="w-6 h-6" style={{ marginRight: '0.15em' }} />
                      <span className="ml-1">{listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}</span>
                    </span>
                  </div>
                )}
                
                {user?.role === 'buyer' && (
                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    {!isAuctionListing && (
                      <button
                        onClick={handlePurchase}
                        className="flex-1 bg-[#ff950e] text-black px-4 py-2 rounded-full hover:bg-[#e0850d] font-bold text-base shadow-lg transition focus:scale-105 active:scale-95"
                        disabled={isProcessing}
                        style={{
                          boxShadow: '0 2px 12px 0 #ff950e44',
                          transition: 'all 0.15s cubic-bezier(.4,2,.6,1)'
                        }}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <ShoppingBag className="w-5 h-5 animate-pulse" /> Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <ShoppingBag className="w-5 h-5" /> Buy Now
                          </span>
                        )}
                      </button>
                    )}
                    
                    <Link
                      href={`/buyers/messages?thread=${listing.seller}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-full hover:bg-gray-600 font-bold text-base shadow-lg transition"
                      style={{ borderRadius: '9999px' }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Message {listing.seller}
                    </Link>
                  </div>
                )}
              </div>

              {/* Purchase Status Message */}
              {purchaseStatus && (
                <p className={`text-lg font-semibold ${purchaseStatus.includes('successful') ? 'text-green-500' : 'text-red-500'} mt-4`}>
                  {purchaseStatus}
                </p>
              )}

              {/* Premium Content Lock Message */}
              {needsSubscription && (
                <div className="bg-yellow-700 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 mt-6">
                  <Lock className="w-6 h-6 text-yellow-200" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Premium Content</h3>
                    <p className="text-sm">This is a premium listing. Subscribe to {listing.seller} to view its full details and purchase.</p>
                    {user?.role === 'buyer' && (
                      <Link
                        href={`/sellers/${listing.seller}`}
                        className="inline-block mt-3 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-yellow-400 transition"
                      >
                        View {listing.seller}'s Profile
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Bid History Modal */}
        {showBidHistory && isAuctionListing && listing.auction && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#1a1a1a] rounded-xl border border-purple-800 w-full max-w-lg p-6 relative">
              {/* Animated decoration */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-800 via-purple-500 to-purple-800 rounded-t-xl"></div>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  Bid History for "{listing.title}"
                </h3>
                <button
                  onClick={() => setShowBidHistory(false)}
                  className="text-gray-400 hover:text-white bg-black/40 p-1.5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {bidsHistory.length === 0 ? (
                <div className="text-center py-12 bg-black/30 rounded-lg border border-dashed border-gray-700">
                  <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-lg">No bids placed yet</p>
                  <p className="text-gray-500 text-sm mt-2">Be the first to bid on this item!</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar bg-black/40 rounded-lg border border-gray-800">
                  <table className="w-full">
                    <thead className="text-left text-gray-400 text-sm border-b border-gray-700">
                      <tr>
                        <th className="py-3 px-4">Bidder</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {bidsHistory.map((bid, index) => (
                        <tr key={index} className={`transition-colors ${bid.bidder === currentUsername ? 'bg-purple-900/30' : index % 2 === 0 ? 'bg-black/20' : ''}`}>
                          <td className="py-3 px-4 font-medium">
                            {bid.bidder === currentUsername ? (
                              <span className="text-purple-400 flex items-center gap-1">
                                <User className="w-3.5 h-3.5" /> You
                              </span>
                            ) : (
                              bid.bidder
                            )}
                            {index === 0 && (
                              <span className="ml-2 text-xs bg-green-600/80 text-white px-1.5 py-0.5 rounded-sm">
                                Highest
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold ${index === 0 ? 'text-green-400' : 'text-white'}`}>
                              ${bid.amount.toFixed(2)}
                            </span>
                            {index > 0 && index < bidsHistory.length - 1 && (
                              <span className="text-xs text-gray-500 ml-2">
                                +${(bid.amount - bidsHistory[index + 1].amount).toFixed(2)}
                              </span>
                            )}
                            <div className="text-xs text-gray-500">
                              Total payable: ${calculateTotalPayable(bid.amount).toFixed(2)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-400">{formatBidDate(bid.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-5 pt-4 border-t border-gray-700 flex justify-between">
                {bidsHistory.length > 0 && user?.role === 'buyer' && user.username !== listing.seller && !isAuctionEnded && (
                  <button
                    onClick={() => {
                      // Close modal and focus bid input
                      setShowBidHistory(false);
                      setTimeout(() => {
                        if (bidInputRef.current) {
                          bidInputRef.current.focus();
                          // If a suggested bid amount exists, use it
                          if (suggestedBidAmount) {
                            setBidAmount(suggestedBidAmount);
                          }
                        }
                      }, 100);
                    }}
                    className="bg-purple-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-purple-500 transition flex-1 mr-2"
                  >
                    Place My Bid
                  </button>
                )}
                <button
                  onClick={() => setShowBidHistory(false)}
                  className={`${bidsHistory.length > 0 && user?.role === 'buyer' && user.username !== listing.seller && !isAuctionEnded ? 'bg-gray-700 text-white' : 'bg-purple-600 text-white'} py-2 px-4 rounded-lg font-bold hover:bg-opacity-90 transition ${bidsHistory.length > 0 && user?.role === 'buyer' && user.username !== listing.seller && !isAuctionEnded ? '' : 'w-full'}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Render Auction Ended Screens */}
        {renderAuctionEndedScreen()}
        
        {/* Render Purchase Success Screen */}
        {renderPurchaseSuccessScreen()}

        {/* Address Confirmation Modal */}
        <AddressConfirmationModal
          isOpen={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          onConfirm={handleAddressConfirm}
          existingAddress={deliveryAddress}
          orderId={purchasedOrderId.current || ''}
        />

        {/* Sticky Buy Now for mobile - only for standard listings */}
        {user?.role === 'buyer' && !needsSubscription && !isAuctionListing && (
          <div className={`fixed bottom-0 left-0 w-full z-40 pointer-events-none sm:hidden`}>
            <div className={`transition-all duration-300 ${showStickyBuy ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
              <div className="max-w-md mx-auto px-4 pb-4">
                <button
                  onClick={handlePurchase}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff950e] text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-[#e0850d] transition focus:scale-105 active:scale-95"
                  style={{
                    boxShadow: '0 2px 12px 0 #ff950e44',
                    transition: 'all 0.15s cubic-bezier(.4,2,.6,1)'
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <ShoppingBag className="w-5 h-5 animate-pulse" /> Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" /> Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Sticky Place Bid for mobile - only for auction listings */}
        {user?.role === 'buyer' && !isAuctionEnded && isAuctionListing && listing.auction && user.username !== listing.seller && (
          <div className={`fixed bottom-0 left-0 w-full z-40 pointer-events-none sm:hidden`}>
            <div className={`transition-all duration-300 ${showStickyBuy ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
              <div className="max-w-md mx-auto px-4 pb-4">
                <div className="bg-black/90 backdrop-blur-sm rounded-xl p-3 border border-purple-800 shadow-lg">
                  <div className="flex flex-col gap-2">
                    {/* Compact auction status */}
                    <div className="w-full flex justify-between items-center text-sm text-purple-300 px-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatTimeRemaining(listing.auction.endTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart2 className="w-3.5 h-3.5" /> 
                        {listing.auction.highestBid 
                          ? `Current: ${listing.auction.highestBid.toFixed(2)}` 
                          : `Start: ${listing.auction.startingPrice.toFixed(2)}`}
                      </span>
                    </div>
                    
                    {/* Bid input and button */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            placeholder="Enter bid"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            onKeyPress={handleBidKeyPress}
                            min={listing.auction.highestBid ? (listing.auction.highestBid + 0.01).toFixed(2) : listing.auction.startingPrice.toFixed(2)}
                            step="0.01"
                            className="w-full pl-8 pr-3 py-3 rounded-lg bg-black border border-purple-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleBidSubmit}
                        disabled={isBidding || !biddingEnabled}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      >
                        {isBidding ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                            Bidding...
                          </>
                        ) : (
                          <>
                            <Gavel className="w-5 h-5" /> Bid
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Total payable info */}
                    {bidAmount && !isNaN(parseFloat(bidAmount)) && parseFloat(bidAmount) > 0 && (
                      <p className="text-xs text-purple-300 px-2">
                        Total with fee: ${calculateTotalPayable(parseFloat(bidAmount)).toFixed(2)}
                      </p>
                    )}
                    
                    {/* Quick bid buttons */}
                    {suggestedBidAmount && (
                      <div className="flex justify-between gap-2 px-1">
                        <button
                          onClick={() => setBidAmount(suggestedBidAmount)}
                          className="flex-1 text-xs bg-purple-900/60 text-purple-300 px-2 py-1.5 rounded-lg hover:bg-purple-800/60 transition border border-purple-700/50"
                        >
                          Bid ${suggestedBidAmount}
                        </button>
                        <button
                          onClick={() => setBidAmount((parseFloat(suggestedBidAmount) * 1.5).toFixed(2))}
                          className="flex-1 text-xs bg-purple-900/60 text-purple-300 px-2 py-1.5 rounded-lg hover:bg-purple-800/60 transition border border-purple-700/50"
                        >
                          Bid ${(parseFloat(suggestedBidAmount) * 1.5).toFixed(2)}
                        </button>
                        <button
                          onClick={() => setShowBidHistory(true)}
                          className="text-xs bg-gray-800/80 text-gray-300 px-2 py-1.5 rounded-lg hover:bg-gray-700/80 transition flex items-center"
                        >
                          <History className="w-3 h-3 mr-1" /> 
                          {listing.auction.bids?.length || 0}
                        </button>
                      </div>
                    )}
                    
                    {/* Display status messages in sticky bar */}
                    {(bidError || bidSuccess) && (
                      <div className={`text-xs p-1.5 rounded ${
                        bidSuccess ? 'bg-green-900/40 text-green-400 border border-green-800/50' : 
                                   'bg-red-900/40 text-red-400 border border-red-800/50'
                      }`}>
                        {bidSuccess || bidError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}