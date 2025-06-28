// src/utils/browseDetailUtils.ts

import { Listing, AuctionSettings } from '@/context/ListingContext';
import { User } from '@/context/AuthContext';
import { Order } from '@/context/WalletContext';
import { getSellerTierMemoized } from './sellerTiers';

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

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
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

export const formatTimeRemaining = (endTimeStr: string): string => {
  const now = new Date();
  const endTime = new Date(endTimeStr);
  
  if (endTime <= now) {
    return 'Auction ended';
  }
  
  const diffMs = endTime.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h remaining`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m remaining`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds}s remaining`;
  } else {
    return `${diffSeconds}s remaining`;
  }
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
  
  const startingBid = listing.auction.startingPrice || 0;
  const currentHighestBid = listing.auction.highestBid || 0;
  const minimumBid = currentHighestBid > 0 ? currentHighestBid + 1 : startingBid;
  
  if (numericBid < minimumBid) {
    return { 
      isValid: false, 
      error: `Minimum bid is $${minimumBid.toFixed(2)}.` 
    };
  }
  
  const totalRequired = calculateTotalPayable(numericBid);
  if (userBalance < totalRequired) {
    return { 
      isValid: false, 
      error: `Insufficient funds. You need $${totalRequired.toFixed(2)}.` 
    };
  }
  
  return { isValid: true };
};

export const isAuctionActive = (auction: AuctionSettings): boolean => {
  if (auction.status !== 'active') return false;
  
  const endTime = new Date(auction.endTime);
  const now = new Date();
  
  return endTime > now;
};

export const extractSellerInfo = (
  listing: Listing,
  users: { [key: string]: User },
  orderHistory?: Order[]
) => {
  const seller = listing.seller;
  const sellerUser = users[seller];
  
  if (!sellerUser) return null;
  
  const isVerified = sellerUser.isVerified || sellerUser.verificationStatus === 'verified';
  const tierInfo = orderHistory ? getSellerTierMemoized(seller, orderHistory) : null;
  
  return {
    seller,
    isVerified,
    tierInfo,
    user: sellerUser
  };
};
