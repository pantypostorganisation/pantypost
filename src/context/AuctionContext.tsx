// src/context/AuctionContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { listingsService, storageService, ordersService } from '@/services';
import { sanitize } from '@/services/security.service';
import { v4 as uuidv4 } from 'uuid';
import type { Listing, Bid, AuctionStatus } from './ListingContext';

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
    activeBidders: Map<string, number>; // Track active bid amounts by bidder
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
  AUCTION_STATE: 'auction_state_v5', // Increment version to force clean state
  REFUND_TRACKER: 'auction_refund_tracker_v3',
  PROCESSING_LOCK: 'auction_processing_lock',
} as const;

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { 
    holdBidFunds,
    refundBidFunds,
    finalizeAuctionPurchase,
    getBuyerBalance,
    getAuctionBidders,
    cleanupAuctionTracking
  } = useWallet();
  
  const [auctionState, setAuctionState] = useState<AuctionState>({});
  const [refundTracker, setRefundTracker] = useState<RefundTracker>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Transaction lock to prevent race conditions
  const transactionLocks = useRef(new Map<string, boolean>());

  // Load state from storage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedState, savedRefunds] = await Promise.all([
          storageService.getItem<AuctionState>(STORAGE_KEYS.AUCTION_STATE, {}),
          storageService.getItem<RefundTracker>(STORAGE_KEYS.REFUND_TRACKER, {})
        ]);
        
        // Convert Set and Map data back from arrays if needed
        const restoredState: AuctionState = {};
        Object.entries(savedState).forEach(([listingId, data]) => {
          restoredState[listingId] = {
            ...data,
            allBidders: new Set(Array.isArray((data as any).allBidders) ? (data as any).allBidders : []),
            activeBidders: new Map(Array.isArray((data as any).activeBidders) ? (data as any).activeBidders : [])
          };
        });
        
        setAuctionState(restoredState);
        setRefundTracker(savedRefunds);
      } catch (error) {
        console.error('[AuctionContext] Failed to load state:', error);
      }
    };
    
    loadState();
  }, []);

  // Save state to storage when it changes
  const saveState = useCallback(async () => {
    try {
      // Convert Sets and Maps to arrays for storage
      const stateToSave: any = {};
      Object.entries(auctionState).forEach(([listingId, data]) => {
        stateToSave[listingId] = {
          ...data,
          allBidders: Array.from(data.allBidders),
          activeBidders: Array.from(data.activeBidders.entries())
        };
      });
      
      await Promise.all([
        storageService.setItem(STORAGE_KEYS.AUCTION_STATE, stateToSave),
        storageService.setItem(STORAGE_KEYS.REFUND_TRACKER, refundTracker)
      ]);
    } catch (error) {
      console.error('[AuctionContext] Failed to save state:', error);
    }
  }, [auctionState, refundTracker]);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveState();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [auctionState, refundTracker, saveState]);

  // Acquire transaction lock
  const acquireLock = async (key: string): Promise<boolean> => {
    const lockKey = `auction_${key}`;
    
    if (transactionLocks.current.get(lockKey)) {
      console.log('[AuctionContext] Transaction locked:', key);
      return false;
    }
    
    transactionLocks.current.set(lockKey, true);
    
    // Also check storage-based lock for cross-tab safety
    const storageLock = await storageService.getItem<any>(`${STORAGE_KEYS.PROCESSING_LOCK}_${key}`, null);
    if (storageLock && storageLock.expires > Date.now()) {
      transactionLocks.current.delete(lockKey);
      return false;
    }
    
    // Set storage lock
    await storageService.setItem(`${STORAGE_KEYS.PROCESSING_LOCK}_${key}`, {
      locked: true,
      expires: Date.now() + 30000, // 30 second expiry
      instanceId: uuidv4()
    });
    
    return true;
  };

  // Release transaction lock
  const releaseLock = async (key: string) => {
    const lockKey = `auction_${key}`;
    transactionLocks.current.delete(lockKey);
    await storageService.removeItem(`${STORAGE_KEYS.PROCESSING_LOCK}_${key}`);
  };

  // Check if a bidder has been refunded
  const hasBeenRefunded = useCallback((listingId: string, bidder: string): boolean => {
    const state = auctionState[listingId];
    if (!state) return true;
    
    // If they're the current highest bidder, they haven't been refunded
    if (state.currentHighestBidder === bidder) return false;
    
    // Check if they have an active bid
    return !state.activeBidders.has(bidder);
  }, [auctionState]);

  // Track a refund
  const trackRefund = useCallback((listingId: string, bidder: string, amount: number) => {
    setRefundTracker(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        [bidder]: {
          refunded: true,
          refundAmount: amount,
          refundedAt: new Date().toISOString()
        }
      }
    }));
  }, []);

  // CORE: Place a bid with comprehensive refund logic
  const placeBid = useCallback(async (
    listingId: string,
    bidder: string,
    amount: number
  ): Promise<boolean> => {
    const lockKey = `bid_${listingId}`;
    
    if (!await acquireLock(lockKey)) {
      setError('Another bid is being processed. Please try again.');
      return false;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Validate inputs
      const sanitizedBidder = sanitize.username(bidder);
      const sanitizedAmount = Math.max(0, amount);

      // Get current listing
      const listingResult = await listingsService.getListing(listingId);
      if (!listingResult.success || !listingResult.data) {
        throw new Error('Listing not found');
      }

      const listing = listingResult.data;
      if (!listing.auction || listing.auction.status !== 'active') {
        throw new Error('Auction is not active');
      }

      // Calculate fees
      const buyerFee = sanitizedAmount * 0.1;
      const totalWithFee = sanitizedAmount + buyerFee;

      // Check buyer balance
      const buyerBalance = getBuyerBalance(sanitizedBidder);
      if (buyerBalance < totalWithFee) {
        throw new Error(`Insufficient balance. Need $${totalWithFee.toFixed(2)}, have $${buyerBalance.toFixed(2)}`);
      }

      // Initialize or get auction state - ENSURE activeBidders is initialized
      let currentState = auctionState[listingId];
      if (!currentState) {
        currentState = {
          bids: [],
          currentHighestBidder: listing.auction.highestBidder || null,
          currentHighestBid: listing.auction.highestBid || 0,
          allBidders: new Set(),
          activeBidders: new Map()
        };
        auctionState[listingId] = currentState;
      }

      // CRITICAL: Ensure activeBidders exists (for backwards compatibility)
      if (!currentState.activeBidders) {
        currentState.activeBidders = new Map();
      }

      // Validate bid amount
      const minimumBid = Math.max(
        listing.auction.startingPrice || 1,
        (currentState.currentHighestBid || 0) + (listing.auction.minimumIncrement || 1)
      );

      if (sanitizedAmount < minimumBid) {
        throw new Error(`Bid must be at least $${minimumBid.toFixed(2)}`);
      }

      console.log('[AuctionContext] Processing bid:', {
        bidder: sanitizedBidder,
        amount: sanitizedAmount,
        currentHighest: currentState.currentHighestBid,
        currentHighestBidder: currentState.currentHighestBidder,
        activeBidders: currentState.activeBidders ? Array.from(currentState.activeBidders.entries()) : []
      });

      // Store the previous highest bidder BEFORE updating
      const previousHighestBidder = currentState.currentHighestBidder;

      // CRITICAL FIX: Refund the previous highest bidder FIRST, before holding new funds
      if (previousHighestBidder && previousHighestBidder !== sanitizedBidder) {
        console.log('[AuctionContext] Refunding previous highest bidder FIRST:', previousHighestBidder);
        
        const refundSuccess = await refundBidFunds(previousHighestBidder, listingId);
        if (!refundSuccess) {
          console.error('[AuctionContext] Failed to refund previous bidder:', previousHighestBidder);
          throw new Error('Failed to refund previous bidder');
        }
        
        // Remove from active bidders after successful refund
        currentState.activeBidders.delete(previousHighestBidder);
        trackRefund(listingId, previousHighestBidder, 0);
        console.log('[AuctionContext] Successfully refunded previous bidder:', previousHighestBidder);
        
        // Force a small delay to ensure refund is processed
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // NOW hold the new bid funds
      const holdSuccess = await holdBidFunds(
        listingId,
        sanitizedBidder,
        sanitizedAmount,
        listing.title
      );

      if (!holdSuccess) {
        throw new Error('Failed to hold bid funds');
      }

      // Place the bid with listing service
      const bidResult = await listingsService.placeBid(listingId, sanitizedBidder, sanitizedAmount);
      if (!bidResult.success) {
        // Refund if bid placement failed
        await refundBidFunds(sanitizedBidder, listingId);
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

      // Update tracking
      currentState.allBidders.add(sanitizedBidder);
      currentState.activeBidders.set(sanitizedBidder, sanitizedAmount);

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
        refundedBidder: previousHighestBidder || 'none',
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
        for (const [bidder, bidAmount] of state.activeBidders.entries()) {
          const refundSuccess = await refundBidFunds(bidder, listingId);
          if (refundSuccess) {
            trackRefund(listingId, bidder, bidAmount + (bidAmount * 0.1));
            console.log('[AuctionContext] Refunded bidder on cancel:', bidder);
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
  }, [auctionState, refundTracker, refundBidFunds, cleanupAuctionTracking, trackRefund]);

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

        // Finalize the purchase for winner
        const success = await finalizeAuctionPurchase(listing, winnerUsername, winningAmount);
        
        if (success && state.activeBidders) {
          // Refund all other active bidders
          for (const [bidder, bidAmount] of state.activeBidders.entries()) {
            if (bidder !== winnerUsername) {
              const refundSuccess = await refundBidFunds(bidder, listing.id);
              if (refundSuccess) {
                trackRefund(listing.id, bidder, bidAmount + (bidAmount * 0.1));
                console.log('[AuctionContext] Refunded loser:', bidder);
              }
            }
          }
          
          // Clean up auction tracking
          await cleanupAuctionTracking(listing.id, winnerUsername);
        }
      } else if (state && state.activeBidders) {
        // No valid winner - refund everyone
        console.log('[AuctionContext] No valid winner, refunding all bidders');
        
        for (const [bidder, bidAmount] of state.activeBidders.entries()) {
          const refundSuccess = await refundBidFunds(bidder, listing.id);
          if (refundSuccess) {
            trackRefund(listing.id, bidder, bidAmount + (bidAmount * 0.1));
            console.log('[AuctionContext] Refunded bidder (no winner):', bidder);
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
      await releaseLock(lockKey);
    }
  }, [auctionState, refundBidFunds, finalizeAuctionPurchase, cleanupAuctionTracking, trackRefund]);

  // Get auction state for a listing
  const getAuctionState = useCallback((listingId: string): AuctionState[string] | null => {
    return auctionState[listingId] || null;
  }, [auctionState]);

  // Get bid history for a listing
  const getBidHistory = useCallback((listingId: string): AuctionBidRecord[] => {
    return auctionState[listingId]?.bids || [];
  }, [auctionState]);

  // Get user's active bids
  const getUserActiveBids = useCallback((username: string): AuctionBidRecord[] => {
    const userBids: AuctionBidRecord[] = [];
    
    Object.values(auctionState).forEach(auction => {
      const userBid = auction.bids
        .filter(b => b.bidder === username && !b.refunded)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (userBid) {
        userBids.push(userBid);
      }
    });

    return userBids;
  }, [auctionState]);

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

export const useAuction = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within AuctionProvider');
  }
  return context;
};