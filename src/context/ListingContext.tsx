'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext';
import { useAuction } from './AuctionContext';
import { useWebSocket } from './WebSocketContext';
import { WebSocketEvent } from '@/types/websocket';
import type { Order } from '@/types/order';
import { v4 as uuidv4 } from 'uuid';
import { listingsService, usersService, storageService } from '@/services';
import { ListingDraft } from '@/types/myListings';
import { securityService, sanitize } from '@/services/security.service';
import { listingSchemas } from '@/utils/validation/schemas';

export type Role = 'buyer' | 'seller' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type VerificationDocs = {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
  code?: string;
};

export type Bid = {
  id: string;
  bidder: string;
  amount: number;
  date: string;
};

export type AuctionStatus = 'active' | 'ended' | 'cancelled' | 'reserve_not_met';

export type AuctionSettings = {
  isAuction: boolean;
  startingPrice: number;
  reservePrice?: number;
  endTime: string;
  bids: Bid[];
  highestBid?: number;
  highestBidder?: string;
  status: AuctionStatus;
  minimumIncrement?: number;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrls: string[];
  date: string;
  seller: string;

  isVerified?: boolean;
  isPremium?: boolean;
  isLocked?: boolean;
  tags?: string[];
  hoursWorn?: number;
  views?: number;

  auction?: AuctionSettings;
};

export type NewListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;
export type AddListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;

export type AuctionInput = {
  startingPrice: number;
  reservePrice?: number;
  endTime: string;
};

export type Notification = {
  id: string;
  message: string;
  timestamp: string;
  cleared: boolean;
};

export type NotificationItem = string | Notification;

type NotificationStore = Record<string, NotificationItem[]>;

interface SubscriptionData {
  seller: string;
  price: number;
  subscribedAt: string;
}

// ============ Sold-listing dedup manager (browser-safe timers) ============
class SoldListingDeduplicationManager {
  private processedListings: Map<string, number> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private expiryMs: number;

  constructor(expiryMs: number = 60_000) {
    this.expiryMs = expiryMs;
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];
      this.processedListings.forEach((timestamp, listingId) => {
        if (now - timestamp > this.expiryMs) expiredKeys.push(listingId);
      });
      expiredKeys.forEach((key) => this.processedListings.delete(key));
    }, 30_000);
  }

  isDuplicate(listingId: string): boolean {
    if (this.processedListings.has(listingId)) return true;
    this.processedListings.set(listingId, Date.now());
    return false;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.processedListings.clear();
  }
}

