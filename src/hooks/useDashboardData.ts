// src/hooks/useDashboardData.ts

import { useState, useEffect, useMemo, createElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storageService } from '@/services';
import { listingsService } from '@/services/listings.service';
import { DashboardStats, SubscriptionInfo, RecentActivity } from '@/types/dashboard';
import { Package, MessageCircle, Crown } from 'lucide-react';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { walletService } from '@/services/wallet.service';
import { ordersService } from '@/services/orders.service';
import { tipService } from '@/services/tip.service';

// ---------- Local type defs used inside the hook ----------
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

// Add new interface for subscription data with price
interface SubscriptionData {
  seller: string;
  price: number;
  subscribedAt: string;
}

// ---------- Helpers ----------
const sanitizeOrder = (order: Order): Order => ({
  ...order,
  id: sanitizeStrict(order.id),
  title: sanitizeStrict(order.title),
  price: sanitizeNumber(order.price, 0, 100000),
  markedUpPrice: order.markedUpPrice ? sanitizeNumber(order.markedUpPrice, 0, 100000) : undefined,
  seller: sanitizeStrict(order.seller),
  buyer: sanitizeStrict(order.buyer),
  date: order.date,
  shippingStatus: order.shippingStatus ? sanitizeStrict(order.shippingStatus) : undefined,
});

const sanitizeRequest = (request: Request): Request => ({
  ...request,
  id: sanitizeStrict(request.id),
  title: sanitizeStrict(request.title),
  seller: sanitizeStrict(request.seller),
  buyer: sanitizeStrict(request.buyer),
  price: sanitizeNumber(request.price, 0, 100000),
  status: request.status,
  date: request.date,
});

const validateTransactionAmount = (transaction: Transaction): boolean => {
  if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) return false;
  if (transaction.amount < 0 || transaction.amount > 100000) return false;
  return true;
};

