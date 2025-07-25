// src/app/buyers/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/buyers/dashboard/DashboardHeader';
import StatsGrid from '@/components/buyers/dashboard/StatsGrid';
import QuickActions from '@/components/buyers/dashboard/QuickActions';
import RecentActivity from '@/components/buyers/dashboard/RecentActivity';
import SubscribedSellers from '@/components/buyers/dashboard/SubscribedSellers';
import { Truck, Clock, CheckCircle, Heart, Star, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TierBadge from '@/components/TierBadge';

export default function BuyerDashboardPage() {
  const { user: authUser } = useAuth();
  const { favorites, favoriteCount, toggleFavorite, loadingFavorites } = useFavorites();
  const router = useRouter();
  const {
    user,
    balance,
    stats,
    subscribedSellers,
    recentActivity,
    isLoading
  } = useDashboardData();

  const handleRemoveFavorite = async (favorite: any) => {
    await toggleFavorite({
      id: favorite.sellerId,
      username: favorite.sellerUsername,
      profilePicture: favorite.profilePicture,
      tier: favorite.tier,
      isVerified: favorite.isVerified,
    });
  };

  const handleViewSellerProfile = (username: string) => {
    router.push(`/sellers/${username}`);
  };

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

                {/* Favorite Sellers Section */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-[#ff950e]" />
                      <h2 className="text-xl font-bold text-white">Favorite Sellers</h2>
                      <span className="text-sm text-gray-400">({favoriteCount})</span>
                    </div>
                    {favoriteCount > 3 && (
                      <button
                        onClick={() => router.push('/browse')}
                        className="text-sm text-[#ff950e] hover:text-[#ff7a00] transition-colors"
                      >
                        Browse more →
                      </button>
                    )}
                  </div>

                  {loadingFavorites ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : favoriteCount === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="mx-auto mb-3 text-gray-600" size={32} />
                      <p className="text-gray-400 mb-4">No favorite sellers yet</p>
                      <button
                        onClick={() => router.push('/browse')}
                        className="px-4 py-2 bg-[#ff950e] text-black rounded-lg text-sm font-medium hover:bg-[#ff7a00] transition-colors"
                      >
                        Browse Sellers
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.slice(0, 6).map((favorite) => (
                        <div
                          key={favorite.sellerId}
                          className="bg-[#111] rounded-lg p-4 hover:bg-[#222] transition-colors group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 cursor-pointer"
                                onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                              >
                                {favorite.profilePicture ? (
                                  <Image
                                    src={favorite.profilePicture}
                                    alt={favorite.sellerUsername}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    <Heart size={16} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 
                                  className="font-medium text-white hover:text-[#ff950e] cursor-pointer transition-colors"
                                  onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                                >
                                  {favorite.sellerUsername}
                                </h3>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {favorite.isVerified && (
                                    <Star className="text-[#ff950e]" size={12} />
                                  )}
                                  {favorite.tier && (
                                    <span className="text-xs text-gray-400">{favorite.tier}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFavorite(favorite)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                              aria-label="Remove from favorites"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                            className="w-full px-3 py-1.5 bg-[#222] text-white rounded text-xs font-medium hover:bg-[#333] transition-colors"
                          >
                            View Profile
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                      <span className="text-white font-bold">{favoriteCount}</span>
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
