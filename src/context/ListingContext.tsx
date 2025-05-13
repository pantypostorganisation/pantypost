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
import { v4 as uuidv4 } from 'uuid';

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
  profilePic?: string | null; // Added profilePic property here
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

type NotificationStore = Record<string, string[]>;

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
  sellerNotifications: string[];
  addSellerNotification: (seller: string, message: string) => void;
  clearSellerNotification: (index: number) => void;

  requestVerification: (docs: VerificationDocs) => void;
  setVerificationStatus: (username: string, status: VerificationStatus, rejectionReason?: string) => void;
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

  // Memoized notification function to avoid infinite render loop
  const addSellerNotification = useCallback((seller: string, message: string) => {
    if (!seller) {
      console.warn("Attempted to add notification without seller ID");
      return;
    }
    setNotificationStore(prev => {
      const sellerNotifications = prev[seller] || [];
      const updated = {
        ...prev,
        [seller]: [...sellerNotifications, message]
      };
      localStorage.setItem('seller_notifications_store', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const { subscribeToSellerWithPayment, setAddSellerNotificationCallback, purchaseListing } = useWallet();

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
          setNotificationStore(JSON.parse(storedNotifications));
        } catch (e) {
          console.error("Error parsing notification store:", e);
          setNotificationStore({});
          localStorage.setItem('seller_notifications_store', JSON.stringify({}));
        }
      } else {
        setNotificationStore({});
        localStorage.setItem('seller_notifications_store', JSON.stringify({}));
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
      profilePic: existingUser?.profilePic ?? null, // Added profilePic here
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
        status: 'active'
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
    if (new Date(listing.auction.endTime) <= new Date()) {
      // Update auction status to ended
      const updatedListings = [...listings];
      updatedListings[listingIndex] = {
        ...listing,
        auction: {
          ...listing.auction,
          status: 'ended'
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

  // Check for ended auctions and process them
  const checkEndedAuctions = () => {
    const now = new Date();
    let updated = false;
    
    const updatedListings = listings.map(listing => {
      // Skip non-auction listings or already ended auctions
      if (!listing.auction || listing.auction.status !== 'active') {
        return listing;
      }
      
      // Check if auction has ended
      if (new Date(listing.auction.endTime) <= now) {
        updated = true;
        
        // Check if there are any bids and if highest bid meets reserve price
        if (listing.auction.bids.length > 0 && 
            (listing.auction.highestBid || 0) >= (listing.auction.reservePrice || 0)) {
          
          // Process the winning bid
          const highestBidder = listing.auction.highestBidder;
          const highestBid = listing.auction.highestBid;
          
          if (highestBidder && highestBid) {
            // Create a copy of the listing for purchase
            const purchaseListing = {
              ...listing,
              price: highestBid,
              markedUpPrice: Math.round(highestBid * 1.1 * 100) / 100
            };
            
            // Process the purchase
            if (purchaseListing && highestBidder) {
              setTimeout(() => {
                // Using a timeout to avoid state update conflicts
                const success = purchaseListing(purchaseListing, highestBidder);
                
                if (success) {
                  // Add notifications
                  addSellerNotification(
                    listing.seller,
                    `🏆 Auction ended: "${listing.title}" sold to ${highestBidder} for $${highestBid.toFixed(2)}`
                  );
                } else {
                  // Failed due to insufficient funds
                  addSellerNotification(
                    listing.seller,
                    `⚠️ Auction payment failed: ${highestBidder} didn't have sufficient funds for "${listing.title}"`
                  );
                }
              }, 100);
            }
          }
        } else {
          // No valid bids - notify seller
          addSellerNotification(
            listing.seller,
            `🔨 Auction ended: No valid bids for "${listing.title}"`
          );
        }
        
        // Mark auction as ended
        return {
          ...listing,
          auction: {
            ...listing.auction,
            status: 'ended'
          }
        };
      }
      
      return listing;
    });
    
    if (updated) {
      setListings(updatedListings);
      localStorage.setItem('listings', JSON.stringify(updatedListings));
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
        status: 'cancelled'
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

  const getCurrentSellerNotifications = (): string[] => {
    if (!user || user.role !== 'seller') {
      return [];
    }
    return notificationStore[user.username] || [];
  };

  const clearSellerNotification = (index: number) => {
    if (!user || user.role !== 'seller') {
      return;
    }

    const username = user.username;
    const userNotifications = notificationStore[username] || [];

    if (index < 0 || index >= userNotifications.length) {
      return;
    }

    const updatedNotifications = [
      ...userNotifications.slice(0, index),
      ...userNotifications.slice(index + 1)
    ];

    setNotificationStore(prev => {
      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      localStorage.setItem('seller_notifications_store', JSON.stringify(updated));
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
        requestVerification,
        setVerificationStatus,
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
