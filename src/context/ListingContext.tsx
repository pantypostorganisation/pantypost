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
import { Order } from './WalletContext'; // Import Order type from WalletContext
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

export type User = {
  username: string;
  role: Role;
  verified?: boolean;
  verificationStatus?: VerificationStatus;
  verificationDocs?: VerificationDocs;
  verificationRequestedAt?: string;
  verificationReviewedAt?: string;
  verificationRejectionReason?: string;
  profilePic?: string | null;
};

export type Bid = {
  id: string;
  bidder: string;
  amount: number;
  date: string;
};

// Define as a proper string union type instead of an enum
export type AuctionStatus = 'active' | 'ended' | 'cancelled';

export type AuctionSettings = {
  isAuction: boolean;
  startingPrice: number;
  reservePrice?: number;
  endTime: string; // ISO date string when auction ends
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
  
  // Auction properties
  auction?: AuctionSettings;
};

export type NewListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;
export type AddListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;

// For creating an auction listing
export type AuctionInput = {
  startingPrice: number;
  reservePrice?: number;
  endTime: string; // ISO date string
};

// New notification structure
export type Notification = {
  id: string;
  message: string;
  timestamp: string;
  cleared: boolean;
};

// Support both old string format and new object format for backwards compatibility
export type NotificationItem = string | Notification;

type NotificationStore = Record<string, NotificationItem[]>;

