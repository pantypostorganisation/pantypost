// src/context/AuctionContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { listingsService, storageService, ordersService } from '@/services';
import { sanitize } from '@/services/security.service';
import { v4 as uuidv4 } from 'uuid';
// Import types from ListingContext directly since they have auction-specific properties
import type { Listing, Bid, AuctionStatus } from './ListingContext';
// Import Order from shared types
import type { Order } from '@/types/order';

// Auction tracking types
interface AuctionBidRecord {
  bidder: string;
  listingId: string;
  bidAmount: number;
  totalPaidWithFees: number;
  timestamp: string;
  refunded: boolean;
  isWinner: boolean;
}

interface AuctionState {
  [listingId: string]: {
    bids: AuctionBidRecord[];
    currentHighestBidder: string | null;
    currentHighestBid: number;
    allBidders: Set<string>; // Track all unique bidders for this auction
    activeBidders: Map<string, { bidAmount: number; totalPaid: number }>; // Track bid amounts AND total paid
  };
}

interface RefundTracker {
  [listingId: string]: {
    [bidder: string]: {
      refunded: boolean;
      refundAmount: number;
      refundedAt?: string;
    };
  };
}

interface AuctionContextValue {
  // Core bidding functions
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  cancelAuction: (listingId: string) => Promise<boolean>;
  processEndedAuction: (listing: Listing) => Promise<boolean>;
  
  // Query functions
  getAuctionState: (listingId: string) => AuctionState[string] | null;
  getBidHistory: (listingId: string) => AuctionBidRecord[];
  getUserActiveBids: (username: string) => AuctionBidRecord[];
  hasBeenRefunded: (listingId: string, bidder: string) => boolean;
  
  // State
  isProcessing: boolean;
  error: string | null;
}

const AuctionContext = createContext<AuctionContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  AUCTION_STATE: 'auction_state_v7', // Increment version to force clean state
  REFUND_TRACKER: 'auction_refund_tracker_v4',
  PROCESSING_LOCK: 'auction_processing_lock',
} as const;

