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
              <DashboardHeader username={user?.username || ''} balance={balance} />
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
                  <Skeleton className="h-96" />
                ) : (
                  <RecentActivity activities={recentActivity} />
                )}
              </div>

              {/* Sidebar */}
              <div className="xl:col-span-1 space-y-8">
                {/* Subscriptions */}
                {isLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <SubscribedSellers subscriptions={subscribedSellers} />
                )}

                {/* Order Status */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Truck className="w-5 h-5 text-blue-400" />
                    <h2 className="text-xl font-bold text-white">Order Status</h2>
                  </div>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-orange-400" />
                            <span className="text-gray-300">Pending</span>
                          </div>
                          <span className="text-white font-semibold">{stats.pendingShipments}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-gray-300">Completed</span>
                          </div>
                          <span className="text-white font-semibold">{stats.completedOrders}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageCircle className="w-5 h-5 text-purple-400" />
                            <span className="text-gray-300">Requests</span>
                          </div>
                          <span className="text-white font-semibold">{stats.pendingRequests}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => window.location.href = '/buyers/my-orders'}
                        className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-colors"
                      >
                        View All Orders
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Featured Listings Section - Optional */}
            {/* {featuredListings.length > 0 && (
              <div className="mt-8">
                <FeaturedListings listings={featuredListings} />
              </div>
            )} */}
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
