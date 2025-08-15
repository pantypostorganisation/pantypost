// src/context/AuctionContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';
import { apiCall, ApiResponse } from '@/services/api.config';

export interface Bid {
  id: string;
  bidder: string;
  amount: number;
  timestamp: string;
  isWinning?: boolean;
}

export interface AuctionData {
  id: string;
  listingId: string;
  seller: string;
  startingPrice: number;
  currentBid: number;
  highestBidder?: string;
  previousBidder?: string;
  endTime: string;
  bids: Bid[];
  status: 'active' | 'ended' | 'cancelled';
  winnerId?: string;
  finalPrice?: number;
}

interface AuctionContextType {
  // Auction state
  auctions: Record<string, AuctionData>;
  activeAuctions: AuctionData[];
  userBids: Record<string, Bid[]>; // Bids by user
  
  // Auction actions
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  cancelAuction: (listingId: string) => Promise<boolean>;
  endAuction: (listingId: string) => Promise<boolean>;
  processEndedAuction: (listing: any) => Promise<boolean>;
  getAuctionByListingId: (listingId: string) => AuctionData | null;
  getUserBidsForAuction: (listingId: string, username: string) => Bid[];
  isUserHighestBidder: (listingId: string, username: string) => boolean;
  
  // Loading states
  isPlacingBid: boolean;
  isCancellingAuction: boolean;
  isLoadingAuctions: boolean;
  
  // Error handling
  bidError: string | null;
  clearBidError: () => void;
  
  // Real-time updates
  subscribeToAuction: (listingId: string) => void;
  unsubscribeFromAuction: (listingId: string) => void;
}

const AuctionContext = createContext<AuctionContextType | null>(null);

