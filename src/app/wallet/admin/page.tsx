// src/app/wallet/admin/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { AlertCircle, BarChart3, Loader2, RefreshCw } from 'lucide-react';

// Import split components
import AdminMetrics from '@/components/admin/wallet/AdminMetrics';
import AdminRevenueChart from '@/components/admin/wallet/AdminRevenueChart';
import AdminHealthSection from '@/components/admin/wallet/AdminHealthSection';
import AdminMoneyFlow from '@/components/admin/wallet/AdminMoneyFlow';
import AdminRecentActivity from '@/components/admin/wallet/AdminRecentActivity';
import { getTimeFilteredData } from '@/utils/admin/walletHelpers';

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
    <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6 overflow-x-hidden">
      {isReloading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#101010] rounded-xl p-6 border border-[#1f1f1f] shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
            <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-200">Reloading analytics data...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#ff950e]/10">
                <BarChart3 className="h-6 w-6 text-[#ff950e]" />
              </span>
              <span className="leading-tight">
                Platform Analytics
                <span className="block text-sm font-normal text-gray-400">Real-time overview of PantyPost revenue performance.</span>
              </span>
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-md border border-[#1f1f1f] bg-[#101010] p-1">
              {[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: '3months', label: '3 Months' },
                { value: 'year', label: 'Year' },
                { value: 'all', label: 'All Time' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handleTimeFilterChange(filter.value as TimeFilter)}
                  className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-[6px] ${
                    timeFilter === filter.value
                      ? 'bg-[#ff950e] text-black'
                      : 'text-gray-300 hover:text-white hover:bg-[#1c1c1c]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleForceReload}
              disabled={isReloading}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#ff950e] bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#ffa733] disabled:cursor-not-allowed disabled:border-[#ff950e]/60 disabled:bg-[#ff950e]/60"
            >
              <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
              {isReloading ? 'Reloading…' : 'Force Reload'}
            </button>
          </div>
        </div>

        {walletInitialized && (
          <div className="rounded-lg border border-[#1f1f1f] bg-[#101010] px-4 py-3 text-xs text-gray-400">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                <span className="uppercase tracking-wide">Data synchronized</span>
              </div>
              <div className="hidden h-4 w-px bg-[#1f1f1f] sm:block" aria-hidden="true" />
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Last updated
                <span className="ml-2 text-gray-300 normal-case">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}

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