// ---------- Hook ----------
export const useDashboardData = () => {
  const { user } = useAuth();

  const [subscribedSellers, setSubscribedSellers] = useState<SubscriptionInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [balance, setBalance] = useState(0);

  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  const [tipsSpent, setTipsSpent] = useState(0);          // total tips sent ($)
  const [subsSpent, setSubsSpent] = useState(0);          // total subscription charges ($)

  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [requests, setRequests] = useState<Request[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Load wallet balance + (legacy) transactions (for balance only)
  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.username) return;
      try {
        const transactions = await storageService.getItem<Transaction[]>('wallet_transactions', []);
        const userTransactions = transactions
          .filter(t => t.userId === user.username && t.walletType === 'buyer')
          .filter(validateTransactionAmount);

        const calculatedBalance = userTransactions.reduce((sum, t) => {
          const amt = sanitizeNumber(t.amount, 0, 100000);
          return t.type === 'deposit' ? sum + amt : sum - amt;
        }, 0);

        setBalance(Math.max(0, calculatedBalance));
      } catch (error) {
        console.error('Error loading wallet data:', error);
        setErrors(prev => [...prev, 'Failed to load wallet data']);
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
        const sanitized: Record<string, Message[]> = {};
        Object.entries(allMessages).forEach(([key, msgs]) => {
          sanitized[key] = msgs.map(msg => ({
            ...msg,
            content: sanitizeStrict(msg.content),
            sender: sanitizeStrict(msg.sender),
            receiver: sanitizeStrict(msg.receiver),
          }));
        });
        setMessages(sanitized);
      } catch (error) {
        console.error('Error loading messages:', error);
        setErrors(prev => [...prev, 'Failed to load messages']);
      }
    };
    loadMessages();
  }, [user?.username]);

  // Load requests
  useEffect(() => {
    const loadRequests = async () => {
      if (!user?.username) return;
      try {
        const all = await storageService.getItem<Request[]>('requests', []);
        const mine = all.filter(r => r.buyer === user.username).map(sanitizeRequest);
        setRequests(mine);
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
          const sanitizedListings = response.data.map((l: Listing) => ({
            ...l,
            title: sanitizeStrict(l.title),
            description: sanitizeStrict(l.description),
            seller: sanitizeStrict(l.seller),
            price: sanitizeNumber(l.price, 0, 100000),
            markedUpPrice: l.markedUpPrice ? sanitizeNumber(l.markedUpPrice, 0, 100000) : undefined,
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

  // Load Orders + Tips + Subscriptions (spend + active subscriptions count/cards)
  useEffect(() => {
    const loadSpendingAndSubs = async () => {
      if (!user?.username) {
        setIsLoading(false);
        return;
      }
      try {
        // ----- Orders (API if available; fallback to local) -----
        const ordersRes = await ordersService.getOrders({ buyer: user.username });
        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          setOrderHistory(ordersRes.data.map(sanitizeOrder));
        } else {
          // fallback to local storage key used across app
          const localOrders = await storageService.getItem<Order[]>('wallet_orders', []);
          const mine = localOrders.filter(o => o.buyer === user.username).map(sanitizeOrder);
          setOrderHistory(mine);
        }
        setOrdersLoaded(true);

        // ----- Tips (sum all-time tips you sent) -----
        const tipsRes = await tipService.getSentTips();
        const tipsTotal = Array.isArray(tipsRes?.tips)
          ? tipsRes.tips.reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0)
          : 0;
        setTipsSpent(Math.max(0, tipsTotal));

        // ----- Subscriptions (tx: type=subscription, status=completed) -----
        const subsRes = await walletService.getTransactions(user.username, {
          type: 'subscription',
          status: 'completed',
        });

        let subsTx = subsRes.success && Array.isArray(subsRes.data) ? subsRes.data : [];
        // Total spent on subscriptions (all-time)
        const subsTotal = subsTx.reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
        setSubsSpent(Math.max(0, subsTotal));

        // Active subscriptions = unique sellers in last ~35 days
        const now = Date.now();
        const WINDOW_MS = 35 * 24 * 60 * 60 * 1000;
        const activeSellersSet = new Set<string>();
        const sellerLatestAmount: Record<string, number> = {};
        const sellerLatestDate: Record<string, number> = {};
        subsTx.forEach((t) => {
          const from = t.from ? sanitizeStrict(String(t.from)) : '';
          const to = t.to ? sanitizeStrict(String(t.to)) : '';
          const createdAtMs = t.createdAt ? Date.parse(String(t.createdAt)) : NaN;
          const within = isFinite(createdAtMs) ? (now - createdAtMs <= WINDOW_MS) : true;
          if (from === user.username && to && within) {
            activeSellersSet.add(to);
            const effDate = isFinite(createdAtMs) ? createdAtMs : now;
            if ((sellerLatestDate[to] ?? 0) <= effDate) {
              sellerLatestDate[to] = effDate;
              if (typeof t.amount === 'number' && t.amount > 0) {
                sellerLatestAmount[to] = t.amount;
              }
            }
          }
        });

        // Merge with local subscription data (so cards have bios/pics/etc.)
        const localSubsMap = await storageService.getItem<Record<string, string[]>>('subscriptions', {});
        const localSubs = localSubsMap[user.username] || [];

        const localSubsDetailsMap =
          await storageService.getItem<Record<string, SubscriptionData[]>>('subscription_details', {});
        const localDetails = localSubsDetailsMap[user.username] || [];

        const unifiedSellers = new Set<string>([
          ...Array.from(activeSellersSet),
          ...localSubs.map(sanitizeStrict),
        ]);

        const cards = await Promise.all(Array.from(unifiedSellers).map(async (seller) => {
          try {
            const detail = localDetails.find(d => d.seller === seller);
            const profile = await storageService.getItem<any>(`seller_profile_${seller}`, null);
            const sellerListings = listings.filter(l => l.seller === seller);

            const resolvedPrice =
              typeof sellerLatestAmount[seller] === 'number'
                ? sellerLatestAmount[seller].toFixed(2)
                : detail?.price?.toString()
                  || (typeof profile?.subscriptionPrice === 'number' ? profile.subscriptionPrice.toFixed(2) : profile?.subscriptionPrice)
                  || '25.00';

            return {
              seller: sanitizeStrict(seller),
              price: resolvedPrice,
              bio: profile?.bio ? sanitizeStrict(profile.bio) : 'No bio available',
              pic: profile?.profilePic || null,
              newListings: sellerListings.filter(l => l.isPremium).length,
              lastActive: new Date().toISOString(),
              tier: profile?.tier ? sanitizeStrict(profile.tier) : 'Tease',
              verified: Boolean(profile?.verificationStatus === 'verified'),
            };
          } catch {
            const detail = localDetails.find(d => d.seller === seller);
            const fallbackPrice =
              typeof sellerLatestAmount[seller] === 'number'
                ? sellerLatestAmount[seller].toFixed(2)
                : detail?.price?.toString() || '25.00';
            return {
              seller: sanitizeStrict(seller),
              price: fallbackPrice,
              bio: 'No bio available',
              pic: null,
              newListings: 0,
              lastActive: new Date().toISOString(),
              tier: 'Tease',
              verified: false,
            };
          }
        }));

        setSubscribedSellers(cards);
      } catch (error) {
        console.error('Error loading spend/subscriptions:', error);
        setErrors(prev => [...prev, 'Failed to load spending/subscriptions']);
      } finally {
        setIsLoading(false);
      }
    };

    loadSpendingAndSubs();
  }, [user?.username, listings]);

  // ---------- Stats (keeps orders count + new total spent) ----------
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
        pendingShipments: 0,
      };
    }

    try {
      // Unread messages
      let unread = 0;
      Object.values(messages).forEach(thread => {
        thread.forEach(msg => {
          if (msg.receiver === user.username && !msg.read) unread++;
        });
      });

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const completedOrders = orderHistory.filter(o => o.shippingStatus === 'delivered').length;
      const pendingShipments = orderHistory.filter(o => o.shippingStatus && o.shippingStatus !== 'delivered').length;

      const weekSpentFromOrders = orderHistory
        .filter(o => {
          try { return new Date(o.date) >= weekAgo; } catch { return false; }
        })
        .reduce((sum, o) => {
          const price = o.markedUpPrice ?? o.price;
          return sum + (typeof price === 'number' && price > 0 ? price : 0);
        }, 0);

      const monthOrders = orderHistory
        .filter(o => {
          try { return new Date(o.date) >= monthAgo; } catch { return false; }
        }).length;

      const favoriteSellerCount = new Set(orderHistory.map(o => o.seller)).size;

      const ordersSpent = orderHistory.reduce((sum, o) => {
        const price = o.markedUpPrice ?? o.price;
        return sum + (typeof price === 'number' && price > 0 ? price : 0);
      }, 0);

      const totalSpentAll = Math.max(0, ordersSpent + tipsSpent + subsSpent);

      return {
        totalSpent: totalSpentAll,
        totalOrders: Math.max(0, orderHistory.length),
        activeSubscriptions: Math.max(0, subscribedSellers.length),
        pendingRequests: Math.max(0, requests.filter(r => r.status === 'pending').length),
        unreadMessages: Math.max(0, unread),
        completedOrders: Math.max(0, completedOrders),
        favoriteSellerCount: Math.max(0, favoriteSellerCount),
        averageOrderValue: orderHistory.length > 0 ? Math.max(0, ordersSpent / orderHistory.length) : 0,
        thisWeekSpent: Math.max(0, weekSpentFromOrders + tipsSpent /* simple approx */),
        thisMonthOrders: Math.max(0, monthOrders),
        pendingShipments: Math.max(0, pendingShipments),
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
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
        pendingShipments: 0,
      };
    }
  }, [user, orderHistory, subscribedSellers, requests, messages, tipsSpent, subsSpent]);

  // ---------- Recent activity ----------
  useEffect(() => {
    if (!user?.username) return;

    try {
      const activities: RecentActivity[] = [];

      // Orders
      orderHistory.slice(0, 3).forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: sanitizeStrict(order.title),
          subtitle: `From ${sanitizeStrict(order.seller)}`,
          time: new Date(order.date).toLocaleDateString(),
          amount: sanitizeNumber(order.markedUpPrice ?? order.price, 0, 100000),
          status: order.shippingStatus ? sanitizeStrict(order.shippingStatus) : 'pending',
          href: `/buyers/my-orders#${order.id}`,
          icon: createElement(Package, { className: 'w-4 h-4' }),
        });
      });

      // Messages
      Object.entries(messages).forEach(([thread, threadMessages]) => {
        const recentMsg = threadMessages
          .filter(m => m.receiver === user.username)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (recentMsg) {
          activities.push({
            id: `msg-${recentMsg.id}`,
            type: 'message',
            title: `Message from ${sanitizeStrict(recentMsg.sender)}`,
            subtitle: sanitizeStrict(recentMsg.content).substring(0, 50) + '...',
            time: new Date(recentMsg.timestamp).toLocaleDateString(),
            href: `/buyers/messages?thread=${thread}`,
            icon: createElement(MessageCircle, { className: 'w-4 h-4' }),
          });
        }
      });

      // Subscription (show most recent one)
      subscribedSellers.slice(0, 1).forEach(sub => {
        activities.push({
          id: `sub-${sub.seller}`,
          type: 'subscription',
          title: `Subscribed to ${sub.seller}`,
          subtitle: 'Premium content access',
          time: 'Active',
          amount: parseFloat(sub.price),
          href: `/sellers/${sub.seller}`,
          icon: createElement(Crown, { className: 'w-4 h-4' }),
        });
      });

      const sorted = activities
        .sort((a, b) => {
          if (a.time === 'Active') return -1;
          if (b.time === 'Active') return 1;
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        })
        .slice(0, 5);

      setRecentActivity(sorted);
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
    errors,
  };
};
