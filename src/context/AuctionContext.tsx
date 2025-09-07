// src/context/AuctionContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';
import { apiCall } from '@/services/api.config';
import { z } from 'zod';
import { getRateLimiter } from '@/utils/security/rate-limiter';
import { isAdmin } from '@/utils/security/permissions';

// -----------------------------
// Types
// -----------------------------
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

// -----------------------------
// Validation Schemas (Zod)
// -----------------------------
const BidEventSchema = z.object({
  listingId: z.string().min(1).optional(),
  id: z.string().optional(),
  bidder: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  amount: z.number().finite().nonnegative().optional(),
  bid: z
    .object({
      amount: z.number().finite().nonnegative(),
    })
    .optional(),
  timestamp: z.string().optional(),
});

const RefundEventSchema = z.object({
  username: z.string().min(1),
  amount: z.number().finite().nonnegative(),
  listingId: z.string().min(1).optional(),
  balance: z.number().finite().nonnegative().optional(),
  reason: z.string().optional(),
});

const BalanceUpdateEventSchema = z.object({
  username: z.string().min(1),
  newBalance: z.number().finite(),
  role: z.string().optional(),
});

const AuctionEndedEventSchema = z.object({
  listingId: z.string().optional(),
  id: z.string().optional(),
  status: z.enum(['ended', 'cancelled', 'reserve_not_met']).optional(),
  winnerId: z.string().optional(),
  winner: z.string().optional(),
  finalPrice: z.number().optional(),
  finalBid: z.number().optional(),
});

