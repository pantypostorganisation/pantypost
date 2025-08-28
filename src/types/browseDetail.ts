// src/types/browseDetail.ts

import { Listing } from '@/context/ListingContext';
import { DeliveryAddress } from '@/components/AddressConfirmationModal';

export interface SellerProfile {
  bio?: string | null;
  pic?: string | null;
  subscriptionPrice?: string | null;
}

export interface BidStatus {
  success?: boolean;
  message?: string;
}

export interface BidHistoryItem {
  bidder: string;
  amount: number;
  date: string;
}

export interface DetailState {
  purchaseStatus: string;
  isProcessing: boolean;
  showPurchaseSuccess: boolean;
  showAuctionSuccess: boolean;
  sellerProfile: SellerProfile;
  showStickyBuy: boolean;
  bidAmount: string;
  bidStatus: BidStatus;
  biddingEnabled: boolean;
  bidsHistory: BidHistoryItem[];
  showBidHistory: boolean;
  forceUpdateTimer: Record<string, unknown>;
  viewCount: number;
  isBidding: boolean;
  bidError: string | null;
  bidSuccess: string | null;
  currentImageIndex: number;
}

// Enhanced auction interface with reserve price support
export interface AuctionWithReserve {
  isAuction: boolean;
  startingPrice: number;
  reservePrice?: number;
  endTime: string;
  bids: Array<{
    id: string;
    bidder: string;
    amount: number;
    date: string;
  }>;
  highestBid?: number;
  highestBidder?: string;
  status: 'active' | 'ended' | 'cancelled' | 'reserve_not_met';
  minimumIncrement?: number;
  reserveMet?: boolean;
}

export interface ListingWithDetails extends Listing {
  sellerProfile?: SellerProfile;
  isSellerVerified?: boolean;
  sellerTierInfo?: {
    tier: string;
    color: string;
    minSales: number;
  } | null;
  sellerAverageRating?: number | null;
  sellerReviewCount?: number;
  // Override auction type to include reserve fields
  auction?: AuctionWithReserve;
}

// Component Props
export interface DetailHeaderProps {
  onBack: () => void;
}

export interface ImageGalleryProps {
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  listing: ListingWithDetails;
  isLockedPremium: boolean | undefined;
  viewCount: number;
  isAuctionListing: boolean;
  isAuctionEnded: boolean;
  formatTimeRemaining: (endTime: string) => string;
  forceUpdateTimer: Record<string, unknown>;
}

export interface ProductInfoProps {
  listing: ListingWithDetails;
}

export interface AuctionSectionProps {
  listing: ListingWithDetails;
  isAuctionEnded: boolean;
  formatTimeRemaining: (endTime: string) => string;
  currentHighestBid: number;
  currentTotalPayable: number;
  getTimerProgress: () => number;
  bidAmount: string;
  onBidAmountChange: (amount: string) => void;
  onBidSubmit: () => void;
  onBidKeyPress: (e: React.KeyboardEvent) => void;
  isBidding: boolean;
  biddingEnabled: boolean;
  bidError: string | null;
  bidSuccess: string | null;
  bidStatus: BidStatus;
  suggestedBidAmount: string | null;
  onShowBidHistory: () => void;
  bidsCount: number;
  userRole?: string;
  username?: string;
  bidInputRef: React.RefObject<HTMLInputElement | null>;
  bidButtonRef: React.RefObject<HTMLButtonElement | null>;
  realtimeBids?: BidHistoryItem[];
  mergedBidsHistory?: BidHistoryItem[];
  hasReserve?: boolean;
  reserveMet?: boolean;
  viewerCount?: number;
}

export interface PurchaseSectionProps {
  listing: ListingWithDetails;
  isProcessing: boolean;
  onPurchase: () => void;
  userRole?: string;
}

export interface SellerProfileProps {
  seller: string;
  sellerProfile: SellerProfile;
  sellerTierInfo: any;
  sellerAverageRating: number | null | undefined;
  sellerReviewCount: number;
  isVerified: boolean;
}

export interface TrustBadgesProps {}

export interface BidHistoryModalProps {
  show: boolean;
  onClose: () => void;
  bidsHistory: BidHistoryItem[];
  currentUsername: string;
  formatBidDate: (date: string) => string;
  calculateTotalPayable: (amount: number) => number;
}

export interface AuctionEndedModalProps {
  isAuctionListing: boolean;
  isAuctionEnded: boolean;
  listing: ListingWithDetails;
  isUserHighestBidder: boolean;
  didUserBid: boolean;
  userRole?: string;
  username?: string;
  bidsHistory: BidHistoryItem[];
  onNavigate: (path: string) => void;
}

export interface PurchaseSuccessModalProps {
  showPurchaseSuccess: boolean;
  showAuctionSuccess: boolean;
  isAuctionListing: boolean;
  listing: ListingWithDetails;
  isUserHighestBidder: boolean;
  userRole?: string;
  calculateTotalPayable: (amount: number) => number;
  onNavigate: (path: string) => void;
}

export interface StickyPurchaseBarProps {
  show: boolean;
  listing: ListingWithDetails;
  isProcessing: boolean;
  needsSubscription: boolean | undefined;
  isAuctionListing: boolean;
  userRole?: string;
  onPurchase: () => void;
}

export interface PremiumLockMessageProps {
  listing: ListingWithDetails;
  userRole?: string;
}

// Additional types for reserve price handling
export interface ReservePriceStatus {
  hasReserve: boolean;
  reservePrice: number | undefined;
  currentBid: number;
  reserveMet: boolean;
  amountToReserve: number;
  percentageToReserve: number;
}

export interface AuctionExpiryStatus {
  isExpired: boolean;
  timeRemaining: number;
  shouldProcess: boolean;
}

// Extended listing creation/update types with reserve support
export interface CreateAuctionRequest {
  title: string;
  description: string;
  imageUrls: string[];
  seller: string;
  tags?: string[];
  hoursWorn?: number;
  auction: {
    startingPrice: number;
    reservePrice?: number;
    endTime: string;
  };
}

export interface UpdateAuctionRequest {
  reservePrice?: number;
  endTime?: string;
  status?: 'active' | 'ended' | 'cancelled';
}