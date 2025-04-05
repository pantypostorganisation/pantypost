'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
};

type Role = 'buyer' | 'seller';

type ListingContextType = {
  listings: Listing[];
  addListing: (listing: Listing) => void;
  removeListing: (id: string) => void;
  user: string | null;
  role: Role | null;
  login: (username: string, role: Role) => void;
  logout: () => void;
  buyerBalance: number;
  sellerBalance: number;
  purchaseListing: (price: number) => boolean;
  isAuthReady: boolean;
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export function ListingProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [buyerBalance, setBuyerBalance] = useState<number>(100);
  const [sellerBalance, setSellerBalance] = useState<number>(250);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // ✅ Load listings and login state from localStorage on first render
  useEffect(() => {
    const storedListings = localStorage.getItem('pantypost_listings');
    const storedUser = localStorage.getItem('pantypost_user');
    const storedRole = localStorage.getItem('pantypost_role');

    if (storedListings) {
      try {
        setListings(JSON.parse(storedListings));
      } catch {
        console.warn('Failed to parse listings from localStorage.');
      }
    } else {
      setListings([
        {
          id: '1',
          title: 'Lacy Red Thong',
          description: 'Worn 2 days, scented and sealed 💋',
          price: 50,
          imageUrl: 'https://via.placeholder.com/300x300?text=Red+Thong',
        },
        {
          id: '2',
          title: 'Black Cotton Briefs',
          description: 'Comfy and cute — with a lil attitude 🖤',
          price: 40,
          imageUrl: 'https://via.placeholder.com/300x300?text=Black+Briefs',
        },
      ]);
    }

    if (storedUser) setUser(storedUser);
    if (storedRole === 'buyer' || storedRole === 'seller') setRole(storedRole);

    setIsAuthReady(true); // ✅ Mark auth as ready
  }, []);

  // ✅ Save listings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pantypost_listings', JSON.stringify(listings));
  }, [listings]);

  const addListing = (listing: Listing) => {
    setListings((prev) => [...prev, listing]);
  };

  const removeListing = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const login = (username: string, selectedRole: Role) => {
    setUser(username);
    setRole(selectedRole);
    localStorage.setItem('pantypost_user', username);
    localStorage.setItem('pantypost_role', selectedRole);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('pantypost_user');
    localStorage.removeItem('pantypost_role');
  };

  const purchaseListing = (price: number): boolean => {
    if (buyerBalance >= price) {
      setBuyerBalance((prev) => prev - price);
      setSellerBalance((prev) => prev + price);
      return true;
    }
    return false;
  };

  return (
    <ListingContext.Provider
      value={{
        listings,
        addListing,
        removeListing,
        user,
        role,
        login,
        logout,
        buyerBalance,
        sellerBalance,
        purchaseListing,
        isAuthReady,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
}

export function useListings() {
  const context = useContext(ListingContext);
  if (!context) throw new Error('useListings must be used within a ListingProvider');
  return context;
}
