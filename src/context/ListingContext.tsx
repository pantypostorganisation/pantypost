// src/context/ListingContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { safeStorage } from '@/utils/safeStorage';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified';

export type VerificationDocs = {
  idPhoto: string;
  selfiePhoto: string;
  code?: string;
};

export type Order = {
  id: string;
  buyer: string;
  seller: string;
  listingId: string;
  listingTitle: string;
  price: number;
  platformFee: number;
  sellerEarnings: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'cancelled';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

export type AuctionBid = {
  bidder: string;
  amount: number;
  timestamp: string;
};

export type AuctionStatus = 'active' | 'ended' | 'cancelled' | 'sold';

export type AuctionSettings = {
  startingPrice: number;
  currentPrice: number;
  reservePrice?: number;
  endTime: string;
  bids: AuctionBid[];
  highestBidder?: string;
  status: AuctionStatus;
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
  tags?: string[];
  hoursWorn?: number;
  
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

type ListingContextType = {
  isAuthReady: boolean;
  listings: Listing[];
  addListing: (listing: AddListingInput) => void;
  addAuctionListing: (listing: AddListingInput, auctionSettings: AuctionInput) => void;
  removeListing: (id: string) => void;
  updateListing: (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>) => void;
  
  // Auction functions
  placeBid: (listingId: string, bidder: string, amount: number) => boolean;
  getAuctionListings: () => Listing[];
  getActiveAuctions: () => Listing[];
  getEndedAuctions: () => Listing[];
  checkEndedAuctions: () => void;
  cancelAuction: (listingId: string) => boolean;
  
  subscriptions: { [buyer: string]: string[] };
  subscribeToSeller: (buyer: string, seller: string, price: number) => boolean;
  unsubscribeFromSeller: (buyer: string, seller: string) => void;
  isSubscribed: (buyer: string, seller: string) => boolean;
  
  // Updated notification system
  sellerNotifications: Notification[];
  addSellerNotification: (seller: string, message: string) => void;
  clearSellerNotification: (notificationId: string | number) => void;
  restoreSellerNotification: (notificationId: string) => void;
  permanentlyDeleteSellerNotification: (notificationId: string) => void;

  requestVerification: (docs: VerificationDocs) => void;
  setVerificationStatus: (username: string, status: VerificationStatus, rejectionReason?: string) => void;
  
  users: { [username: string]: any };
  
  orderHistory: Order[];
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();
  
  const [users, setUsers] = useState<{ [username: string]: any }>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [buyer: string]: string[] }>({});
  const [notificationStore, setNotificationStore] = useState<NotificationStore>({});
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Helper function to normalize notification items to the new format
  const normalizeNotification = (item: NotificationItem): Notification => {
    if (typeof item === 'string') {
      return {
        id: uuidv4(),
        message: item,
        timestamp: new Date().toISOString(),
        cleared: false
      };
    }
    return item;
  };

  // Helper function to save notification store
  const saveNotificationStore = (store: NotificationStore) => {
    safeStorage.setItem('seller_notifications_store', store);
  };

  // Memoized notification function to avoid infinite render loop
  const addSellerNotification = useCallback((seller: string, message: string) => {
    if (!seller) {
      console.warn("Attempted to add notification without seller ID");
      return;
    }
    
    const newNotification: Notification = {
      id: uuidv4(),
      message,
      timestamp: new Date().toISOString(),
      cleared: false
    };
    
    setNotificationStore(prev => {
      const sellerNotifications = prev[seller] || [];
      const updated = {
        ...prev,
        [seller]: [...sellerNotifications, newNotification]
      };
      saveNotificationStore(updated);
      return updated;
    });
  }, []);

  const { subscribeToSellerWithPayment, setAddSellerNotificationCallback, purchaseListing, getBuyerBalance, addOrder, orderHistory } = useWallet();

  // On mount, set the notification callback in WalletContext
  useEffect(() => {
    if (setAddSellerNotificationCallback) {
      setAddSellerNotificationCallback(addSellerNotification);
    }
  }, [setAddSellerNotificationCallback, addSellerNotification]);

  // Listen for notification changes in localStorage (for header live updates)
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === 'panty_seller_notifications_store') {
        const newValue = safeStorage.getItem<NotificationStore>('seller_notifications_store', {}) || {};
        setNotificationStore(newValue);
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Migration function to convert old notifications to new format
  const migrateNotifications = (notifications: NotificationItem[]): Notification[] => {
    return notifications.map(normalizeNotification);
  };

  useEffect(() => {
    const storedUsers = safeStorage.getItem('all_users_v2', {}) || {};
    const storedListings = safeStorage.getItem<Listing[]>('listings', []) || [];
    const storedSubs = safeStorage.getItem('subscriptions', {}) || {};
    const storedNotifications = safeStorage.getItem<NotificationStore>('seller_notifications_store', {}) || {};

    setUsers(storedUsers);
    setListings(storedListings);
    setSubscriptions(storedSubs);
    
    // Migrate old notification format if needed
    const needsMigration = Object.values(storedNotifications).some(
      notifications => notifications.some(n => typeof n === 'string')
    );
    
    if (needsMigration) {
      const migrated: NotificationStore = {};
      Object.entries(storedNotifications).forEach(([seller, notifications]) => {
        migrated[seller] = migrateNotifications(notifications);
      });
      setNotificationStore(migrated);
      saveNotificationStore(migrated);
    } else {
      setNotificationStore(storedNotifications);
    }
    
    setIsAuthReady(true);
  }, []);

  // Persist to localStorage
  const persistUsers = (updatedUsers: { [username: string]: any }) => {
    setUsers(updatedUsers);
    safeStorage.setItem('all_users_v2', updatedUsers);
  };

  const persistListings = (updatedListings: Listing[]) => {
    setListings(updatedListings);
    safeStorage.setItem('listings', updatedListings);
  };

  const persistSubscriptions = (updatedSubs: { [buyer: string]: string[] }) => {
    setSubscriptions(updatedSubs);
    safeStorage.setItem('subscriptions', updatedSubs);
  };

  // Get current user's notifications
  const sellerNotifications = user?.role === 'seller'
    ? (notificationStore[user.username] || []).map(normalizeNotification)
    : [];

  // Auction timer check
  useEffect(() => {
    const interval = setInterval(() => {
      checkEndedAuctions();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [listings]);

  const addListing = (listing: AddListingInput) => {
    const newListing: Listing = {
      ...listing,
      id: uuidv4(),
      date: new Date().toISOString(),
      markedUpPrice: Math.round(listing.price * 1.1 * 100) / 100,
    };
    persistListings([...listings, newListing]);
  };

  const addAuctionListing = (listing: AddListingInput, auctionSettings: AuctionInput) => {
    const newListing: Listing = {
      ...listing,
      id: uuidv4(),
      date: new Date().toISOString(),
      markedUpPrice: 0, // Auctions don't have markup
      auction: {
        ...auctionSettings,
        currentPrice: auctionSettings.startingPrice,
        bids: [],
        status: 'active'
      }
    };
    persistListings([...listings, newListing]);
    
    addSellerNotification(
      listing.seller,
      `🔨 You created a new auction: "${listing.title}" starting at $${auctionSettings.startingPrice}`
    );
  };

  const removeListing = (id: string) => {
    persistListings(listings.filter((listing) => listing.id !== id));
  };

  const updateListing = (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>) => {
    persistListings(
      listings.map((listing) =>
        listing.id === id
          ? {
              ...listing,
              ...updatedListing,
              markedUpPrice: updatedListing.price
                ? Math.round(updatedListing.price * 1.1 * 100) / 100
                : listing.markedUpPrice,
            }
          : listing
      )
    );
  };

  const placeBid = (listingId: string, bidder: string, amount: number): boolean => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing?.auction || listing.auction.status !== 'active') {
      return false;
    }

    const endTime = new Date(listing.auction.endTime);
    if (new Date() > endTime) {
      return false;
    }

    if (amount <= listing.auction.currentPrice) {
      return false;
    }

    const newBid: AuctionBid = {
      bidder,
      amount,
      timestamp: new Date().toISOString()
    };

    const updatedListings = [...listings];
    const listingIndex = updatedListings.findIndex(l => l.id === listingId);
    updatedListings[listingIndex] = {
      ...listing,
      auction: {
        ...listing.auction,
        currentPrice: amount,
        bids: [...listing.auction.bids, newBid],
        highestBidder: bidder
      }
    };

    persistListings(updatedListings);

    addSellerNotification(
      listing.seller,
      `💰 New bid on "${listing.title}": $${amount} by ${bidder}`
    );

    if (listing.auction.highestBidder && listing.auction.highestBidder !== bidder) {
      const outbidAmount = listing.auction.currentPrice;
      addSellerNotification(
        listing.seller,
        `ℹ️ ${listing.auction.highestBidder} was outbid on "${listing.title}" (their bid: $${outbidAmount})`
      );
    }

    return true;
  };

  const getAuctionListings = (): Listing[] => {
    return listings.filter(l => l.auction);
  };

  const getActiveAuctions = (): Listing[] => {
    return listings.filter(l => l.auction && l.auction.status === 'active');
  };

  const getEndedAuctions = (): Listing[] => {
    return listings.filter(l => l.auction && l.auction.status === 'ended');
  };

  const checkEndedAuctions = () => {
    const now = new Date();
    const updatedListings = listings.map(listing => {
      if (listing.auction && listing.auction.status === 'active') {
        const endTime = new Date(listing.auction.endTime);
        if (now > endTime) {
          const hasMetReserve = !listing.auction.reservePrice || 
            listing.auction.currentPrice >= listing.auction.reservePrice;
          const hasBids = listing.auction.bids.length > 0;

          if (hasBids && hasMetReserve && listing.auction.highestBidder) {
            // Process the winning bid
            const buyerBalance = getBuyerBalance(listing.auction.highestBidder);
            
            if (buyerBalance >= listing.auction.currentPrice) {
              // Attempt purchase
              const purchaseSuccess = purchaseListing(
                listing.auction.highestBidder,
                listing.seller,
                listing.id,
                listing.title,
                listing.auction.currentPrice
              );

              if (purchaseSuccess) {
                addSellerNotification(
                  listing.seller,
                  `🏆💰 Auction ended: "${listing.title}" sold to ${listing.auction.highestBidder} for $${listing.auction.currentPrice}!`
                );

                return {
                  ...listing,
                  auction: {
                    ...listing.auction,
                    status: 'sold' as AuctionStatus
                  }
                };
              } else {
                addSellerNotification(
                  listing.seller,
                  `⚠️ Auction ended: "${listing.title}" - Winner had insufficient funds. Auction cancelled.`
                );

                return {
                  ...listing,
                  auction: {
                    ...listing.auction,
                    status: 'cancelled' as AuctionStatus
                  }
                };
              }
            } else {
              addSellerNotification(
                listing.seller,
                `⚠️ Auction ended: "${listing.title}" - Winner ${listing.auction.highestBidder} has insufficient funds ($${buyerBalance}/$${listing.auction.currentPrice})`
              );

              return {
                ...listing,
                auction: {
                  ...listing.auction,
                  status: 'cancelled' as AuctionStatus
                }
              };
            }
          } else if (!hasMetReserve) {
            addSellerNotification(
              listing.seller,
              `🔨 Auction ended: "${listing.title}" - Reserve price not met ($${listing.auction.currentPrice}/$${listing.auction.reservePrice})`
            );
          } else {
            addSellerNotification(
              listing.seller,
              `🔨 Auction ended: "${listing.title}" - No bids were placed`
            );
          }

          return {
            ...listing,
            auction: {
              ...listing.auction,
              status: 'ended' as AuctionStatus
            }
          };
        }
      }
      return listing;
    });

    if (JSON.stringify(updatedListings) !== JSON.stringify(listings)) {
      persistListings(updatedListings);
    }
  };

  const cancelAuction = (listingId: string): boolean => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing?.auction || listing.auction.status !== 'active') {
      return false;
    }

    const updatedListings = [...listings];
    const listingIndex = updatedListings.findIndex(l => l.id === listingId);
    updatedListings[listingIndex] = {
      ...listing,
      auction: {
        ...listing.auction,
        status: 'cancelled' as AuctionStatus
      }
    };
    
    persistListings(updatedListings);
    
    if (listing.auction.bids.length > 0) {
      addSellerNotification(
        listing.seller,
        `🛑 You cancelled your auction: "${listing.title}" with ${listing.auction.bids.length} bids`
      );
    } else {
      addSellerNotification(
        listing.seller,
        `🛑 You cancelled your auction: "${listing.title}" (no bids received)`
      );
    }
    
    return true;
  };

  const subscribeToSeller = (buyer: string, seller: string, price: number): boolean => {
    const success = subscribeToSellerWithPayment(buyer, seller, price);
    if (success) {
      const updated = {
        ...subscriptions,
        [buyer]: [...(subscriptions[buyer] || []), seller],
      };
      persistSubscriptions(updated);
      addSellerNotification(
        seller,
        `🎉 ${buyer} subscribed to you!`
      );
    }
    return success;
  };

  const unsubscribeFromSeller = (buyer: string, seller: string) => {
    const updated = {
      ...subscriptions,
      [buyer]: (subscriptions[buyer] || []).filter((s) => s !== seller),
    };
    persistSubscriptions(updated);
  };

  const isSubscribed = (buyer: string, seller: string): boolean => {
    return subscriptions[buyer]?.includes(seller) ?? false;
  };

  const getCurrentSellerNotifications = (): Notification[] => {
    if (!user || user.role !== 'seller') {
      return [];
    }
    const userNotifications = notificationStore[user.username] || [];
    return userNotifications.map(normalizeNotification);
  };

  const clearSellerNotification = (notificationId: string | number) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    setNotificationStore(prev => {
      const updatedNotifications = userNotifications.map((item, index) => {
        const notification = normalizeNotification(item);
        
        const shouldClear = typeof notificationId === 'string' 
          ? notification.id === notificationId
          : index === notificationId;
          
        if (shouldClear) {
          return {
            ...notification,
            cleared: true
          };
        }
        return notification;
      });

      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const restoreSellerNotification = (notificationId: string) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    setNotificationStore(prev => {
      const updatedNotifications = userNotifications.map(item => {
        const notification = normalizeNotification(item);
        if (notification.id === notificationId) {
          return {
            ...notification,
            cleared: false
          };
        }
        return notification;
      });

      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const permanentlyDeleteSellerNotification = (notificationId: string) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    setNotificationStore(prev => {
      const updatedNotifications = userNotifications.filter(item => {
        const notification = normalizeNotification(item);
        return notification.id !== notificationId;
      });

      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      saveNotificationStore(updated);
      return updated;
    });
  };

  const requestVerification = (docs: VerificationDocs) => {
    if (!user) return;
    
    console.log('🔍 requestVerification called with user:', user.username);
    
    const code = docs.code || `VERIF-${user.username}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    updateUser({
      verificationStatus: 'pending',
      verificationRequestedAt: new Date().toISOString(),
      verificationDocs: { ...docs, code },
    });
    
    // Also update the legacy users store for admin functionality
    const updatedUser = {
      ...user,
      verificationStatus: 'pending' as VerificationStatus,
      verificationDocs: { ...docs, code },
      verificationRequestedAt: new Date().toISOString(),
    };
    
    persistUsers({
      ...users,
      [user.username]: updatedUser,
    });
    
    console.log('✅ Verification request submitted for:', user.username);
  };

  const setVerificationStatus = (
    username: string,
    status: VerificationStatus,
    rejectionReason?: string
  ) => {
    const targetUser = users[username];
    if (!targetUser) return;

    const updatedUser = {
      ...targetUser,
      verificationStatus: status,
      isVerified: status === 'verified',
      verificationRejectionReason: rejectionReason,
    };

    persistUsers({
      ...users,
      [username]: updatedUser,
    });

    // If this is the current user, update auth context
    if (user && user.username === username) {
      updateUser({
        verificationStatus: status,
        isVerified: status === 'verified',
        verificationRejectionReason: rejectionReason,
      });
    }
  };

  const contextValue: ListingContextType = {
    isAuthReady,
    listings,
    addListing,
    addAuctionListing,
    removeListing,
    updateListing,
    placeBid,
    getAuctionListings,
    getActiveAuctions,
    getEndedAuctions,
    checkEndedAuctions,
    cancelAuction,
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
  };

  return <ListingContext.Provider value={contextValue}>{children}</ListingContext.Provider>;
};

export const useListings = () => {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingProvider');
  }
  return context;
};