// src/app/buyers/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/buyers/dashboard/DashboardHeader';
import StatsGrid from '@/components/buyers/dashboard/StatsGrid';
import QuickActions from '@/components/buyers/dashboard/QuickActions';
import RecentActivity from '@/components/buyers/dashboard/RecentActivity';
import SubscribedSellers from '@/components/buyers/dashboard/SubscribedSellers';
// import FeaturedListings from '@/components/buyers/dashboard/FeaturedListings';
import { Truck, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BuyerDashboardPage() {
  const { user: authUser } = useAuth();
  const {
    user,
    balance,
    stats,
    subscribedSellers,
    recentActivity,
    // featuredListings,
    isLoading
  } = useDashboardData();

  if (!authUser || authUser.role !== 'buyer') {
    return (
      <BanCheck>
        <main className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-400">🚫 Access Denied</h1>
          <p className="text-gray-400">Only buyers can view this page.</p>
        </main>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <main className="min-h-screen bg-black text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header Section */}
            {isLoading ? (
              <div className="mb-12">
                <Skeleton className="h-10 w-64 mb-4" />
                <Skeleton className="h-6 w-48" />
              </div>
            ) : (
              <DashboardHeader username={user?.username || ''} />
            )}

            {/* Stats Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <StatsGrid stats={stats} />
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="xl:col-span-2 space-y-8">
                {/* Quick Actions */}
                <QuickActions />

                {/* Recent Activity */}
                {isLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <RecentActivity activities={recentActivity} />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Subscribed Sellers */}
                {isLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <SubscribedSellers subscriptions={subscribedSellers} />
                )}

                {/* Featured Listings - commented out
                {featuredListings && featuredListings.length > 0 && (
                  <FeaturedListings listings={featuredListings} />
                )} */}
              </div>
            </div>
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}