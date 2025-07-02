// src/app/wallet/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { getTimeFilteredData, getAllSellerWithdrawals } from '@/utils/admin/walletHelpers';

function AdminProfitDashboardContent() {
  // All hooks must be called before any conditional returns
  const { 
    adminBalance, 
    adminActions, 
    orderHistory, 
    wallet, 
    depositLogs, 
    getTotalDeposits, 
    getDepositsByTimeframe,
    sellerWithdrawals,
    adminWithdrawals,
    isLoading: walletLoading,
    isInitialized: walletInitialized,
    initializationError,
    reloadData
  } = useWallet();
  
  const { user } = useAuth();
  const { users, listings, isAuthReady: listingsReady } = useListings();
  
  const [showDetails, setShowDetails] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | '3months' | 'year' | 'all'>(() => {
    // Load saved time filter or default to 'all'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_dashboard_timefilter');
      if (saved && ['today', 'week', 'month', '3months', 'year', 'all'].includes(saved)) {
        return saved as any;
      }
    }
    return 'all';
  });
  
  // Save time filter when it changes
  useEffect(() => {
    localStorage.setItem('admin_dashboard_timefilter', timeFilter);
  }, [timeFilter]);

  // Get filtered data (moved before conditional returns)
  const { 
    actions: filteredActions, 
    orders: filteredOrders, 
    deposits: filteredDeposits,
    sellerWithdrawals: filteredSellerWithdrawals,
    adminWithdrawals: filteredAdminWithdrawals
  } = getTimeFilteredData(timeFilter, adminActions, orderHistory, depositLogs, sellerWithdrawals, adminWithdrawals);
  
  // Debug logging for deposits and orders
  useEffect(() => {
    console.log('Admin Dashboard Data:', {
      timeFilter,
      allOrders: orderHistory.length,
      filteredOrders: filteredOrders.length,
      pendingAuctionOrders: orderHistory.filter(o => o.shippingStatus === 'pending-auction').length,
      completedAuctionOrders: orderHistory.filter(o => o.wasAuction && o.shippingStatus !== 'pending-auction').length,
      allDeposits: depositLogs.length,
      filteredDeposits: filteredDeposits.length,
      totalDepositsAmount: getTotalDeposits()
    });
  }, [timeFilter, orderHistory, filteredOrders, depositLogs, filteredDeposits, getTotalDeposits]);

  // Handle force reload
  const handleForceReload = async () => {
    setIsReloading(true);
    try {
      // Reload wallet data
      if (reloadData) {
        await reloadData();
      }
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsReloading(false);
    }
  };

  // Check admin status AFTER all hooks
  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  // Now we can do conditional returns
  // Show loading state while wallet is initializing
  if (!walletInitialized || walletLoading) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-800">
          <Loader2 className="w-16 h-16 text-[#ff950e] animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Loading Analytics</h1>
          <p className="text-gray-400 text-center">
            Initializing wallet data and calculating metrics...
          </p>
        </div>
      </main>
    );
  }

  // Show error state if initialization failed
  if (initializationError) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Initialization Error</h1>
          <p className="text-gray-400 text-center mb-6">
            {initializationError}
          </p>
          <button
            onClick={handleForceReload}
            className="w-full px-4 py-2 bg-[#ff950e] hover:bg-[#ff6b00] text-black rounded-lg font-medium transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Access Denied</h1>
          <p className="text-gray-400 text-center">
            Only platform administrators can view this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white py-6 px-4 sm:px-6 overflow-x-hidden">
      {/* Loading overlay for reloads */}
      {isReloading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 shadow-xl">
            <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-3" />
            <p className="text-white font-medium">Reloading analytics data...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#ff950e] flex items-center gap-3">
              <BarChart3 className="h-8 w-8" />
              Platform Analytics
            </h1>
            <p className="text-gray-400 mt-1">
              Your money-making machine dashboard 💰
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Time Filter */}
            <div className="flex bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
              {[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: '3months', label: '3 Months' },
                { value: 'year', label: 'Year' },
                { value: 'all', label: 'All Time' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setTimeFilter(filter.value as any)}
                  className={`px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                    timeFilter === filter.value
                      ? 'bg-[#ff950e] text-black shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-[#252525]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Force Reload button */}
            <button
              onClick={handleForceReload}
              disabled={isReloading}
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 hover:bg-[#252525] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
              Force Reload
            </button>
          </div>
        </div>

        {/* Data status indicator */}
        {walletInitialized && (
          <div className="mb-6 p-4 bg-[#1a1a1a] border border-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Data synchronized</span>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        <AdminMetrics
          timeFilter={timeFilter}
          filteredActions={filteredActions}
          filteredOrders={filteredOrders}
          filteredDeposits={filteredDeposits}
          filteredSellerWithdrawals={filteredSellerWithdrawals}
          filteredAdminWithdrawals={filteredAdminWithdrawals}
          adminBalance={adminBalance}
          orderHistory={orderHistory}
          adminActions={adminActions}
          depositLogs={depositLogs}
          sellerWithdrawals={sellerWithdrawals}
          adminWithdrawals={adminWithdrawals}
        />

        <AdminRevenueChart
          timeFilter={timeFilter}
          orderHistory={orderHistory}
          adminActions={adminActions}
        />

        <AdminHealthSection
          users={users}
          listings={listings}
          wallet={wallet}
          depositLogs={depositLogs}
          filteredDeposits={filteredDeposits}
          sellerWithdrawals={sellerWithdrawals}
        />

        <AdminMoneyFlow />

        <AdminRecentActivity
          timeFilter={timeFilter}
          filteredDeposits={filteredDeposits}
          filteredSellerWithdrawals={filteredSellerWithdrawals}
          filteredAdminWithdrawals={filteredAdminWithdrawals}
          filteredActions={filteredActions}
          filteredOrders={filteredOrders}
        />
      </div>
    </main>
  );
}

export default function AdminProfitDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
