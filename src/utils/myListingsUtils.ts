// src/utils/myListingsUtils.ts

import { ListingFormState } from '@/types/myListings';

export const INITIAL_FORM_STATE: ListingFormState = {
  title: '',
  description: '',
  price: '',
  imageUrls: [],
  isPremium: false,
  tags: '',
  hoursWorn: '',
  isAuction: false,
  startingPrice: '',
  reservePrice: '',
  auctionDuration: '3'
};

/**
 * Calculate auction end time based on duration
 * @param duration - Duration in days as string
 * @returns Date string for the auction end time
 */
export const calculateAuctionEndTime = (duration: string): string => {
  const days = parseInt(duration, 10);
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + days);
  return endTime.toISOString();
};

/**
 * Format price for display
 * @param price - Price as number
 * @returns Formatted price string
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Get time remaining for an auction
 * @param endTime - Auction end time as string
 * @returns Object with days, hours, minutes remaining
 */
export const getTimeRemaining = (endTime: string): { days: number; hours: number; minutes: number; ended: boolean } => {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, ended: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, ended: false };
};

/**
 * Validate listing form data
 * @param formState - Current form state
 * @param isVerified - Whether user is verified
 * @returns Object with isValid and error message
 */
export const validateListingForm = (
  formState: ListingFormState,
  isVerified: boolean
): { isValid: boolean; error?: string } => {
  const { title, description, imageUrls, isAuction, startingPrice, price } = formState;

  if (!title || !description || imageUrls.length === 0) {
    return { isValid: false, error: 'Please fill in all required fields and add at least one image.' };
  }

  if (isAuction) {
    if (!isVerified) {
      return { isValid: false, error: 'You must be a verified seller to create auction listings.' };
    }

    const startingBid = parseFloat(startingPrice);
    if (isNaN(startingBid) || startingBid <= 0) {
      return { isValid: false, error: 'Please enter a valid starting bid for the auction.' };
    }
  } else {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return { isValid: false, error: 'Please enter a valid price.' };
    }
  }

  return { isValid: true };
};

/**
 * Parse tags from comma-separated string
 * @param tagsString - Comma-separated tags
 * @returns Array of trimmed tag strings
 */
export const parseTags = (tagsString: string): string[] => {
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

/**
 * Get listing type label
 * @param listing - Listing object
 * @returns Type label string
 */
export const getListingTypeLabel = (listing: any): string => {
  if (listing.auction) return 'Auction';
  if (listing.isPremium) return 'Premium';
  return 'Standard';
};

/**
 * Get listing type color classes
 * @param listing - Listing object
 * @returns Color class string
 */
export const getListingTypeColor = (listing: any): string => {
  if (listing.auction) return 'text-purple-500 border-purple-500';
  if (listing.isPremium) return 'text-yellow-500 border-yellow-500';
  return 'text-green-500 border-green-500';
};

/**
 * Get time since listing was created
 * @param createdAt - Creation date string
 * @returns Formatted time string
 */
export const timeSinceListed = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Format time remaining for display
 * @param endTime - End time as string
 * @returns Formatted time remaining string
 */
export const formatTimeRemaining = (endTime: string): string => {
  const { days, hours, minutes, ended } = getTimeRemaining(endTime);
  
  if (ended) {
    return 'Ended';
  }
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};