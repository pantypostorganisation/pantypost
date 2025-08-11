// src/context/AuctionContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';

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

// API base URL - using same as AuthContext
const API_BASE_URL = 'http://localhost:5000/api';

// Fetch wrapper with auth
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data;
}

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

  // Update auction with new bid
  const updateAuctionWithBid = useCallback((listingId: string, bid: Bid) => {
    setAuctions(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        currentBid: bid.amount,
        highestBidder: bid.bidder,
        bids: [...(prev[listingId]?.bids || []), bid].sort(
          (a, b) => b.amount - a.amount
        )
      }
    }));

    // Update user bids
    setUserBids(prev => ({
      ...prev,
      [bid.bidder]: [...(prev[bid.bidder] || []), bid]
    }));
  }, []);

  // Update auction status
  const updateAuctionStatus = useCallback((
    listingId: string, 
    status: 'ended' | 'cancelled',
    winnerId?: string,
    finalPrice?: number
  ) => {
    setAuctions(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        status,
        ...(winnerId && { winnerId }),
        ...(finalPrice && { finalPrice })
      }
    }));
  }, []);

  // Load auctions on mount
  useEffect(() => {
    const loadAuctions = async () => {
      if (!user) return;
      
      setIsLoadingAuctions(true);
      try {
        // TODO: Replace with actual API call
        console.log('[AuctionContext] Loading auctions...');
        // const response = await fetchWithAuth('/auctions');
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
      subscribe(WebSocketEvent.AUCTION_BID, (data: any) => {
        console.log('[AuctionContext] New bid received:', data);
        updateAuctionWithBid(data.listingId, data.bid);
      })
    );

    // Subscribe to auction ended events
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_ENDED, (data: any) => {
        console.log('[AuctionContext] Auction ended:', data);
        updateAuctionStatus(data.listingId, 'ended', data.winnerId, data.finalPrice);
      })
    );

    // Subscribe to auction cancelled events
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_CANCELLED, (data: any) => {
        console.log('[AuctionContext] Auction cancelled:', data);
        updateAuctionStatus(data.listingId, 'cancelled');
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe, updateAuctionWithBid, updateAuctionStatus]);

  // Place a bid
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
      const response = await fetchWithAuth(`/auctions/${listingId}/bid`, {
        method: 'POST',
        body: JSON.stringify({ bidder, amount }),
      });

      if (response.success) {
        // Update will come through WebSocket
        return true;
      } else {
        const error = response.error?.message || 'Failed to place bid';
        setBidError(error);
        return false;
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Network error while placing bid';
      setBidError(errorMsg);
      return false;
    } finally {
      setIsPlacingBid(false);
    }
  }, [user]);

  // Cancel auction (seller only)
  const cancelAuction = useCallback(async (
    listingId: string
  ): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsCancellingAuction(true);

    try {
      const response = await fetchWithAuth(`/auctions/${listingId}/cancel`, {
        method: 'POST',
      });

      if (response.success) {
        // Update will come through WebSocket
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    } finally {
      setIsCancellingAuction(false);
    }
  }, [user]);

  // End auction (admin/system only)
  const endAuction = useCallback(async (
    listingId: string
  ): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      return false;
    }

    try {
      const response = await fetchWithAuth(`/auctions/${listingId}/end`, {
        method: 'POST',
      });

      if (response.success) {
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }, [user]);

  // Process ended auction
  const processEndedAuction = useCallback(async (listing: any): Promise<boolean> => {
    if (!listing.auction) return false;
    
    try {
      // If there's a highest bidder, process the sale
      if (listing.auction.highestBidder && listing.auction.highestBid) {
        // TODO: Call backend to process auction completion
        const response = await fetchWithAuth(`/auctions/${listing.id}/complete`, {
          method: 'POST',
          body: JSON.stringify({
            winner: listing.auction.highestBidder,
            finalPrice: listing.auction.highestBid
          }),
        });

        if (response.success) {
          // Update auction status
          updateAuctionStatus(listing.id, 'ended', listing.auction.highestBidder, listing.auction.highestBid);
          return true;
        }
      } else {
        // No bids - just mark as ended
        updateAuctionStatus(listing.id, 'ended');
        return true;
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