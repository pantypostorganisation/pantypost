// src/hooks/useDashboardData.ts

import { useState, useEffect, useMemo, createElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services';
import { listingsService } from '@/services/listings.service';
import { DashboardStats, SubscriptionInfo, RecentActivity } from '@/types/dashboard';
import { Package, MessageCircle, Crown, DollarSign } from 'lucide-react';
import { sanitizeStrict, sanitizeNumber, sanitizeCurrency } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

// Type definitions
interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice?: number;
  imageUrls?: string[];
  images?: string[];
  date: string;
  seller: string;
  isVerified?: boolean;
  isPremium?: boolean;
  tags?: string[];
  hoursWorn?: number;
  auction?: any;
}

interface Order {
  id: string;
  title: string;
  price: number;
  markedUpPrice?: number;
  seller: string;
  buyer: string;
  date: string;
  shippingStatus?: string;
}

interface Transaction {
  id: string;
  userId: string;
  walletType: 'buyer' | 'seller';
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale';
  amount: number;
  date: string;
}

interface Message {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
  read?: boolean;
}

interface Request {
  id: string;
  title: string;
  seller: string;
  buyer: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  date: string;
}

// Helper function to validate and sanitize order data
const sanitizeOrder = (order: Order): Order => {
  return {
    ...order,
    id: sanitizeStrict(order.id),
    title: sanitizeStrict(order.title),
    price: sanitizeNumber(order.price, 0, 10000),
    markedUpPrice: order.markedUpPrice ? sanitizeNumber(order.markedUpPrice, 0, 10000) : undefined,
    seller: sanitizeStrict(order.seller),
    buyer: sanitizeStrict(order.buyer),
    date: order.date, // Keep date as is for parsing
    shippingStatus: order.shippingStatus ? sanitizeStrict(order.shippingStatus) : undefined
  };
};

// Helper function to validate and sanitize request data
const sanitizeRequest = (request: Request): Request => {
  return {
    ...request,
    id: sanitizeStrict(request.id),
    title: sanitizeStrict(request.title),
    seller: sanitizeStrict(request.seller),
    buyer: sanitizeStrict(request.buyer),
    price: sanitizeNumber(request.price, 0, 1000),
    status: request.status,
    date: request.date
  };
};