// -----------------------------
// Utilities
// -----------------------------
function makeBidId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `bid_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

function coerceNumber(n: unknown, fallback = 0): number {
  const v = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

// Local, safe defaults for bid spam protection
const BID_LIMIT = {
  maxAttempts: 5,
  windowMs: 10_000,
  blockDuration: 10_000,
};

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

  // Keep a ref to latest auctions to avoid effect dependency churn
  const auctionsRef = useRef(auctions);
  useEffect(() => {
    auctionsRef.current = auctions;
  }, [auctions]);

  const activeAuctions = useMemo(
    () => Object.values(auctions).filter((a) => a.status === 'active'),
    [auctions]
  );

  const clearBidError = useCallback(() => {
    setBidError(null);
  }, []);

  const refreshCurrentUserBalance = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiCall<any>(`/wallet/balance/${user.username}`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        const newBalance = response.data.balance || 0;

        if (typeof window !== 'undefined') {
          console.log(`[AuctionContext] Current user balance updated: $${newBalance}`);

          window.dispatchEvent(
            new CustomEvent('wallet:balance_update', {
              detail: {
                username: user.username,
                role: user.role,
                balance: newBalance,
                newBalance: newBalance,
                timestamp: Date.now(),
              },
            })
          );

          const roleEvent =
            user.role === 'buyer' ? 'wallet:buyer-balance-updated' : 'wallet:seller-balance-updated';
          window.dispatchEvent(
            new CustomEvent(roleEvent, {
              detail: {
                username: user.username,
                balance: newBalance,
                timestamp: Date.now(),
              },
            })
          );
        }
      }
    } catch (error) {
      console.error(`[AuctionContext] Error refreshing current user balance:`, error);
    }
  }, [user]);

  const updateAuctionWithBid = useCallback((listingId: string, rawData: unknown) => {
    const parsed = BidEventSchema.safeParse(rawData);
    if (!parsed.success) {
      console.warn('[AuctionContext] Ignoring malformed bid event', parsed.error?.flatten());
      return undefined as unknown as string | undefined;
    }
    const data = parsed.data;

    const amount =
      typeof data.amount === 'number'
        ? data.amount
        : coerceNumber(data.bid?.amount, 0);

    const bidder = (data.bidder || data.username || '').trim();
    if (!listingId || !bidder || !Number.isFinite(amount)) {
      console.warn('[AuctionContext] Incomplete bid payload; skipping update');
      return undefined as unknown as string | undefined;
    }

    const bid: Bid = {
      id: makeBidId(),
      bidder,
      amount,
      timestamp: data.timestamp || new Date().toISOString(),
      isWinning: true,
    };

    console.log('[AuctionContext] Processing bid update:', { listingId, bid });

    let previousHighestBidder: string | undefined;

    setAuctions((prev) => {
      const existingAuction = prev[listingId];
      previousHighestBidder = existingAuction?.highestBidder;

      const reserveMet = existingAuction?.reservePrice
        ? bid.amount >= existingAuction.reservePrice
        : true;

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
          bids: [...(existingAuction?.bids || []), bid].sort((a, b) => b.amount - a.amount),
        },
      };
    });

    setUserBids((prev) => ({
      ...prev,
      [bid.bidder]: [...(prev[bid.bidder] || []), bid],
    }));

    return previousHighestBidder;
  }, []);

  const updateAuctionStatus = useCallback(
    (
      listingId: string,
      status: 'ended' | 'cancelled' | 'reserve_not_met',
      winnerId?: string,
      finalPrice?: number
    ) => {
      setAuctions((prev) => {
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
            ...(typeof finalPrice === 'number' && Number.isFinite(finalPrice) && { finalPrice }),
            reserveMet: status === 'reserve_not_met' ? false : existingAuction?.reserveMet,
          },
        };
      });
    },
    []
  );

  const checkReserveMet = useCallback(
    (listingId: string): boolean => {
      const auction = auctions[listingId];
      if (!auction || !auction.reservePrice) return true;
      return auction.currentBid >= auction.reservePrice;
    },
    [auctions]
  );

  // Initial load (kept minimal; extend if needed)
  useEffect(() => {
    const loadAuctions = async () => {
      if (!user) return;

      setIsLoadingAuctions(true);
      try {
        console.log('[AuctionContext] Loading auctions...');
        // (Intentionally left without fetching to avoid regressions)
      } catch (error) {
        console.error('[AuctionContext] Error loading auctions:', error);
      } finally {
        setIsLoadingAuctions(false);
      }
    };

    loadAuctions();
  }, [user]);

  // WebSocket subscriptions (stabilized: no dependency on auctions state)
  useEffect(() => {
    if (!isConnected || !subscribe) return;

    const unsubscribers: Array<() => void> = [];

    // New bid
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_BID, async (raw: unknown) => {
        const parsed = BidEventSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AuctionContext] Ignoring malformed AUCTION_BID', parsed.error?.flatten());
          return;
        }
        const data = parsed.data;
        const listingId = (data.listingId || data.id || '').toString();
        if (!listingId) return;

        updateAuctionWithBid(listingId, data);

        if (user && (data.bidder === user.username || data.username === user.username)) {
          await refreshCurrentUserBalance();
        }
      })
    );

    // Wallet refund
    unsubscribers.push(
      subscribe('wallet:refund' as WebSocketEvent, async (raw: unknown) => {
        const parsed = RefundEventSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AuctionContext] Ignoring malformed wallet:refund', parsed.error?.flatten());
          return;
        }
        const data = parsed.data;

        if (user && data.username === user.username) {
          console.log('[AuctionContext] Current user was refunded, refreshing balance');
          await refreshCurrentUserBalance();

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('wallet:user-refunded', {
                detail: {
                  username: user.username,
                  amount: data.amount,
                  listingId: data.listingId,
                  balance: data.balance,
                  reason: data.reason,
                  timestamp: Date.now(),
                },
              })
            );
          }
        }
      })
    );

    // Balance update passthrough (dedupe + fan-out)
    unsubscribers.push(
      subscribe('wallet:balance_update' as WebSocketEvent, async (raw: unknown) => {
        const parsed = BalanceUpdateEventSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AuctionContext] Ignoring malformed wallet:balance_update', parsed.error?.flatten());
          return;
        }
        const data = parsed.data;

        if (user && data.username === user.username && typeof data.newBalance === 'number') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('wallet:balance_update', {
                detail: {
                  username: user.username,
                  role: user.role,
                  balance: data.newBalance,
                  newBalance: data.newBalance,
                  timestamp: Date.now(),
                },
              })
            );

            const roleEvent =
              user.role === 'buyer'
                ? 'wallet:buyer-balance-updated'
                : 'wallet:seller-balance-updated';
            window.dispatchEvent(
              new CustomEvent(roleEvent, {
                detail: {
                  username: user.username,
                  balance: data.newBalance,
                  timestamp: Date.now(),
                },
              })
            );

            window.dispatchEvent(
              new CustomEvent('auction:check-bid-status', {
                detail: {
                  username: user.username,
                  balance: data.newBalance,
                  timestamp: Date.now(),
                },
              })
            );
          }
        }
      })
    );

    // Outbid notice (no-op other than logging for now)
    unsubscribers.push(
      subscribe('auction:outbid' as WebSocketEvent, async (data: any) => {
        console.log('[AuctionContext] User was outbid:', data);
        if (user && data?.username === user.username) {
          console.log('[AuctionContext] Current user was outbid on', data?.listingTitle);
        }
      })
    );

    // Auction ended
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_ENDED, async (raw: unknown) => {
        const parsed = AuctionEndedEventSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AuctionContext] Ignoring malformed AUCTION_ENDED', parsed.error?.flatten());
          return;
        }
        const data = parsed.data;

        const listingId = (data.listingId || data.id || '').toString();
        if (!listingId) return;

        const status = data.status || 'ended';

        if (status === 'reserve_not_met') {
          updateAuctionStatus(listingId, 'reserve_not_met');

          const auction = auctionsRef.current[listingId];
          if (user && auction?.highestBidder === user.username) {
            console.log('[AuctionContext] Reserve not met, user will be refunded');
          }
        } else {
          const winner = data.winnerId || data.winner;
          const final =
            typeof data.finalPrice === 'number'
              ? data.finalPrice
              : typeof data.finalBid === 'number'
              ? data.finalBid
              : undefined;

          updateAuctionStatus(listingId, 'ended', winner, final);

          if (user && winner === user.username) {
            await refreshCurrentUserBalance();
          }
        }
      })
    );

    // Reserve not met
    unsubscribers.push(
      subscribe('auction:reserve_not_met' as WebSocketEvent, async (raw: unknown) => {
        const parsed = AuctionEndedEventSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AuctionContext] Ignoring malformed auction:reserve_not_met', parsed.error?.flatten());
          return;
        }
        const data = parsed.data;

        const listingId = (data.listingId || data.id || '').toString();
        if (!listingId) return;

        updateAuctionStatus(listingId, 'reserve_not_met');

        const auction = auctionsRef.current[listingId];
        if (user && auction?.highestBidder === user.username) {
          console.log('[AuctionContext] User was highest bidder, awaiting refund for reserve not met');
        }
      })
    );

    // Cancelled
    unsubscribers.push(
      subscribe(WebSocketEvent.AUCTION_CANCELLED, async (raw: unknown) => {
        const parsed = AuctionEndedEventSchema.safeParse(raw);
        if (!parsed.success) {
          console.warn('[AuctionContext] Ignoring malformed AUCTION_CANCELLED', parsed.error?.flatten());
          return;
        }
        const data = parsed.data;

        const listingId = (data.listingId || data.id || '').toString();
        if (!listingId) return;

        const auction = auctionsRef.current[listingId];
        updateAuctionStatus(listingId, 'cancelled');

        if (user && auction?.highestBidder === user.username) {
          await refreshCurrentUserBalance();
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch {
          // swallow teardown errors
        }
      });
    };
  }, [isConnected, subscribe, updateAuctionWithBid, updateAuctionStatus, refreshCurrentUserBalance, user]);

  const placeBid = useCallback(
    async (listingId: string, bidder: string, amount: number): Promise<boolean> => {
      if (!user) {
        setBidError('You must be logged in to bid');
        return false;
      }

      // Gentle client-side rate limit against spam clicks
      try {
        const limiter = getRateLimiter(); // no args
        const key = `auction:bid:${user.username}`;
        limiter.check(key, {
          maxAttempts: BID_LIMIT.maxAttempts,
          windowMs: BID_LIMIT.windowMs,
          blockDuration: BID_LIMIT.blockDuration,
        });
      } catch {
        setBidError('Too many bid attempts. Please wait a moment.');
        return false;
      }

      // Coerce & validate amount
      const amt = coerceNumber(amount, NaN);
      if (!Number.isFinite(amt) || amt < 0) {
        setBidError('Invalid bid amount');
        return false;
      }

      // Ensure bidder matches logged-in user (UI safety)
      if (bidder && user.username && bidder !== user.username) {
        console.warn('[AuctionContext] Bidder mismatch; normalizing to current user');
      }

      setIsPlacingBid(true);
      setBidError(null);

      try {
        const response = await apiCall<any>(`/listings/${listingId}/bid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amt }),
        });

        if (response.success) {
          console.log('[AuctionContext] Bid placed successfully:', response.data?.message || 'Success');

          updateAuctionWithBid(listingId, {
            bidder: user.username,
            amount: amt,
            timestamp: new Date().toISOString(),
          });

          const auction = auctionsRef.current[listingId];
          if (auction?.reservePrice && amt < auction.reservePrice) {
            console.log('[AuctionContext] Bid placed but reserve price not yet met');
          }

          await refreshCurrentUserBalance();

          return true;
        } else {
          const errorMsg =
            typeof response.error === 'string'
              ? response.error
              : response.error?.message || 'Failed to place bid';
          setBidError(errorMsg);
          console.error('[AuctionContext] Bid failed:', errorMsg);
          return false;
        }
      } catch (error: any) {
        const errorMsg = error?.message || 'Network error while placing bid';
        setBidError(errorMsg);
        console.error('[AuctionContext] Bid error:', error);
        return false;
      } finally {
        setIsPlacingBid(false);
      }
    },
    [user, updateAuctionWithBid, refreshCurrentUserBalance]
  );

  const cancelAuction = useCallback(
    async (listingId: string): Promise<boolean> => {
      if (!user) return false;

      setIsCancellingAuction(true);

      try {
        const response = await apiCall<any>(`/listings/${listingId}/cancel-auction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    },
    [user]
  );

  const endAuction = useCallback(
    async (listingId: string): Promise<boolean> => {
      if (!user || !isAdmin(user)) {
        return false;
      }

      try {
        const response = await apiCall<any>(`/listings/${listingId}/end-auction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    },
    [user]
  );

  // Process ended auction - handle already processed auctions gracefully
  const processEndedAuction = useCallback(
    async (listing: any): Promise<boolean> => {
      if (!listing?.auction) return false;

      try {
        // Call backend to process auction completion
        const response = await apiCall<any>(`/listings/${listing.id}/end-auction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.success) {
          // Check if it was already processed (backend returns success with alreadyProcessed flag)
          const alreadyProcessed =
            response.data?.alreadyProcessed ||
            response.data?.data?.alreadyProcessed ||
            false;

          if (alreadyProcessed) {
            console.log('[AuctionContext] Auction was already processed:', response.data?.status);

            // Update status based on the already-processed status
            const status =
              response.data?.status || response.data?.data?.status || 'ended';
            if (status === 'reserve_not_met') {
              updateAuctionStatus(listing.id, 'reserve_not_met');
            } else if (listing.auction.highestBidder && listing.auction.highestBid) {
              updateAuctionStatus(
                listing.id,
                'ended',
                listing.auction.highestBidder,
                listing.auction.highestBid
              );
            } else {
              updateAuctionStatus(listing.id, 'ended');
            }

            return true; // handled
          }

          // Process the response data
          const responseData = response.data || {};

          // Check if order was created successfully
          const order = responseData.order || responseData.data?.order;
          if (order) {
            console.log('[AuctionContext] Order created successfully:', order);

            // Fire event for order creation
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('order:created', {
                  detail: { order },
                })
              );
            }
          }

          // Update status based on response
          const status = responseData.status || responseData.data?.status || 'ended';
          if (status === 'reserve_not_met') {
            updateAuctionStatus(listing.id, 'reserve_not_met');
          } else if (listing.auction.highestBidder && listing.auction.highestBid) {
            updateAuctionStatus(
              listing.id,
              'ended',
              listing.auction.highestBidder,
              listing.auction.highestBid
            );
          } else {
            updateAuctionStatus(listing.id, 'ended');
          }

          return true;
        }

        // Error path: treat known messages as already-processed
        const msg =
          (typeof response.error === 'string'
            ? response.error
            : response.error?.message || ''
          ).toLowerCase();

        if (
          msg.includes('auction is not active') ||
          msg.includes('already processed') ||
          msg.includes('auction already processed')
        ) {
          console.log('[AuctionContext] Auction already processed, treating as success');
          updateAuctionStatus(listing.id, 'ended');
          return true;
        }

        console.error('[AuctionContext] Failed to process ended auction:', response.error);
        return false;
      } catch (error: any) {
        const msg = (error?.message || '').toLowerCase();
        if (
          msg.includes('auction is not active') ||
          msg.includes('already processed') ||
          msg.includes('auction already processed')
        ) {
          console.log('[AuctionContext] Auction already processed (from catch), treating as success');
          updateAuctionStatus(listing.id, 'ended');
          return true;
        }

        console.error('[AuctionContext] Error processing ended auction:', error);
        return false;
      }
    },
    [updateAuctionStatus]
  );

  const getAuctionByListingId = useCallback(
    (listingId: string): AuctionData | null => auctions[listingId] || null,
    [auctions]
  );

  const getUserBidsForAuction = useCallback(
    (listingId: string, username: string): Bid[] => {
      const auction = auctions[listingId];
      if (!auction) return [];
      return auction.bids.filter((bid) => bid.bidder === username);
    },
    [auctions]
  );

  const isUserHighestBidder = useCallback(
    (listingId: string, username: string): boolean => {
      const auction = auctions[listingId];
      return auction?.highestBidder === username;
    },
    [auctions]
  );

  const subscribeToAuction = useCallback(
    (listingId: string) => {
      if (!isConnected) return;
      console.log('[AuctionContext] Subscribing to auction:', listingId);
      // Hook for future: if your WS supports rooms, join here.
    },
    [isConnected]
  );

  const unsubscribeFromAuction = useCallback(
    (listingId: string) => {
      if (!isConnected) return;
      console.log('[AuctionContext] Unsubscribing from auction:', listingId);
      // Hook for future: if your WS supports rooms, leave here.
    },
    [isConnected]
  );

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

  return <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>;
}

export function useAuction() {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuction must be used within AuctionProvider');
  }
  return context;
}
