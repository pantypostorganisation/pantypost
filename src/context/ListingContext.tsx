'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useWallet } from './WalletContext';

export type Role = 'buyer' | 'seller' | 'admin';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type VerificationDocs = {
  codePhoto?: string; // base64 or URL
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
  imageUrl: string;
  date: string;
  seller: string;
  isPremium?: boolean;
  tags?: string[];
  wearTime?: string;
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
  addListing: (listing: Listing) => void;
  removeListing: (id: string) => void;
  subscriptions: { [buyer: string]: string[] };
  subscribeToSeller: (buyer: string, seller: string, price: number) => boolean;
  unsubscribeFromSeller: (buyer: string, seller: string) => void;
  isSubscribed: (buyer: string, seller: string) => boolean;
  sellerNotifications: string[];
  addSellerNotification: (seller: string, message: string) => void;
  clearSellerNotification: (index: number) => void;

  // Verification
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

  const { subscribeToSellerWithPayment } = useWallet();

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

  const persistUsers = (updated: { [username: string]: User }) => {
    setUsers(updated);
    localStorage.setItem('all_users_v2', JSON.stringify(updated));
  };

  const login = (username: string, selectedRole: Role) => {
    const normalized = username.trim().toLowerCase();
    const actualRole: Role =
      normalized === 'gerome' || normalized === 'oakley' ? 'admin' : selectedRole;

    // If user exists, preserve verification fields
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

  const addListing = (listing: Listing) => {
    setListings((prev) => {
      const updated = [...prev, listing];
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

  const addSellerNotification = (seller: string, message: string) => {
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
        subscriptions,
        subscribeToSeller,
        unsubscribeFromSeller,
        isSubscribed,
        sellerNotifications,
        addSellerNotification,
        clearSellerNotification,
        // Verification
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
