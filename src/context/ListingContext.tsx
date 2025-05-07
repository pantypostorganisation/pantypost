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
};

export type NewListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;
export type AddListingInput = Omit<Listing, 'id' | 'date' | 'markedUpPrice'>;

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
  removeListing: (id: string) => void;
  updateListing: (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>) => void;
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
    if (user?.role === 'seller' && !Array.isArray(notificationStore[user.username])) {
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

  const { subscribeToSellerWithPayment, setAddSellerNotificationCallback } = useWallet();

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

  // Storage quota warning
  useEffect(() => {
    try {
      const used = new Blob(Object.values(localStorage)).size;
      if (used > 4 * 1024 * 1024) {
        console.warn('[PantyPost] LocalStorage usage high:', used, 'bytes');
      }
    } catch {}
  }, []);

  const persistUsers = (updated: { [username: string]: User }) => {
    setUsers(updated);
    localStorage.setItem('all_users_v2', JSON.stringify(updated));
  };

  const login = (username: string, selectedRole: Role) => {
    const normalized = username.trim().toLowerCase();
    const actualRole: Role =
      normalized === 'gerome' || normalized === 'oakley' ? 'admin' : selectedRole;

    let existingUser: User | undefined = users[normalized];
    const newUser: User = {
      username: normalized,
      role: actualRole,
      verified: existingUser?.verified ?? false,
      verificationStatus: existingUser?.verificationStatus ?? 'unverified',
      verificationDocs: existingUser?.verificationDocs ?? {},
      verificationRequestedAt: existingUser?.verificationRequestedAt,
      verificationReviewedAt: existingUser?.verificationReviewedAt,
      verificationRejectionReason: existingUser?.verificationRejectionReason,
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

  const removeListing = (id: string) => {
    setListings((prev) => {
      const updated = prev.filter((listing) => listing.id !== id);
      localStorage.setItem('listings', JSON.stringify(updated));
      return updated;
    });
  };

  const updateListing = (id: string, updatedListing: Partial<Omit<Listing, 'id' | 'date' | 'markedUpPrice'>>) => {
    setListings(prev =>
      prev.map(listing => {
        if (listing.id === id) {
          const updated = {
            ...listing,
            ...updatedListing,
          };
          if (updatedListing.price !== undefined) {
            updated.markedUpPrice = Math.round(updatedListing.price * 1.1 * 100) / 100;
          }
          return updated;
        }
        return listing;
      })
    );
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
        removeListing,
        updateListing,
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
