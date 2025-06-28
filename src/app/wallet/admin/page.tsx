// src/app/wallet/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { AlertCircle, BarChart3, Loader2 } from 'lucide-react';

// Import split components
import AdminMetrics from '@/components/admin/wallet/AdminMetrics';
import AdminRevenueChart from '@/components/admin/wallet/AdminRevenueChart';
import AdminHealthSection from '@/components/admin/wallet/AdminHealthSection';
import AdminMoneyFlow from '@/components/admin/wallet/AdminMoneyFlow';
import AdminRecentActivity from '@/components/admin/wallet/AdminRecentActivity';
import { getTimeFilteredData, getAllSellerWithdrawals } from '@/utils/admin/walletHelpers';

function AdminProfitDashboardContent() {
  const { 
    adminBalance, 
    adminActions, 
    orderHistory, 
    wallet, 
    depositLogs, 
    getTotalDeposits, 
    getDepositsByTimeframe,
    sellerWithdrawals,
    adminWithdrawals
  } = useWallet();
  const { user } = useAuth();
  const { users, listings } = useListings();
  const [showDetails, setShowDetails] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | '3months' | 'year' | 'all'>('today');

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

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

  // Get filtered data
  const { 
    actions: filteredActions, 
    orders: filteredOrders, 
    deposits: filteredDeposits,
    sellerWithdrawals: filteredSellerWithdrawals,
    adminWithdrawals: filteredAdminWithdrawals
  } = getTimeFilteredData(timeFilter, adminActions, orderHistory, depositLogs, sellerWithdrawals, adminWithdrawals);

  return (
    <main className="min-h-screen bg-black text-white py-6 px-4 sm:px-6 overflow-x-hidden">
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
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 hover:bg-[#252525] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Force Reload
            </button>
          </div>
        </div>

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
      <WalletProvider>
        <AdminProfitDashboardContent />
      </WalletProvider>
    </RequireAuth>
  );
}