type ListingContextType = {
  user: User | null;
  role: Role | null;
  users: { [username: string]: User };
  login: (username: string, role: Role) => void;
  logout: () => void;

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
  checkEndedAuctions: () => void; // Checks if any auctions have ended and processes them
  cancelAuction: (listingId: string) => boolean; // Only seller can cancel
  
  subscriptions: { [buyer: string]: string[] };
  subscribeToSeller: (buyer: string, seller: string, price: number) => boolean;
  unsubscribeFromSeller: (buyer: string, seller: string) => void;
  isSubscribed: (buyer: string, seller: string) => boolean;
  
  // Updated notification system
  sellerNotifications: Notification[];
  addSellerNotification: (seller: string, message: string) => void;
  clearSellerNotification: (notificationId: string | number) => void; // Now supports both ID and index for backwards compatibility
  restoreSellerNotification: (notificationId: string) => void;
  permanentlyDeleteSellerNotification: (notificationId: string) => void;

  requestVerification: (docs: VerificationDocs) => void;
  setVerificationStatus: (username: string, status: VerificationStatus, rejectionReason?: string) => void;
  
  // Add orderHistory property
  orderHistory: Order[];
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<{ [username: string]: User }>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [buyer: string]: string[] }>({});
  const [notificationStore, setNotificationStore] = useState<NotificationStore>({});
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Health check: context state
  useEffect(() => {
    if (!user) {
      console.warn('[PantyPost] ListingContext: No user loaded from localStorage.');
    }
    if (!Array.isArray(listings)) {
      console.error('[PantyPost] ListingContext: Listings is not an array!', listings);
    }
    if (typeof subscriptions !== 'object') {
      console.error('[PantyPost] ListingContext: Subscriptions is not an object!', subscriptions);
    }
    // Only log if the value is defined and not an array (undefined is fine for no notifications)
    if (
      user?.role === 'seller' &&
      notificationStore[user.username] !== undefined &&
      !Array.isArray(notificationStore[user.username])
    ) {
      console.error('[PantyPost] sellerNotifications is not an array:', notificationStore[user.username]);
    }
  }, [user, listings, subscriptions, notificationStore]);

  // LocalStorage integrity check
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && typeof JSON.parse(userStr) !== 'object') throw new Error('User data corrupted');
      // Add more keys as needed
    } catch (e) {
      console.error('[PantyPost] LocalStorage integrity check failed:', e);
    }
  }, []);

  // Helper function to normalize notification items to the new format
  const normalizeNotification = (item: NotificationItem): Notification => {
    if (typeof item === 'string') {
      // Convert old string format to new object format
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
      const storedUser = localStorage.getItem('user');
      const storedUsers = localStorage.getItem('all_users_v2');
      const storedListings = localStorage.getItem('listings');
      const storedSubs = localStorage.getItem('subscriptions');
      const storedNotifications = localStorage.getItem('seller_notifications_store');

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedListings) setListings(JSON.parse(storedListings));
      if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
      if (storedNotifications) {
        try {
          const parsed = JSON.parse(storedNotifications);
          // Migrate old format to new format if needed
          const migrated: NotificationStore = {};
          Object.keys(parsed).forEach(username => {
            if (Array.isArray(parsed[username])) {
              migrated[username] = migrateNotifications(parsed[username]);
            }
          });
          setNotificationStore(migrated);
          // Save the migrated format back to localStorage
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

      localStorage.removeItem('seller_notifications');
      localStorage.removeItem('seller_notifications_by_id');
      localStorage.removeItem('seller_notifications_map');

      setIsAuthReady(true);
    }
  }, []);

  // Check for ended auctions on load and at regular intervals
  useEffect(() => {
    // Check on initial load
    checkEndedAuctions();
    
    // Set up interval for checking auctions regularly
    const interval = setInterval(() => {
      checkEndedAuctions();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [listings]);

  // Storage quota warning
  useEffect(() => {
    try {
      const used = new Blob(Object.values(localStorage)).size;
      if (used > 4 * 1024 * 1024) {
        console.warn('[PantyPost] LocalStorage usage high:', used, 'bytes');
      }
    } catch { }
  }, []);

  const persistUsers = (updated: { [username: string]: User }) => {
    setUsers(updated);
    localStorage.setItem('all_users_v2', JSON.stringify(updated));
  };

  const login = (username: string, selectedRole: Role) => {
    const normalized = username.trim().toLowerCase();
    const actualRole: Role =
      (normalized === 'gerome' || normalized === 'oakley') ? 'admin' : selectedRole;

    let existingUser: User | undefined = users[normalized];
    if (existingUser && existingUser.role !== selectedRole && actualRole !== 'admin') {
      alert("User already exists with a different role. You cannot sign up as both a seller and buyer.");
      return;
    }
    const newUser: User = {
      username: normalized,
      role: actualRole,
      verified: existingUser?.verified ?? false,
      verificationStatus: existingUser?.verificationStatus ?? 'unverified',
      verificationDocs: existingUser?.verificationDocs ?? {},
      verificationRequestedAt: existingUser?.verificationRequestedAt,
      verificationReviewedAt: existingUser?.verificationReviewedAt,
      verificationRejectionReason: existingUser?.verificationRejectionReason,
      profilePic: existingUser?.profilePic ?? null,
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    persistUsers({
      ...users,
      [normalized]: newUser,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Enforce listing limits for sellers
  const addListing = (listing: NewListingInput) => {
    if (!user || user.role !== 'seller') return;

    const myListings = listings.filter(l => l.seller === user.username);
    const isVerified = user.verified || user.verificationStatus === 'verified';
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
    };
    setListings((prev) => {
      const updated = [...prev, newListing];
      localStorage.setItem('listings', JSON.stringify(updated));
      return updated;
    });
  };

  // Add an auction listing
  const addAuctionListing = (listing: AddListingInput, auctionSettings: AuctionInput) => {
    if (!user || user.role !== 'seller') return;

    const myListings = listings.filter(l => l.seller === user.username);
    const isVerified = user.verified || user.verificationStatus === 'verified';
    const maxListings = isVerified ? 25 : 2;

    if (myListings.length >= maxListings) {
      alert(
        isVerified
          ? 'You have reached the maximum of 25 listings for verified sellers.'
          : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.'
      );
      return;
    }

    // Create new listing with auction settings
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

    // Add notification to seller
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
      
      // Save updated listings to localStorage
      localStorage.setItem('listings', JSON.stringify(updated));
      return updated;
    });
  };

  // Place a bid on an auction listing
  const placeBid = (listingId: string, bidder: string, amount: number): boolean => {
    // Find the listing
    const listingIndex = listings.findIndex(listing => listing.id === listingId);
    if (listingIndex === -1) return false;
    
    const listing = listings[listingIndex];
    
    // Check if it's an auction listing and active
    if (!listing.auction || listing.auction.status !== 'active') return false;
    
    // Check if auction has ended
    if (new Date(listing.auction.endTime).getTime() <= new Date().getTime()) {
      // Update auction status to ended
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
    
    // Check if bid amount is higher than starting price
    if (amount < listing.auction.startingPrice) return false;
    
    // Check if bid amount is higher than highest bid
    const currentHighestBid = listing.auction.highestBid || 0;
    if (amount <= currentHighestBid) return false;
    
    // Check if bidder has sufficient funds in wallet
    const bidderBalance = getBuyerBalance(bidder);
    if (bidderBalance < amount) {
      return false; // Insufficient funds
    }
    
    // Add the bid
    const bid: Bid = {
      id: uuidv4(),
      bidder,
      amount,
      date: new Date().toISOString()
    };
    
    // Update the listing with the new bid
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
    
    // Notify the seller
    addSellerNotification(
      listing.seller,
      `💰 New bid! ${bidder} bid $${amount.toFixed(2)} on "${listing.title}"`
    );
    
    return true;
  };

  // Get all auction listings
  const getAuctionListings = (): Listing[] => {
    return listings.filter(listing => listing.auction?.isAuction);
  };

  // Get active auctions
  const getActiveAuctions = (): Listing[] => {
    return listings.filter(listing => 
      listing.auction?.isAuction && 
      listing.auction.status === 'active'
    );
  };

  // Get ended auctions
  const getEndedAuctions = (): Listing[] => {
    return listings.filter(listing => 
      listing.auction?.isAuction && 
      listing.auction.status === 'ended'
    );
  };

  // Find the highest bidder with sufficient funds
  const findValidWinner = (bids: Bid[], reservePrice: number | undefined): Bid | null => {
    // Sort bids from highest to lowest
    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
    
    // Filter out bids below reserve price if any
    const validBids = reservePrice 
      ? sortedBids.filter(bid => bid.amount >= reservePrice)
      : sortedBids;
      
    if (validBids.length === 0) return null;
    
    // Check each bidder in order until finding one with sufficient funds
    for (const bid of validBids) {
      const bidderBalance = getBuyerBalance(bid.bidder);
      if (bidderBalance >= bid.amount) {
        return bid;
      }
    }
    
    return null; // No valid winners found
  };

  // FIXED: Check for ended auctions with distributed lock to prevent race conditions
  const checkEndedAuctions = () => {
    const lockKey = 'auction_check_lock';
    const lockExpiry = 5000; // 5 seconds
    const instanceId = uuidv4(); // Unique ID for this check instance
    
    try {
      // Try to acquire lock
      const now = Date.now();
      const existingLock = localStorage.getItem(lockKey);
      
      if (existingLock) {
        try {
          const lockData = JSON.parse(existingLock);
          // Check if lock is expired
          if (lockData.expiry > now) {
            console.log(`[Auction Check ${instanceId}] Another instance is processing auctions`);
            return; // Another tab/instance is processing
          }
        } catch (e) {
          // Invalid lock data, proceed to acquire
        }
      }
      
      // Set lock with expiry time and instance ID
      const lockData = {
        expiry: now + lockExpiry,
        instanceId: instanceId,
        timestamp: now
      };
      localStorage.setItem(lockKey, JSON.stringify(lockData));
      
      // Double-check we own the lock (in case of race condition)
      const verifyLock = localStorage.getItem(lockKey);
      if (verifyLock) {
        try {
          const verifyData = JSON.parse(verifyLock);
          if (verifyData.instanceId !== instanceId) {
            console.log(`[Auction Check ${instanceId}] Lost lock race to ${verifyData.instanceId}`);
            return; // Another instance won the race
          }
        } catch (e) {
          // Proceed if we can't verify
        }
      }
      
      console.log(`[Auction Check ${instanceId}] Acquired lock, processing auctions...`);
      
      // Process auctions
      let updated = false;
      let removedListings: string[] = [];
      
      const updatedListings = listings.map(listing => {
        // Skip non-auction listings or already ended auctions
        if (!listing.auction || listing.auction.status !== 'active') {
          return listing;
        }
        
        // Check if auction has ended
        if (new Date(listing.auction.endTime).getTime() <= now) {
          updated = true;
          
          // Create a processing marker to prevent duplicate processing
          const processingKey = `auction_processing_${listing.id}`;
          const existingProcessing = localStorage.getItem(processingKey);
          
          if (existingProcessing) {
            console.log(`[Auction Check ${instanceId}] Auction ${listing.id} already being processed`);
            return listing; // Skip if already being processed
          }
          
          // Mark as processing with 30 second expiry
          localStorage.setItem(processingKey, JSON.stringify({
            instanceId: instanceId,
            expiry: now + 30000
          }));
          
          try {
            // Process auction if there are bids
            if (listing.auction.bids.length > 0) {
              // Find a valid winner (someone with sufficient funds)
              const validWinner = findValidWinner(
                listing.auction.bids, 
                listing.auction.reservePrice
              );
              
              if (validWinner) {
                // Process the winning bid
                const winningBidder = validWinner.bidder;
                const winningBid = validWinner.amount;
                
                // Create a copy of the listing for purchase with proper pricing
                const purchaseListingCopy = {
                  ...listing,
                  price: winningBid,
                  markedUpPrice: Math.round(winningBid * 1.1 * 100) / 100
                };
                
                // Calculate seller tier credit
                const sellerTierInfo = getSellerTierMemoized(listing.seller, orderHistory);
                const tierCreditPercent = sellerTierInfo.credit;
                const tierCreditAmount = winningBid * tierCreditPercent;
                
                // Process the purchase
                const success = purchaseListing(purchaseListingCopy, winningBidder);
                
                if (success) {
                  // Notify seller of the winner and any tier credit
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
                  
                  // If the winning bidder is not the highest bidder, notify both
                  if (listing.auction.highestBidder && winningBidder !== listing.auction.highestBidder) {
                    addSellerNotification(
                      listing.seller,
                      `ℹ️ Note: Original highest bidder ${listing.auction.highestBidder} had insufficient funds. Sold to next highest bidder.`
                    );
                  }
                  
                  // Add to order history with auction flag to track auction orders
                  addOrder({
                    ...purchaseListingCopy,
                    buyer: winningBidder,
                    date: new Date().toISOString(),
                    imageUrl: listing.imageUrls?.[0] || undefined,
                    wasAuction: true, // Add flag to indicate this was an auction
                    finalBid: winningBid,
                    tierCreditAmount: tierCreditAmount // Store the tier credit amount
                  });
                  
                  // Mark listing for removal since it has been sold
                  removedListings.push(listing.id);
                  
                  // Clean up processing marker
                  localStorage.removeItem(processingKey);
                  
                  return null;
                } else {
                  // This shouldn't happen since we verified funds above, but just in case
                  addSellerNotification(
                    listing.seller,
                    `⚠️ Auction payment error: Couldn't process payment for "${listing.title}"`
                  );
                }
              } else {
                // No valid winner with sufficient funds
                if (listing.auction.reservePrice && listing.auction.highestBid && listing.auction.highestBid < listing.auction.reservePrice) {
                  // Reserve price not met
                  addSellerNotification(
                    listing.seller,
                    `🔨 Auction ended: Reserve price not met for "${listing.title}"`
                  );
                } else if (listing.auction.highestBidder) {
                  // Highest bidder had insufficient funds (and no other valid bidders)
                  addSellerNotification(
                    listing.seller,
                    `⚠️ Auction ended: Bidder ${listing.auction.highestBidder} had insufficient funds for "${listing.title}" and no other valid bidders were found.`
                  );
                }
              }
            } else {
              // No bids placed
              addSellerNotification(
                listing.seller,
                `🔨 Auction ended: No bids were placed on "${listing.title}"`
              );
            }
            
            // Clean up processing marker
            localStorage.removeItem(processingKey);
            
            // Mark auction as ended if it wasn't removed
            return {
              ...listing,
              auction: {
                ...listing.auction,
                status: 'ended' as AuctionStatus
              }
            };
          } catch (error) {
            console.error(`[Auction Check ${instanceId}] Error processing auction ${listing.id}:`, error);
            // Clean up processing marker on error
            localStorage.removeItem(processingKey);
            return listing;
          }
        }
        
        return listing;
      }).filter(listing => listing !== null) as Listing[]; // Filter out null entries (sold listings)
      
      // Remove listings that were sold
      const finalListings = updatedListings.filter(listing => !removedListings.includes(listing.id));
      
      if (updated || removedListings.length > 0) {
        setListings(finalListings);
        localStorage.setItem('listings', JSON.stringify(finalListings));
        console.log(`[Auction Check ${instanceId}] Processed ${removedListings.length} auctions`);
      }
      
    } finally {
      // Always release lock when done
      const currentLock = localStorage.getItem(lockKey);
      if (currentLock) {
        try {
          const lockData = JSON.parse(currentLock);
          // Only remove if we own the lock
          if (lockData.instanceId === instanceId) {
            localStorage.removeItem(lockKey);
            console.log(`[Auction Check ${instanceId}] Released lock`);
          }
        } catch (e) {
          // Remove invalid lock
          localStorage.removeItem(lockKey);
        }
      }
    }
  };

  // Cancel an auction
  const cancelAuction = (listingId: string): boolean => {
    if (!user) return false;
    
    const listingIndex = listings.findIndex(l => l.id === listingId);
    if (listingIndex === -1) return false;
    
    const listing = listings[listingIndex];
    
    // Only seller or admin can cancel
    if (user.role !== 'admin' && user.username !== listing.seller) return false;
    
    // Check if it's an auction and still active
    if (!listing.auction || listing.auction.status !== 'active') return false;
    
    // Update the listing
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
    
    // Notify if bids exist
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

  // --- NOTIFICATION ON SUBSCRIBE ---
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
      // Add notification for the seller
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
    // Ensure all notifications are in the new format
    return userNotifications.map(normalizeNotification);
  };

  // Updated clear function - now marks as cleared instead of deleting
  const clearSellerNotification = (notificationId: string | number) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    setNotificationStore(prev => {
      const updatedNotifications = userNotifications.map((item, index) => {
        const notification = normalizeNotification(item);
        
        // Support both ID-based and index-based clearing for backwards compatibility
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

  // New function to restore a cleared notification
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

  // New function to permanently delete a notification
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

  // --- Seller Verification Logic ---

  const requestVerification = (docs: VerificationDocs) => {
    if (!user) return;
    const normalized = user.username;
    const code = docs.code || `VERIF-${normalized}-${Math.floor(100000 + Math.random() * 900000)}`;
    const updatedUser: User = {
      ...user,
      verificationStatus: 'pending',
      verificationDocs: { ...docs, code },
      verificationRequestedAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    persistUsers({
      ...users,
      [normalized]: updatedUser,
    });
  };

  const setVerificationStatus = (
    username: string,
    status: VerificationStatus,
    rejectionReason?: string
  ) => {
    const existingUser = users[username];
    if (!existingUser) return;
    const updatedUser: User = {
      ...existingUser,
      verificationStatus: status,
      verified: status === 'verified',
      verificationReviewedAt: new Date().toISOString(),
      verificationRejectionReason: rejectionReason,
    };
    if (user?.username === username) setUser(updatedUser);
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
        user,
        role: user?.role ?? null,
        users,
        login,
        logout,
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
        orderHistory, // Add orderHistory to context value
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