'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
};

type ListingContextType = {
  listings: Listing[];
  addListing: (listing: Listing) => void;
  removeListing: (id: string) => void;
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export function ListingProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([
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

  const addListing = (listing: Listing) => {
    setListings((prev) => [...prev, listing]);
  };

  const removeListing = (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <ListingContext.Provider value={{ listings, addListing, removeListing }}>
      {children}
    </ListingContext.Provider>
  );
}

export function useListings() {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingProvider');
  }
  return context;
}
