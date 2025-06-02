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
  DollarSign, 
  Package, 
  Clock, 
  Crown, 
  Star,
  User,
  Plus,
  ArrowRight,
  Calendar,
  Wallet,
  CheckCircle,
  AlertCircle,
  Truck,
  Activity,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SubscriptionInfo {
  seller: string;
  price: string;
  bio: string;
  pic: string | null;
  newListings: number;
  lastActive: string;
  tier?: string;
  verified?: boolean;
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);

  // Load subscriptions from the correct localStorage key
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username) {
      try {
        const subsKey = 'subscriptions';
        const storedSubs = localStorage.getItem(subsKey);
        
        if (storedSubs) {
          const allSubscriptions = JSON.parse(storedSubs);
          const userSubscriptions = allSubscriptions[user.username] || [];
          
          const subscriptionData: SubscriptionInfo[] = userSubscriptions.map((seller: string) => {
            const sellerUser = users[seller];
            // ✅ FIXED: Safely access bio property with fallback
            const sellerBio = sessionStorage.getItem(`profile_bio_${seller}`) || 
                             (sellerUser as any)?.bio || 
                             'No bio available';
            const sellerPic = sessionStorage.getItem(`profile_pic_${seller}`) || null;
            const subscriptionPrice = sessionStorage.getItem(`subscription_price_${seller}`) || '25.00';
            
            return {
              seller,
              price: subscriptionPrice,
              bio: sellerBio,
              pic: sellerPic,
              newListings: listings.filter(l => l.seller === seller && l.isPremium).length,
              lastActive: new Date().toISOString(),
              // ✅ FIXED: Safely access tier property with fallback
              tier: (sellerUser as any)?.tier || 'Tease',
              verified: sellerUser?.verified || sellerUser?.verificationStatus === 'verified'
            };
          });
          
          setSubscribedSellers(subscriptionData);
        }
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      }
    }
  }, [user?.username, listings, users]);

  // Calculate dashboard statistics
  const stats = useMemo(() => {
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

    const userOrders = orderHistory.filter(order => order.buyer === user.username);
    const userRequests = getRequestsForUser(user.username, 'buyer');
    
    const unreadCount = Object.values(messages)
      .flat()
      .filter(msg => 
        msg.receiver === user.username && 
        !msg.read
      ).length;

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
          icon: <MessageCircle className="w-4 h-4" />
        });
      });

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 6));
  }, [user, orderHistory, getRequestsForUser]);

  // Get featured/recommended listings
  useEffect(() => {
    const userOrders = orderHistory.filter(order => order.buyer === user?.username);
    const purchasedSellers = new Set(userOrders.map(order => order.seller));
    
    const recommendedListings = listings
      .filter(listing => 
        purchasedSellers.has(listing.seller) && 
        !listing.isPremium &&
        !listing.auction
      )
      .slice(0, 6);

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
        <main className="min-h-screen bg-black text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            
            {/* ✅ FIXED: Clean Header with properly sized wallet and button */}
            <div className="mb-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Welcome back, <span className="text-[#ff950e]">{user.username}</span>!
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Here's an overview of your account activity
                  </p>
                </div>
                
                {/* ✅ FIXED: Wallet balance with integrated add funds button */}
                <div className="flex justify-end">
                  {/* Wallet Balance with Plus Button in Top-Right */}
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-6 py-4 relative min-w-[200px]">
                    {/* Add Funds Button - Small green circle in top-right */}
                    <Link
                      href="/wallet/buyer"
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-colors shadow-lg"
                      title="Add Funds"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </Link>
                    
                    {/* Wallet Balance Content */}
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-[#ff950e]" />
                      <div>
                        <p className="text-xs text-gray-400 leading-none">Balance</p>
                        <p className="text-lg font-bold text-white leading-none">${balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - Clean and Simple */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-[#ff950e]" />
                  <span className="text-xl font-bold text-white">${stats.totalSpent.toFixed(2)}</span>
                </div>
                <p className="text-gray-400 font-medium">Total Spent</p>
              </div>
              
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-6 h-6 text-purple-400" />
                  <span className="text-xl font-bold text-white">{stats.totalOrders}</span>
                </div>
                <p className="text-gray-400 font-medium">Total Orders</p>
              </div>
              
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <span className="text-xl font-bold text-white">{stats.activeSubscriptions}</span>
                </div>
                <p className="text-gray-400 font-medium">Subscriptions</p>
              </div>
              
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="w-6 h-6 text-blue-400" />
                  <span className="text-xl font-bold text-white">{stats.unreadMessages}</span>
                </div>
                <p className="text-gray-400 font-medium">Unread Messages</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Main Content Area */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Quick Actions - Clean Grid */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-5">Quick Actions</h2>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link
                      href="/browse"
                      className="bg-[#111111] border border-gray-700 hover:border-[#ff950e] hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
                    >
                      <ShoppingBag className="w-7 h-7 text-[#ff950e] mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-semibold mb-1 text-sm">Browse</p>
                      <p className="text-gray-400 text-xs">Find new items</p>
                    </Link>
                    
                    <Link
                      href="/buyers/messages"
                      className="bg-[#111111] border border-gray-700 hover:border-blue-400 hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
                    >
                      <MessageCircle className="w-7 h-7 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-semibold mb-1 text-sm">Messages</p>
                      <p className="text-gray-400 text-xs">Chat with sellers</p>
                    </Link>
                    
                    <Link
                      href="/buyers/my-orders"
                      className="bg-[#111111] border border-gray-700 hover:border-purple-400 hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
                    >
                      <Package className="w-7 h-7 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-semibold mb-1 text-sm">My Orders</p>
                      <p className="text-gray-400 text-xs">Track purchases</p>
                    </Link>
                    
                    <Link
                      href="/wallet/buyer"
                      className="bg-[#111111] border border-gray-700 hover:border-green-400 hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
                    >
                      <Wallet className="w-7 h-7 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-semibold mb-1 text-sm">Wallet</p>
                      <p className="text-gray-400 text-xs">Manage funds</p>
                    </Link>
                  </div>
                </div>

                {/* Recent Activity - Clean List */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                    <Link 
                      href="/buyers/my-orders"
                      className="text-[#ff950e] hover:text-[#e88800] font-medium flex items-center gap-2 text-sm"
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
                          className="flex items-center gap-4 p-4 bg-[#111111] border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
                        >
                          <div className="p-2 bg-[#1a1a1a] rounded-lg border border-gray-700">
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
                              <div className="flex items-center gap-1 mt-1 justify-end">
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
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-4">No recent activity</p>
                      <Link
                        href="/browse"
                        className="inline-flex items-center gap-2 bg-[#ff950e] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#e88800] transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                
                {/* Subscriptions - Clean Design */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Crown className="w-6 h-6 text-yellow-400" />
                      Subscriptions
                    </h2>
                    <span className="bg-yellow-400 text-black text-sm px-2 py-1 rounded font-bold">
                      {subscribedSellers.length}
                    </span>
                  </div>
                  
                  {subscribedSellers.length > 0 ? (
                    <div className="space-y-4">
                      {subscribedSellers.slice(0, 4).map((sub) => (
                        <Link
                          key={sub.seller}
                          href={`/sellers/${sub.seller}`}
                          className="flex items-center gap-3 p-4 bg-[#111111] border border-gray-700 hover:border-yellow-400 rounded-lg transition-colors"
                        >
                          {sub.pic ? (
                            <img
                              src={sub.pic}
                              alt={sub.seller}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-lg">
                              {sub.seller.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-semibold truncate">{sub.seller}</p>
                              {sub.verified && (
                                <img src="/verification_badge.png" alt="Verified" className="w-5 h-5" />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm truncate">{sub.bio}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-yellow-400 font-bold">${sub.price}/mo</p>
                            {sub.newListings > 0 && (
                              <p className="text-green-400 text-sm">{sub.newListings} new</p>
                            )}
                          </div>
                        </Link>
                      ))}
                      
                      {subscribedSellers.length > 4 && (
                        <Link
                          href="/browse?filter=premium"
                          className="block text-center text-[#ff950e] hover:text-[#e88800] font-medium py-3"
                        >
                          View all {subscribedSellers.length} subscriptions
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Crown className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No active subscriptions</p>
                      <Link
                        href="/browse?filter=premium"
                        className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                      >
                        <Crown className="w-4 h-4" />
                        Browse Premium
                      </Link>
                    </div>
                  )}
                </div>

                {/* Order Status */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Truck className="w-6 h-6 text-blue-400" />
                    Order Status
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#111111] border border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">Pending</span>
                      </div>
                      <span className="text-white font-bold text-lg">{stats.pendingShipments}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#111111] border border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">Completed</span>
                      </div>
                      <span className="text-white font-bold text-lg">{stats.completedOrders}</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#111111] border border-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-orange-400" />
                        <span className="text-white font-medium">Requests</span>
                      </div>
                      <span className="text-white font-bold text-lg">{stats.pendingRequests}</span>
                    </div>
                  </div>
                  
                  <Link
                    href="/buyers/my-orders"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg mt-6 transition-colors"
                  >
                    View All Orders
                  </Link>
                </div>

                {/* Monthly Summary */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-400" />
                    This Month
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Orders</span>
                        <span className="text-white font-bold text-lg">{stats.thisMonthOrders}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((stats.thisMonthOrders / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Spent</span>
                        <span className="text-white font-bold text-lg">${stats.thisWeekSpent.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className="bg-[#ff950e] h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min((stats.thisWeekSpent / 500) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-gray-400 text-center">
                        Average order: <span className="text-white font-bold">${stats.averageOrderValue.toFixed(2)}</span>
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