// Helper function to validate transaction amounts
const validateTransactionAmount = (transaction: Transaction): boolean => {
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
    return false;
  }
  if (transaction.amount < 0 || transaction.amount > 100000) {
    return false;
  }
  return true;
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const [subscribedSellers, setSubscribedSellers] = useState<SubscriptionInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [balance, setBalance] = useState(0);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [requests, setRequests] = useState<Request[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Load wallet data with validation
  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.username) return;

      try {
        // Load transactions to calculate balance
        const transactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
        
        // Filter and validate transactions
        const userTransactions = transactions
          .filter(t => t.userId === user.username && t.walletType === 'buyer')
          .filter(validateTransactionAmount);
        
        // Calculate balance with validation
        const calculatedBalance = userTransactions.reduce((sum, t) => {
          const amount = sanitizeNumber(t.amount, 0, 100000);
          return t.type === 'deposit' ? sum + amount : sum - amount;
        }, 0);
        
        // Ensure balance is never negative
        setBalance(Math.max(0, calculatedBalance));

        // FIXED: Load orders from the correct storage key 'wallet_orders' instead of 'orders'
        const orders = await storageService.getItem<Order[]>('wallet_orders', []);
        const buyerOrders = orders
          .filter(order => order.buyer === user.username)
          .map(sanitizeOrder);
        
        setOrderHistory(buyerOrders);
      } catch (error) {
        console.error('Error loading wallet data:', error);
        setErrors(prev => [...prev, 'Failed to load wallet data']);
      }
    };

    loadWalletData();
  }, [user?.username]);

  // Load messages with sanitization
  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.username) return;

      try {
        const allMessages = await storageService.getItem<Record<string, Message[]>>('messages', {});
        
        // Sanitize message content
        const sanitizedMessages: Record<string, Message[]> = {};
        Object.entries(allMessages).forEach(([key, messages]) => {
          sanitizedMessages[key] = messages.map(msg => ({
            ...msg,
            content: sanitizeStrict(msg.content),
            sender: sanitizeStrict(msg.sender),
            receiver: sanitizeStrict(msg.receiver)
          }));
        });
        
        setMessages(sanitizedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        setErrors(prev => [...prev, 'Failed to load messages']);
      }
    };

    loadMessages();
  }, [user?.username]);

  // Load requests with sanitization
  useEffect(() => {
    const loadRequests = async () => {
      if (!user?.username) return;

      try {
        const allRequests = await storageService.getItem<Request[]>('requests', []);
        const userRequests = allRequests
          .filter(r => r.buyer === user.username)
          .map(sanitizeRequest);
        
        setRequests(userRequests);
      } catch (error) {
        console.error('Error loading requests:', error);
        setErrors(prev => [...prev, 'Failed to load requests']);
      }
    };

    loadRequests();
  }, [user?.username]);

  // Load listings
  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await listingsService.getListings();
        if (response.success && response.data) {
          // Sanitize listing data
          const sanitizedListings = response.data.map((listing: Listing) => ({
            ...listing,
            title: sanitizeStrict(listing.title),
            description: sanitizeStrict(listing.description),
            seller: sanitizeStrict(listing.seller),
            price: sanitizeNumber(listing.price, 0, 10000),
            markedUpPrice: listing.markedUpPrice ? sanitizeNumber(listing.markedUpPrice, 0, 10000) : undefined
          }));
          setListings(sanitizedListings);
        } else {
          setErrors(prev => [...prev, 'Failed to load listings']);
        }
      } catch (error) {
        console.error('Error loading listings:', error);
        setErrors(prev => [...prev, 'Failed to load listings']);
      }
    };

    loadListings();
  }, []);

  // Load subscription info
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.username) return;

      try {
        const subscriptions = await storageService.getItem<Record<string, string[]>>('subscriptions', {});
        const userSubscriptions = subscriptions[user.username] || [];
        
        // Load detailed info for each subscribed seller
        const subscriptionDataPromises = userSubscriptions.map(async (seller) => {
          try {
            // Load seller profile with validation
            const profileKey = `seller_profile_${seller}`;
            const profileData = await storageService.getItem<any>(profileKey, null);
            
            // Get seller listings for counting
            const sellerListings = listings.filter(l => l.seller === seller);
            
            return {
              seller: sanitizeStrict(seller),
              price: profileData?.subscriptionPrice ? sanitizeCurrency(profileData.subscriptionPrice).toString() : '25.00',
              bio: profileData?.bio ? sanitizeStrict(profileData.bio) : 'No bio available',
              pic: profileData?.profilePic || null,
              newListings: sellerListings.filter(l => l.isPremium).length,
              lastActive: new Date().toISOString(),
              tier: profileData?.tier ? sanitizeStrict(profileData.tier) : 'Tease',
              verified: Boolean(profileData?.verificationStatus === 'verified')
            };
          } catch (error) {
            console.error(`Error loading profile for seller ${seller}:`, error);
            return {
              seller: sanitizeStrict(seller),
              price: '25.00',
              bio: 'No bio available',
              pic: null,
              newListings: 0,
              lastActive: new Date().toISOString(),
              tier: 'Tease',
              verified: false
            };
          }
        });
        
        const subscriptionData = await Promise.all(subscriptionDataPromises);
        setSubscribedSellers(subscriptionData);
      } catch (error) {
        console.error('Error loading subscriptions:', error);
        setErrors(prev => [...prev, 'Failed to load subscriptions']);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [user?.username, listings]);

  // Calculate statistics with validation
  const stats = useMemo<DashboardStats>(() => {
    if (!user?.username) {
      return {
        totalSpent: 0,
        totalOrders: 0,
        activeSubscriptions: 0,
        pendingRequests: 0,
        unreadMessages: 0,
        completedOrders: 0,
        favoriteSellerCount: 0,
        averageOrderValue: 0,
        thisWeekSpent: 0,
        thisMonthOrders: 0,
        pendingShipments: 0
      };
    }

    try {
      // Count unread messages safely
      let unreadCount = 0;
      Object.values(messages).forEach((threadMessages) => {
        threadMessages.forEach((msg) => {
          if (msg.receiver === user.username && !msg.read) {
            unreadCount++;
          }
        });
      });

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const completedOrders = orderHistory.filter(order => 
        order.shippingStatus === 'delivered'
      ).length;
      
      const pendingShipments = orderHistory.filter(order => 
        order.shippingStatus && order.shippingStatus !== 'delivered'
      ).length;

      // Calculate week spent with validation
      const weekSpent = orderHistory
        .filter(order => {
          try {
            return new Date(order.date) >= weekAgo;
          } catch {
            return false;
          }
        })
        .reduce((sum, order) => {
          const price = order.markedUpPrice || order.price;
          return sum + (typeof price === 'number' && price > 0 ? price : 0);
        }, 0);

      // Calculate month orders with validation
      const monthOrders = orderHistory
        .filter(order => {
          try {
            return new Date(order.date) >= monthAgo;
          } catch {
            return false;
          }
        })
        .length;

      const favoriteSellerCount = new Set(orderHistory.map(order => order.seller)).size;
      
      // Calculate total spent with validation
      const totalSpent = orderHistory.reduce((sum, order) => {
        const price = order.markedUpPrice || order.price;
        return sum + (typeof price === 'number' && price > 0 ? price : 0);
      }, 0);
      
      const pendingRequests = requests.filter(r => r.status === 'pending').length;

      return {
        totalSpent: Math.max(0, totalSpent),
        totalOrders: Math.max(0, orderHistory.length),
        activeSubscriptions: Math.max(0, subscribedSellers.length),
        pendingRequests: Math.max(0, pendingRequests),
        unreadMessages: Math.max(0, unreadCount),
        completedOrders: Math.max(0, completedOrders),
        favoriteSellerCount: Math.max(0, favoriteSellerCount),
        averageOrderValue: orderHistory.length > 0 ? Math.max(0, totalSpent / orderHistory.length) : 0,
        thisWeekSpent: Math.max(0, weekSpent),
        thisMonthOrders: Math.max(0, monthOrders),
        pendingShipments: Math.max(0, pendingShipments)
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      // Return safe defaults
      return {
        totalSpent: 0,
        totalOrders: 0,
        activeSubscriptions: 0,
        pendingRequests: 0,
        unreadMessages: 0,
        completedOrders: 0,
        favoriteSellerCount: 0,
        averageOrderValue: 0,
        thisWeekSpent: 0,
        thisMonthOrders: 0,
        pendingShipments: 0
      };
    }
  }, [user, orderHistory, subscribedSellers, requests, messages]);

  // Generate recent activity with sanitization
  useEffect(() => {
    if (!user?.username) return;

    try {
      const activities: RecentActivity[] = [];

      // Add recent orders
      orderHistory
        .slice(0, 3)
        .forEach(order => {
          activities.push({
            id: `order-${order.id}`,
            type: 'order',
            title: sanitizeStrict(order.title),
            subtitle: `From ${sanitizeStrict(order.seller)}`,
            time: new Date(order.date).toLocaleDateString(),
            amount: sanitizeNumber(order.markedUpPrice || order.price, 0, 10000),
            status: order.shippingStatus ? sanitizeStrict(order.shippingStatus) : 'pending',
            href: `/buyers/my-orders#${order.id}`,
            icon: createElement(Package, { className: 'w-4 h-4' })
          });
        });

      // Add recent messages
      Object.entries(messages).forEach(([thread, threadMessages]) => {
        const recentMsg = threadMessages
          .filter(msg => msg.receiver === user.username)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 1)[0];
          
        if (recentMsg) {
          activities.push({
            id: `msg-${recentMsg.id}`,
            type: 'message',
            title: `Message from ${sanitizeStrict(recentMsg.sender)}`,
            subtitle: sanitizeStrict(recentMsg.content).substring(0, 50) + '...',
            time: new Date(recentMsg.timestamp).toLocaleDateString(),
            href: `/buyers/messages?thread=${thread}`,
            icon: createElement(MessageCircle, { className: 'w-4 h-4' })
          });
        }
      });

      // Add subscription activity
      subscribedSellers.slice(0, 1).forEach(sub => {
        activities.push({
          id: `sub-${sub.seller}`,
          type: 'subscription',
          title: `Subscribed to ${sub.seller}`,
          subtitle: 'Premium content access',
          time: 'Active',
          amount: parseFloat(sub.price),
          href: `/sellers/${sub.seller}`,
          icon: createElement(Crown, { className: 'w-4 h-4' })
        });
      });

      // Sort by most recent and limit
      const sortedActivities = activities
        .sort((a, b) => {
          if (a.time === 'Active') return -1;
          if (b.time === 'Active') return 1;
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        })
        .slice(0, 5);

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error generating activity:', error);
      setRecentActivity([]);
    }
  }, [user?.username, orderHistory, messages, subscribedSellers]);

  return {
    user,
    balance,
    stats,
    subscribedSellers,
    recentActivity,
    orderHistory,
    messages,
    requests,
    listings,
    isLoading,
    errors
  };
};