// Helper to round currency values to 2 decimal places
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { 
    holdBidFunds,
    refundBidFunds,
    getBuyerBalance,
    finalizeAuctionPurchase
  } = useWallet();

  // Core state
  const [auctionState, setAuctionState] = useState<AuctionState>({});
  const [refundTracker, setRefundTracker] = useState<RefundTracker>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Lock management
  const lockManager = useRef(new Map<string, boolean>());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Lock utilities
  const acquireLock = async (key: string): Promise<boolean> => {
    const lockKey = `${STORAGE_KEYS.PROCESSING_LOCK}_${key}`;
    const existingLock = await storageService.getItem<{ timestamp: number } | null>(lockKey, null);
    
    if (existingLock && Date.now() - existingLock.timestamp < 30000) {
      console.log('[AuctionContext] Lock exists for:', key);
      return false;
    }
    
    await storageService.setItem(lockKey, { timestamp: Date.now() });
    lockManager.current.set(key, true);
    return true;
  };

  const releaseLock = async (key: string): Promise<void> => {
    const lockKey = `${STORAGE_KEYS.PROCESSING_LOCK}_${key}`;
    await storageService.removeItem(lockKey);
    lockManager.current.delete(key);
  };

  // Load state from storage
  const loadState = useCallback(async () => {
    try {
      const [savedState, savedTracker] = await Promise.all([
        storageService.getItem<AuctionState>(STORAGE_KEYS.AUCTION_STATE, {}),
        storageService.getItem<RefundTracker>(STORAGE_KEYS.REFUND_TRACKER, {})
      ]);

      // Rebuild Maps and Sets from saved data
      const rebuiltState: AuctionState = {};
      
      for (const [listingId, data] of Object.entries(savedState)) {
        rebuiltState[listingId] = {
          bids: data.bids || [],
          currentHighestBidder: data.currentHighestBidder,
          currentHighestBid: data.currentHighestBid || 0,
          allBidders: new Set(data.allBidders || []),
          activeBidders: new Map(data.activeBidders || [])
        };
      }

      setAuctionState(rebuiltState);
      setRefundTracker(savedTracker);
    } catch (error) {
      console.error('[AuctionContext] Failed to load state:', error);
    }
  }, []);

  // Save state to storage
  const saveState = useCallback(async () => {
    try {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce saves
      saveTimeoutRef.current = setTimeout(async () => {
        // Convert Maps and Sets for serialization
        const serializableState: any = {};
        
        for (const [listingId, data] of Object.entries(auctionState)) {
          serializableState[listingId] = {
            bids: data.bids,
            currentHighestBidder: data.currentHighestBidder,
            currentHighestBid: data.currentHighestBid,
            allBidders: Array.from(data.allBidders),
            activeBidders: Array.from(data.activeBidders.entries())
          };
        }

        await Promise.all([
          storageService.setItem(STORAGE_KEYS.AUCTION_STATE, serializableState),
          storageService.setItem(STORAGE_KEYS.REFUND_TRACKER, refundTracker)
        ]);
      }, 500);
    } catch (error) {
      console.error('[AuctionContext] Failed to save state:', error);
    }
  }, [auctionState, refundTracker]);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Save state on changes
  useEffect(() => {
    saveState();
  }, [auctionState, refundTracker, saveState]);

  // Track refund
  const trackRefund = useCallback((listingId: string, bidder: string, amount: number) => {
    setRefundTracker(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        [bidder]: {
          refunded: true,
          refundAmount: roundCurrency(amount),
          refundedAt: new Date().toISOString()
        }
      }
    }));
  }, []);

  // Check if user has been refunded
  const hasBeenRefunded = useCallback((listingId: string, bidder: string): boolean => {
    return refundTracker[listingId]?.[bidder]?.refunded || false;
  }, [refundTracker]);

  // Get auction state
  const getAuctionState = useCallback((listingId: string): AuctionState[string] | null => {
    return auctionState[listingId] || null;
  }, [auctionState]);

  // Get bid history
  const getBidHistory = useCallback((listingId: string): AuctionBidRecord[] => {
    return auctionState[listingId]?.bids || [];
  }, [auctionState]);

  // Get user's active bids
  const getUserActiveBids = useCallback((username: string): AuctionBidRecord[] => {
    const activeBids: AuctionBidRecord[] = [];
    
    for (const [listingId, state] of Object.entries(auctionState)) {
      const userBids = state.bids.filter(bid => 
        bid.bidder === username && !bid.refunded
      );
      activeBids.push(...userBids);
    }
    
    return activeBids;
  }, [auctionState]);

  // Clean up auction tracking
  const cleanupAuctionTracking = useCallback(async (listingId: string, winner?: string) => {
    try {
      // Get all pending auction orders for this listing
      const orders = await ordersService.getOrders();
      if (!orders.success || !orders.data) return;

      // Remove all pending auction orders for this listing
      const filteredOrders = orders.data.filter((order: any) => 
        !(order.listingId === listingId && order.shippingStatus === 'pending-auction')
      );

      // Save filtered orders back
      await storageService.setItem('wallet_orders', filteredOrders);
      ordersService.clearCache();

      console.log('[AuctionContext] Cleaned up auction tracking for:', listingId);
    } catch (error) {
      console.error('[AuctionContext] Cleanup error:', error);
    }
  }, []);

  // FIXED: Place a bid with proper refund handling
  const placeBid = useCallback(async (
    listingId: string, 
    bidder: string, 
    amount: number
  ): Promise<boolean> => {
    const lockKey = `bid_${listingId}_${bidder}`;
    
    if (!await acquireLock(lockKey)) {
      console.log('[AuctionContext] Bid already in progress');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Validate inputs
      const sanitizedBidder = sanitize.username(bidder);
      const sanitizedAmount = roundCurrency(amount);

      // Get listing
      const listingResult = await listingsService.getListing(listingId);
      if (!listingResult.success || !listingResult.data) {
        throw new Error('Listing not found');
      }

      const listing = listingResult.data;
      if (!listing.auction || listing.auction.status !== 'active') {
        throw new Error('Auction is not active');
      }

      // Check minimum bid
      const currentHighest = listing.auction.highestBid || 0;
      const minBid = currentHighest > 0 ? currentHighest + 1 : listing.auction.startingPrice;
      
      if (sanitizedAmount < minBid) {
        throw new Error(`Minimum bid is ${minBid}`);
      }

      // Initialize state if needed
      if (!auctionState[listingId]) {
        auctionState[listingId] = {
          bids: [],
          currentHighestBidder: null,
          currentHighestBid: 0,
          allBidders: new Set(),
          activeBidders: new Map()
        };
      }

      const currentState = auctionState[listingId];
      
      // Calculate fees with proper rounding
      const buyerFee = roundCurrency(sanitizedAmount * 0.1);
      const totalWithFee = roundCurrency(sanitizedAmount + buyerFee);

      console.log('[AuctionContext] Processing bid:', {
        bidder: sanitizedBidder,
        amount: sanitizedAmount,
        currentHighest: currentState.currentHighestBid,
        currentHighestBidder: currentState.currentHighestBidder,
        activeBidders: currentState.activeBidders ? Array.from(currentState.activeBidders.entries()) : []
      });

      // FIX: Handle bidder's previous bid FIRST
      let previousBidAmount = 0;
      let previousTotalPaid = 0;
      
      if (currentState.activeBidders.has(sanitizedBidder)) {
        const previousBidData = currentState.activeBidders.get(sanitizedBidder);
        if (previousBidData && typeof previousBidData === 'object' && 'totalPaid' in previousBidData) {
          previousBidAmount = previousBidData.bidAmount;
          previousTotalPaid = previousBidData.totalPaid;
          
          console.log('[AuctionContext] Bidder has previous bid:', {
            previousBidAmount,
            previousTotalPaid
          });
        }
      }

      // Calculate what the bidder needs to pay
      let amountToCharge = totalWithFee;
      
      if (previousTotalPaid > 0) {
        // FIX: For incremental bidding, only charge the difference
        amountToCharge = roundCurrency(totalWithFee - previousTotalPaid);
        
        console.log('[AuctionContext] Incremental bid:', {
          newTotalRequired: totalWithFee,
          alreadyPaid: previousTotalPaid,
          amountToCharge
        });
        
        if (amountToCharge <= 0) {
          throw new Error('New bid must be higher than your current bid');
        }
      }

      // FIX: Refund ONLY other bidders (not the current bidder)
      const biddersToRefund = Array.from(currentState.activeBidders.keys()).filter(b => b !== sanitizedBidder);
      
      console.log('[AuctionContext] Refunding other bidders:', biddersToRefund);

      for (const bidderToRefund of biddersToRefund) {
        console.log(`[AuctionContext] Refunding bidder: ${bidderToRefund}`);
        
        // Get the bidder's data
        const bidderData = currentState.activeBidders.get(bidderToRefund);
        
        if (bidderData && typeof bidderData === 'object' && 'totalPaid' in bidderData && bidderData.totalPaid > 0) {
          const refundAmount = roundCurrency(bidderData.totalPaid);
          console.log(`[AuctionContext] Found pending bid for ${bidderToRefund}, refunding $${refundAmount}`);
          
          // Use atomic refund with the correct amount
          const { atomicRefundOperation } = await import('@/utils/storageSyncFix');
          const refundSuccess = await atomicRefundOperation(
            bidderToRefund,
            listingId,
            refundAmount
          );
          
          if (refundSuccess) {
            // Remove from active bidders and track refund
            currentState.activeBidders.delete(bidderToRefund);
            trackRefund(listingId, bidderToRefund, refundAmount);
            console.log(`[AuctionContext] Successfully refunded ${bidderToRefund}`);
          } else {
            console.error(`[AuctionContext] Failed to refund bidder: ${bidderToRefund}`);
          }
        }
      }

      // Force a delay to ensure refunds are processed
      await new Promise(resolve => setTimeout(resolve, 200));

      // FIX: Handle the new bid based on whether it's incremental or new
      if (previousTotalPaid > 0) {
        // Incremental bid - only hold the difference
        console.log('[AuctionContext] Processing incremental bid, holding additional:', amountToCharge);
        
        // First, cancel the previous order to free it up
        const orders = await ordersService.getOrders();
        if (orders.success && orders.data) {
          const previousOrder = orders.data.find((order: Order) => 
            order.buyer === sanitizedBidder && 
            order.listingId === listingId && 
            order.shippingStatus === 'pending-auction'
          );
          
          if (previousOrder) {
            // Remove the old order
            const filteredOrders = orders.data.filter((o: Order) => o.id !== previousOrder.id);
            await storageService.setItem('wallet_orders', filteredOrders);
            ordersService.clearCache();
          }
        }
        
        // Hold the full new amount (the system will create a new order for the total)
        const holdSuccess = await holdBidFunds(
          listingId,
          sanitizedBidder,
          sanitizedAmount,
          listing.title
        );

        if (!holdSuccess) {
          throw new Error('Failed to hold additional bid funds');
        }
      } else {
        // New bid - hold the full amount
        const holdSuccess = await holdBidFunds(
          listingId,
          sanitizedBidder,
          sanitizedAmount,
          listing.title
        );

        if (!holdSuccess) {
          throw new Error('Failed to hold bid funds');
        }
      }

      // Place the bid with listing service
      const bidResult = await listingsService.placeBid(listingId, sanitizedBidder, sanitizedAmount);
      if (!bidResult.success) {
        // Refund if bid placement failed
        if (previousTotalPaid === 0) {
          await refundBidFunds(sanitizedBidder, listingId);
        }
        throw new Error(bidResult.error?.message || 'Failed to place bid');
      }

      // Update auction state
      const newBidRecord: AuctionBidRecord = {
        bidder: sanitizedBidder,
        listingId,
        bidAmount: sanitizedAmount,
        totalPaidWithFees: totalWithFee,
        timestamp: new Date().toISOString(),
        refunded: false,
        isWinner: false
      };

      // Update tracking with proper structure
      currentState.allBidders.add(sanitizedBidder);
      currentState.activeBidders.set(sanitizedBidder, {
        bidAmount: sanitizedAmount,
        totalPaid: totalWithFee
      });

      // Update state with new data
      const newState = {
        ...auctionState,
        [listingId]: {
          bids: [...currentState.bids, newBidRecord],
          currentHighestBidder: sanitizedBidder,
          currentHighestBid: sanitizedAmount,
          allBidders: new Set(currentState.allBidders),
          activeBidders: new Map(currentState.activeBidders)
        }
      };

      setAuctionState(newState);

      // Force save state immediately
      await saveState();

      console.log('[AuctionContext] Bid placed successfully:', {
        bidder: sanitizedBidder,
        amount: sanitizedAmount,
        totalPaid: totalWithFee,
        refundedBidders: biddersToRefund,
        activeBidders: Array.from(currentState.activeBidders.entries())
      });

      return true;

    } catch (error) {
      console.error('[AuctionContext] Bid error:', error);
      setError(error instanceof Error ? error.message : 'Failed to place bid');
      return false;
    } finally {
      setIsProcessing(false);
      await releaseLock(lockKey);
    }
  }, [auctionState, getBuyerBalance, holdBidFunds, refundBidFunds, trackRefund, saveState]);

  // Cancel an auction and refund all bidders
  const cancelAuction = useCallback(async (listingId: string): Promise<boolean> => {
    const lockKey = `cancel_${listingId}`;
    
    if (!await acquireLock(lockKey)) {
      return false;
    }

    try {
      setIsProcessing(true);

      // Cancel via listing service
      const result = await listingsService.cancelAuction(listingId);
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to cancel auction');
      }

      // Get auction state
      const state = auctionState[listingId];
      if (state && state.activeBidders) {
        // Refund all active bidders
        for (const [bidder, bidData] of state.activeBidders.entries()) {
          let refundAmount = 0;
          
          if (bidData && typeof bidData === 'object' && 'totalPaid' in bidData) {
            refundAmount = roundCurrency(bidData.totalPaid);
          } else if (typeof bidData === 'number') {
            refundAmount = roundCurrency(bidData * 1.1);
          }
          
          if (refundAmount > 0) {
            const { atomicRefundOperation } = await import('@/utils/storageSyncFix');
            const refundSuccess = await atomicRefundOperation(bidder, listingId, refundAmount);
            if (refundSuccess) {
              trackRefund(listingId, bidder, refundAmount);
              console.log('[AuctionContext] Refunded bidder on cancel:', bidder);
            }
          }
        }
      }

      // Clean up auction tracking
      await cleanupAuctionTracking(listingId);

      // Remove from state
      const newState = { ...auctionState };
      delete newState[listingId];
      setAuctionState(newState);

      // Clear refund tracker for this listing
      const newRefundTracker = { ...refundTracker };
      delete newRefundTracker[listingId];
      setRefundTracker(newRefundTracker);

      return true;
    } catch (error) {
      console.error('[AuctionContext] Cancel auction error:', error);
      return false;
    } finally {
      setIsProcessing(false);
      await releaseLock(lockKey);
    }
  }, [auctionState, refundTracker, cleanupAuctionTracking, trackRefund]);

  // Process an ended auction
  const processEndedAuction = useCallback(async (listing: Listing): Promise<boolean> => {
    const lockKey = `process_${listing.id}`;
    
    if (!await acquireLock(lockKey)) {
      return false;
    }

    try {
      console.log('[AuctionContext] Processing ended auction:', listing.id);

      if (!listing.auction || listing.auction.status !== 'active') {
        return false;
      }

      // Check if auction has ended
      if (new Date(listing.auction.endTime) > new Date()) {
        return false;
      }

      // Find valid winner
      let validWinner: Bid | null = null;
      
      if (listing.auction.bids && listing.auction.bids.length > 0) {
        const sortedBids = [...listing.auction.bids].sort((a, b) => b.amount - a.amount);
        
        // Check for reserve price
        if (listing.auction.reservePrice) {
          validWinner = sortedBids.find(bid => bid.amount >= listing.auction!.reservePrice!) || null;
        } else {
          validWinner = sortedBids[0];
        }
      }

      const state = auctionState[listing.id];

      if (validWinner && state) {
        // Process the winner
        const winnerUsername = validWinner.bidder;
        const winningAmount = validWinner.amount;
        
        console.log('[AuctionContext] Processing winner:', {
          winner: winnerUsername,
          amount: winningAmount
        });

        // Convert ListingContext's Listing to a format that WalletContext expects
        // The wallet just needs basic listing info for the purchase
        const listingForWallet = {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: winningAmount,
          markedUpPrice: listing.markedUpPrice || winningAmount,
          seller: listing.seller,
          imageUrls: listing.imageUrls,
          type: 'instant' as const,
          status: 'active' as const,
          category: 'panties' as const,
          shippingIncluded: true,
          internationalShipping: false,
          createdAt: listing.date,
          updatedAt: listing.date,
          views: 0,
          favorites: 0
        };

        // Finalize the purchase for winner
        const success = await finalizeAuctionPurchase(listingForWallet as any, winnerUsername, winningAmount);
        
        if (success && state.activeBidders) {
          // Refund all other active bidders
          for (const [bidder, bidData] of state.activeBidders.entries()) {
            if (bidder !== winnerUsername) {
              let refundAmount = 0;
              
              if (bidData && typeof bidData === 'object' && 'totalPaid' in bidData) {
                refundAmount = roundCurrency(bidData.totalPaid);
              } else if (typeof bidData === 'number') {
                refundAmount = roundCurrency(bidData * 1.1);
              }
              
              if (refundAmount > 0) {
                const { atomicRefundOperation } = await import('@/utils/storageSyncFix');
                const refundSuccess = await atomicRefundOperation(bidder, listing.id, refundAmount);
                if (refundSuccess) {
                  trackRefund(listing.id, bidder, refundAmount);
                  console.log('[AuctionContext] Refunded loser:', bidder);
                }
              }
            }
          }
          
          // Clean up auction tracking
          await cleanupAuctionTracking(listing.id, winnerUsername);
        }
      } else if (state && state.activeBidders) {
        // No valid winner - refund everyone
        console.log('[AuctionContext] No valid winner, refunding all bidders');
        
        for (const [bidder, bidData] of state.activeBidders.entries()) {
          let refundAmount = 0;
          
          if (bidData && typeof bidData === 'object' && 'totalPaid' in bidData) {
            refundAmount = roundCurrency(bidData.totalPaid);
          } else if (typeof bidData === 'number') {
            refundAmount = roundCurrency(bidData * 1.1);
          }
          
          if (refundAmount > 0) {
            const { atomicRefundOperation } = await import('@/utils/storageSyncFix');
            const refundSuccess = await atomicRefundOperation(bidder, listing.id, refundAmount);
            if (refundSuccess) {
              trackRefund(listing.id, bidder, refundAmount);
              console.log('[AuctionContext] Refunded bidder (no winner):', bidder);
            }
          }
        }
        
        // Clean up auction tracking
        await cleanupAuctionTracking(listing.id);
      }

      // Remove from state
      const newState = { ...auctionState };
      delete newState[listing.id];
      setAuctionState(newState);

      return true;
    } catch (error) {
      console.error('[AuctionContext] Process ended auction error:', error);
      return false;
    } finally {
      setIsProcessing(false);
      await releaseLock(lockKey);
    }
  }, [auctionState, finalizeAuctionPurchase, cleanupAuctionTracking, trackRefund]);

  const value: AuctionContextValue = {
    placeBid,
    cancelAuction,
    processEndedAuction,
    getAuctionState,
    getBidHistory,
    getUserActiveBids,
    hasBeenRefunded,
    isProcessing,
    error
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within AuctionProvider');
  }
  return context;
}