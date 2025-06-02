// src/app/buyers/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useRequests } from '@/context/RequestContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useEffect, useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  MessageCircle, 
  Heart, 
  DollarSign, 
  Package, 
  Clock, 
  Crown, 
  Star,
  TrendingUp,
  User,
  Settings,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  Eye,
  ShoppingCart,
  Wallet,
  Gift,
  Bell,
  Filter,
  Search,
  Gavel,
  CheckCircle,
  AlertCircle,
  Truck,
  CreditCard,
  Activity
} from 'lucide-react';

interface SubscriptionInfo {
  seller: string;
  price: string;
  bio: string;
  pic: string | null;
  newListings: number;
  lastActive: string;
}

interface DashboardStats {
  totalSpent: number;
  totalOrders: number;
  activeSubscriptions: number;
  pendingRequests: number;
  unreadMessages: number;
  completedOrders: number;
  favoriteSellerCount: number;
  averageOrderValue: number;
  thisWeekSpent: number;
  thisMonthOrders: number;
  pendingShipments: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'message' | 'subscription' | 'request';
  title: string;
  subtitle: string;
  time: string;
  status?: string;
  amount?: number;
  href?: string;
  icon: React.ReactNode;
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const { orderHistory, getBuyerBalance } = useWallet();
  const { getRequestsForUser } = useRequests();
  const { listings, users } = useListings();
  const { messages } = useMessages();

  const [subscribedSellers, setSubscribedSellers] = useState<SubscriptionInfo[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
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
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);

