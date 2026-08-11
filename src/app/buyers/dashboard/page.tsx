// src/app/buyers/dashboard/page.tsx
'use client';

import React, { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Plus, Search } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import { Skeleton } from '@/components/ui/Skeleton';
import { SecureImage, SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';

/* =====================================================================
 * BUYER DASHBOARD
 *
 * What this replaced: 740 lines containing four collapsible sections
 * (Overview / Connections / Activity / Insights), each with a row of
 * "summary pills" restating its own contents while collapsed, and TWO
 * MORE collapsibles nested inside one of them. Plus a stats grid of six
 * boxes, a quick-actions grid, an activity feed, a subscriptions list, a
 * favourites list and a spending panel.
 *
 * A buyer opening this page wants to know three things:
 *   1. how much money do I have
 *   2. where are my orders
 *   3. how do I get back to shopping
 *
 * Everything else was furniture. This page is now: balance + the two
 * actions, one line of numbers, and recent orders. Anything deeper lives
 * on the page that owns it -- /wallet/buyer, /buyers/my-orders,
 * /browse -- which is where a buyer expects to find it anyway.
 *
 * Nothing was moved behind a click: the sections that are gone were
 * duplicating pages that already exist.
 * ===================================================================== */

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

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-center">
      <AlertCircle className="mx-auto mb-4 h-10 w-10 text-danger" aria-hidden="true" />
      <h1 className="mb-2 text-xl font-bold text-white">Something went wrong</h1>
      <p className="mb-6 text-sm text-ink-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
      >
        Try again
      </button>
    </main>
  );
}

/** One number, stated plainly. No box, no icon, no border. */
function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums text-white sm:text-xl">{value}</p>
      <p className="text-xs text-ink-faint">{label}</p>
    </div>
  );
}

function DashboardContent() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const { user, balance, stats, subscribedSellers, recentActivity, isLoading } = useDashboardData();

  const safeBalance = typeof balance === 'number' && Number.isFinite(balance) ? balance : 0;

  const safeStats = {
    totalSpent: stats?.totalSpent ?? 0,
    totalOrders: stats?.totalOrders ?? 0,
    pendingShipments: stats?.pendingShipments ?? 0,
    activeSubscriptions: stats?.activeSubscriptions ?? 0,
  };

  const activity = useMemo(
    () => (Array.isArray(recentActivity) ? recentActivity.slice(0, 4) : []),
    [recentActivity]
  );

  const subscriptions = useMemo(
    () => (Array.isArray(subscribedSellers) ? subscribedSellers.slice(0, 6) : []),
    [subscribedSellers]
  );

  const money = useCallback(
    (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      }).format(value),
    []
  );

  if (!authUser || authUser.role !== 'buyer') {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold text-white">Buyers only</h1>
        <p className="text-sm text-ink-muted">This page is for buyer accounts.</p>
      </main>
    );
  }

  const displayName = user?.username || authUser?.username || '';

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* ---- Balance and the only two actions that matter ---- */}
        <section className="mb-8">
          <p className="mb-1 text-sm text-ink-muted">
            Welcome back, <span className="text-ink">{displayName}</span>
          </p>

          {isLoading ? (
            <Skeleton className="h-12 w-48 rounded-md bg-surface-overlay" />
          ) : (
            <p className="text-4xl font-bold tabular-nums text-white sm:text-5xl">
              {money(safeBalance)}
            </p>
          )}
          <p className="mt-1 text-xs text-ink-faint">Wallet balance</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/wallet/buyer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-hover active:bg-primary-press"
              style={{ color: '#000' }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="text-black">Add funds</span>
            </Link>

            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-md border border-line bg-transparent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary-line hover:bg-surface-hover"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Browse listings
            </Link>
          </div>
        </section>

        {/* ---- One line of numbers. Was a six-box grid plus four pill
                rows restating the same figures. ---- */}
        <section className="mb-8 grid grid-cols-2 gap-4 border-y border-line py-5 sm:grid-cols-4">
          <Figure label="Orders" value={String(safeStats.totalOrders)} />
          <Figure label="In transit" value={String(safeStats.pendingShipments)} />
          <Figure label="Subscriptions" value={String(safeStats.activeSubscriptions)} />
          <Figure label="Total spent" value={money(safeStats.totalSpent)} />
        </section>

        {/* ---- Recent orders ---- */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent orders</h2>
            <Link
              href="/buyers/my-orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              View all
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-md bg-surface-overlay" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="rounded-md border border-line bg-surface-raised px-6 py-10 text-center">
              <p className="mb-4 text-sm text-ink-muted">You haven&rsquo;t ordered anything yet.</p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-hover"
                style={{ color: '#000' }}
              >
                <span className="text-black">Find something</span>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface-raised">
              {activity.map((item: any) => (
                <li key={item.id}>
                  <Link
                    href={item.href || '/buyers/my-orders'}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <SecureMessageDisplay
                        content={item.title}
                        allowBasicFormatting={false}
                        className="block truncate text-sm font-medium text-ink"
                      />
                      <p className="mt-0.5 text-xs text-ink-faint">{item.time}</p>
                    </div>
                    {typeof item.amount === 'number' && !Number.isNaN(item.amount) ? (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
                        ${item.amount.toFixed(2)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---- Sellers you subscribe to: avatars, not cards. The old
                version gave each one a full card with tier badge, price,
                new-listing count and its own collapsible wrapper. ---- */}
        {subscriptions.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Your sellers</h2>
              <Link
                href="/buyers/profile"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
              >
                Manage
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {subscriptions.map((sub: any) => {
                const username = sanitizeUsername(sub.seller);
                return (
                  <button
                    key={`${sub.seller}-${sub.tier ?? 'tier'}`}
                    type="button"
                    onClick={() => router.push(`/sellers/${username}`)}
                    className="flex items-center gap-2 rounded-md border border-line bg-surface-raised py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary-line hover:bg-surface-hover"
                  >
                    <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-overlay">
                      {sub.pic ? (
                        <SecureImage
                          src={sub.pic}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
                          {username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-ink">{username}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function BuyerDashboardPage() {
  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <ErrorBoundary fallback={(error, reset) => <ErrorFallback error={error} reset={reset} />}>
          <DashboardContent />
        </ErrorBoundary>
      </RequireAuth>
    </BanCheck>
  );
}
