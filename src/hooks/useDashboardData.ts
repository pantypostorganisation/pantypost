// src/hooks/useDashboardData.ts

import { useState, useEffect, useMemo, createElement } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useRequests } from '@/context/RequestContext';
import { useListings } from '@/context/ListingContext';
import { useMessages } from '@/context/MessageContext';
import { DashboardStats, SubscriptionInfo, RecentActivity } from '@/types/dashboard';
import { Package, MessageCircle } from 'lucide-react';

export const useDashboardData = () => {
  const { user } = useAuth();
  const { orderHistory, getBuyerBalance } = useWallet();
  const { getRequestsForUser } = useRequests();
  const { listings, users } = useListings();
  const { messages } = useMessages();

  const [subscribedSellers, setSubscribedSellers] = useState<SubscriptionInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);

  // Load subscriptions
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

  // Generate recent activity
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
          icon: createElement(Package, { className: "w-4 h-4" })
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
          icon: createElement(MessageCircle, { className: "w-4 h-4" })
        });
      });

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 6));
  }, [user, orderHistory, getRequestsForUser]);

  // Get featured listings
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

  const balance = user ? getBuyerBalance(user.username) : 0;

  return {
    user,
    balance,
    stats,
    subscribedSellers,
    recentActivity,
    featuredListings
  };
};