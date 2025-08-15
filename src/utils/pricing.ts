// src/utils/pricing.ts
// Single source of truth for pricing calculations

import { Listing } from '@/context/ListingContext';

/**
 * Get the total amount a buyer needs to pay for a listing
 * This is the SINGLE SOURCE OF TRUTH used by both:
 * - Pre-purchase balance checks
 * - Actual wallet debits in WalletContext
 */
export function getBuyerDebitAmount(listing: { 
  markedUpPrice?: number; 
  price: number;
  auction?: any;
}): number {
  // For auctions, we don't use this function (handled separately)
  if (listing.auction) {
    return 0;
  }
  
  // Use markedUpPrice if available (includes platform fee)
  // Otherwise use base price
  return listing.markedUpPrice || listing.price;
}

/**
 * CRITICAL FIX: Remove 10% markup for auction bids
 * Buyers pay exactly their bid amount, no additional fees
 */
export function getAuctionTotalPayable(bidAmount: number): number {
  // NEW: No markup for buyers - they pay exactly what they bid
  return bidAmount;
}

/**
 * Calculate seller earnings for auction (after 20% platform fee)
 */
export function getAuctionSellerEarnings(winningBid: number): number {
  const AUCTION_PLATFORM_FEE = 0.20; // 20% platform fee from seller
  return Math.round(winningBid * (1 - AUCTION_PLATFORM_FEE) * 100) / 100;
}

/**
 * Calculate platform fee for auction (20% of winning bid)
 */
export function getAuctionPlatformFee(winningBid: number): number {
  const AUCTION_PLATFORM_FEE = 0.20; // 20% platform fee
  return Math.round(winningBid * AUCTION_PLATFORM_FEE * 100) / 100;
}

/**
 * Check if buyer has sufficient balance for a purchase
 */
export function hasSufficientBalance(
  buyerBalance: number, 
  listing: { markedUpPrice?: number; price: number; auction?: any }
): boolean {
  const required = getBuyerDebitAmount(listing);
  return buyerBalance >= required;
}

/**
 * Get the amount needed to complete a purchase
 */
export function getAmountNeeded(
  buyerBalance: number,
  listing: { markedUpPrice?: number; price: number; auction?: any }
): number {
  const required = getBuyerDebitAmount(listing);
  const needed = required - buyerBalance;
  return Math.max(0, needed);
}