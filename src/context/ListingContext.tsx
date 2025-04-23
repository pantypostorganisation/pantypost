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

export type User = {
  username: string;
  role: Role;
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

// COMPLETELY NEW NOTIFICATION SYSTEM
// Simple key-value object with seller usernames as keys and arrays of messages as values
type NotificationStore = Record<string, string[]>;

type ListingContextType = {
  user: User | null;
  role: Role | null;
  users: { [username: string]: Role };
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
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<{ [username: string]: Role }>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [buyer: string]: string[] }>({});
  
  // NEW: Replace sellerNotifications with a store that separates by seller
  const [notificationStore, setNotificationStore] = useState<NotificationStore>({});
  
  const [isAuthReady, setIsAuthReady] = useState(false);

  const { subscribeToSellerWithPayment } = useWallet();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedUsers = localStorage.getItem('all_users');
      const storedListings = localStorage.getItem('listings');
      const storedSubs = localStorage.getItem('subscriptions');
      
      // Try to load notifications from new storage format
      const storedNotifications = localStorage.getItem('seller_notifications_store');

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedListings) setListings(JSON.parse(storedListings));
      if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
      
      // Initialize notification store
      if (storedNotifications) {
        try {
          setNotificationStore(JSON.parse(storedNotifications));
        } catch (e) {
          console.error("Error parsing notification store:", e);
          // Initialize with empty object if there's an error
          setNotificationStore({});
          localStorage.setItem('seller_notifications_store', JSON.stringify({}));
        }
      } else {
        // Start with empty object if no notifications found
        setNotificationStore({});
        localStorage.setItem('seller_notifications_store', JSON.stringify({}));
      }
      
      // Clear any old notification formats to avoid conflicts
      localStorage.removeItem('seller_notifications');
      localStorage.removeItem('seller_notifications_by_id');
      localStorage.removeItem('seller_notifications_map');

      setIsAuthReady(true);
    }
  }, []);

  const login = (username: string, selectedRole: Role) => {
    const normalized = username.trim().toLowerCase();
    const actualRole: Role =
      normalized === 'gerome' || normalized === 'oakley' ? 'admin' : selectedRole;

    const newUser = { username: normalized, role: actualRole };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    // ✅ Track all users
    setUsers((prev) => {
      const updated = { ...prev, [normalized]: actualRole };
      localStorage.setItem('all_users', JSON.stringify(updated));
      return updated;
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

  // COMPLETELY NEW notification implementation
  const addSellerNotification = (seller: string, message: string) => {
    if (!seller) {
      console.warn("Attempted to add notification without seller ID");
      return;
    }
    
    // Update notification store with new message for this seller
    setNotificationStore(prev => {
      // Get existing notifications for this seller or empty array
      const sellerNotifications = prev[seller] || [];
      
      // Create updated store with new notification added
      const updated = {
        ...prev,
        [seller]: [...sellerNotifications, message]
      };
      
      // Save to localStorage
      localStorage.setItem('seller_notifications_store', JSON.stringify(updated));
      
      return updated;
    });
  };

  // Get only notifications for the current user
  const getCurrentSellerNotifications = (): string[] => {
    if (!user || user.role !== 'seller') {
      return [];
    }
    
    // Return only notifications for the current seller
    return notificationStore[user.username] || [];
  };

  // Clear notification for the current user
  const clearSellerNotification = (index: number) => {
    if (!user || user.role !== 'seller') {
      return;
    }
    
    const username = user.username;
    const userNotifications = notificationStore[username] || [];
    
    // Check if index is valid
    if (index < 0 || index >= userNotifications.length) {
      return;
    }
    
    // Create new notifications array without the specified index
    const updatedNotifications = [
      ...userNotifications.slice(0, index),
      ...userNotifications.slice(index + 1)
    ];
    
    // Update the store
    setNotificationStore(prev => {
      const updated = {
        ...prev,
        [username]: updatedNotifications
      };
      
      // Save to localStorage
      localStorage.setItem('seller_notifications_store', JSON.stringify(updated));
      
      return updated;
    });
  };

  // Get all current seller's notifications
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