// src/app/wallet/admin/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

// Import split components
import AdminMetrics from '@/components/admin/wallet/AdminMetrics';
import AdminRevenueChart from '@/components/admin/wallet/AdminRevenueChart';
import AdminHealthSection from '@/components/admin/wallet/AdminHealthSection';
import AdminMoneyFlow from '@/components/admin/wallet/AdminMoneyFlow';
import AdminRecentActivity from '@/components/admin/wallet/AdminRecentActivity';
import {
  calculatePlatformProfit,
  calculateSubscriptionProfit,
  calculateSubscriptionRevenue,
  calculateTotalRevenue,
  getTimeFilteredData
} from '@/utils/admin/walletHelpers';

type TimeFilter = 'today' | 'week' | 'month' | '3months' | 'year' | 'all';

// Memoize the main content component to prevent unnecessary re-renders
const AdminProfitDashboardContent = memo(function AdminProfitDashboardContent() {
  // All hooks must be called before any conditional returns
  const {
    adminBalance,
    adminActions,
    orderHistory,
    wallet,
    depositLogs,
    getTotalDeposits,
    sellerWithdrawals,
    adminWithdrawals,
    isLoading: walletLoading,
    isInitialized: walletInitialized,
    initializationError,
    reloadData,
  } = useWallet();

  const { user } = useAuth();
  const { users, listings } = useListings();

  const [isReloading, setIsReloading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const adminDisplayName = useMemo(
    () => user?.displayName || user?.username || 'Platform Admin',
    [user?.displayName, user?.username]
  );

  const adminInitial = useMemo(() => adminDisplayName.charAt(0).toUpperCase(), [adminDisplayName]);

  const usersArray = useMemo(() => (users ? Object.values(users) : []), [users]);

  const totalSellers = useMemo(
    () => usersArray.filter((info: any) => info?.role === 'seller').length,
    [usersArray]
  );

  const totalBuyers = useMemo(
    () => usersArray.filter((info: any) => info?.role === 'buyer').length,
    [usersArray]
  );

  const verifiedSellers = useMemo(
    () =>
      usersArray.filter(
        (info: any) => info?.role === 'seller' && (info?.verified || info?.verificationStatus === 'verified')
      ).length,
    [usersArray]
  );

  const totalListings = useMemo(() => (Array.isArray(listings) ? listings.length : 0), [listings]);

  const premiumListings = useMemo(
    () => (Array.isArray(listings) ? listings.filter((listing: any) => listing?.isPremium).length : 0),
    [listings]
  );

  const safeAdminBalance = useMemo(
    () => (typeof adminBalance === 'number' && Number.isFinite(adminBalance) ? adminBalance : 0),
    [adminBalance]
  );
  
  // Use a ref to track loading state for the guard check
  const isReloadingRef = useRef(false);

  // Initialize time filter with proper error handling
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => {
    if (typeof window === 'undefined') return 'all';
    try {
      const saved = localStorage.getItem('admin_dashboard_timefilter');
      if (saved && ['today', 'week', 'month', '3months', 'year', 'all'].includes(saved)) {
        return saved as TimeFilter;
      }
    } catch {
      // ignore
    }
    return 'all';
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Keep the ref in sync with the state
  useEffect(() => {
    isReloadingRef.current = isReloading;
  }, [isReloading]);

  // Optimize the time filter effect to prevent storage writes on every render
  useEffect(() => {
    if (!mounted) return;
    
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('admin_dashboard_timefilter', timeFilter);
      } catch {
        // ignore storage errors
      }
    }, 500); // Debounce storage writes
    
    return () => clearTimeout(timeoutId);
  }, [timeFilter, mounted]);

  // ✅ Source of truth: role from backend-authenticated user
  const isAdminUser = useMemo(() => user?.role === 'admin', [user?.role]);

  const filteredData = useMemo(() => {
    if (!adminActions || !orderHistory || !depositLogs || !sellerWithdrawals || !adminWithdrawals) {
      return {
        actions: [] as any[],
        orders: [] as any[],
        deposits: [] as any[],
        sellerWithdrawals: [] as any,
        adminWithdrawals: [] as any,
      };
    }

    try {
      return getTimeFilteredData(
        timeFilter,
        adminActions,
        orderHistory,
        depositLogs,
        sellerWithdrawals,
        adminWithdrawals
      );
    } catch (error) {
      console.error('Error filtering data:', error);
      return {
        actions: [] as any[],
        orders: [] as any[],
        deposits: [] as any[],
        sellerWithdrawals: [] as any,
        adminWithdrawals: [] as any,
      };
    }
  }, [timeFilter, adminActions, orderHistory, depositLogs, sellerWithdrawals, adminWithdrawals]);

  // --- NORMALIZERS: ensure arrays for components expecting arrays ---
  const isMap = (val: unknown): val is Record<string, any[]> =>
    !!val && !Array.isArray(val) && typeof val === 'object';

  const normalizeWithdrawals = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (isMap(val)) {
      const result: any[] = [];
      for (const [username, arr] of Object.entries(val)) {
        if (Array.isArray(arr)) {
          arr.forEach((w) => result.push({ username, ...w }));
        }
      }
      return result;
    }
    return [];
  };

  const filteredSellerWithdrawalsArr = useMemo(
    () => normalizeWithdrawals(filteredData.sellerWithdrawals),
    [filteredData.sellerWithdrawals]
  );

  const filteredAdminWithdrawalsArr = useMemo(
    () => normalizeWithdrawals(filteredData.adminWithdrawals),
    [filteredData.adminWithdrawals]
  );
  // -----------------------------------------------------------------

  const financialSnapshot = useMemo(() => {
    const ensureNumber = (value: number) => (Number.isFinite(value) ? value : 0);

    const safeFilteredOrders = Array.isArray(filteredData.orders) ? filteredData.orders : [];
    const safeFilteredActions = Array.isArray(filteredData.actions) ? filteredData.actions : [];
    const safeOrderHistory = Array.isArray(orderHistory) ? orderHistory : [];
    const safeAdminActions = Array.isArray(adminActions) ? adminActions : [];

    const periodSalesRevenue = ensureNumber(calculateTotalRevenue(safeFilteredOrders));
    const periodSubscriptionRevenue = ensureNumber(calculateSubscriptionRevenue(safeFilteredActions));
    const periodSalesProfit = ensureNumber(calculatePlatformProfit(safeFilteredOrders));
    const periodSubscriptionProfit = ensureNumber(calculateSubscriptionProfit(safeFilteredActions));

    const allSalesRevenue = ensureNumber(calculateTotalRevenue(safeOrderHistory));
    const allSubscriptionRevenue = ensureNumber(calculateSubscriptionRevenue(safeAdminActions));
    const allSalesProfit = ensureNumber(calculatePlatformProfit(safeOrderHistory));
    const allSubscriptionProfit = ensureNumber(calculateSubscriptionProfit(safeAdminActions));

    const revenue =
      timeFilter === 'all'
        ? allSalesRevenue + allSubscriptionRevenue
        : periodSalesRevenue + periodSubscriptionRevenue;

    const profit =
      timeFilter === 'all'
        ? allSalesProfit + allSubscriptionProfit
        : periodSalesProfit + periodSubscriptionProfit;

    return { revenue, profit };
  }, [
    adminActions,
    filteredData.actions,
    filteredData.orders,
    orderHistory,
    timeFilter
  ]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
    []
  );

  const formatCurrency = useCallback(
    (amount: number) => currencyFormatter.format(Number.isFinite(amount) ? amount : 0),
    [currencyFormatter]
  );

  const currentPeriodLabel = useMemo(() => {
    switch (timeFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case '3months':
        return 'Last 90 Days';
      case 'year':
        return 'This Year';
      default:
        return 'All Time';
    }
  }, [timeFilter]);

  const heroStats = useMemo(
    () => [
      {
        label: `${timeFilter === 'all' ? 'Total' : 'Period'} Revenue`,
        value: formatCurrency(financialSnapshot.revenue),
        sublabel: 'Sales + subscriptions',
        accent: 'from-[#ff950e]/40 via-[#ff6b00]/20 to-transparent text-[#ffbf7f]'
      },
      {
        label: `${timeFilter === 'all' ? 'Total' : 'Period'} Profit`,
        value: formatCurrency(financialSnapshot.profit),
        sublabel: 'After platform fees',
        accent: 'from-emerald-500/40 via-emerald-400/20 to-transparent text-emerald-200'
      },
      {
        label: 'Platform Balance',
        value: formatCurrency(safeAdminBalance),
        sublabel: 'Cash available right now',
        accent: 'from-sky-500/30 via-sky-400/15 to-transparent text-sky-200'
      },
      {
        label: 'Live Listings',
        value: totalListings.toLocaleString(),
        sublabel: `${premiumListings.toLocaleString()} premium • ${totalSellers.toLocaleString()} sellers`,
        accent: 'from-purple-500/40 via-purple-400/20 to-transparent text-purple-200'
      }
    ], [
      financialSnapshot,
      formatCurrency,
      premiumListings,
      safeAdminBalance,
      timeFilter,
      totalListings,
      totalSellers
    ]
  );

  // Fixed handleForceReload function
  const handleForceReload = useCallback(async () => {
    // Use ref for guard check to avoid stale closure
    if (isReloadingRef.current) {
      console.log('Reload already in progress, skipping...');
      return;
    }
    
    console.log('Starting force reload...');
    setIsReloading(true);
    isReloadingRef.current = true;
    
    try {
      if (reloadData && typeof reloadData === 'function') {
        // Add timeout to detect if reloadData hangs
        const reloadPromise = reloadData();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Reload timeout')), 30000) // 30 second timeout
        );
        
        await Promise.race([
          Promise.all([
            reloadPromise,
            new Promise((resolve) => setTimeout(resolve, 1000)) // Minimum 1 second delay
          ]),
          timeoutPromise
        ]);
        
        console.log('Force reload completed successfully');
      } else {
        console.warn('reloadData function not available');
        // Still wait minimum time to show loading state
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error during force reload:', error);
      // You might want to show an error toast here
    } finally {
      console.log('Resetting reload state');
      setIsReloading(false);
      isReloadingRef.current = false;
    }
  }, [reloadData]);

  const handleTimeFilterChange = useCallback((filter: TimeFilter) => {
    setTimeFilter(filter);
  }, []);

  if (!walletInitialized || walletLoading || !mounted) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-800">
          <Loader2 className="w-16 h-16 text-[#ff950e] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Loading Analytics</h1>
          <p className="text-gray-400 text-center">Initializing wallet data and calculating metrics...</p>
        </div>
      </main>
    );
  }

  if (initializationError) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Initialization Error</h1>
          <p className="text-gray-400 text-center mb-6">{initializationError}</p>
          <button
            onClick={handleForceReload}
            disabled={isReloading}
            className="w-full px-4 py-2 bg-[#ff950e] hover:bg-[#ff6b00] text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReloading ? 'Retrying...' : 'Retry Loading'}
          </button>
        </div>
      </main>
    );
  }

  if (!isAdminUser) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Access Denied</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#050505] text-white py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-[#ff6b00]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute top-48 -left-16 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />
      </div>

      {isReloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="rounded-2xl border border-white/10 bg-black/80 px-8 py-6 shadow-2xl shadow-[#ff950e]/20">
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#ff950e]" />
            <p className="text-sm font-medium text-white">Reloading analytics data...</p>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f0b0b]/90 via-[#120606]/90 to-[#050303]/90 p-6 sm:p-8 shadow-2xl shadow-[#ff950e]/10">
          <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[#ff950e]/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" aria-hidden="true" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff950e]/50 to-[#ff6b00]/40 blur-lg"
                  aria-hidden="true"
                />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-black/80 text-3xl font-bold">
                  {adminInitial}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold sm:text-4xl">{adminDisplayName}</h1>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Super Admin
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm text-gray-300">
                  Welcome back! Monitor payouts, marketplace traction, and subscription momentum without leaving the command
                  center.
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#ffbf7f]">
                  Performance • {currentPeriodLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                  { value: '3months', label: '90 Days' },
                  { value: 'year', label: 'Year' },
                  { value: 'all', label: 'All Time' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleTimeFilterChange(filter.value as TimeFilter)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap ${
                      timeFilter === filter.value
                        ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black shadow-lg shadow-[#ff950e]/30'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleForceReload}
                disabled={isReloading}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#ff950e]/60 hover:bg-[#ff950e]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 text-[#ffbf7f] transition-transform ${
                    isReloading ? 'animate-spin' : 'group-hover:rotate-6'
                  }`}
                />
                <span>{isReloading ? 'Reloading...' : 'Force Reload'}</span>
              </button>
            </div>
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition duration-300 hover:border-[#ff950e]/60 hover:shadow-lg hover:shadow-[#ff950e]/15"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  aria-hidden="true"
                />
                <div className="relative flex flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{stat.label}</span>
                  <span className="text-3xl font-bold text-white">{stat.value}</span>
                  <span className="text-xs text-gray-400">{stat.sublabel}</span>
                </div>
              </div>
            ))}
          </div>

          {walletInitialized && (
            <div className="relative mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300">
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span>Data synchronized</span>
                <span className="text-emerald-200/80">Last updated {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#ffbf7f]">Audience</span>
                <span>
                  {totalSellers.toLocaleString()} sellers • {totalBuyers.toLocaleString()} buyers
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#ffbf7f]">Verified</span>
                <span>{verifiedSellers.toLocaleString()} sellers</span>
              </div>
            </div>
          )}
        </section>

        {adminBalance !== undefined && (
          <AdminMetrics
            timeFilter={timeFilter}
            filteredActions={filteredData.actions}
            filteredOrders={filteredData.orders}
            filteredDeposits={filteredData.deposits}
            filteredSellerWithdrawals={filteredSellerWithdrawalsArr}
            filteredAdminWithdrawals={filteredAdminWithdrawalsArr}
            adminBalance={adminBalance}
            orderHistory={orderHistory || []}
            adminActions={adminActions || []}
            depositLogs={depositLogs || []}
            sellerWithdrawals={sellerWithdrawals || []}
            adminWithdrawals={adminWithdrawals || []}
          />
        )}

        {orderHistory && adminActions && (
          <AdminRevenueChart timeFilter={timeFilter} orderHistory={orderHistory} adminActions={adminActions} />
        )}

        {users && listings && wallet && depositLogs && sellerWithdrawals && (
          <AdminHealthSection
            users={users}
            listings={listings}
            wallet={wallet}
            depositLogs={depositLogs}
            filteredDeposits={filteredData.deposits}
            sellerWithdrawals={sellerWithdrawals}
          />
        )}

        <AdminMoneyFlow />

        <AdminRecentActivity
          timeFilter={timeFilter}
          filteredDeposits={filteredData.deposits}
          filteredSellerWithdrawals={filteredSellerWithdrawalsArr}
          filteredAdminWithdrawals={filteredAdminWithdrawalsArr}
          filteredActions={filteredData.actions}
          filteredOrders={filteredData.orders}
        />
      </div>
    </main>
  );
});

export default function AdminProfitDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <RequireAuth role="admin">
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-[#ff950e] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading platform analytics...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <AdminProfitDashboardContent />
    </RequireAuth>
  );
}
