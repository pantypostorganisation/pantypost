// src/hooks/useDashboardData.ts

import { useState, useEffect, useMemo, createElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services';
import { listingsService } from '@/services/listings.service';
import { DashboardStats, SubscriptionInfo, RecentActivity } from '@/types/dashboard';
import { Package, MessageCircle, Crown, DollarSign } from 'lucide-react';
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

  // Load wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.username) return;

      try {
        // Load transactions to calculate balance
        const transactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
        const userTransactions = transactions.filter(
          t => t.userId === user.username && t.walletType === 'buyer'
        );
        
        const calculatedBalance = userTransactions.reduce((sum, t) => {
          return t.type === 'deposit' ? sum + t.amount : sum - t.amount;
        }, 0);
        
        setBalance(calculatedBalance);

        // Load orders
        const orders = await storageService.getItem<Order[]>('orders', []);
        const buyerOrders = orders.filter(order => order.buyer === user.username);
        setOrderHistory(buyerOrders);
      } catch (error) {
        console.error('Error loading wallet data:', error);
      }
    };

    loadWalletData();
  }, [user?.username]);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.username) return;

      try {
        const allMessages = await storageService.getItem<Record<string, Message[]>>('messages', {});
        setMessages(allMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [user?.username]);

  // Load requests
  useEffect(() => {
    const loadRequests = async () => {
      if (!user?.username) return;

      try {
        const allRequests = await storageService.getItem<Request[]>('requests', []);
        const userRequests = allRequests.filter(
          r => r.buyer === user.username
        );
        setRequests(userRequests);
      } catch (error) {
        console.error('Error loading requests:', error);
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
          setListings(response.data);
        }
      } catch (error) {
        console.error('Error loading listings:', error);
      }
    };

    loadListings();
  }, []);

  // Load subscriptions
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.username) return;

      try {
        const subsKey = 'subscriptions';
        const allSubscriptions = await storageService.getItem<{ [key: string]: string[] }>(subsKey, {});
        const userSubscriptions = allSubscriptions[user.username] || [];
        
        const subscriptionDataPromises = userSubscriptions.map(async (seller: string) => {
          try {
            // Load seller profile data
            const profileKey = `profile_${seller}`;
            const profileData = await storageService.getItem<any>(profileKey, null);
            
            const sellerListings = listings.filter(l => l.seller === seller);
            
            return {
              seller,
              price: profileData?.subscriptionPrice || '25.00',
              bio: profileData?.bio || 'No bio available',
              pic: profileData?.profilePic || null,
              newListings: sellerListings.filter(l => l.isPremium).length,
              lastActive: new Date().toISOString(),
              tier: profileData?.tier || 'Tease',
              verified: profileData?.verificationStatus === 'verified'
            };
          } catch (error) {
            console.error(`Error loading profile for seller ${seller}:`, error);
            return {
              seller,
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
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [user?.username, listings]);

  // Calculate statistics
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

    // Count unread messages
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

    const weekSpent = orderHistory
      .filter(order => new Date(order.date) >= weekAgo)
      .reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);

    const monthOrders = orderHistory
      .filter(order => new Date(order.date) >= monthAgo)
      .length;

    const favoriteSellerCount = new Set(orderHistory.map(order => order.seller)).size;
    const totalSpent = orderHistory.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);
    const pendingRequests = requests.filter(r => r.status === 'pending').length;

    return {
      totalSpent,
      totalOrders: orderHistory.length,
      activeSubscriptions: subscribedSellers.length,
      pendingRequests,
      unreadMessages: unreadCount,
      completedOrders,
      favoriteSellerCount,
      averageOrderValue: orderHistory.length > 0 ? totalSpent / orderHistory.length : 0,
      thisWeekSpent: weekSpent,
      thisMonthOrders: monthOrders,
      pendingShipments
    };
  }, [user, orderHistory, subscribedSellers, requests, messages]);

  // Generate recent activity
  useEffect(() => {
    if (!user?.username) return;

    const activities: RecentActivity[] = [];

    // Add recent orders
    orderHistory
      .slice(0, 3)
      .forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: order.title,
          subtitle: `From ${order.seller}`,
          time: new Date(order.date).toLocaleDateString(),
          amount: order.markedUpPrice || order.price,
          status: order.shippingStatus || 'pending',
          href: '/buyers/my-orders',
          icon: createElement(Package, { className: "w-4 h-4" })
        });
      });

    // Add recent requests
    requests
      .slice(0, 2)
      .forEach(request => {
        activities.push({
          id: `request-${request.id}`,
          type: 'request',
          title: request.title,
          subtitle: `To ${request.seller}`,
          time: new Date(request.date).toLocaleDateString(),
          amount: request.price,
          status: request.status,
          href: '/buyers/messages',
          icon: createElement(MessageCircle, { className: "w-4 h-4" })
        });
      });

    // Add subscription activities
    subscribedSellers.slice(0, 1).forEach(sub => {
      activities.push({
        id: `sub-${sub.seller}`,
        type: 'subscription',
        title: `Subscribed to ${sub.seller}`,
        subtitle: `Premium content access`,
        time: 'Active',
        amount: parseFloat(sub.price),
        href: `/sellers/${sub.seller}`,
        icon: createElement(Crown, { className: "w-4 h-4" })
      });
    });

    // Sort by time and limit
    activities.sort((a, b) => {
      if (a.time === 'Active') return -1;
      if (b.time === 'Active') return 1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
    
    setRecentActivity(activities.slice(0, 6));
  }, [user, orderHistory, requests, subscribedSellers]);

  // Get featured listings (removed to avoid complexity)

  return {
    user,
    balance,
    stats,
    subscribedSellers,
    recentActivity,
    isLoading
  };
};