  // Fetch subscription data
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username) {
      const subs = JSON.parse(localStorage.getItem('buyer_subscriptions') || '{}');
      const userSubscriptions = subs[user.username] || [];
      
      const subscriptionData: SubscriptionInfo[] = userSubscriptions.map((seller: string) => ({
        seller,
        price: sessionStorage.getItem(`subscription_price_${seller}`) || 'N/A',
        bio: sessionStorage.getItem(`profile_bio_${seller}`) || 'No bio available',
        pic: sessionStorage.getItem(`profile_pic_${seller}`),
        newListings: listings.filter(l => l.seller === seller && l.isPremium).length,
        lastActive: new Date().toISOString() // Mock data
      }));
      
      setSubscribedSellers(subscriptionData);
    }
  }, [user?.username, listings]);

  // Calculate comprehensive dashboard statistics
  const stats = useMemo(() => {
    if (!user?.username) return dashboardStats;

    const userOrders = orderHistory.filter(order => order.buyer === user.username);
    const userRequests = getRequestsForUser(user.username, 'buyer');
    
    // Calculate unread messages
    const unreadCount = Object.values(messages)
      .flat()
      .filter(msg => 
        msg.receiver === user.username && 
        !msg.read
      ).length;

    // Recent activity calculations
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const weekSpent = userOrders
      .filter(order => new Date(order.date) >= oneWeekAgo)
      .reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);
    
    const monthOrders = userOrders
      .filter(order => new Date(order.date) >= oneMonthAgo).length;

    const totalSpent = userOrders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);
    const completedOrders = userOrders.filter(order => order.shippingStatus === 'shipped').length;
    const pendingShipments = userOrders.filter(order => 
      order.shippingStatus === 'pending' || order.shippingStatus === 'processing'
    ).length;
    
    const uniqueSellers = new Set(userOrders.map(order => order.seller)).size;
    
    return {
      totalSpent,
      totalOrders: userOrders.length,
      activeSubscriptions: subscribedSellers.length,
      pendingRequests: userRequests.filter(req => req.status === 'pending').length,
      unreadMessages: unreadCount,
      completedOrders,
      favoriteSellerCount: uniqueSellers,
      averageOrderValue: userOrders.length > 0 ? totalSpent / userOrders.length : 0,
      thisWeekSpent: weekSpent,
      thisMonthOrders: monthOrders,
      pendingShipments
    };
  }, [user, orderHistory, subscribedSellers, getRequestsForUser, messages]);

  // Generate recent activity feed
  useEffect(() => {
    if (!user?.username) return;

    const activities: RecentActivity[] = [];
    const userOrders = orderHistory.filter(order => order.buyer === user.username);
    const userRequests = getRequestsForUser(user.username, 'buyer');

    // Add recent orders
    userOrders
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
          icon: <Package className="w-4 h-4" />
        });
      });

    // Add recent requests
    userRequests
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
          icon: <Settings className="w-4 h-4" />
        });
      });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 6));
  }, [user, orderHistory, getRequestsForUser]);

  // Get featured/recommended listings
  useEffect(() => {
    const userOrders = orderHistory.filter(order => order.buyer === user?.username);
    const purchasedSellers = new Set(userOrders.map(order => order.seller));
    
    // Get listings from sellers user has purchased from before
    const recommendedListings = listings
      .filter(listing => 
        purchasedSellers.has(listing.seller) && 
        !listing.isPremium &&
        !listing.auction
      )
      .slice(0, 6);

    // If not enough, add popular listings
    if (recommendedListings.length < 6) {
      const popularListings = listings
        .filter(listing => 
          !purchasedSellers.has(listing.seller) &&
          !listing.isPremium &&
          !listing.auction
        )
        .slice(0, 6 - recommendedListings.length);
      
      recommendedListings.push(...popularListings);
    }

    setFeaturedListings(recommendedListings);
  }, [listings, orderHistory, user]);

  if (!user || user.role !== 'buyer') {
    return (
      <BanCheck>
        <main className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-400">🚫 Access Denied</h1>
          <p className="text-gray-400">Only buyers can view this page.</p>
        </main>
      </BanCheck>
    );
  }

  const balance = getBuyerBalance(user.username);

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            
            {/* Welcome Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff950e] to-[#ff6b00] bg-clip-text text-transparent">
                    Welcome back, {user.username}! 👋
                  </h1>
                  <p className="text-gray-400 mt-2">
                    Here's what's happening with your account
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 border border-[#ff950e]/30 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-[#ff950e]" />
                      <div>
                        <p className="text-xs text-gray-400">Wallet Balance</p>
                        <p className="text-xl font-bold text-[#ff950e]">${balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/wallet/buyer"
                    className="bg-[#ff950e] hover:bg-[#e88800] text-black font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Top Up
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-[#ff950e]/10 via-black/20 to-[#ff6b00]/10 border border-[#ff950e]/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#ff950e] text-sm font-medium">Total Spent</p>
                    <p className="text-white text-xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-[#ff950e]/60" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/10 via-black/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm font-medium">Total Orders</p>
                    <p className="text-white text-xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-400/60" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 via-black/20 to-emerald-600/10 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-300 text-sm font-medium">Subscriptions</p>
                    <p className="text-white text-xl font-bold">{stats.activeSubscriptions}</p>
                  </div>
                  <Crown className="w-8 h-8 text-green-400/60" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 via-black/20 to-cyan-600/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-300 text-sm font-medium">Messages</p>
                    <p className="text-white text-xl font-bold">{stats.unreadMessages}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-blue-400/60" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column - Main Content */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#ff950e]" />
                    Quick Actions
                  </h2>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                      href="/browse"
                      className="group bg-gradient-to-br from-[#ff950e]/10 to-[#ff6b00]/10 hover:from-[#ff950e]/20 hover:to-[#ff6b00]/20 border border-[#ff950e]/30 hover:border-[#ff950e]/50 rounded-lg p-4 transition-all transform hover:scale-105"
                    >
                      <ShoppingBag className="w-6 h-6 text-[#ff950e] mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-medium text-sm">Browse</p>
                      <p className="text-gray-400 text-xs">Discover new</p>
                    </Link>
                    
                    <Link
                      href="/buyers/messages"
                      className="group bg-gradient-to-br from-blue-500/10 to-cyan-600/10 hover:from-blue-500/20 hover:to-cyan-600/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg p-4 transition-all transform hover:scale-105"
                    >
                      <MessageCircle className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-medium text-sm">Messages</p>
                      <p className="text-gray-400 text-xs">Chat with sellers</p>
                    </Link>
                    
                    <Link
                      href="/buyers/my-orders"
                      className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg p-4 transition-all transform hover:scale-105"
                    >
                      <Package className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-medium text-sm">My Orders</p>
                      <p className="text-gray-400 text-xs">Track purchases</p>
                    </Link>
                    
                    <Link
                      href="/wallet/buyer"
                      className="group bg-gradient-to-br from-green-500/10 to-emerald-600/10 hover:from-green-500/20 hover:to-emerald-600/20 border border-green-500/30 hover:border-green-500/50 rounded-lg p-4 transition-all transform hover:scale-105"
                    >
                      <CreditCard className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-medium text-sm">Wallet</p>
                      <p className="text-gray-400 text-xs">Manage funds</p>
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#ff950e]" />
                      Recent Activity
                    </h2>
                    <Link 
                      href="/buyers/my-orders"
                      className="text-[#ff950e] hover:text-[#ff6b00] text-sm font-medium flex items-center gap-1"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <Link
                          key={activity.id}
                          href={activity.href || '#'}
                          className="block bg-black/20 hover:bg-black/40 border border-gray-800 hover:border-gray-600 rounded-lg p-4 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-gray-800 p-2 rounded-lg">
                              {activity.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium">{activity.title}</h3>
                              <p className="text-gray-400 text-sm">{activity.subtitle}</p>
                            </div>
                            <div className="text-right">
                              {activity.amount && (
                                <p className="text-[#ff950e] font-bold">${activity.amount.toFixed(2)}</p>
                              )}
                              <p className="text-gray-500 text-xs">{activity.time}</p>
                              {activity.status && (
                                <div className="flex items-center gap-1 mt-1">
                                  {activity.status === 'shipped' ? (
                                    <CheckCircle className="w-3 h-3 text-green-400" />
                                  ) : activity.status === 'pending' ? (
                                    <Clock className="w-3 h-3 text-yellow-400" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 text-orange-400" />
                                  )}
                                  <span className="text-xs capitalize text-gray-400">{activity.status}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No recent activity</p>
                      <Link
                        href="/browse"
                        className="inline-flex items-center gap-2 mt-4 bg-[#ff950e] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#e88800] transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recommended Listings */}
                {featuredListings.length > 0 && (
                  <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-[#ff950e]" />
                        Recommended For You
                      </h2>
                      <Link 
                        href="/browse"
                        className="text-[#ff950e] hover:text-[#ff6b00] text-sm font-medium flex items-center gap-1"
                      >
                        Browse All <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {featuredListings.slice(0, 6).map((listing) => (
                        <Link
                          key={listing.id}
                          href={`/browse/${listing.id}`}
                          className="group bg-black/20 hover:bg-black/40 border border-gray-800 hover:border-[#ff950e]/50 rounded-lg overflow-hidden transition-all transform hover:scale-[1.02]"
                        >
                          <div className="aspect-square bg-gray-800 overflow-hidden">
                            {listing.imageUrls?.[0] ? (
                              <img 
                                src={listing.imageUrls[0]} 
                                alt={listing.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="text-white font-medium text-sm truncate">{listing.title}</h3>
                            <p className="text-gray-400 text-xs truncate">by {listing.seller}</p>
                            <p className="text-[#ff950e] font-bold mt-1">${(listing.markedUpPrice || listing.price).toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                
                {/* Active Subscriptions */}
                <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      Subscriptions
                    </h2>
                    <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-bold">
                      {subscribedSellers.length}
                    </span>
                  </div>
                  
                  {subscribedSellers.length > 0 ? (
                    <div className="space-y-3">
                      {subscribedSellers.slice(0, 4).map((sub) => (
                        <Link
                          key={sub.seller}
                          href={`/sellers/${sub.seller}`}
                          className="block bg-black/20 hover:bg-black/40 border border-gray-800 hover:border-yellow-500/50 rounded-lg p-3 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {sub.pic ? (
                              <img
                                src={sub.pic}
                                alt={sub.seller}
                                className="w-10 h-10 rounded-full object-cover border border-gray-600"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                {sub.seller.charAt(0).toUpperCase()}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{sub.seller}</p>
                              <p className="text-gray-400 text-xs truncate">{sub.bio}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-yellow-400 font-bold text-sm">${sub.price}/mo</p>
                              {sub.newListings > 0 && (
                                <p className="text-green-400 text-xs">{sub.newListings} new</p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                      
                      {subscribedSellers.length > 4 && (
                        <Link
                          href="/browse?filter=premium"
                          className="block text-center text-[#ff950e] hover:text-[#ff6b00] text-sm font-medium py-2"
                        >
                          View all {subscribedSellers.length} subscriptions
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Crown className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm mb-3">No active subscriptions</p>
                      <Link
                        href="/browse?filter=premium"
                        className="inline-flex items-center gap-2 bg-yellow-600 text-black px-3 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-all"
                      >
                        <Crown className="w-3 h-3" />
                        Browse Premium
                      </Link>
                    </div>
                  )}
                </div>

                {/* Order Status Overview */}
                <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 rounded-xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-400" />
                    Order Status
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300 text-sm">Pending</span>
                      </div>
                      <span className="text-white font-bold">{stats.pendingShipments}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300 text-sm">Completed</span>
                      </div>
                      <span className="text-white font-bold">{stats.completedOrders}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-orange-400" />
                        <span className="text-gray-300 text-sm">Requests</span>
                      </div>
                      <span className="text-white font-bold">{stats.pendingRequests}</span>
                    </div>
                  </div>
                  
                  <Link
                    href="/buyers/my-orders"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg mt-4 transition-all"
                  >
                    View All Orders
                  </Link>
                </div>

                {/* This Month Summary */}
                <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-gray-700 rounded-xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    This Month
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400 text-sm">Orders</span>
                        <span className="text-white font-bold">{stats.thisMonthOrders}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((stats.thisMonthOrders / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400 text-sm">Spent</span>
                        <span className="text-white font-bold">${stats.thisWeekSpent.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-[#ff950e] h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((stats.thisWeekSpent / 500) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-gray-400 text-xs">
                        Average order: <span className="text-white font-semibold">${stats.averageOrderValue.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
