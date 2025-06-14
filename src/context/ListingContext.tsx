// src/context/ListingContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext'; // ✅ FIXED: Import AuthContext
import { Order } from './WalletContext';
import { v4 as uuidv4 } from 'uuid';
import { getSellerTierMemoized } from '@/utils/sellerTiers';

export type Role = 'buyer' | 'seller' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type VerificationDocs = {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
  code?: string;
};

// ✅ FIXED: Remove conflicting User type since we'll use AuthContext's User
export type Bid = {
  id: string;
  bidder: string;
  amount: number;
  date: string;
};

export type AuctionStatus = 'active' | 'ended' | 'cancelled';

export type AuctionSettings = {
  isAuction: boolean;
  startingPrice: number;
  reservePrice?: number;
  endTime: string;
  bids: Bid[];
  highestBid?: number;
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
  // ✅ FIXED: Remove user management from ListingContext - use AuthContext instead
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
  
  // ✅ FIXED: Add users access for admin functionality
  users: { [username: string]: any };
  
  orderHistory: Order[];
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ FIXED: Use AuthContext for user management
  const { user, updateUser } = useAuth();
  
  const [users, setUsers] = useState<{ [username: string]: any }>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [buyer: string]: string[] }>({});
  const [notificationStore, setNotificationStore] = useState<NotificationStore>({});
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Health check: context state
  useEffect(() => {
    if (!user) {
      console.warn('[PantyPost] ListingContext: No user loaded from AuthContext.');
    }
    if (!Array.isArray(listings)) {
      console.error('[PantyPost] ListingContext: Listings is not an array!', listings);
    }
    if (typeof subscriptions !== 'object') {
      console.error('[PantyPost] ListingContext: Subscriptions is not an object!', subscriptions);
    }
    if (
      user?.role === 'seller' &&
      notificationStore[user.username] !== undefined &&
      !Array.isArray(notificationStore[user.username])
    ) {
      console.error('[PantyPost] sellerNotifications is not an array:', notificationStore[user.username]);
    }
  }, [user, listings, subscriptions, notificationStore]);

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
    localStorage.setItem('seller_notifications_store', JSON.stringify(store));
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

  // Migration function to convert old notifications to new format
  const migrateNotifications = (notifications: NotificationItem[]): Notification[] => {
    return notifications.map(normalizeNotification);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ✅ FIXED: Only load ListingContext-specific data, not user data
      const storedUsers = localStorage.getItem('all_users_v2');
      const storedListings = localStorage.getItem('listings');
      const storedSubs = localStorage.getItem('subscriptions');
      const storedNotifications = localStorage.getItem('seller_notifications_store');

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedListings) setListings(JSON.parse(storedListings));
      if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
      if (storedNotifications) {
        try {
          const parsed = JSON.parse(storedNotifications);
          const migrated: NotificationStore = {};
          Object.keys(parsed).forEach(username => {
            if (Array.isArray(parsed[username])) {
              migrated[username] = migrateNotifications(parsed[username]);
            }
          });
          setNotificationStore(migrated);
          saveNotificationStore(migrated);
        } catch (e) {
          console.error("Error parsing notification store:", e);
          setNotificationStore({});
          saveNotificationStore({});
        }
      } else {
        setNotificationStore({});
        saveNotificationStore({});
      }

      // Clean up old notification storage
      localStorage.removeItem('seller_notifications');
      localStorage.removeItem('seller_notifications_by_id');
      localStorage.removeItem('seller_notifications_map');

      setIsAuthReady(true);
    }
  }, []);

  // Check for ended auctions on load and at regular intervals
  useEffect(() => {
    checkEndedAuctions();
    
    const interval = setInterval(() => {
      checkEndedAuctions();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [listings]);

  const persistUsers = (updated: { [username: string]: any }) => {
    setUsers(updated);
    localStorage.setItem('all_users_v2', JSON.stringify(updated));
  };

  // ✅ FIXED: Enforce listing limits for sellers using AuthContext user
  const addListing = (listing: NewListingInput) => {
    console.log('🔍 addListing called with user:', user); // Debug log
    
    if (!user || user.role !== 'seller') {
      console.error('❌ addListing failed: user is not a seller', { user: user?.username, role: user?.role });
      alert('You must be logged in as a seller to create listings.');
      return;
    }

    const myListings = listings.filter(l => l.seller === user.username);
    const isVerified = user.isVerified || user.verificationStatus === 'verified';
    const maxListings = isVerified ? 25 : 2;

    console.log('📊 Listing check:', {
      currentListings: myListings.length,
      maxListings,
      isVerified,
      username: user.username
    });

    if (myListings.length >= maxListings) {
      alert(
        isVerified
          ? 'You have reached the maximum of 25 listings for verified sellers.'
          : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.'
      );
      return;
    }

    const newListing: Listing = {
      id: uuidv4(),
      date: new Date().toISOString(),
      markedUpPrice: Math.round(listing.price * 1.1 * 100) / 100,
      isVerified: isVerified,
      ...listing,
    };
    
    console.log('✅ Creating new listing:', newListing);

    setListings((prev) => {
      const updated = [...prev, newListing];
      localStorage.setItem('listings', JSON.stringify(updated));
      console.log('💾 Saved listings to localStorage, total:', updated.length);
      return updated;
    });
  };

  // Add an auction listing
  const addAuctionListing = (listing: AddListingInput, auctionSettings: AuctionInput) => {
    if (!user || user.role !== 'seller') {
      alert('You must be logged in as a seller to create auction listings.');
      return;
    }

    const myListings = listings.filter(l => l.seller === user.username);
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

    const newListing: Listing = {
      id: uuidv4(),
      date: new Date().toISOString(),
      markedUpPrice: Math.round(listing.price * 1.1 * 100) / 100,
      isVerified: isVerified,
      ...listing,
      auction: {
        isAuction: true,
        startingPrice: auctionSettings.startingPrice,
        reservePrice: auctionSettings.reservePrice,
        endTime: auctionSettings.endTime,
        bids: [],
        status: 'active' as AuctionStatus
      }
    };

    setListings((prev) => {
      const updated = [...prev, newListing];
      localStorage.setItem('listings', JSON.stringify(updated));
      return updated;
    });

    addSellerNotification(
      user.username,
      `🔨 You've created a new auction: "${listing.title}" starting at $${auctionSettings.startingPrice.toFixed(2)}`
    );
  };

  const removeListing = (id: string) => {
    setListings((prev) => {
      const updated = prev.filter((listing) => listing.id !== id);
      localStorage.setItem('listings', JSON.stringify(updated));
      return updated;
    });
  };

  const updateListing = (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>) => {
    setListings(prev => {
      const updated = prev.map(listing => {
        if (listing.id === id) {
          const updatedItem = {
            ...listing,
            ...updatedListing,
          };
          if (updatedListing.price !== undefined) {
            updatedItem.markedUpPrice = Math.round(updatedListing.price * 1.1 * 100) / 100;
          }
          return updatedItem;
        }
        return listing;
      });
      
      localStorage.setItem('listings', JSON.stringify(updated));
      return updated;
    });
  };

  // Place a bid on an auction listing
  const placeBid = (listingId: string, bidder: string, amount: number): boolean => {
    const listingIndex = listings.findIndex(listing => listing.id === listingId);
    if (listingIndex === -1) return false;
    
    const listing = listings[listingIndex];
    
    if (!listing.auction || listing.auction.status !== 'active') return false;
    
    if (new Date(listing.auction.endTime).getTime() <= new Date().getTime()) {
      const updatedListings = [...listings];
      updatedListings[listingIndex] = {
        ...listing,
        auction: {
          ...listing.auction,
          status: 'ended' as AuctionStatus
        }
      };
      setListings(updatedListings);
      localStorage.setItem('listings', JSON.stringify(updatedListings));
      return false;
    }
    
    if (amount < listing.auction.startingPrice) return false;
    
    const currentHighestBid = listing.auction.highestBid || 0;
    if (amount <= currentHighestBid) return false;
    
    const bidderBalance = getBuyerBalance(bidder);
    if (bidderBalance < amount) {
      return false;
    }
    
    const bid: Bid = {
      id: uuidv4(),
      bidder,
      amount,
      date: new Date().toISOString()
    };
    
    const updatedListings = [...listings];
    updatedListings[listingIndex] = {
      ...listing,
      auction: {
        ...listing.auction,
        bids: [...listing.auction.bids, bid],
        highestBid: amount,
        highestBidder: bidder
      }
    };
    
    setListings(updatedListings);
    localStorage.setItem('listings', JSON.stringify(updatedListings));
    
    addSellerNotification(
      listing.seller,
      `💰 New bid! ${bidder} bid $${amount.toFixed(2)} on "${listing.title}"`
    );
    
    return true;
  };

  const getAuctionListings = (): Listing[] => {
    return listings.filter(listing => listing.auction?.isAuction);
  };

  const getActiveAuctions = (): Listing[] => {
    return listings.filter(listing => 
      listing.auction?.isAuction && 
      listing.auction.status === 'active'
    );
  };

  const getEndedAuctions = (): Listing[] => {
    return listings.filter(listing => 
      listing.auction?.isAuction && 
      listing.auction.status === 'ended'
    );
  };

  const findValidWinner = (bids: Bid[], reservePrice: number | undefined): Bid | null => {
    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
    const validBids = reservePrice 
      ? sortedBids.filter(bid => bid.amount >= reservePrice)
      : sortedBids;
      
    if (validBids.length === 0) return null;
    
    for (const bid of validBids) {
      const bidderBalance = getBuyerBalance(bid.bidder);
      if (bidderBalance >= bid.amount) {
        return bid;
      }
    }
    
    return null;
  };

  const checkEndedAuctions = () => {
    const lockKey = 'auction_check_lock';
    const lockExpiry = 5000;
    const instanceId = uuidv4();
    
    try {
      const now = Date.now();
      const existingLock = localStorage.getItem(lockKey);
      
      if (existingLock) {
        try {
          const lockData = JSON.parse(existingLock);
          if (lockData.expiry > now) {
            console.log(`[Auction Check ${instanceId}] Another instance is processing auctions`);
            return;
          }
        } catch (e) {
          // Invalid lock data, proceed to acquire
        }
      }
      
      const lockData = {
        expiry: now + lockExpiry,
        instanceId: instanceId,
        timestamp: now
      };
      localStorage.setItem(lockKey, JSON.stringify(lockData));
      
      const verifyLock = localStorage.getItem(lockKey);
      if (verifyLock) {
        try {
          const verifyData = JSON.parse(verifyLock);
          if (verifyData.instanceId !== instanceId) {
            console.log(`[Auction Check ${instanceId}] Lost lock race to ${verifyData.instanceId}`);
            return;
          }
        } catch (e) {
          // Proceed if we can't verify
        }
      }
      
      console.log(`[Auction Check ${instanceId}] Acquired lock, processing auctions...`);
      
      let updated = false;
      let removedListings: string[] = [];
      
      const updatedListings = listings.map(listing => {
        if (!listing.auction || listing.auction.status !== 'active') {
          return listing;
        }
        
        if (new Date(listing.auction.endTime).getTime() <= now) {
          updated = true;
          
          const processingKey = `auction_processing_${listing.id}`;
          const existingProcessing = localStorage.getItem(processingKey);
          
          if (existingProcessing) {
            console.log(`[Auction Check ${instanceId}] Auction ${listing.id} already being processed`);
            return listing;
          }
          
          localStorage.setItem(processingKey, JSON.stringify({
            instanceId: instanceId,
            expiry: now + 30000
          }));
          
          try {
            if (listing.auction.bids.length > 0) {
              const validWinner = findValidWinner(
                listing.auction.bids, 
                listing.auction.reservePrice
              );
              
              if (validWinner) {
                const winningBidder = validWinner.bidder;
                const winningBid = validWinner.amount;
                
                const purchaseListingCopy = {
                  ...listing,
                  price: winningBid,
                  markedUpPrice: Math.round(winningBid * 1.1 * 100) / 100
                };
                
                const sellerTierInfo = getSellerTierMemoized(listing.seller, orderHistory);
                const tierCreditPercent = sellerTierInfo.credit;
                const tierCreditAmount = winningBid * tierCreditPercent;
                
                const success = purchaseListing(purchaseListingCopy, winningBidder);
                
                if (success) {
                  if (tierCreditAmount > 0) {
                    addSellerNotification(
                      listing.seller,
                      `🏆 Auction ended: "${listing.title}" sold to ${winningBidder} for $${winningBid.toFixed(2)} (includes $${tierCreditAmount.toFixed(2)} ${sellerTierInfo.tier} tier credit)`
                    );
                  } else {
                    addSellerNotification(
                      listing.seller,
                      `🏆 Auction ended: "${listing.title}" sold to ${winningBidder} for $${winningBid.toFixed(2)}`
                    );
                  }
                  
                  if (listing.auction.highestBidder && winningBidder !== listing.auction.highestBidder) {
                    addSellerNotification(
                      listing.seller,
                      `ℹ️ Note: Original highest bidder ${listing.auction.highestBidder} had insufficient funds. Sold to next highest bidder.`
                    );
                  }
                  
                  addOrder({
                    ...purchaseListingCopy,
                    buyer: winningBidder,
                    date: new Date().toISOString(),
                    imageUrl: listing.imageUrls?.[0] || undefined,
                    wasAuction: true,
                    finalBid: winningBid,
                    tierCreditAmount: tierCreditAmount
                  });
                  
                  removedListings.push(listing.id);
                  localStorage.removeItem(processingKey);
                  return null;
                } else {
                  addSellerNotification(
                    listing.seller,
                    `⚠️ Auction payment error: Couldn't process payment for "${listing.title}"`
                  );
                }
              } else {
                if (listing.auction.reservePrice && listing.auction.highestBid && listing.auction.highestBid < listing.auction.reservePrice) {
                  addSellerNotification(
                    listing.seller,
                    `🔨 Auction ended: Reserve price not met for "${listing.title}"`
                  );
                } else if (listing.auction.highestBidder) {
                  addSellerNotification(
                    listing.seller,
                    `⚠️ Auction ended: Bidder ${listing.auction.highestBidder} had insufficient funds for "${listing.title}" and no other valid bidders were found.`
                  );
                }
              }
            } else {
              addSellerNotification(
                listing.seller,
                `🔨 Auction ended: No bids were placed on "${listing.title}"`
              );
            }
            
            localStorage.removeItem(processingKey);
            
            return {
              ...listing,
              auction: {
                ...listing.auction,
                status: 'ended' as AuctionStatus
              }
            };
          } catch (error) {
            console.error(`[Auction Check ${instanceId}] Error processing auction ${listing.id}:`, error);
            localStorage.removeItem(processingKey);
            return listing;
          }
        }
        
        return listing;
      }).filter(listing => listing !== null) as Listing[];
      
      const finalListings = updatedListings.filter(listing => !removedListings.includes(listing.id));
      
      if (updated || removedListings.length > 0) {
        setListings(finalListings);
        localStorage.setItem('listings', JSON.stringify(finalListings));
        console.log(`[Auction Check ${instanceId}] Processed ${removedListings.length} auctions`);
      }
      
    } finally {
      const currentLock = localStorage.getItem(lockKey);
      if (currentLock) {
        try {
          const lockData = JSON.parse(currentLock);
          if (lockData.instanceId === instanceId) {
            localStorage.removeItem(lockKey);
            console.log(`[Auction Check ${instanceId}] Released lock`);
          }
        } catch (e) {
          localStorage.removeItem(lockKey);
        }
      }
    }
  };

  const cancelAuction = (listingId: string): boolean => {
    if (!user) return false;
    
    const listingIndex = listings.findIndex(l => l.id === listingId);
    if (listingIndex === -1) return false;
    
    const listing = listings[listingIndex];
    
    if (user.role !== 'admin' && user.username !== listing.seller) return false;
    
    if (!listing.auction || listing.auction.status !== 'active') return false;
    
    const updatedListings = [...listings];
    updatedListings[listingIndex] = {
      ...listing,
      auction: {
        ...listing.auction,
        status: 'cancelled' as AuctionStatus
      }
    };
    
    setListings(updatedListings);
    localStorage.setItem('listings', JSON.stringify(updatedListings));
    
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
      setSubscriptions((prev) => {
        const updated = {
          ...prev,
          [buyer]: [...(prev[buyer] || []), seller],
        };
        localStorage.setItem('subscriptions', JSON.stringify(updated));
        return updated;
      });
      addSellerNotification(
        seller,
        `🎉 ${buyer} subscribed to you!`
      );
    }
    return success;
  };

  const unsubscribeFromSeller = (buyer: string, seller: string) => {
    setSubscriptions((prev) => {
      const updated = {
        ...prev,
        [buyer]: (prev[buyer] || []).filter((s) => s !== seller),
      };
      localStorage.setItem('subscriptions', JSON.stringify(updated));
      return updated;
    });
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

  // ✅ FIXED: Use AuthContext for verification instead of separate user management
  const requestVerification = (docs: VerificationDocs) => {
    if (!user) return;
    
    console.log('🔍 requestVerification called with user:', user.username);
    
    const code = docs.code || `VERIF-${user.username}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // ✅ FIXED: Update AuthContext user instead of local state
    updateUser({
      verificationStatus: 'pending',
      verificationRequestedAt: new Date().toISOString(),
      verificationDocs: { ...docs, code }, // Store docs in AuthContext too
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
    const existingUser = users[username];
    if (!existingUser) return;
    
    const updatedUser = {
      ...existingUser,
      verificationStatus: status,
      verified: status === 'verified',
      verificationReviewedAt: new Date().toISOString(),
      verificationRejectionReason: rejectionReason,
    };
    
    // ✅ FIXED: Also update AuthContext if this is the current user
    if (user?.username === username) {
      updateUser({
        verificationStatus: status,
        isVerified: status === 'verified',
        verificationRejectionReason: rejectionReason,
      });
    }
    
    persistUsers({
      ...users,
      [username]: updatedUser,
    });

    setListings(prev => {
      return prev.map(listing => {
        if (listing.seller === username) {
          return { ...listing, isVerified: status === 'verified' };
        }
        return listing;
      });
    });
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