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
        <main className="min-h-screen bg-slate-950 text-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-44 rounded-3xl" />
              </div>
            ) : (
              <DashboardHeader username={user?.username || authUser?.username || ''} />
            )}

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <StatsGrid stats={safeStats} />
                )}

                <QuickActions />

                <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                        <Heart className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold">Favorite sellers</h2>
                        <p className="text-xs text-slate-400">{favoriteCount} creators you follow closely</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/browse')}
                      className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
                    >
                      Discover more
                    </button>
                  </div>

                  {loadingFavorites ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                      ))}
                    </div>
                  ) : favoriteCount === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/80 p-10 text-center">
                      <Heart className="mx-auto mb-4 h-8 w-8 text-slate-500" />
                      <p className="text-sm text-slate-300">You haven&apos;t saved any sellers yet.</p>
                      <button
                        onClick={() => router.push('/browse')}
                        className="mt-6 inline-flex items-center justify-center rounded-full bg-orange-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-300"
                      >
                        Explore marketplace
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {safeFavorites.slice(0, 6).map((favorite) => {
                        if (!favorite?.sellerId || !favorite?.sellerUsername) return null;

                        return (
                          <div
                            key={favorite.sellerId}
                            className="group rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition hover:border-orange-400/40 hover:bg-slate-900/80"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                                className="flex items-center gap-3 text-left"
                              >
                                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-white/10 bg-slate-800">
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
                                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                                      <Heart className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-100 transition group-hover:text-orange-200">
                                    {favorite.sellerUsername}
                                  </p>
                                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                    {favorite.isVerified && (
                                      <span className="flex items-center gap-1 text-blue-300">
                                        <Star className="h-3 w-3" /> Verified
                                      </span>
                                    )}
                                    {favorite.tier && <span className="rounded-full bg-slate-800 px-2 py-0.5">{favorite.tier}</span>}
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={() => handleRemoveFavorite(favorite)}
                                className="rounded-full p-1 text-slate-500 transition hover:bg-slate-800 hover:text-red-400"
                                aria-label="Remove from favorites"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                              <button
                                onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                                className="inline-flex items-center gap-1 font-medium text-orange-200 transition hover:text-orange-100"
                              >
                                View profile
                              </button>
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 uppercase tracking-wide text-[10px] text-slate-300">
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
                  <Skeleton className="h-96 rounded-3xl" />
                ) : (
                  <RecentActivity activities={recentActivity || []} />
                )}
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">Account snapshot</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-100">
                        ${balance.toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">Available wallet balance</p>
                    </div>
                    <button
                      onClick={() => router.push('/wallet/buyer')}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-orange-300 hover:text-orange-200"
                    >
                      Manage funds
                    </button>
                  </div>
                  <dl className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                      <dt className="text-slate-400">Orders this month</dt>
                      <dd className="font-medium text-slate-100">{safeStats.thisMonthOrders}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                      <dt className="text-slate-400">Active subscriptions</dt>
                      <dd className="font-medium text-slate-100">{safeStats.activeSubscriptions}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                      <dt className="text-slate-400">Open requests</dt>
                      <dd className="font-medium text-slate-100">{safeStats.pendingRequests}</dd>
                    </div>
                  </dl>
                </section>

                {isLoading ? (
                  <Skeleton className="h-64 rounded-3xl" />
                ) : (
                  <SubscribedSellers subscriptions={subscribedSellers || []} />
                )}

                <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">Order status</h2>
                      <p className="text-xs text-slate-400">Snapshot of your active deliveries</p>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="mt-6 space-y-3">
                      <Skeleton className="h-16 rounded-2xl" />
                      <Skeleton className="h-16 rounded-2xl" />
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-4">
                        <div className="flex items-center gap-3 text-slate-300">
                          <Clock className="h-4 w-4 text-yellow-300" />
                          Processing
                        </div>
                        <span className="font-semibold text-slate-100">{safeStats.pendingShipments}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-4">
                        <div className="flex items-center gap-3 text-slate-300">
                          <CheckCircle className="h-4 w-4 text-emerald-300" />
                          Delivered
                        </div>
                        <span className="font-semibold text-slate-100">{safeStats.completedOrders}</span>
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
                  <h2 className="text-lg font-semibold text-slate-100">Spending insights</h2>
                  <div className="mt-5 space-y-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                      <span className="text-slate-400">This week</span>
                      <span className="font-medium text-slate-100">${safeStats.thisWeekSpent.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                      <span className="text-slate-400">Average order value</span>
                      <span className="font-medium text-slate-100">${safeStats.averageOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-950/40 px-4 py-3">
                      <span className="text-slate-400">Favorite sellers</span>
                      <span className="font-medium text-slate-100">{favoriteCount}</span>
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
