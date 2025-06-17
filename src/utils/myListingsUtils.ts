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
  auctionDuration: '1',
};

export const timeSinceListed = (dateString: string): string => {
  const now = new Date();
  const listed = new Date(dateString);
  const diffMs = now.getTime() - listed.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes > 0) return `${diffMinutes} min ago`;
  return 'just now';
};

export const formatTimeRemaining = (endTimeStr: string): string => {
  const endTime = new Date(endTimeStr);
  const now = new Date();
  
  if (endTime <= now) {
    return 'Ended';
  }
  
  const diffMs = endTime.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h left`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m left`;
  } else {
    return `${diffMinutes}m ${Math.floor((diffMs % (1000 * 60)) / 1000)}s left`;
  }
};

export const uploadImageToStorage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const calculateAuctionEndTime = (duration: string): string => {
  const now = new Date();
  const days = parseFloat(duration);
  const millisecondsToAdd = days * 24 * 60 * 60 * 1000;
  const endTime = new Date(now.getTime() + millisecondsToAdd);
  return endTime.toISOString();
};