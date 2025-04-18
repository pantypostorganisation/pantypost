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
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export const ListingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedListings = localStorage.getItem('listings');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    if (storedListings) {
      setListings(JSON.parse(storedListings));
    }

    setIsAuthReady(true);
  }, []);

  const login = (username: string, role: Role) => {
    const normalized = username.trim().toLowerCase();
    const actualRole: Role =
      normalized === 'gerome' || normalized === 'oakley' ? 'admin' : role;

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
