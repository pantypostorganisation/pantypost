// src/utils/browseUtils.ts

import { Listing, AuctionSettings } from '@/context/ListingContext';
import { HourRangeOption } from '@/types/browse';

export const HOUR_RANGE_OPTIONS: HourRangeOption[] = [
  { label: 'Any Hours', min: 0, max: Infinity },
  { label: '12+ Hours', min: 12, max: Infinity },
  { label: '24+ Hours', min: 24, max: Infinity },
  { label: '48+ Hours', min: 48, max: Infinity },
];

export const PAGE_SIZE = 40;

// Type guard for auction listings
export const isAuctionListing = (listing: Listing): listing is Listing & { auction: AuctionSettings } => {
  return !!listing.auction;
};

// Safe date parsing with validation
export const safeParseDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return null;
    }
    return date;
  } catch (error) {
    console.error('Date parsing error:', error, 'for string:', dateString);
    return null;
  }
};

// Helper function to check if listing is active
export const isListingActive = (listing: Listing): boolean => {
  if (listing.auction) {
    const isActive = listing.auction.status === 'active';
    const endTime = safeParseDate(listing.auction.endTime);
    const endTimeNotPassed = endTime ? endTime > new Date() : false;
    return isActive && endTimeNotPassed;
  }
  return true; // Non-auction listings are always active
};

// Get display price for a listing
export const getDisplayPrice = (listing: Listing): { price: string; label: string } => {
  try {
    if (isAuctionListing(listing)) {
      const hasActiveBids = listing.auction.bids && listing.auction.bids.length > 0;
      const highestBid = listing.auction.highestBid;
      
      // Check for null/undefined explicitly, not falsy (allows 0)
      if (hasActiveBids && highestBid !== null && highestBid !== undefined) {
        return {
          price: highestBid.toFixed(2),
          label: 'Current Bid'
        };
      } else {
        return {
          price: listing.auction.startingPrice.toFixed(2),
          label: 'Starting Bid'
        };
      }
    } else {
      return {
        price: listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2),
        label: 'Buy Now'
      };
    }
  } catch (error) {
    console.error('Error getting display price:', error);
    return { price: '0.00', label: 'Price Error' };
  }
};

// Format time remaining for auction
export const formatTimeRemaining = (endTimeStr: string, timeCache: React.MutableRefObject<{[key: string]: {formatted: string, expires: number}}>): string => {
  try {
    const now = new Date();
    const nowTime = now.getTime();
    
    // Check cache first
    const cached = timeCache.current[endTimeStr];
    if (cached && cached.expires > nowTime) {
      return cached.formatted;
    }
    
    const endTime = safeParseDate(endTimeStr);
    if (!endTime) {
      return 'Invalid time';
    }
    
    if (endTime <= now) {
      // Cache ended auctions for longer to prevent repeated calculations
      timeCache.current[endTimeStr] = {
        formatted: 'Ended',
        expires: nowTime + 300000 // Cache for 5 minutes
      };
      return 'Ended';
    }
    
    const diffMs = endTime.getTime() - nowTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let formatted: string;
    let cacheTime: number;
    
    if (diffDays > 0) {
      formatted = `${diffDays}d ${diffHours}h`;
      cacheTime = 300000; // Cache for 5 minutes
    } else if (diffHours > 0) {
      formatted = `${diffHours}h ${diffMinutes}m`;
      cacheTime = 60000; // Cache for 1 minute
    } else if (diffMinutes > 0) {
      formatted = `${diffMinutes}m`;
      cacheTime = 30000; // Cache for 30 seconds
    } else {
      formatted = 'Soon';
      cacheTime = 10000; // Cache for 10 seconds
    }
    
    // Update cache
    timeCache.current[endTimeStr] = {
      formatted,
      expires: nowTime + cacheTime
    };
    
    return formatted;
  } catch (error) {
    console.error('Error formatting time remaining:', error, 'for string:', endTimeStr);
    return 'Time error';
  }
};