// src/app/buyers/dashboard/page.tsx
'use client';

import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/buyers/dashboard/DashboardHeader';
import StatsGrid from '@/components/buyers/dashboard/StatsGrid';
import QuickActions from '@/components/buyers/dashboard/QuickActions';
import RecentActivity from '@/components/buyers/dashboard/RecentActivity';
import { Truck, Clock, CheckCircle, Heart, Star, X, AlertCircle, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';

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

  const sectionNavItems = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'connections', label: 'Connections' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'insights', label: 'Insights' }
    ],
    []
  );

  const [activeSection, setActiveSection] = useState(sectionNavItems[0]?.id ?? 'overview');
  const [activeCollection, setActiveCollection] = useState<'favorites' | 'subscriptions'>('favorites');

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-45% 0px -45% 0px',
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    sectionNavItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionNavItems]);

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

  const handleSectionNavigation = useCallback((targetId: string) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(targetId);
    }
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
  const safeBalance =
    typeof balance === 'number' && Number.isFinite(balance) ? balance : 0;
  const safeSubscriptions = useMemo(
    () => (Array.isArray(subscribedSellers) ? subscribedSellers : []),
    [subscribedSellers]
  );

  const renderFavoritePreview = () => {
    if (loadingFavorites) {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={`favorite-skeleton-${index}`} className="h-28 rounded-2xl bg-[#181818]" />
          ))}
        </div>
      );
    }

    if (favoriteCount === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#181818] p-8 text-center">
          <Heart className="mx-auto mb-4 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">You haven&apos;t saved any sellers yet.</p>
          <button
            onClick={() => router.push('/browse')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] px-5 py-2 text-sm font-semibold text-black shadow-lg transition hover:shadow-[#ff950e]/30"
          >
            Explore marketplace
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {safeFavorites.slice(0, 4).map((favorite) => {
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
                      {favorite.tier && (
                        <span className="rounded-full bg-black/40 px-2 py-0.5 text-gray-400">{favorite.tier}</span>
                      )}
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
              <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
                <button
                  onClick={() => handleViewSellerProfile(favorite.sellerUsername)}
                  className="inline-flex items-center gap-1 font-semibold text-[#ff950e] transition hover:text-[#ffb347]"
                >
                  View profile
                </button>
                <span className="rounded-full bg-black/40 px-2 py-0.5 text-white/60">Favorite</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubscriptionPreview = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={`subscription-skeleton-${index}`} className="h-28 rounded-2xl bg-[#181818]" />
          ))}
        </div>
      );
    }

    if (safeSubscriptions.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#181818] p-8 text-center">
          <Crown className="mx-auto mb-4 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">No active subscriptions yet.</p>
          <button
            onClick={() => router.push('/browse')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] px-5 py-2 text-sm font-semibold text-black shadow-lg transition hover:shadow-[#ff950e]/30"
          >
            Browse sellers
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {safeSubscriptions.slice(0, 4).map((sub) => {
          const sanitizedUsername = sanitizeUsername(sub.seller);
          const monthlyPrice =
            typeof sub.price === 'number'
              ? sub.price
              : typeof sub.price === 'string'
              ? Number(sub.price)
              : 0;
          const priceDisplay = Number.isFinite(monthlyPrice) ? monthlyPrice.toFixed(2) : '0.00';
          const newListings =
            typeof sub.newListings === 'number'
              ? Math.max(0, sub.newListings)
              : Number.isFinite(Number(sub.newListings))
              ? Math.max(0, Number(sub.newListings))
              : 0;

          return (
            <div
              key={`${sub.seller}-${sub.tier ?? 'tier'}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-gradient-to-br from-[#181818] to-[#0f0f0f] p-4 transition hover:border-[#ff950e]/40 hover:bg-[#161616]"
            >
              <div className="flex items-center gap-3">
                {sub.pic ? (
                  <SecureImage
                    src={sub.pic}
                    alt={sub.seller}
                    className="h-11 w-11 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-amber-200">
                    <Crown className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <button
                    onClick={() => router.push(`/sellers/${sanitizedUsername}`)}
                    className="text-sm font-medium text-white transition hover:text-[#ff950e]"
                  >
                    <SecureMessageDisplay content={sub.seller} allowBasicFormatting={false} className="inline" />
                  </button>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                    ${priceDisplay}/month
                    <span className="mx-2 text-white/20">•</span>
                    {newListings} new listings
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push(`/sellers/${sanitizedUsername}`)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-gray-300 transition hover:border-[#ff950e] hover:text-[#ff950e]"
              >
                View
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-[#060606] to-[#0c0c0c] text-gray-100">
          <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-[#ff950e]/10 blur-[140px]" aria-hidden />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-[#ff6b00]/5 blur-[160px]" aria-hidden />

          <div className="relative mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
            {isLoading ? (
              <Skeleton className="h-44 rounded-3xl bg-[#1a1a1a]" />
            ) : (
              <DashboardHeader username={user?.username || authUser?.username || ''} />
            )}

            <nav className="sticky top-6 z-30">
              <div className="rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur">
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {sectionNavItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSectionNavigation(item.id)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
                          isActive
                            ? 'bg-white/15 text-white shadow-[0_12px_30px_-20px_rgba(255,149,14,0.75)] ring-1 ring-[#ff950e]/40'
                            : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>

            <section id="overview" className="scroll-mt-32 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
                <div className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[...Array(4)].map((_, index) => (
                        <Skeleton key={`overview-stat-${index}`} className="h-32 rounded-2xl bg-[#1a1a1a]" />
                      ))}
                    </div>
                  ) : (
                    <StatsGrid stats={safeStats} />
                  )}
                </div>
                {isLoading ? (
                  <Skeleton className="h-full min-h-[280px] rounded-3xl bg-[#1a1a1a]" />
                ) : (
                  <QuickActions />
                )}
              </div>
            </section>

            <section id="connections" className="scroll-mt-32">
              <div className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Your network</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Creators you follow</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1">
                    <button
                      type="button"
                      onClick={() => setActiveCollection('favorites')}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        activeCollection === 'favorites'
                          ? 'bg-white/15 text-white shadow-[0_8px_24px_-16px_rgba(255,149,14,0.75)]'
                          : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      Favorites
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCollection('subscriptions')}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        activeCollection === 'subscriptions'
                          ? 'bg-white/15 text-white shadow-[0_8px_24px_-16px_rgba(255,149,14,0.75)]'
                          : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      Subscriptions
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {activeCollection === 'favorites' ? (
                    <>
                      {renderFavoritePreview()}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                        <span>Showing up to four favorites</span>
                        <button
                          type="button"
                          onClick={() => router.push('/browse')}
                          className="font-semibold text-[#ff950e] transition hover:text-[#ffb347]"
                        >
                          Discover more sellers
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {renderSubscriptionPreview()}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                        <span>Recent membership updates</span>
                        <button
                          type="button"
                          onClick={() => router.push('/buyers/profile')}
                          className="font-semibold text-[#ff950e] transition hover:text-[#ffb347]"
                        >
                          Manage subscriptions
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {favError && activeCollection === 'favorites' && (
                  <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                    {favError}
                  </div>
                )}
              </div>
            </section>

            <section id="timeline" className="scroll-mt-32">
              {isLoading ? (
                <Skeleton className="h-[340px] rounded-3xl bg-[#1a1a1a]" />
              ) : (
                <RecentActivity activities={recentActivity || []} />
              )}
            </section>

            <section id="insights" className="scroll-mt-32">
              {isLoading ? (
                <Skeleton className="h-[340px] rounded-3xl bg-[#1a1a1a]" />
              ) : (
                <div className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Financial pulse</p>
                      <h2 className="mt-1 text-xl font-semibold text-white">Wallet &amp; activity</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/wallet/buyer')}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:border-[#ff950e] hover:text-[#ff950e]"
                    >
                      Manage funds
                    </button>
                  </div>

                  <div className="mt-8 grid gap-5 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                      <p className="text-sm text-gray-500">Current balance</p>
                      <p className="mt-3 text-3xl font-semibold text-white">${safeBalance.toFixed(2)}</p>
                      <p className="mt-2 text-xs text-gray-500">Available wallet balance</p>
                      <dl className="mt-6 space-y-3 text-sm text-gray-400">
                        <div className="flex items-center justify-between">
                          <dt>Orders this month</dt>
                          <dd className="font-semibold text-white">{safeStats.thisMonthOrders}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Active subscriptions</dt>
                          <dd className="font-semibold text-white">{safeStats.activeSubscriptions}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Open requests</dt>
                          <dd className="font-semibold text-white">{safeStats.pendingRequests}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
                          <Truck className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-white">Order status</h3>
                          <p className="text-xs text-gray-500">Snapshot of your active deliveries</p>
                        </div>
                      </div>
                      <div className="mt-6 space-y-3 text-sm text-gray-400">
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-300" />
                            Processing
                          </div>
                          <span className="font-semibold text-white">{safeStats.pendingShipments}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-300" />
                            Delivered
                          </div>
                          <span className="font-semibold text-white">{safeStats.completedOrders}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/40 p-5">
                      <h3 className="text-base font-semibold text-white">Spending insights</h3>
                      <p className="mt-1 text-xs text-gray-500">Keep tabs on your purchasing habits</p>
                      <div className="mt-6 space-y-4 text-sm text-gray-400">
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <span className="text-gray-500">This week</span>
                          <span className="font-semibold text-white">${safeStats.thisWeekSpent.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <span className="text-gray-500">Average order value</span>
                          <span className="font-semibold text-white">${safeStats.averageOrderValue.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <span className="text-gray-500">Favorite sellers</span>
                          <span className="font-semibold text-white">{favoriteCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
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
