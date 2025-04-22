'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';

// Define types
export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice?: number;
  imageUrl: string;
  seller: string;
  createdAt: string;
  updatedAt: string;
  isPremium: boolean;
  tags?: string[];
  wearTime?: string;
  status: 'available' | 'sold' | 'reserved';
};

export type Sale = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyer: string;
  seller: string;
  price: number;
  commissionAmount: number;
  sellerEarnings: number;
  date: string;
  imageUrl?: string;
};

export type Notification = {
  id: string;
  userId: string; // The user this notification is for
  message: string;
  read: boolean;
  createdAt: string;
};

type UserSubscriptions = {
  [buyerId: string]: string[]; // buyerId -> array of seller names they're subscribed to
};

type User = {
  id: string;
  username: string;
  role: string;
  [key: string]: any;
};

interface ListingContextType {
  listings: Listing[];
  user: User | null;
  sellerNotifications: string[]; // Added for Header component
  addListing: (listing: Listing) => void;
  removeListing: (id: string) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  isSubscribed: (buyerId: string, sellerName: string) => boolean;
  toggleSubscription: (buyerId: string, sellerName: string) => void;
  recordSale: (sale: Sale) => void;
  sales: Sale[];
  getSellerSales: (sellerName: string) => Sale[];
  getUserSubscriptions: (userId: string) => string[];
  notifications: Notification[];
  addSellerNotification: (sellerId: string, message: string) => void;
  clearSellerNotification: (index: number) => void; // Added for Header component
  markNotificationAsRead: (notificationId: string) => void;
  getUnreadNotificationsCount: (userId: string) => number;
  getUserNotifications: (userId: string) => Notification[];
  logout: () => void; // Added for Header component
}

export const ListingsContext = createContext<ListingContextType>({
  listings: [],
  user: null,
  sellerNotifications: [], // Added for Header component
  addListing: () => {},
  removeListing: () => {},
  updateListing: () => {},
  isSubscribed: () => false,
  toggleSubscription: () => {},
  recordSale: () => {},
  sales: [],
  getSellerSales: () => [],
  getUserSubscriptions: () => [],
  notifications: [],
  addSellerNotification: () => {},
  clearSellerNotification: () => {}, // Added for Header component
  markNotificationAsRead: () => {},
  getUnreadNotificationsCount: () => 0,
  getUserNotifications: () => [],
  logout: () => {}, // Added for Header component
});

export const useListings = () => useContext(ListingsContext);

