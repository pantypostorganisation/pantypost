// src/app/wallet/admin/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { AlertCircle, BarChart3, Loader2, RefreshCw, Database, Shield, CheckCircle, XCircle } from 'lucide-react';
import { WalletRecovery } from '@/utils/walletRecovery';
import { getTimeFilteredData, getAllSellerWithdrawals } from '@/utils/admin/walletHelpers';

// Data Health Component
function DataHealthIndicator() {
  const [health, setHealth] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const healthReport = WalletRecovery.checkDataHealth();
      setHealth(healthReport);
    } catch (error) {
      console.error('Health check failed:', error);
    }
    setIsChecking(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const fixCorruption = async () => {
    try {
      WalletRecovery.cleanupCorrupted();
      await checkHealth();
      window.location.reload();
    } catch (error) {
      console.error('Fix failed:', error);
    }
  };

  if (!health) return null;

  const hasIssues = Object.values(health).some((item: any) => item.status === 'corrupted');

  return (
    <div className={`p-4 rounded-lg border mb-6 ${hasIssues ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasIssues ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          <span className="text-sm font-medium">
            Data Health: {hasIssues ? 'Issues Detected' : 'All Good'}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={checkHealth}
            disabled={isChecking}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded border border-gray-600 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            Check
          </button>
          
          {hasIssues && (
            <button
              onClick={fixCorruption}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded border border-red-500 transition-colors"
            >
              <Shield className="w-3 h-3" />
              Fix Issues
            </button>
          )}
        </div>
      </div>
      
      {hasIssues && (
        <div className="mt-2 text-xs text-red-300">
          <div>Admin Balance: {health.adminBalance.status}</div>
          <div>Buyer Data: {health.buyerData.status}</div>
          <div>Seller Data: {health.sellerData.status}</div>
        </div>
      )}
    </div>
  );
}

// Simple metrics component (inline to avoid prop issues)
function SimpleAdminMetrics({ 
  timeFilter, 
  filteredOrders, 
  filteredDeposits,
  adminBalance 
}: {
  timeFilter: string;
  filteredOrders: any[];
  filteredDeposits: any[];
  adminBalance: number;
}) {
  const totalSales = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);
  const totalDeposits = filteredDeposits
    .filter((deposit: any) => deposit.status === 'completed')
    .reduce((sum: number, deposit: any) => sum + deposit.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Admin Balance</p>
            <p className="text-2xl font-bold text-white">${adminBalance.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Sales ({timeFilter})</p>
            <p className="text-2xl font-bold text-white">{totalSales}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Revenue ({timeFilter})</p>
            <p className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-[#ff950e]/10 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-[#ff950e]" />
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Deposits</p>
            <p className="text-2xl font-bold text-white">${totalDeposits.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple revenue chart (inline to avoid prop issues)
function SimpleRevenueChart({ filteredOrders }: { filteredOrders: any[] }) {
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateString = date.toISOString().split('T')[0];
    
    const dayOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.toISOString().split('T')[0] === dateString;
    });
    
    return {
      date: dateString,
      revenue: dayOrders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0),
      sales: dayOrders.length,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Revenue Trend (Last 7 Days)</h3>
      <div className="space-y-4">
        {chartData.map((day, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-16 text-sm text-gray-400 text-right">
              {day.label}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-800 rounded-full h-2 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] h-full rounded-full transition-all duration-500"
                  style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="w-20 text-sm text-white text-right">
                ${day.revenue.toFixed(0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [dataLoaded, setDataLoaded] = useState(false);
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

  // Monitor data loading
  useEffect(() => {
    // Check if essential data is loaded
    const essentialDataLoaded = typeof adminBalance === 'number' && 
                               Array.isArray(orderHistory) && 
                               Array.isArray(depositLogs) && 
                               Array.isArray(adminActions);
    
    if (essentialDataLoaded && !dataLoaded) {
      setDataLoaded(true);
      console.log('✅ Admin dashboard data loaded:', {
        adminBalance,
        orderCount: orderHistory.length,
        depositCount: depositLogs.length,
        actionCount: adminActions.length
      });
    }
  }, [adminBalance, orderHistory, depositLogs, adminActions, dataLoaded]);

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  // Calculate filtered data
  const safeOrderHistory = Array.isArray(orderHistory) ? orderHistory : [];
  const safeDepositLogs = Array.isArray(depositLogs) ? depositLogs : [];
  const safeAdminActions = Array.isArray(adminActions) ? adminActions : [];
  
  const filteredData = getTimeFilteredData(
    safeOrderHistory,
    safeDepositLogs,
    safeAdminActions,
    timeFilter
  );

  // Loading state
  if (!dataLoaded) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading admin dashboard data...</p>
              <p className="text-xs text-gray-500 mt-2">
                Balance: {typeof adminBalance === 'number' ? '✓' : '⏳'} | 
                Orders: {Array.isArray(orderHistory) ? '✓' : '⏳'} | 
                Deposits: {Array.isArray(depositLogs) ? '✓' : '⏳'}
              </p>
            </div>
          </div>
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

  const totalSales = filteredData.orders.length;
  const totalRevenue = filteredData.orders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);
  const totalDeposits = getTotalDeposits ? getTotalDeposits() : 0;
  const completedDeposits = safeDepositLogs.filter(log => log.status === 'completed').length;

  return (
    <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Admin Analytics</h1>
              <p className="text-gray-400">Platform performance and financial overview</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#ff950e]"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
              
              {/* Details Toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-gray-700 hover:border-[#ff950e]/50 rounded-lg px-4 py-2 text-sm transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          </div>

          {/* Data Health Indicator */}
          <DataHealthIndicator />

          {/* Metrics */}
          <SimpleAdminMetrics 
            timeFilter={timeFilter}
            filteredOrders={filteredData.orders}
            filteredDeposits={filteredData.deposits}
            adminBalance={adminBalance}
          />
        </div>

        {/* Main Dashboard Components */}
        <div className="space-y-8">
          {/* Revenue Chart */}
          <SimpleRevenueChart filteredOrders={filteredData.orders} />
          
          {showDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {filteredData.orders.slice(0, 5).map((order, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-b-0">
                      <div>
                        <p className="text-white text-sm font-medium">{order.title}</p>
                        <p className="text-gray-400 text-xs">
                          {order.buyer} → {order.seller}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">${(order.markedUpPrice || order.price).toFixed(2)}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredData.orders.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Money Flow */}
              <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-4">Money Flow</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Platform Revenue</span>
                    <span className="text-green-400 font-medium">
                      ${(totalRevenue * 0.1).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Seller Earnings</span>
                    <span className="text-blue-400 font-medium">
                      ${(totalRevenue * 0.9).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Deposits</span>
                    <span className="text-purple-400 font-medium">
                      ${totalDeposits.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Admin Balance</span>
                    <span className="text-[#ff950e] font-medium">
                      ${adminBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Debug Info</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Admin Balance: ${adminBalance} (type: {typeof adminBalance})</div>
              <div>Orders: {safeOrderHistory.length} items</div>
              <div>Deposits: {safeDepositLogs.length} items</div>
              <div>Actions: {safeAdminActions.length} items</div>
              <div>Data Loaded: {dataLoaded ? 'Yes' : 'No'}</div>
              <div>Time Filter: {timeFilter}</div>
              <div>Filtered Orders: {filteredData.orders.length}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Main export with proper error boundary
export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Initializing admin analytics...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <RequireAuth role="admin">
      <AdminProfitDashboardContent />
    </RequireAuth>
  );
}
