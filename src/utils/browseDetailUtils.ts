// src/utils/browseDetailUtils.ts

import { Listing } from '@/context/ListingContext';

export const calculateTotalPayable = (bidPrice: number): number => {
  return Math.round(bidPrice * 1.1 * 100) / 100;
};

export const formatBidDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const getTimerProgress = (
  isAuctionListing: boolean,
  listing: Listing | undefined,
  isAuctionEnded: boolean
): number => {
  if (!isAuctionListing || !listing?.auction?.endTime || isAuctionEnded) return 0;
  
  const listingCreatedTime = new Date(listing.date).getTime();
  const endTime = new Date(listing.auction.endTime).getTime();
  const now = new Date().getTime();
  
  const totalDuration = endTime - listingCreatedTime;
  const elapsed = now - listingCreatedTime;
  
  const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  return progress;
};

export const formatTimeRemaining = (
  endTimeStr: string,
  timeCache: React.MutableRefObject<{[key: string]: {formatted: string, expires: number}}>
): string => {
  const now = new Date();
  const nowTime = now.getTime();
  
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
  
  const cacheTime = diffDays > 0 ? 60000 :
                    diffHours > 0 ? 30000 :
                    diffMinutes > 0 ? 5000 :
                    1000;
                    
  timeCache.current[endTimeStr] = {
    formatted,
    expires: nowTime + cacheTime
  };
  
  return formatted;
};

export const validateBidAmount = (
  bidAmount: string,
  listing: Listing | undefined,
  userBalance: number
): { isValid: boolean; error?: string } => {
  if (!listing?.auction) {
    return { isValid: false, error: 'Invalid auction listing' };
  }

  const numericBid = parseFloat(bidAmount);
  
  if (isNaN(numericBid) || numericBid <= 0) {
    return { isValid: false, error: 'Please enter a valid bid amount.' };
  }
  
  if (numericBid < listing.auction.startingPrice) {
    return { 
      isValid: false, 
      error: `Your bid must be at least $${listing.auction.startingPrice.toFixed(2)}.` 
    };
  }
  
  const currentHighestBid = listing.auction.highestBid || 0;
  if (numericBid <= currentHighestBid) {
    return { 
      isValid: false, 
      error: `Your bid must be higher than the current highest bid of $${currentHighestBid.toFixed(2)}.` 
    };
  }
  
  if (userBalance < numericBid) {
    return { 
      isValid: false, 
      error: `Insufficient funds. Your wallet balance is $${userBalance.toFixed(2)}.` 
    };
  }
  
  return { isValid: true };
};