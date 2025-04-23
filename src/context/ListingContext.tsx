'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Add viewCount, sellerRating, and isVerifiedSeller to the Listing type
type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  isPremium?: boolean;
  category?: string;
  createdAt: number; // timestamp
  status: 'active' | 'sold' | 'pending';
  viewCount?: number; // New property for filtering by popularity
  sellerRating?: number; // New property for filtering by seller rating
  isVerifiedSeller?: boolean; // New property for filtering by verified sellers
};

type User = {
  id: string;
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  balance: number;
  subscriptions: string[]; // Array of seller IDs the user is subscribed to
  cart: CartItem[];
};

type CartItem = {
  listingId: string;
  quantity: number;
};

type ListingContextType = {
  listings: Listing[];
  user: User | null;
  isAuthReady: boolean;
  login: (username: string, role: 'buyer' | 'seller' | 'admin') => void;
  logout: () => void;
  addListing: (listing: Omit<Listing, 'id'>) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  removeListing: (id: string) => void;
  addToCart: (listing: Listing) => void;
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;
  isSubscribedToSeller: (sellerId: string) => boolean;
  subscribeToSeller: (sellerId: string, sellerName: string) => void;
  unsubscribeFromSeller: (sellerId: string) => void;
  addViewToListing: (listingId: string) => void; // New function to track views
  checkout: () => void;
  getSavedFilters: () => any;
  saveFilters: (filters: any) => void;
};

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export function ListingProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedListings = localStorage.getItem('pantypost_listings');
    const storedUser = localStorage.getItem('pantypost_user');

    if (storedListings) {
      setListings(JSON.parse(storedListings));
    } else {
      // Initialize with demo data if no listings exist
      const demoListings = generateDemoListings();
      setListings(demoListings);
      localStorage.setItem('pantypost_listings', JSON.stringify(demoListings));
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setIsAuthReady(true);
  }, []);

  // Save listings to localStorage whenever they change
  useEffect(() => {
    if (listings.length > 0) {
      localStorage.setItem('pantypost_listings', JSON.stringify(listings));
    }
  }, [listings]);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('pantypost_user', JSON.stringify(user));
    }
  }, [user]);

  // Login function
  const login = (username: string, role: 'buyer' | 'seller' | 'admin') => {
    // Check if user exists in localStorage
    const storedUsers = localStorage.getItem('pantypost_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    let existingUser = users.find((u: any) => u.username === username);
    
    // For admin role, hardcode specific credentials
    if (role === 'admin' && (username === 'oakley' || username === 'gerome')) {
      existingUser = {
        id: username === 'oakley' ? 'admin1' : 'admin2',
        username,
        role: 'admin',
        balance: 1000,
        subscriptions: [],
        cart: []
      };
    }

    if (existingUser) {
      setUser(existingUser);
    } else {
      // Create new user if not exists
      const newUser: User = {
        id: `user_${Date.now()}`,
        username,
        role,
        balance: role === 'buyer' ? 500 : 0, // Give buyers some starting balance
        subscriptions: [],
        cart: []
      };
      
      // Save to localStorage
      const updatedUsers = [...users, newUser];
      localStorage.setItem('pantypost_users', JSON.stringify(updatedUsers));
      
      setUser(newUser);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('pantypost_user');
  };

  // Add a new listing
  const addListing = (listing: Omit<Listing, 'id'>) => {
    const newListing: Listing = {
      ...listing,
      id: `listing_${Date.now()}`,
      createdAt: Date.now(),
      status: 'active',
      viewCount: 0,
    };
    
    setListings((prevListings) => [...prevListings, newListing]);
  };

  // Update an existing listing
  const updateListing = (id: string, updates: Partial<Listing>) => {
    setListings((prevListings) =>
      prevListings.map((listing) =>
        listing.id === id ? { ...listing, ...updates } : listing
      )
    );
  };

  // Remove a listing
  const removeListing = (id: string) => {
    setListings((prevListings) => prevListings.filter((listing) => listing.id !== id));
  };

  // Add a listing to cart
  const addToCart = (listing: Listing) => {
    if (!user) return;
    
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      // Check if item is already in cart
      const existingCartItem = prevUser.cart.find(item => item.listingId === listing.id);
      
      let updatedCart;
      if (existingCartItem) {
        updatedCart = prevUser.cart.map(item => 
          item.listingId === listing.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        updatedCart = [...prevUser.cart, { listingId: listing.id, quantity: 1 }];
      }
      
      return { ...prevUser, cart: updatedCart };
    });
  };

  // Remove a listing from cart
  const removeFromCart = (listingId: string) => {
    if (!user) return;
    
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      return {
        ...prevUser,
        cart: prevUser.cart.filter(item => item.listingId !== listingId)
      };
    });
  };

  // Clear the cart
  const clearCart = () => {
    if (!user) return;
    
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      return {
        ...prevUser,
        cart: []
      };
    });
  };

  // Check if user is subscribed to a seller
  const isSubscribedToSeller = (sellerId: string) => {
    if (!user) return false;
    return user.subscriptions.includes(sellerId);
  };

  // Subscribe to a seller
  const subscribeToSeller = (sellerId: string, sellerName: string) => {
    if (!user) return;
    
    // Check if already subscribed
    if (isSubscribedToSeller(sellerId)) return;
    
    // Subscription cost is $9.99
    const subscriptionCost = 9.99;
    
    // Check if user has enough balance
    if (user.balance < subscriptionCost) {
      alert('Insufficient balance to subscribe. Please add funds to your wallet.');
      return;
    }
    
    // Update user balance and subscriptions
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      return {
        ...prevUser,
        balance: prevUser.balance - subscriptionCost,
        subscriptions: [...prevUser.subscriptions, sellerId]
      };
    });
    
    // Update seller balance (75% goes to seller, 25% to platform)
    const sellerAmount = subscriptionCost * 0.75;
    
    // Find the seller user
    const storedUsers = localStorage.getItem('pantypost_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    const sellerUser = users.find((u: any) => u.id === sellerId);
    
    if (sellerUser) {
      sellerUser.balance += sellerAmount;
      
      // Update seller in localStorage
      localStorage.setItem('pantypost_users', JSON.stringify(users));
    }
    
    // Notify user
    alert(`You have successfully subscribed to ${sellerName}'s content!`);
  };

  // Unsubscribe from a seller
  const unsubscribeFromSeller = (sellerId: string) => {
    if (!user) return;
    
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      return {
        ...prevUser,
        subscriptions: prevUser.subscriptions.filter(id => id !== sellerId)
      };
    });
  };

  // Add a view to a listing (for popularity tracking)
  const addViewToListing = (listingId: string) => {
    setListings((prevListings) =>
      prevListings.map((listing) =>
        listing.id === listingId
          ? { ...listing, viewCount: (listing.viewCount || 0) + 1 }
          : listing
      )
    );
  };

  // Process checkout
  const checkout = () => {
    if (!user || user.cart.length === 0) return;
    
    // Calculate total cost
    let totalCost = 0;
    const updatedListings = [...listings];
    
    user.cart.forEach(item => {
      const listing = listings.find(l => l.id === item.listingId);
      if (listing && listing.status === 'active') {
        totalCost += listing.price * item.quantity;
        
        // Update listing status
        const listingIndex = updatedListings.findIndex(l => l.id === item.listingId);
        if (listingIndex !== -1) {
          updatedListings[listingIndex] = {
            ...updatedListings[listingIndex],
            status: 'sold'
          };
        }
      }
    });
    
    // Add platform fee (10%)
    const platformFee = totalCost * 0.1;
    const finalCost = totalCost + platformFee;
    
    // Check if user has enough balance
    if (user.balance < finalCost) {
      alert(`Insufficient balance. Your total is $${finalCost.toFixed(2)} including platform fee.`);
      return;
    }
    
    // Process payment
    setUser((prevUser) => {
      if (!prevUser) return null;
      
      return {
        ...prevUser,
        balance: prevUser.balance - finalCost,
        cart: []
      };
    });
    
    // Update listings
    setListings(updatedListings);
    
    // Update sellers' balances (90% of item price goes to sellers)
    const sellerPayments = new Map<string, number>();
    
    user.cart.forEach(item => {
      const listing = listings.find(l => l.id === item.listingId);
      if (listing && listing.status === 'active') {
        const sellerAmount = listing.price * item.quantity * 0.9;
        const sellerId = listing.sellerId;
        
        sellerPayments.set(
          sellerId,
          (sellerPayments.get(sellerId) || 0) + sellerAmount
        );
      }
    });
    
    // Update sellers in localStorage
    const storedUsers = localStorage.getItem('pantypost_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    sellerPayments.forEach((amount, sellerId) => {
      const sellerIndex = users.findIndex((u: any) => u.id === sellerId);
      if (sellerIndex !== -1) {
        users[sellerIndex].balance += amount;
      }
    });
    
    localStorage.setItem('pantypost_users', JSON.stringify(users));
    
    // Notify user
    alert(`Purchase successful! Total: $${finalCost.toFixed(2)}`);
  };

  // Get saved filters from localStorage
  const getSavedFilters = () => {
    if (!user) return null;
    
    const storedFilters = localStorage.getItem(`pantypost_filters_${user.id}`);
    return storedFilters ? JSON.parse(storedFilters) : null;
  };

  // Save filters to localStorage
  const saveFilters = (filters: any) => {
    if (!user) return;
    
    localStorage.setItem(`pantypost_filters_${user.id}`, JSON.stringify(filters));
  };

  // Generate demo listings if none exist
  function generateDemoListings(): Listing[] {
    const categories = [
      'Panties', 
      'Bras', 
      'Socks', 
      'Lingerie', 
      'Activewear', 
      'Swimwear'
    ];
    
    const sellerNames = [
      'Emily', 'Jessica', 'Sophia', 'Olivia', 'Emma', 
      'Ava', 'Mia', 'Isabella', 'Zoe', 'Lily'
    ];
    
    const demoListings: Listing[] = [];
    
    // Generate 20 demo listings
    for (let i = 1; i <= 20; i++) {
      const sellerId = `seller_${i % 10 + 1}`;
      const sellerName = sellerNames[i % 10];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const isPremium = Math.random() > 0.7; // 30% chance to be premium
      const isVerified = Math.random() > 0.5; // 50% chance to be verified
      
      demoListings.push({
        id: `listing_${i}`,
        title: `${category} Item ${i}`,
        description: `This is a demo ${category.toLowerCase()} item from ${sellerName}.`,
        price: Math.floor(Math.random() * 100) + 10, // Random price between $10-$110
        imageUrl: `/images/demo_${i % 5 + 1}.jpg`, // Cycle through 5 demo images
        sellerId,
        sellerName,
        isPremium,
        category,
        createdAt: Date.now() - (i * 86400000), // Spread creation dates over several days
        status: 'active',
        viewCount: Math.floor(Math.random() * 1000), // Random view count
        sellerRating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5
        isVerifiedSeller: isVerified,
      });
    }
    
    return demoListings;
  }

  return (
    <ListingContext.Provider
      value={{
        listings,
        user,
        isAuthReady,
        login,
        logout,
        addListing,
        updateListing,
        removeListing,
        addToCart,
        removeFromCart,
        clearCart,
        isSubscribedToSeller,
        subscribeToSeller,
        unsubscribeFromSeller,
        addViewToListing,
        checkout,
        getSavedFilters,
        saveFilters,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
}

export function useListings() {
  const context = useContext(ListingContext);
  if (context === undefined) {
    throw new Error('useListings must be used within a ListingProvider');
  }
  return context;
}