export function AuctionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Fix: Handle nullable WebSocket context
  const wsContext = useWebSocket();
  const subscribe = wsContext?.subscribe || (() => () => {});
  const isConnected = wsContext?.isConnected || false;
  
  const [auctions, setAuctions] = useState<Record<string, AuctionData>>({});
  const [userBids, setUserBids] = useState<Record<string, Bid[]>>({});
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isCancellingAuction, setIsCancellingAuction] = useState(false);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  
  // Get active auctions
  const activeAuctions = Object.values(auctions).filter(
    auction => auction.status === 'active'
  );

  // Clear bid error
  const clearBidError = useCallback(() => {
    setBidError(null);
  }, []);

  // Helper function to refresh ONLY current user's wallet balance
  const refreshCurrentUserBalance = useCallback(async () => {
    if (!user) return;
    
    try {
      // Only fetch balance for the current user - this is allowed
      const response = await apiCall<any>(`/wallet/balance/${user.username}`);
      
      if (response.success && response.data) {
        const newBalance = response.data.balance || 0;
        
        // Fire wallet update event for current user
        if (typeof window !== 'undefined') {
          console.log(`[AuctionContext] Current user balance updated: $${newBalance}`);
          
          // Fire generic balance update event
          window.dispatchEvent(new CustomEvent('wallet:balance_update', {
            detail: { 
              username: user.username,
              role: user.role,
              balance: newBalance,
              newBalance: newBalance,
              timestamp: Date.now()
            }
          }));
          
          // Fire role-specific event
          const roleEvent = user.role === 'buyer' ? 'wallet:buyer-balance-updated' : 'wallet:seller-balance-updated';
          window.dispatchEvent(new CustomEvent(roleEvent, {
            detail: { 
              username: user.username,
              balance: newBalance,
              timestamp: Date.now()
            }
          }));
        }
      }
    } catch (error) {
      console.error(`[AuctionContext] Error refreshing current user balance:`, error);
    }
  }, [user]);

  // Update auction with new bid - Enhanced to track previous bidder
  const updateAuctionWithBid = useCallback((listingId: string, bidData: any) => {
    // Handle the actual WebSocket data structure
    const bid: Bid = {
      id: `bid_${Date.now()}`,
      bidder: bidData.bidder || bidData.username,
      amount: bidData.amount || bidData.bid?.amount || 0,
      timestamp: bidData.timestamp || new Date().toISOString(),
      isWinning: true
    };

    console.log('[AuctionContext] Processing bid update:', { listingId, bid });

    // Track the previous highest bidder before updating
    let previousHighestBidder: string | undefined;
    
    setAuctions(prev => {
      const existingAuction = prev[listingId];
      previousHighestBidder = existingAuction?.highestBidder;
      
      return {
        ...prev,
        [listingId]: {
          ...existingAuction,
          listingId,
          id: listingId,
          seller: existingAuction?.seller || '',
          startingPrice: existingAuction?.startingPrice || 0,
          currentBid: bid.amount,
          highestBidder: bid.bidder,
          previousBidder: previousHighestBidder,
          endTime: existingAuction?.endTime || '',
          status: existingAuction?.status || 'active',
          bids: [...(existingAuction?.bids || []), bid].sort(
            (a, b) => b.amount - a.amount
          )
        }
      };
    });

    // Update user bids
    setUserBids(prev => ({
      ...prev,
      [bid.bidder]: [...(prev[bid.bidder] || []), bid]
    }));
    
    // Return the previous bidder so we can handle updates
    return previousHighestBidder;
  }, []);

  // Update auction status
  const updateAuctionStatus = useCallback((
    listingId: string, 
    status: 'ended' | 'cancelled',
    winnerId?: string,
    finalPrice?: number
  ) => {
    setAuctions(prev => {
      const existingAuction = prev[listingId];
      
      return {
        ...prev,
        [listingId]: {
          ...existingAuction,
          listingId,
          id: listingId,
          seller: existingAuction?.seller || '',
          startingPrice: existingAuction?.startingPrice || 0,
          currentBid: existingAuction?.currentBid || 0,
          endTime: existingAuction?.endTime || '',
          bids: existingAuction?.bids || [],
          status,
          ...(winnerId && { winnerId }),
          ...(finalPrice && { finalPrice })
        }
      };
    });
  }, []);

  // Load auctions on mount
  useEffect(() => {
    const loadAuctions = async () => {
      if (!user) return;
      
      setIsLoadingAuctions(true);
      try {
        // TODO: Replace with actual API call when endpoint exists
        console.log('[AuctionContext] Loading auctions...');
        // const response = await apiCall<any>('/auctions');
        // if (response.success) {
        //   setAuctions(response.data);
        // }
      } catch (error) {
        console.error('[AuctionContext] Error loading auctions:', error);
      } finally {
        setIsLoadingAuctions(false);
      }
    };

    loadAuctions();
  }, [user]);

  // Subscribe to WebSocket updates for auctions
  useEffect(() => {
    if (!isConnected || !subscribe) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to auction bid events
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_BID, async (data: any) => {
        console.log('[AuctionContext] New bid received:', data);
        
        // Extract listing ID and bid data from the WebSocket event
        const listingId = data.listingId || data.id;
        if (listingId) {
          // Update auction and get the previous bidder
          const previousBidder = updateAuctionWithBid(listingId, data);
          
          // Only refresh balance if current user is involved
          if (user && data.bidder === user.username) {
            // Current user placed a bid - refresh their balance
            await refreshCurrentUserBalance();
          }
          
          // Note: We don't try to refresh the outbid user's balance here
          // The backend will send a wallet:balance_update or wallet:refund event for them
        }
      })
    );

    // Subscribe to wallet:refund events (for when current user is outbid)
    unsubscribers.push(
      subscribe('wallet:refund' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] Wallet refund received:', data);
        
        // If this refund is for the current user, refresh their balance
        if (user && data.username === user.username) {
          console.log('[AuctionContext] Current user was refunded, refreshing balance');
          await refreshCurrentUserBalance();
        }
      })
    );

    // Subscribe to wallet:balance_update events
    unsubscribers.push(
      subscribe('wallet:balance_update' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] Balance update received:', data);
        
        // If this is for the current user and has a balance value, update UI
        if (user && data.username === user.username && typeof data.newBalance === 'number') {
          // Fire events to update the UI
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wallet:balance_update', {
              detail: { 
                username: user.username,
                role: user.role,
                balance: data.newBalance,
                newBalance: data.newBalance,
                timestamp: Date.now()
              }
            }));
            
            const roleEvent = user.role === 'buyer' ? 'wallet:buyer-balance-updated' : 'wallet:seller-balance-updated';
            window.dispatchEvent(new CustomEvent(roleEvent, {
              detail: { 
                username: user.username,
                balance: data.newBalance,
                timestamp: Date.now()
              }
            }));
          }
        }
      })
    );

    // Subscribe to auction:outbid events
    unsubscribers.push(
      subscribe('auction:outbid' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] User was outbid:', data);
        
        // If current user was outbid, they should get a refund
        // The backend will handle this and send a wallet:refund event
        // We just show a notification here if needed
        if (user && data.username === user.username) {
          console.log('[AuctionContext] Current user was outbid on', data.listingTitle);
          // You could show a notification here
        }
      })
    );

    // Subscribe to auction ended events
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_ENDED, async (data: any) => {
        console.log('[AuctionContext] Auction ended:', data);
        const listingId = data.listingId || data.id;
        if (listingId) {
          updateAuctionStatus(listingId, 'ended', data.winnerId || data.winner, data.finalPrice || data.finalBid);
          
          // If current user is the winner, refresh their balance
          if (user && (data.winnerId === user.username || data.winner === user.username)) {
            await refreshCurrentUserBalance();
          }
        }
      })
    );

    // Subscribe to auction cancelled events
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_CANCELLED, async (data: any) => {
        console.log('[AuctionContext] Auction cancelled:', data);
        const listingId = data.listingId || data.id;
        if (listingId) {
          const auction = auctions[listingId];
          updateAuctionStatus(listingId, 'cancelled');
          
          // If current user was highest bidder, refresh their balance (they get refunded)
          if (user && auction?.highestBidder === user.username) {
            await refreshCurrentUserBalance();
          }
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe, updateAuctionWithBid, updateAuctionStatus, user, refreshCurrentUserBalance, auctions]);

  // Place a bid - Using apiCall from api.config
  const placeBid = useCallback(async (
    listingId: string,
    bidder: string, 
    amount: number
  ): Promise<boolean> => {
    if (!user) {
      setBidError('You must be logged in to bid');
      return false;
    }

    setIsPlacingBid(true);
    setBidError(null);

    try {
      // Use apiCall which handles auth properly
      const response = await apiCall<any>(`/listings/${listingId}/bid`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });

      if (response.success) {
        // Update will come through WebSocket
        console.log('[AuctionContext] Bid placed successfully:', response.data?.message || 'Success');
        
        // Also update local state immediately for better UX
        updateAuctionWithBid(listingId, {
          bidder: bidder,
          amount: amount,
          timestamp: new Date().toISOString()
        });
        
        // Refresh current user's balance (they placed the bid)
        await refreshCurrentUserBalance();
        
        return true;
      } else {
        // Extract error message string from ApiError object
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Failed to place bid';
        setBidError(errorMsg);
        console.error('[AuctionContext] Bid failed:', errorMsg);
        return false;
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Network error while placing bid';
      setBidError(errorMsg);
      console.error('[AuctionContext] Bid error:', error);
      return false;
    } finally {
      setIsPlacingBid(false);
    }
  }, [user, updateAuctionWithBid, refreshCurrentUserBalance]);

  // Cancel auction (seller only) - Using apiCall
  const cancelAuction = useCallback(async (
    listingId: string
  ): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsCancellingAuction(true);

    try {
      const response = await apiCall<any>(`/listings/${listingId}/cancel-auction`, {
        method: 'POST',
      });

      if (response.success) {
        // Update will come through WebSocket
        return true;
      } else {
        console.error('[AuctionContext] Cancel auction failed:', response.error);
        return false;
      }
    } catch (error: any) {
      console.error('[AuctionContext] Cancel auction error:', error);
      return false;
    } finally {
      setIsCancellingAuction(false);
    }
  }, [user]);

  // End auction (admin/system only) - Using apiCall
  const endAuction = useCallback(async (
    listingId: string
  ): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      return false;
    }

    try {
      const response = await apiCall<any>(`/listings/${listingId}/end-auction`, {
        method: 'POST',
      });

      if (response.success) {
        return true;
      } else {
        console.error('[AuctionContext] End auction failed:', response.error);
        return false;
      }
    } catch (error: any) {
      console.error('[AuctionContext] End auction error:', error);
      return false;
    }
  }, [user]);

  // Process ended auction
  const processEndedAuction = useCallback(async (listing: any): Promise<boolean> => {
    if (!listing.auction) return false;
    
    try {
      // If there's a highest bidder, process the sale
      if (listing.auction.highestBidder && listing.auction.highestBid) {
        // Call backend to process auction completion
        const response = await apiCall<any>(`/listings/${listing.id}/end-auction`, {
          method: 'POST',
        });

        if (response.success) {
          // Update auction status
          updateAuctionStatus(listing.id, 'ended', listing.auction.highestBidder, listing.auction.highestBid);
          return true;
        }
      } else {
        // No bids - just mark as ended
        const response = await apiCall<any>(`/listings/${listing.id}/end-auction`, {
          method: 'POST',
        });
        
        if (response.success) {
          updateAuctionStatus(listing.id, 'ended');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[AuctionContext] Error processing ended auction:', error);
      return false;
    }
  }, [updateAuctionStatus]);

  // Get auction by listing ID
  const getAuctionByListingId = useCallback((listingId: string): AuctionData | null => {
    return auctions[listingId] || null;
  }, [auctions]);

  // Get user's bids for an auction
  const getUserBidsForAuction = useCallback((listingId: string, username: string): Bid[] => {
    const auction = auctions[listingId];
    if (!auction) return [];
    
    return auction.bids.filter(bid => bid.bidder === username);
  }, [auctions]);

  // Check if user is highest bidder
  const isUserHighestBidder = useCallback((listingId: string, username: string): boolean => {
    const auction = auctions[listingId];
    return auction?.highestBidder === username;
  }, [auctions]);

  // Subscribe to auction updates
  const subscribeToAuction = useCallback((listingId: string) => {
    if (!isConnected) return;
    
    // Send subscription message via WebSocket
    console.log('[AuctionContext] Subscribing to auction:', listingId);
    // TODO: Implement WebSocket subscription
  }, [isConnected]);

  // Unsubscribe from auction updates
  const unsubscribeFromAuction = useCallback((listingId: string) => {
    if (!isConnected) return;
    
    console.log('[AuctionContext] Unsubscribing from auction:', listingId);
    // TODO: Implement WebSocket unsubscription
  }, [isConnected]);

  const value: AuctionContextType = {
    auctions,
    activeAuctions,
    userBids,
    placeBid,
    cancelAuction,
    endAuction,
    processEndedAuction,
    getAuctionByListingId,
    getUserBidsForAuction,
    isUserHighestBidder,
    isPlacingBid,
    isCancellingAuction,
    isLoadingAuctions,
    bidError,
    clearBidError,
    subscribeToAuction,
    unsubscribeFromAuction,
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