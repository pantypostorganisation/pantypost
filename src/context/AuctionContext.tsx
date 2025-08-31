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
  reservePrice?: number;
  currentBid: number;
  highestBidder?: string;
  previousBidder?: string;
  endTime: string;
  bids: Bid[];
  status: 'active' | 'ended' | 'cancelled' | 'reserve_not_met';
  winnerId?: string;
  finalPrice?: number;
  reserveMet?: boolean;
}

interface AuctionContextType {
  // Auction state
  auctions: Record<string, AuctionData>;
  activeAuctions: AuctionData[];
  userBids: Record<string, Bid[]>;
  
  // Auction actions
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  cancelAuction: (listingId: string) => Promise<boolean>;
  endAuction: (listingId: string) => Promise<boolean>;
  processEndedAuction: (listing: any) => Promise<boolean>;
  getAuctionByListingId: (listingId: string) => AuctionData | null;
  getUserBidsForAuction: (listingId: string, username: string) => Bid[];
  isUserHighestBidder: (listingId: string, username: string) => boolean;
  checkReserveMet: (listingId: string) => boolean;
  
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
  
  const wsContext = useWebSocket();
  const subscribe = wsContext?.subscribe || (() => () => {});
  const isConnected = wsContext?.isConnected || false;
  
  const [auctions, setAuctions] = useState<Record<string, AuctionData>>({});
  const [userBids, setUserBids] = useState<Record<string, Bid[]>>({});
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isCancellingAuction, setIsCancellingAuction] = useState(false);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  
  const activeAuctions = Object.values(auctions).filter(
    auction => auction.status === 'active'
  );

  const clearBidError = useCallback(() => {
    setBidError(null);
  }, []);

  const refreshCurrentUserBalance = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await apiCall<any>(`/wallet/balance/${user.username}`);
      
      if (response.success && response.data) {
        const newBalance = response.data.balance || 0;
        
        if (typeof window !== 'undefined') {
          console.log(`[AuctionContext] Current user balance updated: $${newBalance}`);
          
          window.dispatchEvent(new CustomEvent('wallet:balance_update', {
            detail: { 
              username: user.username,
              role: user.role,
              balance: newBalance,
              newBalance: newBalance,
              timestamp: Date.now()
            }
          }));
          
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

  const updateAuctionWithBid = useCallback((listingId: string, bidData: any) => {
    const bid: Bid = {
      id: `bid_${Date.now()}`,
      bidder: bidData.bidder || bidData.username,
      amount: bidData.amount || bidData.bid?.amount || 0,
      timestamp: bidData.timestamp || new Date().toISOString(),
      isWinning: true
    };

    console.log('[AuctionContext] Processing bid update:', { listingId, bid });

    let previousHighestBidder: string | undefined;
    
    setAuctions(prev => {
      const existingAuction = prev[listingId];
      previousHighestBidder = existingAuction?.highestBidder;
      
      const reserveMet = existingAuction?.reservePrice ? 
        bid.amount >= existingAuction.reservePrice : true;
      
      return {
        ...prev,
        [listingId]: {
          ...existingAuction,
          listingId,
          id: listingId,
          seller: existingAuction?.seller || '',
          startingPrice: existingAuction?.startingPrice || 0,
          reservePrice: existingAuction?.reservePrice,
          currentBid: bid.amount,
          highestBidder: bid.bidder,
          previousBidder: previousHighestBidder,
          endTime: existingAuction?.endTime || '',
          status: existingAuction?.status || 'active',
          reserveMet,
          bids: [...(existingAuction?.bids || []), bid].sort(
            (a, b) => b.amount - a.amount
          )
        }
      };
    });

    setUserBids(prev => ({
      ...prev,
      [bid.bidder]: [...(prev[bid.bidder] || []), bid]
    }));
    
    return previousHighestBidder;
  }, []);

  const updateAuctionStatus = useCallback((
    listingId: string, 
    status: 'ended' | 'cancelled' | 'reserve_not_met',
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
          reservePrice: existingAuction?.reservePrice,
          currentBid: existingAuction?.currentBid || 0,
          endTime: existingAuction?.endTime || '',
          bids: existingAuction?.bids || [],
          status,
          ...(winnerId && { winnerId }),
          ...(finalPrice && { finalPrice }),
          reserveMet: status === 'reserve_not_met' ? false : existingAuction?.reserveMet
        }
      };
    });
  }, []);

  const checkReserveMet = useCallback((listingId: string): boolean => {
    const auction = auctions[listingId];
    if (!auction || !auction.reservePrice) return true;
    return auction.currentBid >= auction.reservePrice;
  }, [auctions]);

  useEffect(() => {
    const loadAuctions = async () => {
      if (!user) return;
      
      setIsLoadingAuctions(true);
      try {
        console.log('[AuctionContext] Loading auctions...');
      } catch (error) {
        console.error('[AuctionContext] Error loading auctions:', error);
      } finally {
        setIsLoadingAuctions(false);
      }
    };

    loadAuctions();
  }, [user]);

  useEffect(() => {
    if (!isConnected || !subscribe) return;

    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_BID, async (data: any) => {
        console.log('[AuctionContext] New bid received:', data);
        
        const listingId = data.listingId || data.id;
        if (listingId) {
          const previousBidder = updateAuctionWithBid(listingId, data);
          
          if (user && data.bidder === user.username) {
            await refreshCurrentUserBalance();
          }
        }
      })
    );

    unsubscribers.push(
      subscribe('wallet:refund' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] Wallet refund received:', data);
        
        if (user && data.username === user.username) {
          console.log('[AuctionContext] Current user was refunded, refreshing balance');
          await refreshCurrentUserBalance();
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wallet:user-refunded', {
              detail: { 
                username: user.username,
                amount: data.amount,
                listingId: data.listingId,
                balance: data.balance,
                reason: data.reason,
                timestamp: Date.now()
              }
            }));
          }
        }
      })
    );

    unsubscribers.push(
      subscribe('wallet:balance_update' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] Balance update received:', data);
        
        if (user && data.username === user.username && typeof data.newBalance === 'number') {
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
            
            window.dispatchEvent(new CustomEvent('auction:check-bid-status', {
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

    unsubscribers.push(
      subscribe('auction:outbid' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] User was outbid:', data);
        
        if (user && data.username === user.username) {
          console.log('[AuctionContext] Current user was outbid on', data.listingTitle);
        }
      })
    );

    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_ENDED, async (data: any) => {
        console.log('[AuctionContext] Auction ended:', data);
        const listingId = data.listingId || data.id;
        if (listingId) {
          const status = data.status || 'ended';
          
          if (status === 'reserve_not_met') {
            updateAuctionStatus(listingId, 'reserve_not_met');
            
            const auction = auctions[listingId];
            if (user && auction?.highestBidder === user.username) {
              console.log('[AuctionContext] Reserve not met, user will be refunded');
            }
          } else {
            updateAuctionStatus(listingId, 'ended', data.winnerId || data.winner, data.finalPrice || data.finalBid);
            
            if (user && (data.winnerId === user.username || data.winner === user.username)) {
              await refreshCurrentUserBalance();
            }
          }
        }
      })
    );

    unsubscribers.push(
      subscribe('auction:reserve_not_met' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] Auction reserve not met:', data);
        const listingId = data.listingId || data.id;
        if (listingId) {
          updateAuctionStatus(listingId, 'reserve_not_met');
          
          const auction = auctions[listingId];
          if (user && auction?.highestBidder === user.username) {
            console.log('[AuctionContext] User was highest bidder, awaiting refund for reserve not met');
          }
        }
      })
    );

    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_CANCELLED, async (data: any) => {
        console.log('[AuctionContext] Auction cancelled:', data);
        const listingId = data.listingId || data.id;
        if (listingId) {
          const auction = auctions[listingId];
          updateAuctionStatus(listingId, 'cancelled');
          
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
      const response = await apiCall<any>(`/listings/${listingId}/bid`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });

      if (response.success) {
        console.log('[AuctionContext] Bid placed successfully:', response.data?.message || 'Success');
        
        updateAuctionWithBid(listingId, {
          bidder: bidder,
          amount: amount,
          timestamp: new Date().toISOString()
        });
        
        const auction = auctions[listingId];
        if (auction?.reservePrice && amount < auction.reservePrice) {
          console.log('[AuctionContext] Bid placed but reserve price not yet met');
        }
        
        await refreshCurrentUserBalance();
        
        return true;
      } else {
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
  }, [user, updateAuctionWithBid, refreshCurrentUserBalance, auctions]);

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

  // FIXED: Process ended auction - handle already processed auctions gracefully
  const processEndedAuction = useCallback(async (listing: any): Promise<boolean> => {
    if (!listing.auction) return false;
    
    try {
      // Call backend to process auction completion
      const response = await apiCall<any>(`/listings/${listing.id}/end-auction`, {
        method: 'POST',
      });

      if (response.success) {
        // Check if it was already processed (backend returns success with alreadyProcessed flag)
        if (response.data?.alreadyProcessed) {
          console.log('[AuctionContext] Auction was already processed:', response.data.status);
          
          // Update status based on the already-processed status
          const status = response.data.status || 'ended';
          if (status === 'reserve_not_met') {
            updateAuctionStatus(listing.id, 'reserve_not_met');
          } else if (status === 'ended' || status === 'sold') {
            updateAuctionStatus(listing.id, 'ended', listing.auction.highestBidder, listing.auction.highestBid);
          }
          
          return true; // Return true since it's handled (even if already processed)
        }
        
        // Not already processed - update status based on response
        const status = response.data?.status || 'ended';
        if (status === 'reserve_not_met') {
          updateAuctionStatus(listing.id, 'reserve_not_met');
        } else if (listing.auction.highestBidder && listing.auction.highestBid) {
          updateAuctionStatus(listing.id, 'ended', listing.auction.highestBidder, listing.auction.highestBid);
        } else {
          updateAuctionStatus(listing.id, 'ended');
        }
        
        return true;
      }
      
      // FIXED: Check if error is about auction not being active (already processed)
      if (response.error?.message?.includes('Auction is not active') || 
          response.error?.message?.includes('already processed')) {
        console.log('[AuctionContext] Auction already processed, ignoring error');
        
        // Update status to ended since it's already been processed
        updateAuctionStatus(listing.id, 'ended');
        return true; // Return true to indicate it's handled
      }
      
      console.error('[AuctionContext] Failed to process ended auction:', response.error);
      return false;
    } catch (error: any) {
      // FIXED: Check if error message indicates already processed
      if (error.message?.includes('Auction is not active') || 
          error.message?.includes('already processed')) {
        console.log('[AuctionContext] Auction already processed (from catch), ignoring error');
        updateAuctionStatus(listing.id, 'ended');
        return true;
      }
      
      console.error('[AuctionContext] Error processing ended auction:', error);
      return false;
    }
  }, [updateAuctionStatus]);

  const getAuctionByListingId = useCallback((listingId: string): AuctionData | null => {
    return auctions[listingId] || null;
  }, [auctions]);

  const getUserBidsForAuction = useCallback((listingId: string, username: string): Bid[] => {
    const auction = auctions[listingId];
    if (!auction) return [];
    
    return auction.bids.filter(bid => bid.bidder === username);
  }, [auctions]);

  const isUserHighestBidder = useCallback((listingId: string, username: string): boolean => {
    const auction = auctions[listingId];
    return auction?.highestBidder === username;
  }, [auctions]);

  const subscribeToAuction = useCallback((listingId: string) => {
    if (!isConnected) return;
    
    console.log('[AuctionContext] Subscribing to auction:', listingId);
  }, [isConnected]);

  const unsubscribeFromAuction = useCallback((listingId: string) => {
    if (!isConnected) return;
    
    console.log('[AuctionContext] Unsubscribing from auction:', listingId);
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
    checkReserveMet,
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