type ListingContextType = {
  isAuthReady: boolean;
  listings: Listing[];
  addListing: (listing: AddListingInput) => Promise<void>;
  addAuctionListing: (listing: AddListingInput, auctionSettings: AuctionInput) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  updateListing: (
    id: string,
    updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>
  ) => Promise<void>;
  purchaseListingAndRemove: (listing: Listing, buyerUsername: string) => Promise<boolean>;

  // Auction functions
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  getAuctionListings: () => Listing[];
  getActiveAuctions: () => Listing[];
  getEndedAuctions: () => Listing[];
  checkEndedAuctions: () => Promise<void>;
  cancelAuction: (listingId: string) => Promise<boolean>;

  // Draft functions
  saveDraft: (draft: ListingDraft) => Promise<boolean>;
  getDrafts: () => Promise<ListingDraft[]>;
  deleteDraft: (draftId: string) => Promise<boolean>;

  // Image functions
  uploadImage: (file: File) => Promise<string | null>;
  deleteImage: (imageUrl: string) => Promise<boolean>;

  subscriptions: { [buyer: string]: string[] };
  subscribeToSeller: (buyer: string, seller: string, price: number) => Promise<boolean>;
  unsubscribeFromSeller: (buyer: string, seller: string) => Promise<void>;
  isSubscribed: (buyer: string, seller: string) => boolean;

  // Notifications
  sellerNotifications: Notification[];
  addSellerNotification: (seller: string, message: string) => void;
  clearSellerNotification: (notificationId: string | number) => void;
  restoreSellerNotification: (notificationId: string) => void;
  permanentlyDeleteSellerNotification: (notificationId: string) => void;

  // Verification
  requestVerification: (docs: VerificationDocs) => Promise<void>;
  setVerificationStatus: (
    username: string,
    status: VerificationStatus,
    rejectionReason?: string
  ) => Promise<void>;

  users: { [username: string]: any };

  orderHistory: Order[];
  latestOrder: Order | null;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
  refreshListings: () => Promise<void>;
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  const webSocketContext = useWebSocket();

  const subscribe = webSocketContext?.subscribe;
  const isConnected = webSocketContext?.isConnected || false;

  const [users, setUsers] = useState<{ [username: string]: any }>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [buyer: string]: string[] }>({});
  const [notificationStore, setNotificationStore] = useState<NotificationStore>({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  const soldListingDeduplicator = useRef(new SoldListingDeduplicationManager());
  const listingUpdateDeduplicator = useRef(new Map<string, number>());
  const DEBOUNCE_TIME = 500;

  const apiRequestCache = useRef(new Map<string, { timestamp: number; promise: Promise<any> }>());
  const API_CACHE_TIME = 1000;

  // ---------- Notification helpers ----------
  const normalizeNotification = (item: NotificationItem): Notification => {
    if (typeof item === 'string') {
      return {
        id: uuidv4(),
        message: sanitize.strict(item),
        timestamp: new Date().toISOString(),
        cleared: false,
      };
    }
    return {
      ...item,
      message: sanitize.strict(item.message),
    };
  };

  const saveNotificationStore = async (store: NotificationStore) => {
    try {
      await storageService.setItem('seller_notifications_store', store);
    } catch (e) {
      console.error('[ListingContext] Failed saving notification store', e);
    }
  };

  const addSellerNotification = useCallback((seller: string, message: string) => {
    const safeSeller = sanitize.username(seller);
    if (!safeSeller) {
      console.warn('[ListingContext] Attempted to add notification with invalid seller');
      return;
    }

    const sanitizedMessage = sanitize.strict(message);
    const newNotification: Notification = {
      id: uuidv4(),
      message: sanitizedMessage,
      timestamp: new Date().toISOString(),
      cleared: false,
    };

    setNotificationStore((prev) => {
      const sellerNotifications = prev[safeSeller] || [];
      const updated = {
        ...prev,
        [safeSeller]: [...sellerNotifications.map(normalizeNotification), newNotification],
      };
      // fire-and-forget
      saveNotificationStore(updated);
      return updated;
    });
  }, []);

  const {
    subscribeToSellerWithPayment,
    setAddSellerNotificationCallback,
    purchaseListing,
    orderHistory,
    unsubscribeFromSeller: walletUnsubscribeFromSeller,
  } = useWallet();

  const { placeBid: auctionPlaceBid, cancelAuction: auctionCancelAuction, processEndedAuction } =
    useAuction();

  useEffect(() => {
    if (setAddSellerNotificationCallback) {
      setAddSellerNotificationCallback(addSellerNotification);
    }
  }, [setAddSellerNotificationCallback, addSellerNotification]);

  // ---------- WebSocket: listing sold ----------
  useEffect(() => {
    if (!isConnected || !subscribe) return;

    const unsubscribe = subscribe('listing:sold' as WebSocketEvent, (data: { listingId?: string; id?: string }) => {
      const id = data.listingId ?? data.id;
      if (!id) return;

      const now = Date.now();
      const last = listingUpdateDeduplicator.current.get(id);
      if (last && now - last < DEBOUNCE_TIME) return;
      listingUpdateDeduplicator.current.set(id, now);

      if (soldListingDeduplicator.current.isDuplicate(id)) return;

      setListings((prev) => {
        if (!prev.some((l) => l.id === id)) return prev;
        const filtered = prev.filter((l) => l.id !== id);

        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('listing:removed', { detail: { listingId: id, reason: 'sold' } })
            );
          }, 100);
        }
        return filtered;
      });
    });

    return () => {
      unsubscribe();
      listingUpdateDeduplicator.current.clear();
    };
  }, [isConnected, subscribe]);

  // ---------- WebSocket: order created ----------
  useEffect(() => {
    if (!isConnected || !subscribe) return;

    const unsubscribe = subscribe('order:created' as WebSocketEvent, (data: any) => {
      const order = data?.order || data;
      if (order) {
        setLatestOrder(order);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('order:created', { detail: { order } }));
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected, subscribe]);

  // Cleanup dedup manager on unmount
  useEffect(() => {
    return () => {
      soldListingDeduplicator.current.destroy();
    };
  }, []);

  // Listen for notification changes (multi-tab)
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'seller_notifications_store') {
        try {
          setNotificationStore(JSON.parse(e.newValue || '{}'));
        } catch {
          setNotificationStore({});
        }
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const migrateNotifications = (notifications: NotificationItem[]): Notification[] =>
    notifications.map(normalizeNotification);

  // Cached fetch (per listing)
  const fetchListingWithCache = useCallback(async (listingId: string) => {
    const now = Date.now();
    const cached = apiRequestCache.current.get(listingId);
    if (cached && now - cached.timestamp < API_CACHE_TIME) {
      return cached.promise;
    }
    const promise = listingsService.getListing(listingId);
    apiRequestCache.current.set(listingId, { timestamp: now, promise });

    setTimeout(() => {
      const cleanupTime = Date.now();
      for (const [key, value] of apiRequestCache.current.entries()) {
        if (cleanupTime - value.timestamp > API_CACHE_TIME * 2) {
          apiRequestCache.current.delete(key);
        }
      }
    }, API_CACHE_TIME * 2);

    return promise;
  }, []);

  // Cache for getListings
  const listingsCache = useRef<{ timestamp: number; promise: Promise<any> } | null>(null);
  const LISTINGS_CACHE_TIME = 1000;

  // ---------- Initial load ----------
  const loadData = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Users (supports array or { users: [] })
      const usersResult = await usersService.getUsers();
      if (usersResult.success && usersResult.data) {
        const usersMap: { [username: string]: any } = {};
        if (Array.isArray(usersResult.data)) {
          usersResult.data.forEach((u: any) => (usersMap[u.username] = u));
        } else if (
          usersResult.data &&
          typeof usersResult.data === 'object' &&
          'users' in usersResult.data &&
          Array.isArray((usersResult.data as any).users)
        ) {
          (usersResult.data as any).users.forEach((u: any) => (usersMap[u.username] = u));
        }
        setUsers(usersMap);
      }

      // Listings
      const now = Date.now();
      let listingsResult;
      if (listingsCache.current && now - listingsCache.current.timestamp < LISTINGS_CACHE_TIME) {
        listingsResult = await listingsCache.current.promise;
      } else {
        const promise = listingsService.getListings();
        listingsCache.current = { timestamp: now, promise };
        listingsResult = await promise;
      }

      if (listingsResult.success && listingsResult.data) {
        setListings(listingsResult.data);
      } else {
        throw new Error(listingsResult.error?.message || 'Failed to load listings');
      }

      // Subscriptions
      const storedSubs = await storageService.getItem<{ [buyer: string]: string[] }>(
        'subscriptions',
        {}
      );
      setSubscriptions(storedSubs);

      // Notifications
      const storedNotifications = await storageService.getItem<NotificationStore>(
        'seller_notifications_store',
        {}
      );
      const migrated: NotificationStore = {};
      Object.keys(storedNotifications).forEach((username) => {
        if (Array.isArray(storedNotifications[username])) {
          migrated[username] = migrateNotifications(storedNotifications[username]);
        }
      });
      setNotificationStore(migrated);
      await saveNotificationStore(migrated);

      setIsAuthReady(true);
    } catch (err: any) {
      console.error('Error loading ListingContext data:', err);
      setError(err?.message || 'Failed to load data');
      setIsAuthReady(true);
      listingsCache.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Debounced mount-load (browser-safe timer types)
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    timeoutId = setTimeout(() => {
      if (mounted && !isAuthReady && !isLoading) {
        loadData();
      }
    }, 100);
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistUsers = async (updated: { [username: string]: any }) => {
    setUsers(updated);
    await storageService.setItem('all_users_v2', updated);
  };

  // ---------- Refresh listings (cached) ----------
  const refreshListings = useCallback(async () => {
    const now = Date.now();
    if (listingsCache.current && now - listingsCache.current.timestamp < LISTINGS_CACHE_TIME) {
      try {
        const result = await listingsCache.current.promise;
        if (result.success && result.data) {
          setListings(result.data);
        }
        return;
      } catch {
        // fall through to fetch fresh
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const promise = listingsService.getListings();
      listingsCache.current = { timestamp: now, promise };
      const listingsResult = await promise;
      if (listingsResult.success && listingsResult.data) {
        setListings(listingsResult.data);
      } else {
        throw new Error(listingsResult.error?.message || 'Failed to refresh listings');
      }
    } catch (err: any) {
      console.error('Error refreshing listings:', err);
      setError(err?.message || 'Failed to refresh listings');
      listingsCache.current = null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------- Auction checks ----------
  useEffect(() => {
    checkEndedAuctions();
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      checkEndedAuctions();
    }, 60_000);
    return () => clearInterval(interval);
  }, [listings]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Create listing ----------
  const addListing = async (listing: NewListingInput): Promise<void> => {
    if (!user || user.role !== 'seller') {
      alert('You must be logged in as a seller to create listings.');
      return;
    }

    const validationResult = securityService.validateAndSanitize(
      {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        tags: listing.tags,
        wearDuration: listing.hoursWorn,
      },
      listingSchemas.createListingSchema.pick({
        title: true,
        description: true,
        price: true,
        tags: true,
        wearDuration: true,
      }),
      {
        title: sanitize.strict,
        description: sanitize.strict,
        tags: (tags: string[]) => tags?.map((tag) => sanitize.strict(tag)),
      }
    );

    if (!validationResult.success) {
      alert(
        'Please check your listing details:\n' +
          Object.values(validationResult.errors || {}).join('\n')
      );
      return;
    }

    const myListings = listings.filter((l) => l.seller === user.username);
    const isVerified = user.isVerified || user.verificationStatus === 'verified';
    const maxListings = isVerified ? 25 : 2;

    if (myListings.length >= maxListings) {
      alert(
        isVerified
          ? 'You have reached the maximum of 25 listings for verified sellers.'
          : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.'
      );
      return;
    }

    try {
      const sanitizedListing = {
        ...listing,
        title: validationResult.data!.title,
        description: validationResult.data!.description,
        price: validationResult.data!.price,
        tags: validationResult.data!.tags,
        hoursWorn: validationResult.data!.wearDuration,
        seller: user.username,
        isVerified: isVerified,
      };

      const result = await listingsService.createListing(sanitizedListing);
      if (result.success && result.data) {
        setListings((prev) => [...prev, result.data!]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('listingCreated', { detail: { listing: result.data } })
          );
        }
      } else {
        alert(result.error?.message || 'Failed to create listing. Please try again.');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('An error occurred while creating the listing.');
    }
  };

  // ---------- Create auction listing ----------
  const addAuctionListing = async (
    listing: AddListingInput,
    auctionSettings: AuctionInput
  ): Promise<void> => {
    if (!user || user.role !== 'seller') {
      alert('You must be logged in as a seller to create auction listings.');
      return;
    }

    const listingValidation = securityService.validateAndSanitize(
      {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        tags: listing.tags,
        wearDuration: listing.hoursWorn,
      },
      listingSchemas.createListingSchema.pick({
        title: true,
        description: true,
        price: true,
        tags: true,
        wearDuration: true,
      }),
      {
        title: sanitize.strict,
        description: sanitize.strict,
        tags: (tags: string[]) => tags?.map((tag) => sanitize.strict(tag)),
      }
    );

    if (!listingValidation.success) {
      alert(
        'Please check your listing details:\n' +
          Object.values(listingValidation.errors || {}).join('\n')
      );
      return;
    }

    const amountValidation = securityService.validateAmount(auctionSettings.startingPrice, {
      min: 0.01,
      max: 10_000,
    });
    if (!amountValidation.valid) {
      alert(amountValidation.error || 'Invalid starting price');
      return;
    }

    if (auctionSettings.reservePrice) {
      const reserveValidation = securityService.validateAmount(auctionSettings.reservePrice, {
        min: auctionSettings.startingPrice,
        max: 10_000,
      });
      if (!reserveValidation.valid) {
        alert('Reserve price must be at least the starting price');
        return;
      }
    }

    const myListings = listings.filter((l) => l.seller === user.username);
    const isVerified = user.isVerified || user.verificationStatus === 'verified';
    const maxListings = isVerified ? 25 : 2;

    if (myListings.length >= maxListings) {
      alert(
        isVerified
          ? 'You have reached the maximum of 25 listings for verified sellers.'
          : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.'
      );
      return;
    }

    try {
      const sanitizedListing = {
        ...listing,
        title: listingValidation.data!.title,
        description: listingValidation.data!.description,
        price: listingValidation.data!.price,
        tags: listingValidation.data!.tags,
        hoursWorn: listingValidation.data!.wearDuration,
        seller: user.username,
        isVerified: isVerified,
        auction: auctionSettings,
      };

      const result = await listingsService.createListing(sanitizedListing);
      if (result.success && result.data) {
        setListings((prev) => [...prev, result.data!]);

        addSellerNotification(
          user.username,
          `🔨 You've created a new auction: "${sanitizedListing.title}" starting at $${auctionSettings.startingPrice.toFixed(
            2
          )}`
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('listingCreated', { detail: { listing: result.data } })
          );
        }
      } else {
        alert(result.error?.message || 'Failed to create auction listing. Please try again.');
      }
    } catch (error) {
      console.error('Error creating auction listing:', error);
      alert('An error occurred while creating the auction listing.');
    }
  };

  // ---------- Remove listing ----------
  const removeListing = async (id: string): Promise<void> => {
    try {
      const result = await listingsService.deleteListing(id);
      if (result.success) {
        setListings((prev) => prev.filter((l) => l.id !== id));

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('listing:removed', { detail: { listingId: id, reason: 'deleted' } })
          );
          window.dispatchEvent(new CustomEvent('listingDeleted', { detail: { listingId: id } }));
        }
      } else {
        throw new Error(result.error?.message || 'Failed to delete listing');
      }
    } catch (error: any) {
      console.error('Error removing listing:', error);
      alert(error?.message || 'Failed to remove listing');
    }
  };

  // ---------- Purchase + remove ----------
  const purchaseListingAndRemove = async (
    listing: Listing,
    buyerUsername: string
  ): Promise<boolean> => {
    try {
      const sanitizedBuyer = sanitize.username(buyerUsername);
      if (!sanitizedBuyer) return false;

      const listingForWallet = {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        markedUpPrice: listing.markedUpPrice,
        seller: listing.seller,
        sellerUsername: listing.seller,
        imageUrls: listing.imageUrls,
        type: 'instant' as const,
        status: 'active' as const,
        category: 'panties' as const,
        shippingIncluded: true,
        internationalShipping: false,
        createdAt: listing.date,
        updatedAt: listing.date,
        views: listing.views || 0,
        favorites: 0,
        tags: listing.tags,
        size: undefined,
        color: undefined,
        material: undefined,
        wearTime: listing.hoursWorn?.toString(),
        customizations: [],
        featured: false,
        verified: listing.isVerified,
        nsfw: false,
      };

      const success = await purchaseListing(listingForWallet as any, sanitizedBuyer);
      if (success) {
        soldListingDeduplicator.current.isDuplicate(listing.id);
        await removeListing(listing.id);
      }
      return success;
    } catch (error) {
      console.error('Error in purchaseListingAndRemove:', error);
      return false;
    }
  };

  // ---------- Update listing ----------
  const updateListing = async (
    id: string,
    updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>
  ): Promise<void> => {
    try {
      const sanitizedUpdate: any = { ...updatedListing };

      if (updatedListing.title) sanitizedUpdate.title = sanitize.strict(updatedListing.title);
      if (updatedListing.description)
        sanitizedUpdate.description = sanitize.strict(updatedListing.description);
      if (Array.isArray(updatedListing.tags)) {
        sanitizedUpdate.tags = updatedListing.tags.map((tag) => sanitize.strict(tag));
      }

      const result = await listingsService.updateListing(id, sanitizedUpdate);
      if (result.success && result.data) {
        setListings((prev) => prev.map((l) => (l.id === id ? result.data! : l)));
      } else {
        throw new Error(result.error?.message || 'Failed to update listing');
      }
    } catch (error: any) {
      console.error('Error updating listing:', error);
      alert(error?.message || 'Failed to update listing');
    }
  };

  // ---------- Bidding ----------
  const placeBid = useCallback(
    async (listingId: string, bidder: string, amount: number): Promise<boolean> => {
      try {
        const cleanBidder = sanitize.username(bidder);
        if (!cleanBidder || !Number.isFinite(amount) || amount <= 0) {
          console.error('[ListingContext] Invalid bid input');
          return false;
        }

        const listing = listings.find((l) => l.id === listingId);
        if (!listing) {
          console.error('[ListingContext] Listing not found:', listingId);
          return false;
        }

        const isCurrentHighestBidder = listing.auction?.highestBidder === cleanBidder;
        const currentHighestBid = listing.auction?.highestBid || 0;

        if (isCurrentHighestBidder && currentHighestBid > 0) {
          const bidDifference = amount - currentHighestBid;
          if (!(bidDifference > 0)) {
            console.warn('[ListingContext] Incremental bid must exceed current highest bid');
            return false;
          }
        }

        const success = await auctionPlaceBid(listingId, cleanBidder, amount);
        if (success) {
          await refreshListings();
          addSellerNotification(
            listing.seller,
            `💰 New bid! ${cleanBidder} bid $${amount.toFixed(2)} on "${listing.title}"`
          );
        }
        return success;
      } catch (error) {
        console.error('[ListingContext] Bid error:', error);
        return false;
      }
    },
    [listings, auctionPlaceBid, refreshListings, addSellerNotification]
  );

  const getAuctionListings = (): Listing[] => listings.filter((l) => l.auction?.isAuction);
  const getActiveAuctions = (): Listing[] =>
    listings.filter((l) => l.auction?.isAuction && l.auction.status === 'active');
  const getEndedAuctions = (): Listing[] =>
    listings.filter((l) => l.auction?.isAuction && l.auction.status === 'ended');

  // Only sellers/admins check ended auctions
  const checkEndedAuctions = async (): Promise<void> => {
    if (!user || (user.role !== 'seller' && user.role !== 'admin')) return;

    const activeAuctions = getActiveAuctions();
    const now = new Date();

    for (const listing of activeAuctions) {
      if (
        listing.auction &&
        new Date(listing.auction.endTime) <= now &&
        (user.username === listing.seller || user.role === 'admin')
      ) {
        const processed = await processEndedAuction(listing);
        if (processed) {
          setListings((prev) =>
            prev.map((l) =>
              l.id === listing.id
                ? { ...l, auction: { ...l.auction!, status: 'ended' as AuctionStatus } }
                : l
            )
          );

          if (listing.auction.highestBidder) {
            soldListingDeduplicator.current.isDuplicate(listing.id);
            setListings((prev) => prev.filter((l) => l.id !== listing.id));

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('listing:removed', {
                  detail: { listingId: listing.id, reason: 'auction-sold' },
                })
              );
            }
          }

          if (listing.auction.highestBidder && listing.auction.highestBid) {
            const sellerEarnings = listing.auction.highestBid * 0.8;
            addSellerNotification(
              listing.seller,
              `🏆 Auction ended: "${listing.title}" sold to ${listing.auction.highestBidder} for $${listing.auction.highestBid.toFixed(
                2
              )}. You'll receive $${sellerEarnings.toFixed(2)} (after 20% platform fee)`
            );
          } else {
            addSellerNotification(
              listing.seller,
              `🔨 Auction ended: No valid bids for "${listing.title}"`
            );
          }
        }
      }
    }
  };

  // ---------- Cancel auction ----------
  const cancelAuction = async (listingId: string): Promise<boolean> => {
    if (!user) return false;

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return false;

    if (user.role !== 'admin' && user.username !== listing.seller) return false;

    const success = await auctionCancelAuction(listingId);
    if (success) {
      setListings((prev) =>
        prev.map((l) =>
          l.id === listingId ? { ...l, auction: { ...l.auction!, status: 'cancelled' } } : l
        )
      );

      addSellerNotification(listing.seller, `🛑 You cancelled your auction: "${listing.title}". All bidders have been refunded.`);
    }

    return success;
  };

  // ---------- Drafts ----------
  const saveDraft = async (draft: ListingDraft): Promise<boolean> => {
    if (!user || user.role !== 'seller') {
      console.error('Only sellers can save drafts');
      return false;
    }

    try {
      const sanitizedDraft = {
        ...draft,
        formState: {
          ...draft.formState,
          title: draft.formState.title ? sanitize.strict(draft.formState.title) : '',
          description: draft.formState.description ? sanitize.strict(draft.formState.description) : '',
          tags: draft.formState.tags ? sanitize.strict(draft.formState.tags) : '',
        },
        seller: user.username,
      };

      const result = await listingsService.saveDraft(sanitizedDraft);
      return !!result.success;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  };

  const getDrafts = async (): Promise<ListingDraft[]> => {
    if (!user || user.role !== 'seller') return [];
    try {
      const result = await listingsService.getDrafts(user.username);
      return result.success && result.data ? result.data : [];
    } catch (error) {
      console.error('Error getting drafts:', error);
      return [];
    }
  };

  const deleteDraft = async (draftId: string): Promise<boolean> => {
    try {
      const result = await listingsService.deleteDraft(draftId);
      return !!result.success;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  };

  // ---------- Images ----------
  const uploadImage = async (file: File): Promise<string | null> => {
    const fileValidation = securityService.validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    });
    if (!fileValidation.valid) {
      alert(fileValidation.error || 'Invalid file');
      return null;
    }
    try {
      const result = await listingsService.uploadImage(file);
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      const sanitizedUrl = sanitize.url(imageUrl);
      if (!sanitizedUrl) {
        console.error('Invalid image URL');
        return false;
      }
      const result = await listingsService.deleteImage(sanitizedUrl);
      return !!result.success;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  // ---------- Subscriptions ----------
  const subscribeToSeller = async (buyer: string, seller: string, price: number): Promise<boolean> => {
    const priceValidation = securityService.validateAmount(price, { min: 0.01, max: 1000 });
    if (!priceValidation.valid) {
      console.error('Invalid subscription price:', priceValidation.error);
      return false;
    }

    const sanitizedBuyer = sanitize.username(buyer);
    const sanitizedSeller = sanitize.username(seller);
    if (!sanitizedBuyer || !sanitizedSeller) return false;

    const success = await subscribeToSellerWithPayment(sanitizedBuyer, sanitizedSeller, price);
    if (success) {
      setSubscriptions((prev) => {
        const updated = {
          ...prev,
          [sanitizedBuyer]: [...(prev[sanitizedBuyer] || []), sanitizedSeller],
        };
        storageService.setItem('subscriptions', updated);
        return updated;
      });

      const subscriptionDetails =
        (await storageService.getItem<Record<string, SubscriptionData[]>>(
          'subscription_details',
          {}
        )) || {};
      const buyerSubs = subscriptionDetails[sanitizedBuyer] || [];
      const filtered = buyerSubs.filter((sub) => sub.seller !== sanitizedSeller);
      filtered.push({ seller: sanitizedSeller, price, subscribedAt: new Date().toISOString() });
      subscriptionDetails[sanitizedBuyer] = filtered;
      await storageService.setItem('subscription_details', subscriptionDetails);

      addSellerNotification(sanitizedSeller, `🎉 ${sanitizedBuyer} subscribed to you!`);
    }
    return success;
  };

  const unsubscribeFromSeller = async (buyer: string, seller: string): Promise<void> => {
    try {
      const sanitizedBuyer = sanitize.username(buyer);
      const sanitizedSeller = sanitize.username(seller);
      if (!sanitizedBuyer || !sanitizedSeller) return;

      let success = false;
      if (walletUnsubscribeFromSeller && typeof walletUnsubscribeFromSeller === 'function') {
        success = await walletUnsubscribeFromSeller(sanitizedBuyer, sanitizedSeller);
      } else {
        console.warn('[ListingContext] Wallet unsubscribe method not available; local update only');
        success = true;
      }

      if (success) {
        setSubscriptions((prev) => {
          const updated = {
            ...prev,
            [sanitizedBuyer]: (prev[sanitizedBuyer] || []).filter((s) => s !== sanitizedSeller),
          };
        storageService.setItem('subscriptions', updated);
          return updated;
        });

        const subscriptionDetails =
          (await storageService.getItem<Record<string, SubscriptionData[]>>(
            'subscription_details',
            {}
          )) || {};
        const buyerSubs = subscriptionDetails[sanitizedBuyer] || [];
        subscriptionDetails[sanitizedBuyer] = buyerSubs.filter(
          (sub) => sub.seller !== sanitizedSeller
        );
        await storageService.setItem('subscription_details', subscriptionDetails);

        addSellerNotification(sanitizedSeller, `${sanitizedBuyer} unsubscribed from your content`);
      } else {
        throw new Error('Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      console.error('[ListingContext] Error in unsubscribeFromSeller:', error);
      throw error;
    }
  };

  const isSubscribed = (buyer: string, seller: string): boolean => {
    const sanitizedBuyer = sanitize.username(buyer);
    const sanitizedSeller = sanitize.username(seller);
    if (!sanitizedBuyer || !sanitizedSeller) return false;
    return subscriptions[sanitizedBuyer]?.includes(sanitizedSeller) ?? false;
  };

  // ---------- Seller notifications (current) ----------
  const getCurrentSellerNotifications = (): Notification[] => {
    if (!user || user.role !== 'seller') return [];
    const safeUser = sanitize.username(user.username);
    if (!safeUser) return [];
    const userNotifications = notificationStore[safeUser] || [];
    return userNotifications.map(normalizeNotification);
  };

  const clearSellerNotification = (notificationId: string | number) => {
    if (!user || user.role !== 'seller') return;

    const username = sanitize.username(user.username);
    if (!username) return;

    const userNotifications = notificationStore[username] || [];
    setNotificationStore((prev) => {
      const updatedNotifications = userNotifications.map((item, index) => {
        const notification = normalizeNotification(item);
        const shouldClear =
          typeof notificationId === 'string' ? notification.id === notificationId : index === notificationId;
        return shouldClear ? { ...notification, cleared: true } : notification;
      });

      const updated = { ...prev, [username]: updatedNotifications };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const restoreSellerNotification = (notificationId: string) => {
    if (!user || user.role !== 'seller') return;

    const username = sanitize.username(user.username);
    if (!username) return;

    const userNotifications = notificationStore[username] || [];
    setNotificationStore((prev) => {
      const updatedNotifications = userNotifications.map((item) => {
        const notification = normalizeNotification(item);
        return notification.id === notificationId ? { ...notification, cleared: false } : notification;
      });

      const updated = { ...prev, [username]: updatedNotifications };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const permanentlyDeleteSellerNotification = (notificationId: string) => {
    if (!user || user.role !== 'seller') return;

    const username = sanitize.username(user.username);
    if (!username) return;

    const userNotifications = notificationStore[username] || [];
    setNotificationStore((prev) => {
      const updatedNotifications = userNotifications.filter((item) => {
        const notification = normalizeNotification(item);
        return notification.id !== notificationId;
      });

      const updated = { ...prev, [username]: updatedNotifications };
      saveNotificationStore(updated);
      return updated;
    });
  };

  // ---------- Verification ----------
  const requestVerification = async (docs: VerificationDocs): Promise<void> => {
    if (!user) return;

    const code =
      docs.code || `VERIF-${user.username}-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const result = await usersService.requestVerification(user.username, { ...docs, code });
      if (result.success) {
        await updateUser({
          verificationStatus: 'pending',
          verificationRequestedAt: new Date().toISOString(),
          verificationDocs: { ...docs, code },
        });

        const updatedUser = {
          ...user,
          verificationStatus: 'pending' as VerificationStatus,
          verificationDocs: { ...docs, code },
          verificationRequestedAt: new Date().toISOString(),
        };

        await persistUsers({
          ...users,
          [user.username]: updatedUser,
        });
      } else {
        alert('Failed to submit verification request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting verification request:', error);
      alert('An error occurred while submitting verification request.');
    }
  };

  const setVerificationStatus = async (
    username: string,
    status: VerificationStatus,
    rejectionReason?: string
  ): Promise<void> => {
    // client gate: admin only
    if (!user || user.role !== 'admin') {
      console.warn('[ListingContext] setVerificationStatus blocked: admin only');
      return;
    }

    const sanitizedUsername = sanitize.username(username);
    const sanitizedReason = rejectionReason ? sanitize.strict(rejectionReason) : undefined;
    if (!sanitizedUsername) return;

    const existingUser = users[sanitizedUsername];
    if (!existingUser) return;

    try {
      const result = await usersService.updateVerificationStatus(sanitizedUsername, {
        status,
        rejectionReason: sanitizedReason,
        adminUsername: user.username,
      });

      if (result.success) {
        const updatedUser = {
          ...existingUser,
          verificationStatus: status,
          verified: status === 'verified',
          verificationReviewedAt: new Date().toISOString(),
          verificationRejectionReason: sanitizedReason,
        };

        if (user?.username === sanitizedUsername) {
          await updateUser({
            verificationStatus: status,
            isVerified: status === 'verified',
            verificationRejectionReason: sanitizedReason,
          });
        }

        await persistUsers({
          ...users,
          [sanitizedUsername]: updatedUser,
        });

        setListings((prev) =>
          prev.map((l) => (l.seller === sanitizedUsername ? { ...l, isVerified: status === 'verified' } : l))
        );
      } else {
        alert('Failed to update verification status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('An error occurred while updating verification status.');
    }
  };

  const sellerNotifications = getCurrentSellerNotifications();

  return (
    <ListingContext.Provider
      value={{
        isAuthReady,
        listings,
        addListing,
        addAuctionListing,
        removeListing,
        updateListing,
        purchaseListingAndRemove,
        placeBid,
        getAuctionListings,
        getActiveAuctions,
        getEndedAuctions,
        checkEndedAuctions,
        cancelAuction,
        saveDraft,
        getDrafts,
        deleteDraft,
        uploadImage,
        deleteImage,
        subscriptions,
        subscribeToSeller,
        unsubscribeFromSeller,
        isSubscribed,
        sellerNotifications,
        addSellerNotification,
        clearSellerNotification,
        restoreSellerNotification,
        permanentlyDeleteSellerNotification,
        requestVerification,
        setVerificationStatus,
        users,
        orderHistory,
        latestOrder,
        isLoading,
        error,
        refreshListings,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
};

export const useListings = () => {
  const context = useContext(ListingContext);
  if (!context) throw new Error('useListings must be used within a ListingProvider');
  return context;
};
