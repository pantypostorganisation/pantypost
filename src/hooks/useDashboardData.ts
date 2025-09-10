// src/hooks/useDashboardData.ts

import { useState, useEffect, useMemo, createElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services';
import { listingsService } from '@/services/listings.service';
import { DashboardStats, SubscriptionInfo, RecentActivity } from '@/types/dashboard';
import { Package, MessageCircle, Crown } from 'lucide-react';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import walletService, { ApiTransaction } from '@/services/wallet.service';
import { tipService, type TipTransaction } from '@/services/tip.service';

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

interface TransactionLS {
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

// Add new interface for subscription data with price
interface SubscriptionData {
  seller: string;
  price: number;
  subscribedAt: string;
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

// Helper function to validate transaction amounts (legacy LS)
const validateTransactionAmount = (transaction: TransactionLS): boolean => {
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) return false;
  if (transaction.amount < 0 || transaction.amount > 100000) return false;
  return true;
};

// Sum helper for API transactions (money OUT for buyer)
function sumBuyerDebits(
  txs: ApiTransaction[],
  buyer: string,
  types: Array<ApiTransaction['type']>,
  since?: Date
): number {
  const uname = buyer.toLowerCase();
  return txs
    .filter((t) => types.includes(t.type))
    .filter((t) => (t.status === 'completed'))
    .filter((t) => (t.from || '').toLowerCase() === uname) // money going out from buyer
    .filter((t) => (since ? new Date(t.createdAt) >= since : true))
    .reduce((sum, t) => sum + (typeof t.amount === 'number' && t.amount > 0 ? t.amount : 0), 0);
}

// Count helper for purchases
function countBuyerPurchases(
  txs: ApiTransaction[],
  buyer: string
): number {
  const uname = buyer.toLowerCase();
  return txs
    .filter((t) => t.type === 'purchase' && t.status === 'completed' && (t.from || '').toLowerCase() === uname)
    .length;
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
  const [errors, setErrors] = useState<string[]>([]);

  // NEW: Wallet transactions (API) and fallback tips if needed
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [sentTipsFallback, setSentTipsFallback] = useState<TipTransaction[]>([]);

  // Load wallet data (legacy LS balance + orders) — unchanged
  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.username) return;

      try {
        // LEGACY: Local storage transactions to compute balance if present
        const transactionsLS = await storageService.getItem<TransactionLS[]>('wallet_transactions', []);
        const userTransactions = transactionsLS
          .filter(t => t.userId === user.username && t.walletType === 'buyer')
          .filter(validateTransactionAmount);

        const calculatedBalance = userTransactions.reduce((sum, t) => {
          const amount = sanitizeNumber(t.amount, 0, 100000);
          return t.type === 'deposit' ? sum + amount : sum - amount;
        }, 0);

        setBalance(Math.max(0, calculatedBalance));

        // Orders from LS (used for shipping stats and fallback spend)
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

  // NEW: Load wallet transactions from API (primary source for spend)
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.username) return;
      try {
        const resp = await walletService.getTransactions(user.username, {
          status: 'completed',
          limit: 1000
        });
        if (resp.success && resp.data) {
          setTransactions(resp.data);
        } else {
          // Fallback: at least fetch sent tips if transactions aren't available
          const tips = await tipService.getSentTips({ limit: 200 });
          setSentTipsFallback(tips.tips || []);
        }
      } catch (e) {
        console.error('[Dashboard] Failed to load transactions:', e);
        const tips = await tipService.getSentTips({ limit: 200 });
        setSentTipsFallback(tips.tips || []);
      }
    };
    loadTransactions();
  }, [user?.username]);

  // Load messages with sanitization
  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.username) return;

      try {
        const allMessages = await storageService.getItem<Record<string, Message[]>>('messages', {});
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
          .map((request) => ({
            ...request,
            id: sanitizeStrict(request.id),
            title: sanitizeStrict(request.title),
            seller: sanitizeStrict(request.seller),
            buyer: sanitizeStrict(request.buyer),
            price: sanitizeNumber(request.price, 0, 1000),
          }));
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

  // Load subscription info (for sidebar + fallback amounts)
  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?.username) {
        setIsLoading(false);
        return;
      }

      try {
        // Basic list of sellers the user is subscribed to
        const subscriptions = await storageService.getItem<Record<string, string[]>>('subscriptions', {});
        const userSubscriptions = subscriptions[user.username] || [];

        // With prices (for fallback when no wallet transactions)
        const subscriptionDetails = await storageService.getItem<Record<string, SubscriptionData[]>>('subscription_details', {});
        const userSubscriptionDetails = subscriptionDetails[user.username] || [];

        const subscriptionData = await Promise.all(
          userSubscriptions.map(async (seller) => {
            try {
              const profileKey = `seller_profile_${seller}`;
              const profileData = await storageService.getItem<any>(profileKey, null);
              const sellerListings = listings.filter(l => l.seller === seller);

              const subDetail = userSubscriptionDetails.find(sd => sd.seller === seller);

              return {
                seller: sanitizeStrict(seller),
                price: subDetail?.price?.toString() || profileData?.subscriptionPrice || '25.00',
                bio: profileData?.bio ? sanitizeStrict(profileData.bio) : 'No bio available',
                pic: profileData?.profilePic || null,
                newListings: sellerListings.filter(l => l.isPremium).length,
                lastActive: new Date().toISOString(),
                tier: profileData?.tier ? sanitizeStrict(profileData.tier) : 'Tease',
                verified: Boolean(profileData?.verificationStatus === 'verified')
              };
            } catch (error) {
              console.error(`Error loading profile for seller ${seller}:`, error);
              const subDetail = userSubscriptionDetails.find(sd => sd.seller === seller);
              return {
                seller: sanitizeStrict(seller),
                price: subDetail?.price?.toString() || '25.00',
                bio: 'No bio available',
                pic: null,
                newListings: 0,
                lastActive: new Date().toISOString(),
                tier: 'Tease',
                verified: false
              };
            }
          })
        );

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

  // Calculate statistics (now includes wallet transactions)
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

      // Shipping stats still come from orderHistory
      const completedOrders = orderHistory.filter(order =>
        order.shippingStatus === 'delivered'
      ).length;

      const pendingShipments = orderHistory.filter(order =>
        order.shippingStatus && order.shippingStatus !== 'delivered'
      ).length;

      // ---------- PRIMARY: derive spending from wallet transactions ----------
      const hasTx = transactions && transactions.length > 0;

      let purchasesSpent = 0;
      let tipsSpent = 0;
      let subsSpent = 0;
      let purchasesThisWeek = 0;
      let tipsThisWeek = 0;
      let subsThisWeek = 0;
      let purchasesCount = 0;

      if (hasTx) {
        purchasesSpent = sumBuyerDebits(transactions, user.username, ['purchase']);
        tipsSpent = sumBuyerDebits(transactions, user.username, ['tip']);
        subsSpent = sumBuyerDebits(transactions, user.username, ['subscription']);
        purchasesThisWeek = sumBuyerDebits(transactions, user.username, ['purchase'], weekAgo);
        tipsThisWeek = sumBuyerDebits(transactions, user.username, ['tip'], weekAgo);
        subsThisWeek = sumBuyerDebits(transactions, user.username, ['subscription'], weekAgo);
        purchasesCount = countBuyerPurchases(transactions, user.username);
      } else {
        // ---------- FALLBACKS ----------
        // 1) Orders (fallback for purchases)
        purchasesSpent = orderHistory.reduce((sum, order) => {
          const price = order.markedUpPrice || order.price;
          return sum + (typeof price === 'number' && price > 0 ? price : 0);
        }, 0);

        purchasesThisWeek = orderHistory
          .filter(order => {
            try { return new Date(order.date) >= weekAgo; } catch { return false; }
          })
          .reduce((sum, order) => {
            const price = order.markedUpPrice || order.price;
            return sum + (typeof price === 'number' && price > 0 ? price : 0);
          }, 0);

        purchasesCount = orderHistory.length;

        // 2) Tips sent (fallback)
        tipsSpent = (sentTipsFallback || []).reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
        tipsThisWeek = (sentTipsFallback || [])
          .filter(t => {
            try { return new Date(t.date) >= weekAgo; } catch { return false; }
          })
          .reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

        // 3) Subscription charges (fallback using “subscription_details” snapshot)
        const fallbackSubs = subscribedSellers
          .map((s) => parseFloat(s.price || '0'))
          .filter((n) => Number.isFinite(n) && n > 0);
        subsSpent = fallbackSubs.reduce((a, b) => a + b, 0);
        subsThisWeek = 0; // unknown without transactions; leave as 0 in fallback
      }

      const totalSpent = Math.max(0, purchasesSpent + tipsSpent + subsSpent);
      const thisWeekSpent = Math.max(0, purchasesThisWeek + tipsThisWeek + subsThisWeek);

      // Month orders (remain from orders list)
      const monthOrders = orderHistory
        .filter(order => { try { return new Date(order.date) >= monthAgo; } catch { return false; } })
        .length;

      // Distinct sellers (from orders list)
      const favoriteSellerCount = new Set(orderHistory.map(order => order.seller)).size;

      return {
        totalSpent,
        totalOrders: Math.max(0, hasTx ? purchasesCount : orderHistory.length),
        activeSubscriptions: Math.max(0, subscribedSellers.length),
        pendingRequests: Math.max(0, requests.filter(r => r.status === 'pending').length),
        unreadMessages: Math.max(0, unreadCount),
        completedOrders: Math.max(0, completedOrders),
        favoriteSellerCount: Math.max(0, favoriteSellerCount),
        averageOrderValue:
          (hasTx ? purchasesCount : orderHistory.length) > 0
            ? Math.max(0, (hasTx ? purchasesSpent : totalSpent) / (hasTx ? purchasesCount : orderHistory.length))
            : 0,
        thisWeekSpent,
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
  }, [user, orderHistory, subscribedSellers, requests, messages, transactions, sentTipsFallback]);

  // Generate recent activity (unchanged, lightly aware of subscriptions)
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

      // Add subscription activity (display only)
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