export const ListingsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscriptions>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sellerNotifications, setSellerNotifications] = useState<string[]>([]); // Added for Header component
  const router = useRouter();

  // Load data from localStorage on initial render
  useEffect(() => {
    // Load listings
    const storedListings = localStorage.getItem('listings');
    if (storedListings) {
      setListings(JSON.parse(storedListings));
    } else {
      // Initialize with sample data if none exists
      const sampleListings = generateSampleListings();
      setListings(sampleListings);
      localStorage.setItem('listings', JSON.stringify(sampleListings));
    }

    // Load sales
    const storedSales = localStorage.getItem('sales');
    if (storedSales) {
      setSales(JSON.parse(storedSales));
    }

    // Load current user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // If user is a seller, load their notifications
      if (parsedUser.role === 'seller') {
        // Load seller notifications
        const storedSellerNotifications = localStorage.getItem(`seller_notifications_${parsedUser.id}`);
        if (storedSellerNotifications) {
          setSellerNotifications(JSON.parse(storedSellerNotifications));
        }
      }
    }

    // Load subscriptions
    const storedSubscriptions = localStorage.getItem('subscriptions');
    if (storedSubscriptions) {
      setSubscriptions(JSON.parse(storedSubscriptions));
    }

    // Load notifications
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  // Update localStorage when data changes
  useEffect(() => {
    if (listings.length > 0) {
      localStorage.setItem('listings', JSON.stringify(listings));
    }
  }, [listings]);

  useEffect(() => {
    if (sales.length > 0) {
      localStorage.setItem('sales', JSON.stringify(sales));
    }
  }, [sales]);

  useEffect(() => {
    if (Object.keys(subscriptions).length > 0) {
      localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    }
  }, [subscriptions]);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Save seller notifications to localStorage
  useEffect(() => {
    if (user && user.role === 'seller' && sellerNotifications.length > 0) {
      localStorage.setItem(`seller_notifications_${user.id}`, JSON.stringify(sellerNotifications));
    }
  }, [sellerNotifications, user]);

  // Logout function
  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    router.push('/login');
  };

  // Add a new listing
  const addListing = (listing: Listing) => {
    setListings(prevListings => [...prevListings, listing]);
  };

  // Remove a listing
  const removeListing = (id: string) => {
    setListings(prevListings => prevListings.filter(listing => listing.id !== id));
  };

  // Update a listing
  const updateListing = (id: string, updates: Partial<Listing>) => {
    setListings(prevListings =>
      prevListings.map(listing =>
        listing.id === id ? { ...listing, ...updates, updatedAt: new Date().toISOString() } : listing
      )
    );
  };

  // Check if a buyer is subscribed to a seller
  const isSubscribed = (buyerId: string, sellerName: string) => {
    return subscriptions[buyerId]?.includes(sellerName) || false;
  };

  // Toggle subscription status
  const toggleSubscription = (buyerId: string, sellerName: string) => {
    setSubscriptions(prevSubscriptions => {
      // Create a copy of the current subscriptions
      const newSubscriptions = { ...prevSubscriptions };
      
      // If this buyer already has subscriptions
      if (newSubscriptions[buyerId]) {
        // If already subscribed, unsubscribe
        if (newSubscriptions[buyerId].includes(sellerName)) {
          newSubscriptions[buyerId] = newSubscriptions[buyerId].filter(seller => seller !== sellerName);
        } else {
          // Otherwise add the subscription
          newSubscriptions[buyerId] = [...newSubscriptions[buyerId], sellerName];
        }
      } else {
        // First subscription for this buyer
        newSubscriptions[buyerId] = [sellerName];
      }
      
      return newSubscriptions;
    });
  };

  // Record a sale
  const recordSale = (sale: Sale) => {
    // Add the sale to sales records
    setSales(prevSales => [sale, ...prevSales]);
    
    // Mark the listing as sold
    updateListing(sale.listingId, { status: 'sold' });
    
    // Add a notification for the seller
    const sellerId = getSellerIdByUsername(sale.seller);
    if (sellerId) {
      addSellerNotification(sellerId, `🛍️ ${sale.buyer} purchased: "${sale.listingTitle}" for $${sale.price.toFixed(2)}`);
    }
  };

  // Get sales for a specific seller
  const getSellerSales = (sellerName: string) => {
    return sales.filter(sale => sale.seller === sellerName);
  };

  // Get subscriptions for a user
  const getUserSubscriptions = (userId: string) => {
    return subscriptions[userId] || [];
  };

  // Helper function to find seller ID by username
  const getSellerIdByUsername = (username: string): string => {
    // Get users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return '';
    
    try {
      const users = JSON.parse(storedUsers);
      const seller = users.find((user: {username: string, role: string, id: string}) => 
        user.username === username && user.role === 'seller'
      );
      
      return seller ? seller.id : '';
    } catch (e) {
      console.error("Error parsing users from localStorage:", e);
      return '';
    }
  };

  // Add a notification for a specific seller
  const addSellerNotification = (sellerId: string, message: string) => {
    // Create notification object
    const notification: Notification = {
      id: Date.now().toString(),
      userId: sellerId,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    // Add to notifications array
    setNotifications(prev => [notification, ...prev]);
    
    // If current user is the seller, also add to seller notifications
    if (user && user.id === sellerId) {
      setSellerNotifications(prev => [message, ...prev]);
    }
  };

  // Clear a seller notification
  const clearSellerNotification = (index: number) => {
    setSellerNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // Mark a notification as read
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  // Get unread notifications count for a user
  const getUnreadNotificationsCount = (userId: string) => {
    return notifications.filter(notification => notification.userId === userId && !notification.read).length;
  };

  // Get notifications for a specific user
  const getUserNotifications = (userId: string) => {
    return notifications.filter(notification => notification.userId === userId);
  };

  // Generate sample listings for development purposes
  const generateSampleListings = (): Listing[] => {
    const sellers = ['Sarah', 'Emily', 'Jessica', 'Lily', 'Sophia'];
    const tags = ['New', 'Worn', 'Cotton', 'Lace', 'Silk', 'Nylon', 'Black', 'Red', 'Pink', 'White'];
    const wearTimes = ['1 day', '2 days', '3 days', '1 week'];
    
    return Array.from({ length: 30 }, (_, i) => {
      const seller = sellers[i % sellers.length];
      const isPremium = i % 5 === 0;
      const basePrice = 20 + Math.floor(Math.random() * 30);
      const markedUpPrice = basePrice * 1.1; // 10% markup
      
      // Generate 2-4 random tags
      const listingTags = Array.from(
        { length: 2 + Math.floor(Math.random() * 3) },
        () => tags[Math.floor(Math.random() * tags.length)]
      );
      
      // Filter duplicate tags
      const uniqueTags = [...new Set(listingTags)];
      
      return {
        id: `listing-${i + 1}`,
        title: `${isPremium ? 'Premium ' : ''}${uniqueTags[0]} Panties`,
        description: `These are high quality ${uniqueTags.join(', ')} panties. Perfect for your collection!`,
        price: basePrice,
        markedUpPrice,
        imageUrl: `/sample/panty-${(i % 5) + 1}.jpg`,
        seller,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(), // Each listing 1 day older
        updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
        isPremium,
        tags: uniqueTags,
        wearTime: wearTimes[i % wearTimes.length],
        status: 'available'
      };
    });
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        user,
        sellerNotifications,
        addListing,
        removeListing,
        updateListing,
        isSubscribed,
        toggleSubscription,
        recordSale,
        sales,
        getSellerSales,
        getUserSubscriptions,
        notifications,
        addSellerNotification,
        clearSellerNotification,
        markNotificationAsRead,
        getUnreadNotificationsCount,
        getUserNotifications,
        logout
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
};