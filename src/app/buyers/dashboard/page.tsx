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
import { Truck, Clock, CheckCircle, Heart, Star, X, AlertCircle, Crown, ChevronDown } from 'lucide-react';
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

interface CollapsibleSectionProps {
  id: string;
  title: string;
  description: string;
  summary?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ id, title, description, summary, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-white/10 bg-[#111111]/85 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)]"
    >
      <div className="p-6">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${id}-content`}
          className="flex w-full items-start justify-between gap-6 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <ChevronDown
            className={`mt-1 h-5 w-5 flex-shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`}
          />
        </button>
        {summary ? <div className="mt-4 flex flex-wrap gap-2">{summary}</div> : null}
      </div>
      <div
        id={`${id}-content`}
        className={`border-t border-white/5 p-6 ${isOpen ? 'block' : 'hidden'}`}
      >
        {isOpen ? children : null}
      </div>
    </section>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs text-gray-400">
      <span className="font-semibold text-white">{value}</span>
      <span className="uppercase tracking-wide">{label}</span>
    </span>
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

  type SectionId = 'overview' | 'connections' | 'activity' | 'insights';

  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    overview: true,
    connections: false,
    activity: false,
    insights: false,
  });
  const [openCollections, setOpenCollections] = useState<{ favorites: boolean; subscriptions: boolean }>({
    favorites: true,
    subscriptions: false,
  });

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const toggleSection = useCallback((sectionId: SectionId) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const toggleCollection = useCallback((collection: 'favorites' | 'subscriptions') => {
    setOpenCollections((prev) => ({ ...prev, [collection]: !prev[collection] }));
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
  const safeBalance =
    typeof balance === 'number' && Number.isFinite(balance) ? balance : 0;
  const safeSubscriptions = useMemo(
    () => (Array.isArray(subscribedSellers) ? subscribedSellers : []),
    [subscribedSellers]
  );
  const safeRecentActivity = useMemo(
    () => (Array.isArray(recentActivity) ? recentActivity : []),
    [recentActivity]
  );

  const favoritesPreview = safeFavorites.slice(0, 3);
  const subscriptionsPreview = safeSubscriptions.slice(0, 3);
  const activityPreview = safeRecentActivity.slice(0, 3);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  }, []);

  const formatNumber = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  }, []);

  const renderFavoritePreview = () => {
    if (loadingFavorites) {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={`favorite-skeleton-${index}`} className="h-24 rounded-2xl bg-[#181818]" />
          ))}
        </div>
      );
    }

    if (favoriteCount === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#181818] p-8 text-center">
          <Heart className="mx-auto mb-4 h-7 w-7 text-gray-600" />
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
        {favoritesPreview.map((favorite) => {
          if (!favorite?.sellerId || !favorite?.sellerUsername) return null;

          return (
            <div
              key={favorite.sellerId}
              className="group rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-[#ff950e]/40"
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
                  className="rounded-full border border-transparent p-1 text-gray-600 transition hover:border-[#ff950e]/40 hover:text-[#ff950e]"
                  aria-label="Remove from favorites"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
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
            <Skeleton key={`subscription-skeleton-${index}`} className="h-24 rounded-2xl bg-[#181818]" />
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
        {subscriptionsPreview.map((sub) => {
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
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-[#ff950e]/40"
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
        <main className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-[#080808] text-gray-100">
          <div className="mx-auto max-w-5xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
            {isLoading ? (
              <Skeleton className="h-44 rounded-3xl bg-[#1a1a1a]" />
            ) : (
              <DashboardHeader username={user?.username || authUser?.username || ''} />
            )}

            <div className="mt-8 space-y-6">
              <CollapsibleSection
                id="overview"
                title="Overview"
                description="Quick stats and shortcuts"
                summary={
                  <>
                    <SummaryPill label="spent" value={formatCurrency(safeStats.totalSpent)} />
                    <SummaryPill label="orders" value={formatNumber(safeStats.totalOrders)} />
                    <SummaryPill label="unread" value={formatNumber(safeStats.unreadMessages)} />
                  </>
                }
                isOpen={openSections.overview}
                onToggle={() => toggleSection('overview')}
              >
                <div className="space-y-5">
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[...Array(4)].map((_, index) => (
                        <Skeleton key={`overview-stat-${index}`} className="h-28 rounded-2xl bg-[#181818]" />
                      ))}
                    </div>
                  ) : (
                    <StatsGrid stats={safeStats} />
                  )}

                  <div className="rounded-2xl border border-white/5 bg-black/30 p-4">
                    <QuickActions />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                id="connections"
                title="Connections"
                description="Stay close to the creators you trust"
                summary={
                  <>
                    <SummaryPill label="favorites" value={formatNumber(favoriteCount)} />
                    <SummaryPill label="subscriptions" value={formatNumber(safeStats.activeSubscriptions)} />
                  </>
                }
                isOpen={openSections.connections}
                onToggle={() => toggleSection('connections')}
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/5 bg-black/20">
                    <button
                      type="button"
                      onClick={() => toggleCollection('favorites')}
                      aria-expanded={openCollections.favorites}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-white">Favorites</h3>
                        <p className="text-xs text-gray-500">Sellers you&apos;ve saved for quick access.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-gray-300">
                          {formatNumber(favoriteCount)}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-500 transition-transform ${openCollections.favorites ? 'rotate-180 text-white' : ''}`}
                        />
                      </div>
                    </button>
                    <div
                      className={`space-y-4 border-t border-white/5 px-5 py-4 ${openCollections.favorites ? 'block' : 'hidden'}`}
                    >
                      {renderFavoritePreview()}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                        <span>Showing a curated preview</span>
                        <button
                          type="button"
                          onClick={() => router.push('/browse')}
                          className="font-semibold text-[#ff950e] transition hover:text-[#ffb347]"
                        >
                          Discover more sellers
                        </button>
                      </div>
                      {favError ? (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                          {favError}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-black/20">
                    <button
                      type="button"
                      onClick={() => toggleCollection('subscriptions')}
                      aria-expanded={openCollections.subscriptions}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-white">Subscriptions</h3>
                        <p className="text-xs text-gray-500">Active memberships and recurring support.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-gray-300">
                          {formatNumber(safeStats.activeSubscriptions)}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-500 transition-transform ${openCollections.subscriptions ? 'rotate-180 text-white' : ''}`}
                        />
                      </div>
                    </button>
                    <div
                      className={`space-y-4 border-t border-white/5 px-5 py-4 ${openCollections.subscriptions ? 'block' : 'hidden'}`}
                    >
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
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                id="activity"
                title="Activity"
                description="Latest movements across your account"
                summary={
                  <>
                    <SummaryPill label="processing" value={formatNumber(safeStats.pendingShipments)} />
                    <SummaryPill label="delivered" value={formatNumber(safeStats.completedOrders)} />
                  </>
                }
                isOpen={openSections.activity}
                onToggle={() => toggleSection('activity')}
              >
                {isLoading ? (
                  <Skeleton className="h-[260px] rounded-2xl bg-[#1a1a1a]" />
                ) : (
                  <RecentActivity activities={activityPreview} />
                )}
              </CollapsibleSection>

              <CollapsibleSection
                id="insights"
                title="Insights"
                description="Balance, orders, and spending snapshots"
                summary={
                  <>
                    <SummaryPill label="balance" value={formatCurrency(safeBalance)} />
                    <SummaryPill label="week spend" value={formatCurrency(safeStats.thisWeekSpent)} />
                  </>
                }
                isOpen={openSections.insights}
                onToggle={() => toggleSection('insights')}
              >
                {isLoading ? (
                  <Skeleton className="h-[260px] rounded-2xl bg-[#1a1a1a]" />
                ) : (
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
                      <p className="text-sm text-gray-500">Current balance</p>
                      <p className="mt-3 text-3xl font-semibold text-white">{formatCurrency(safeBalance)}</p>
                      <p className="mt-2 text-xs text-gray-500">Available wallet balance</p>
                      <dl className="mt-5 space-y-3 text-sm text-gray-400">
                        <div className="flex items-center justify-between">
                          <dt>Orders this month</dt>
                          <dd className="font-semibold text-white">{formatNumber(safeStats.thisMonthOrders)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Active subscriptions</dt>
                          <dd className="font-semibold text-white">{formatNumber(safeStats.activeSubscriptions)}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt>Open requests</dt>
                          <dd className="font-semibold text-white">{formatNumber(safeStats.pendingRequests)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-200">
                          <Truck className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-white">Order status</h3>
                          <p className="text-xs text-gray-500">Snapshot of your active deliveries.</p>
                        </div>
                      </div>
                      <div className="mt-6 space-y-3 text-sm text-gray-400">
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-300" />
                            Processing
                          </div>
                          <span className="font-semibold text-white">{formatNumber(safeStats.pendingShipments)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-300" />
                            Delivered
                          </div>
                          <span className="font-semibold text-white">{formatNumber(safeStats.completedOrders)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
                      <h3 className="text-base font-semibold text-white">Spending insights</h3>
                      <p className="mt-1 text-xs text-gray-500">Keep tabs on your purchasing habits.</p>
                      <div className="mt-5 space-y-3 text-sm text-gray-400">
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <span className="text-gray-500">This week</span>
                          <span className="font-semibold text-white">{formatCurrency(safeStats.thisWeekSpent)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <span className="text-gray-500">Average order</span>
                          <span className="font-semibold text-white">{formatCurrency(safeStats.averageOrderValue)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-[#0b0b0b] px-4 py-3">
                          <span className="text-gray-500">Favorite sellers</span>
                          <span className="font-semibold text-white">{formatNumber(favoriteCount)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push('/wallet/buyer')}
                        className="mt-5 inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-[#ff950e] hover:text-[#ff950e]"
                      >
                        Manage funds
                      </button>
                    </div>
                  </div>
                )}
              </CollapsibleSection>
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
