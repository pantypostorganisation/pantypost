// src/types/order.ts

/**
 * Shared Order type definition to avoid circular dependencies
 */

export interface DeliveryAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrl?: string;
  date: string;
  seller: string;
  buyer: string;
  tags?: string[];
  wearTime?: string;
  wasAuction?: boolean;
  finalBid?: number;
  deliveryAddress?: DeliveryAddress;
  shippingStatus?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'pending-auction';
  tierCreditAmount?: number;
  isCustomRequest?: boolean;
  originalRequestId?: string;
  listingId?: string;
  listingTitle?: string;
  quantity?: number;
  notes?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice?: number;
  seller: string;
  sellerUsername?: string;
  type: 'instant' | 'auction';
  status: 'active' | 'sold' | 'expired' | 'cancelled' | 'pending';
  category: 'panties' | 'bras' | 'socks' | 'accessories' | 'custom' | 'other';
  imageUrls: string[];
  tags?: string[];
  size?: string;
  color?: string;
  material?: string;
  wearTime?: string;
  customizations?: string[];
  shippingIncluded: boolean;
  internationalShipping: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  soldAt?: string;
  views: number;
  favorites: number;
  
  // Auction specific fields
  auctionEndTime?: string;
  startingBid?: number;
  currentBid?: number;
  bidCount?: number;
  highestBidder?: string;
  bidIncrement?: number;
  reservePrice?: number;
  reserveMet?: boolean;
  
  // Additional metadata
  featured?: boolean;
  verified?: boolean;
  nsfw?: boolean;
  metadata?: Record<string, any>;
}

export interface CustomRequestPurchase {
  requestId: string;
  buyer: string;
  seller: string;
  amount: number;
  description: string;
  metadata?: any;
}

export interface DepositLog {
  id: string;
  username: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  date: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  notes?: string;
}