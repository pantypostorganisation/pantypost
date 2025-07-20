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
                    <div className="space-y-2">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-[#111111] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-300">Processing</span>
                        </div>
                        <span className="text-sm font-bold text-white">{stats.pendingShipments}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-[#111111] rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">Delivered</span>
                        </div>
                        <span className="text-sm font-bold text-white">{stats.completedOrders}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Quick Stats</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">This Week Spent</span>
                      <span className="text-white font-bold">${stats.thisWeekSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Average Order</span>
                      <span className="text-white font-bold">${stats.averageOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Favorite Sellers</span>
                      <span className="text-white font-bold">{stats.favoriteSellerCount}</span>
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