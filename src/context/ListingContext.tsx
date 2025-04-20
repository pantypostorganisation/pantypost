'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

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
};

type ListingContextType = {
  user: User | null;
  role: Role | null;
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
  const [listings, setListings] = useState<Listing[]>([]);
  const [subscriptions, setSubscriptions] = useState<{ [buyer: string]: string[] }>({});
  const [sellerNotifications, setSellerNotifications] = useState<string[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedListings = localStorage.getItem('listings');
    const storedSubs = localStorage.getItem('subscriptions');
    const storedNotifs = localStorage.getItem('seller_notifications');

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedListings) setListings(JSON.parse(storedListings));
    if (storedSubs) setSubscriptions(JSON.parse(storedSubs));
    if (storedNotifs) setSellerNotifications(JSON.parse(storedNotifs));

    setIsAuthReady(true);
  }, []);

  const login = (username: string, selectedRole: Role) => {
    const normalized = username.trim().toLowerCase();
    const actualRole: Role =
      normalized === 'gerome' || normalized === 'oakley' ? 'admin' : selectedRole;

    const newUser = { username, role: actualRole };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
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
    const buyerBalancesRaw = localStorage.getItem('wallet_buyers');
    const buyerBalances = buyerBalancesRaw ? JSON.parse(buyerBalancesRaw) : {};
    const currentBalance = buyerBalances[buyer] || 0;

    if (currentBalance < price) {
      alert('Insufficient funds for subscription.');
      return false;
    }

    const sellerCut = price * 0.75;
    const adminCut = price * 0.25;
    const sellerBalancesRaw = localStorage.getItem('wallet_sellers');
    const sellerBalances = sellerBalancesRaw ? JSON.parse(sellerBalancesRaw) : {};
    const adminBalanceRaw = localStorage.getItem('wallet_admin');
    const adminBalance = adminBalanceRaw ? parseFloat(adminBalanceRaw) : 0;

    buyerBalances[buyer] = currentBalance - price;
    sellerBalances[seller] = (sellerBalances[seller] || 0) + sellerCut;
    const newAdminBalance = adminBalance + adminCut;

    localStorage.setItem('wallet_buyers', JSON.stringify(buyerBalances));
    localStorage.setItem('wallet_sellers', JSON.stringify(sellerBalances));
    localStorage.setItem('wallet_admin', newAdminBalance.toString());

    setSubscriptions((prev) => {
      const updated = {
        ...prev,
        [buyer]: [...(prev[buyer] || []), seller],
      };
      localStorage.setItem('subscriptions', JSON.stringify(updated));
      return updated;
    });

    addSellerNotification(seller, `${buyer} subscribed to you.`);

    return true;
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
    setSellerNotifications((prev) => {
      const updated = [...prev, message];
      localStorage.setItem('seller_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const clearSellerNotification = (index: number) => {
    setSellerNotifications((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem('seller_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ListingContext.Provider
      value={{
        user,
        role: user?.role ?? null,
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
