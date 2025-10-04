// src/app/buyers/dashboard/page.tsx
'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
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
import { Truck, Clock, CheckCircle, Heart, Star, X, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (error: Error, reset: () => void) => React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, () => {
        this.setState({ hasError: false, error: null });
      });
    }

    return this.props.children;
  }
}

// Error Fallback Component
function DashboardErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-md mx-auto text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
        <p className="text-gray-400 mb-6">
          {error.message || 'Something went wrong loading your dashboard.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#ff950e] text-black rounded-lg hover:bg-[#ff7a00] transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent() {
  const { user: authUser } = useAuth();
  const { favorites, favoriteCount, toggleFavorite, loadingFavorites, error: favError } = useFavorites();
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const isMountedRef = useRef(true);
  
  const {
    user,
    balance,
    stats,
    subscribedSellers,
    recentActivity,
    isLoading
  } = useDashboardData();

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRemoveFavorite = useCallback(async (favorite: any) => {
    // Validate favorite data
    if (!favorite || typeof favorite !== 'object') {
      console.error('Invalid favorite object');
      return;
    }
    
    const { sellerId, sellerUsername, profilePicture, tier, isVerified } = favorite;
    
    if (!sellerId || !sellerUsername) {
      console.error('Missing required favorite properties');
      return;
    }
    
    try {
      await toggleFavorite({
        id: sellerId,
        username: sellerUsername,
        profilePicture: profilePicture || undefined,
        tier: tier || undefined,
        isVerified: isVerified || false,
      });
      
      // Reset image error state for this seller if successful
      if (isMountedRef.current) {
        setImageErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[sellerId];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }, [toggleFavorite]);

  const handleViewSellerProfile = useCallback((username: string) => {
    if (!username || typeof username !== 'string') {
      console.error('Invalid username provided');
      return;
    }
    router.push(`/sellers/${username}`);
  }, [router]);

  const handleImageError = useCallback((sellerId: string) => {
    if (!sellerId || !isMountedRef.current) return;
    setImageErrors(prev => ({ ...prev, [sellerId]: true }));
  }, []);

  // Handle successful image load (reset error state)
  const handleImageLoad = useCallback((sellerId: string) => {
    if (!sellerId || !isMountedRef.current) return;
    setImageErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[sellerId];
      return newErrors;
    });
  }, []);

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

  // Safe default values for stats - include all required properties
  const safeStats = {
    totalSpent: stats?.totalSpent ?? 0,
    totalOrders: stats?.totalOrders ?? 0,
    pendingShipments: stats?.pendingShipments ?? 0,
    completedOrders: stats?.completedOrders ?? 0,
    thisWeekSpent: stats?.thisWeekSpent ?? 0,
    averageOrderValue: stats?.averageOrderValue ?? 0,
    activeSubscriptions: stats?.activeSubscriptions ?? 0,
    pendingRequests: stats?.pendingRequests ?? 0,
    unreadMessages: stats?.unreadMessages ?? 0,
    favoriteSellerCount: stats?.favoriteSellerCount ?? 0,
    thisMonthOrders: stats?.thisMonthOrders ?? 0
  };

  // Safe favorites list
  const safeFavorites = Array.isArray(favorites) ? favorites : [];

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#060606] to-[#0c0c0c] text-gray-100">
          <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-[#ff950e]/10 blur-[140px]" aria-hidden />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-[#ff6b00]/5 blur-[160px]" aria-hidden />

          <div className="relative mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-44 rounded-3xl bg-[#1a1a1a]" />
              </div>
            ) : (
              <DashboardHeader username={user?.username || authUser?.username || ''} />
            )}

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-2xl bg-[#1a1a1a]" />
                    ))}
                  </div>
                ) : (
                  <StatsGrid stats={safeStats} />
                )}

                <QuickActions />

                <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff950e]/15 text-[#ffb347]">
                        <Heart className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Favorite sellers</h2>
                        <p className="text-xs text-gray-500">{favoriteCount} creators you follow closely</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/browse')}
                      className="text-sm font-medium text-[#ff950e] transition hover:text-[#ffb347]"
                    >
                      Discover more
                    </button>
                  </div>

                  {loadingFavorites ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl bg-[#181818]" />
                      ))}
                    </div>
                  ) : favoriteCount === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-[#181818] p-10 text-center">
                      <Heart className="mx-auto mb-4 h-8 w-8 text-gray-600" />
                      <p className="text-sm text-gray-400">You haven&apos;t saved any sellers yet.</p>
                      <button
                        onClick={() => router.push('/browse')}
                        className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] px-5 py-2 text-sm font-semibold text-black shadow-lg transition hover:shadow-[#ff950e]/30"
                      >
                        Explore marketplace
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {safeFavorites.slice(0, 6).map((favorite) => {
                        if (!favorite?.sellerId || !favorite?.sellerUsername) return null;

                        return (
                          <div
                            key={favorite.sellerId}
                            className="group rounded-2xl border border-white/5 bg-gradient-to-br from-[#181818] to-[#0f0f0f] p-4 transition hover:border-[#ff950e]/40 hover:bg-[#161616]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                                className="flex items-center gap-3 text-left"
                              >
                                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-white/10 bg-black/40">
                                  {favorite.profilePicture && !imageErrors[favorite.sellerId] ? (
                                    <Image
                                      src={favorite.profilePicture}
                                      alt={favorite.sellerUsername}
                                      fill
                                      className="object-cover"
                                      onError={() => handleImageError(favorite.sellerId)}
                                      onLoad={() => handleImageLoad(favorite.sellerId)}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-600">
                                      <Heart className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-white transition group-hover:text-[#ff950e]">
                                    {favorite.sellerUsername}
                                  </p>
                                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                    {favorite.isVerified && (
                                      <span className="flex items-center gap-1 text-blue-300">
                                        <Star className="h-3 w-3" /> Verified
                                      </span>
                                    )}
                                    {favorite.tier && <span className="rounded-full bg-black/40 px-2 py-0.5 text-gray-400">{favorite.tier}</span>}
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={() => handleRemoveFavorite(favorite)}
                                className="rounded-full border border-transparent p-1 text-gray-600 transition hover:border-[#ff950e]/40 hover:bg-black/40 hover:text-[#ff950e]"
                                aria-label="Remove from favorites"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                              <button
                                onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                                className="inline-flex items-center gap-1 font-medium text-[#ff950e] transition hover:text-[#ffb347]"
                              >
                                View profile
                              </button>
                              <span className="rounded-full bg-black/40 px-2 py-0.5 uppercase tracking-wide text-[10px] text-gray-400">
                                Favorite
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {favError && (
                    <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                      {favError}
                    </div>
                  )}
                </section>

                {isLoading ? (
                  <Skeleton className="h-96 rounded-3xl bg-[#1a1a1a]" />
                ) : (
                  <RecentActivity activities={recentActivity || []} />
                )}
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Account snapshot</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        ${balance.toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">Available wallet balance</p>
                    </div>
                    <button
                      onClick={() => router.push('/wallet/buyer')}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-gray-300 transition hover:border-[#ff950e] hover:text-[#ff950e]"
                    >
                      Manage funds
                    </button>
                  </div>
                  <dl className="mt-6 grid grid-cols-1 gap-3 text-sm text-gray-400">
                    <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3">
                      <dt className="text-gray-500">Orders this month</dt>
                      <dd className="font-medium text-white">{safeStats.thisMonthOrders}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3">
                      <dt className="text-gray-500">Active subscriptions</dt>
                      <dd className="font-medium text-white">{safeStats.activeSubscriptions}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3">
                      <dt className="text-gray-500">Open requests</dt>
                      <dd className="font-medium text-white">{safeStats.pendingRequests}</dd>
                    </div>
                  </dl>
                </section>

                {isLoading ? (
                  <Skeleton className="h-64 rounded-3xl bg-[#1a1a1a]" />
                ) : (
                  <SubscribedSellers subscriptions={subscribedSellers || []} />
                )}

                <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Order status</h2>
                      <p className="text-xs text-gray-500">Snapshot of your active deliveries</p>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="mt-6 space-y-3">
                      <Skeleton className="h-16 rounded-2xl bg-[#181818]" />
                      <Skeleton className="h-16 rounded-2xl bg-[#181818]" />
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-4">
                        <div className="flex items-center gap-3 text-gray-400">
                          <Clock className="h-4 w-4 text-yellow-300" />
                          Processing
                        </div>
                        <span className="font-semibold text-white">{safeStats.pendingShipments}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-4">
                        <div className="flex items-center gap-3 text-gray-400">
                          <CheckCircle className="h-4 w-4 text-emerald-300" />
                          Delivered
                        </div>
                        <span className="font-semibold text-white">{safeStats.completedOrders}</span>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
                  <h2 className="text-lg font-semibold text-white">Spending insights</h2>
                  <div className="mt-5 space-y-4 text-sm text-gray-400">
                    <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3">
                      <span className="text-gray-500">This week</span>
                      <span className="font-medium text-white">${safeStats.thisWeekSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3">
                      <span className="text-gray-500">Average order value</span>
                      <span className="font-medium text-white">${safeStats.averageOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-black/30 px-4 py-3">
                      <span className="text-gray-500">Favorite sellers</span>
                      <span className="font-medium text-white">{favoriteCount}</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}

// Main component with error boundary
export default function BuyerDashboardPage() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <DashboardErrorFallback error={error} reset={reset} />
      )}
    >
      <DashboardContent />
    </ErrorBoundary>
  );
}
