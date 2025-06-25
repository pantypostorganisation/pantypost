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
import { useWallet } from './WalletContext.enhanced';
import { useAuth } from './AuthContext';
import { Order } from './WalletContext.enhanced';
import { v4 as uuidv4 } from 'uuid';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { listingsService, usersService, storageService } from '@/services';

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
  isAuthReady: boolean;
  listings: Listing[];
  addListing: (listing: AddListingInput) => Promise<void>;
  addAuctionListing: (listing: AddListingInput, auctionSettings: AuctionInput) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  updateListing: (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>) => Promise<void>;
  
  // Auction functions
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  getAuctionListings: () => Listing[];
  getActiveAuctions: () => Listing[];
  getEndedAuctions: () => Listing[];
  checkEndedAuctions: () => Promise<void>;
  cancelAuction: (listingId: string) => Promise<boolean>;
  
  subscriptions: { [buyer: string]: string[] };
  subscribeToSeller: (buyer: string, seller: string, price: number) => Promise<boolean>;
  unsubscribeFromSeller: (buyer: string, seller: string) => Promise<void>;
  isSubscribed: (buyer: string, seller: string) => boolean;
  
  // Updated notification system
  sellerNotifications: Notification[];
  addSellerNotification: (seller: string, message: string) => void;
  clearSellerNotification: (notificationId: string | number) => void;
  restoreSellerNotification: (notificationId: string) => void;
  permanentlyDeleteSellerNotification: (notificationId: string) => void;

  requestVerification: (docs: VerificationDocs) => Promise<void>;
  setVerificationStatus: (username: string, status: VerificationStatus, rejectionReason?: string) => Promise<void>;
  
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
  const saveNotificationStore = async (store: NotificationStore) => {
    await storageService.setItem('seller_notifications_store', store);
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

  // Load initial data using services
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Load users
        const usersResult = await usersService.getUsers();
        if (usersResult.success && usersResult.data) {
          setUsers(usersResult.data);
        }

        // Load listings
        const listingsResult = await listingsService.getListings();
        if (listingsResult.success && listingsResult.data) {
          setListings(listingsResult.data);
        }

        // Load subscriptions
        const storedSubs = await storageService.getItem<{ [buyer: string]: string[] }>('subscriptions', {});
        setSubscriptions(storedSubs);

        // Load notifications
        const storedNotifications = await storageService.getItem<NotificationStore>('seller_notifications_store', {});
        const migrated: NotificationStore = {};
        Object.keys(storedNotifications).forEach(username => {
          if (Array.isArray(storedNotifications[username])) {
            migrated[username] = migrateNotifications(storedNotifications[username]);
          }
        });
        setNotificationStore(migrated);
        await saveNotificationStore(migrated);

        // Clean up old notification storage
        await storageService.removeItem('seller_notifications');
        await storageService.removeItem('seller_notifications_by_id');
        await storageService.removeItem('seller_notifications_map');

        setIsAuthReady(true);
      } catch (error) {
        console.error('Error loading ListingContext data:', error);
        setIsAuthReady(true);
      }
    };

    loadData();
  }, []);

  // Check for ended auctions on load and at regular intervals
  useEffect(() => {
    checkEndedAuctions();
    
    const interval = setInterval(() => {
      checkEndedAuctions();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [listings]);

  const persistUsers = async (updated: { [username: string]: any }) => {
    setUsers(updated);
    await storageService.setItem('all_users_v2', updated);
  };

  // Use listings service for adding listings
  const addListing = async (listing: NewListingInput): Promise<void> => {
    console.log('🔍 addListing called with user:', user);
    
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

    try {
      const result = await listingsService.createListing({
        ...listing,
        seller: user.username,
        isVerified: isVerified,
      });

      if (result.success && result.data) {
        setListings(prev => [...prev, result.data!]);
        console.log('✅ Created new listing:', result.data);
      } else {
        console.error('Failed to create listing:', result.error);
        alert('Failed to create listing. Please try again.');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('An error occurred while creating the listing.');
    }
  };

  // Add an auction listing
  const addAuctionListing = async (listing: AddListingInput, auctionSettings: AuctionInput): Promise<void> => {
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

    try {
      const result = await listingsService.createListing({
        ...listing,
        seller: user.username,
        isVerified: isVerified,
        auction: auctionSettings,
      });

      if (result.success && result.data) {
        setListings(prev => [...prev, result.data!]);
        
        addSellerNotification(
          user.username,
          `🔨 You've created a new auction: "${listing.title}" starting at $${auctionSettings.startingPrice.toFixed(2)}`
        );
      } else {
        alert('Failed to create auction listing. Please try again.');
      }
    } catch (error) {
      console.error('Error creating auction listing:', error);
      alert('An error occurred while creating the auction listing.');
    }
  };

  const removeListing = async (id: string): Promise<void> => {
    try {
      const result = await listingsService.deleteListing(id);
      if (result.success) {
        setListings(prev => prev.filter(listing => listing.id !== id));
      }
    } catch (error) {
      console.error('Error removing listing:', error);
    }
  };

  const updateListing = async (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>): Promise<void> => {
    try {
      const result = await listingsService.updateListing(id, updatedListing);
      if (result.success && result.data) {
        setListings(prev => prev.map(listing => 
          listing.id === id ? result.data! : listing
        ));
      }
    } catch (error) {
      console.error('Error updating listing:', error);
    }
  };

  // Place a bid on an auction listing
  const placeBid = async (listingId: string, bidder: string, amount: number): Promise<boolean> => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing || !listing.auction || listing.auction.status !== 'active') return false;
    
    if (new Date(listing.auction.endTime).getTime() <= new Date().getTime()) {
      await checkEndedAuctions();
      return false;
    }
    
    if (amount < listing.auction.startingPrice) return false;
    
    const currentHighestBid = listing.auction.highestBid || 0;
    if (amount <= currentHighestBid) return false;
    
    const bidderBalance = getBuyerBalance(bidder);
    if (bidderBalance < amount) {
      return false;
    }
    
    try {
      const result = await listingsService.placeBid(listingId, bidder, amount);
      if (result.success && result.data) {
        setListings(prev => prev.map(l => l.id === listingId ? result.data! : l));
        
        addSellerNotification(
          listing.seller,
          `💰 New bid! ${bidder} bid $${amount.toFixed(2)} on "${listing.title}"`
        );
        
        return true;
      }
    } catch (error) {
      console.error('Error placing bid:', error);
    }
    
    return false;
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

  const checkEndedAuctions = async (): Promise<void> => {
    const lockKey = 'auction_check_lock';
    const lockExpiry = 5000;
    const instanceId = uuidv4();
    
    try {
      const now = Date.now();
      const existingLock = await storageService.getItem<any>(lockKey, null);
      
      if (existingLock) {
        if (existingLock.expiry > now) {
          console.log(`[Auction Check ${instanceId}] Another instance is processing auctions`);
          return;
        }
      }
      
      const lockData = {
        expiry: now + lockExpiry,
        instanceId: instanceId,
        timestamp: now
      };
      await storageService.setItem(lockKey, lockData);
      
      const verifyLock = await storageService.getItem<any>(lockKey, null);
      if (verifyLock && verifyLock.instanceId !== instanceId) {
        console.log(`[Auction Check ${instanceId}] Lost lock race to ${verifyLock.instanceId}`);
        return;
      }
      
      console.log(`[Auction Check ${instanceId}] Acquired lock, processing auctions...`);
      
      let updated = false;
      let removedListings: string[] = [];
      
      const updatedListings = await Promise.all(listings.map(async (listing) => {
        if (!listing.auction || listing.auction.status !== 'active') {
          return listing;
        }
        
        if (new Date(listing.auction.endTime).getTime() <= now) {
          updated = true;
          
          const processingKey = `auction_processing_${listing.id}`;
          const existingProcessing = await storageService.getItem<any>(processingKey, null);
          
          if (existingProcessing) {
            console.log(`[Auction Check ${instanceId}] Auction ${listing.id} already being processed`);
            return listing;
          }
          
          await storageService.setItem(processingKey, {
            instanceId: instanceId,
            expiry: now + 30000
          });
          
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
                
                const success = await purchaseListing(purchaseListingCopy, winningBidder);
                
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
                  
                  await addOrder({
                    ...purchaseListingCopy,
                    buyer: winningBidder,
                    date: new Date().toISOString(),
                    imageUrl: listing.imageUrls?.[0] || undefined,
                    wasAuction: true,
                    finalBid: winningBid,
                    tierCreditAmount: tierCreditAmount
                  });
                  
                  removedListings.push(listing.id);
                  await storageService.removeItem(processingKey);
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
            
            await storageService.removeItem(processingKey);
            
            return {
              ...listing,
              auction: {
                ...listing.auction,
                status: 'ended' as AuctionStatus
              }
            };
          } catch (error) {
            console.error(`[Auction Check ${instanceId}] Error processing auction ${listing.id}:`, error);
            await storageService.removeItem(processingKey);
            return listing;
          }
        }
        
        return listing;
      }));
      
      // Filter out null values after all promises resolve
      const filteredListings = updatedListings.filter((listing): listing is Listing => listing !== null);
      const finalListings = filteredListings.filter(listing => !removedListings.includes(listing.id));
      
      if (updated || removedListings.length > 0) {
        setListings(finalListings);
        await storageService.setItem('listings', finalListings);
        console.log(`[Auction Check ${instanceId}] Processed ${removedListings.length} auctions`);
      }
      
    } finally {
      const currentLock = await storageService.getItem<any>(lockKey, null);
      if (currentLock && currentLock.instanceId === instanceId) {
        await storageService.removeItem(lockKey);
        console.log(`[Auction Check ${instanceId}] Released lock`);
      }
    }
  };

  const cancelAuction = async (listingId: string): Promise<boolean> => {
    if (!user) return false;
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return false;
    
    if (user.role !== 'admin' && user.username !== listing.seller) return false;
    
    if (!listing.auction || listing.auction.status !== 'active') return false;
    
    try {
      const result = await listingsService.cancelAuction(listingId);
      if (result.success && result.data) {
        setListings(prev => prev.map(l => l.id === listingId ? result.data! : l));
        
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
      }
    } catch (error) {
      console.error('Error cancelling auction:', error);
    }
    
    return false;
  };

  const subscribeToSeller = async (buyer: string, seller: string, price: number): Promise<boolean> => {
    const success = await subscribeToSellerWithPayment(buyer, seller, price);
    if (success) {
      setSubscriptions((prev) => {
        const updated = {
          ...prev,
          [buyer]: [...(prev[buyer] || []), seller],
        };
        storageService.setItem('subscriptions', updated);
        return updated;
      });
      addSellerNotification(
        seller,
        `🎉 ${buyer} subscribed to you!`
      );
    }
    return success;
  };

  const unsubscribeFromSeller = async (buyer: string, seller: string): Promise<void> => {
    setSubscriptions((prev) => {
      const updated = {
        ...prev,
        [buyer]: (prev[buyer] || []).filter((s) => s !== seller),
      };
      storageService.setItem('subscriptions', updated);
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

  const requestVerification = async (docs: VerificationDocs): Promise<void> => {
    if (!user) return;
    
    console.log('🔍 requestVerification called with user:', user.username);
    
    const code = docs.code || `VERIF-${user.username}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    try {
      const result = await usersService.requestVerification(user.username, { ...docs, code });
      
      if (result.success) {
        await updateUser({
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
        
        await persistUsers({
          ...users,
          [user.username]: updatedUser,
        });
        
        console.log('✅ Verification request submitted for:', user.username);
      } else {
        console.error('Failed to submit verification request:', result.error);
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
    const existingUser = users[username];
    if (!existingUser) return;
    
    try {
      const result = await usersService.updateVerificationStatus(username, {
        status,
        rejectionReason,
        adminUsername: user?.username || 'admin',
      });
      
      if (result.success) {
        const updatedUser = {
          ...existingUser,
          verificationStatus: status,
          verified: status === 'verified',
          verificationReviewedAt: new Date().toISOString(),
          verificationRejectionReason: rejectionReason,
        };
        
        // Also update AuthContext if this is the current user
        if (user?.username === username) {
          await updateUser({
            verificationStatus: status,
            isVerified: status === 'verified',
            verificationRejectionReason: rejectionReason,
          });
        }
        
        await persistUsers({
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
      } else {
        console.error('Failed to update verification status:', result.error);
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
