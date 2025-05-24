'use client';

import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import { useState, useRef, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Wallet,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Eye,
  EyeOff,
  Star,
  Award,
  Zap,
  Info,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

export default function AdminProfitDashboard() {
  const { adminBalance, adminActions, orderHistory, wallet } = useWallet();
  const { user, users, listings } = useListings();
  const [showDetails, setShowDetails] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d' | '90d'>('30d');

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  // Calculate comprehensive metrics
  const allUsers = Object.values(users).filter(u => u.role !== 'admin');
  const buyers = allUsers.filter(u => u.role === 'buyer');
  const sellers = allUsers.filter(u => u.role === 'seller');
  const verifiedSellers = sellers.filter(u => u.verified || u.verificationStatus === 'verified');
  
  // Revenue calculations
  const totalPlatformRevenue = adminBalance;
  const averageOrderValue = orderHistory.length > 0 ? (totalPlatformRevenue / orderHistory.length) * 5 : 0; // Multiply by 5 since we get 20%
  const totalGMV = averageOrderValue * orderHistory.length; // Gross Merchandise Value
  
  // User engagement metrics
  const activeListings = listings.length;
  const avgListingsPerSeller = sellers.length > 0 ? activeListings / sellers.length : 0;
  const buyerToSellerRatio = sellers.length > 0 ? buyers.length / sellers.length : 0;
  
  // Calculate daily/weekly/monthly trends
  const getTimeFilteredData = () => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeFilter) {
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(now.getDate() - 90);
        break;
      default:
        return adminActions;
    }
    
    return adminActions.filter(action => new Date(action.date) >= filterDate);
  };

  const filteredActions = getTimeFilteredData();
  const periodRevenue = filteredActions
    .filter(action => action.type === 'credit')
    .reduce((sum, action) => sum + action.amount, 0);

  // Calculate growth metrics
  const previousPeriodActions = adminActions.filter(action => {
    const actionDate = new Date(action.date);
    const now = new Date();
    const currentPeriodStart = new Date();
    const previousPeriodStart = new Date();
    
    switch (timeFilter) {
      case '7d':
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodStart.setDate(now.getDate() - 14);
        return actionDate >= previousPeriodStart && actionDate < currentPeriodStart;
      case '30d':
        currentPeriodStart.setDate(now.getDate() - 30);
        previousPeriodStart.setDate(now.getDate() - 60);
        return actionDate >= previousPeriodStart && actionDate < currentPeriodStart;
      case '90d':
        currentPeriodStart.setDate(now.getDate() - 90);
        previousPeriodStart.setDate(now.getDate() - 180);
        return actionDate >= previousPeriodStart && actionDate < currentPeriodStart;
      default:
        return false;
    }
  });

  const previousPeriodRevenue = previousPeriodActions
    .filter(action => action.type === 'credit')
    .reduce((sum, action) => sum + action.amount, 0);

  const growthRate = previousPeriodRevenue > 0 ? 
    ((periodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0;

  // Top performing sellers by wallet balance
  const topSellers = Object.entries(wallet)
    .filter(([username]) => users[username]?.role === 'seller')
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Revenue distribution by day (for chart)
  const getRevenueByDay = () => {
    const days = [];
    const now = new Date();
    const daysToShow = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : timeFilter === '90d' ? 90 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dayActions = adminActions.filter(action => {
        const actionDate = new Date(action.date);
        return actionDate.toDateString() === date.toDateString();
      });
      
      const dayRevenue = dayActions
        .filter(action => action.type === 'credit')
        .reduce((sum, action) => sum + action.amount, 0);
      
      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        transactions: dayActions.length
      });
    }
    return days;
  };

  const chartData = getRevenueByDay();
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    <RequireAuth role="admin">
      <main className="min-h-screen bg-black text-white py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
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
                  { value: '7d', label: 'Week' },
                  { value: '30d', label: 'Month' },
                  { value: '90d', label: '3 Months' },
                  { value: 'all', label: 'All Time' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value as any)}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                      timeFilter === filter.value
                        ? 'bg-[#ff950e] text-black shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Money Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Money Made */}
            <div className="md:col-span-1 bg-gradient-to-br from-[#ff950e]/20 to-[#ff6b00]/10 rounded-xl p-6 border border-[#ff950e]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff950e]/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#ff950e] rounded-lg">
                    <DollarSign className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">Total Money Made</h3>
                    <p className="text-xs text-gray-500">Your platform profit</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">{formatCurrency(totalPlatformRevenue)}</span>
                  <span className="text-lg text-[#ff950e] font-medium">💰</span>
                </div>
                <p className="text-sm text-gray-400">20% from every transaction</p>
              </div>
            </div>

            {/* Period Performance */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">
                    {timeFilter === 'all' ? 'All Time' : timeFilter === '7d' ? 'This Week' : timeFilter === '30d' ? 'This Month' : 'Last 3 Months'}
                  </h3>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-white">{formatCurrency(periodRevenue)}</span>
                  {growthRate !== 0 && (
                    <span className={`text-sm flex items-center gap-1 ${
                      growthRate > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {growthRate > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(growthRate).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {filteredActions.filter(a => a.type === 'credit').length} revenue transactions
                </p>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">Avg Order Value</h3>
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-white">{formatCurrency(averageOrderValue)}</span>
                  <span className="text-xs text-gray-500">per sale</span>
                </div>
                <p className="text-xs text-gray-500">
                  = {formatCurrency(averageOrderValue * 0.2)} profit each
                </p>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#ff950e]" />
                Revenue Trend
              </h3>
              <div className="text-sm text-gray-400">
                Daily revenue over {timeFilter === 'all' ? 'last 30 days' : timeFilter === '7d' ? 'week' : timeFilter === '30d' ? 'month' : '3 months'}
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-1 mb-4">
              {chartData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex justify-center mb-2">
                    <div
                      className="w-8 bg-gradient-to-t from-[#ff950e] to-[#ff6b00] rounded-t-lg transition-all duration-300 group-hover:from-[#ff6b00] group-hover:to-[#ff950e] min-h-[4px]"
                      style={{
                        height: `${Math.max((day.revenue / maxRevenue) * 200, 4)}px`
                      }}
                    ></div>
                    <div className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatCurrency(day.revenue)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 transform -rotate-45 origin-center">
                    {day.date}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
              <div className="text-center">
                <p className="text-xs text-gray-500">Highest Day</p>
                <p className="font-bold text-green-400">{formatCurrency(Math.max(...chartData.map(d => d.revenue)))}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Average Day</p>
                <p className="font-bold text-white">{formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Period</p>
                <p className="font-bold text-[#ff950e]">{formatCurrency(periodRevenue)}</p>
              </div>
            </div>
          </div>

          {/* Platform Health & User Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Platform Health */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#ff950e]" />
                Platform Health
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[#252525] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <span className="text-white">Total Users</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{allUsers.length}</span>
                    <p className="text-xs text-gray-400">{buyers.length} buyers, {sellers.length} sellers</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-[#252525] rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <span className="text-white">Verified Sellers</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{verifiedSellers.length}</span>
                    <p className="text-xs text-gray-400">
                      {sellers.length > 0 ? Math.round((verifiedSellers.length / sellers.length) * 100) : 0}% verified
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-[#252525] rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-purple-400" />
                    <span className="text-white">Active Listings</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{activeListings}</span>
                    <p className="text-xs text-gray-400">
                      {avgListingsPerSeller.toFixed(1)} avg per seller
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Sellers */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-[#ff950e]" />
                Top Earning Sellers
              </h3>
              <div className="space-y-3">
                {topSellers.length > 0 ? topSellers.map(([username, balance], index) => (
                  <div key={username} className="flex items-center justify-between p-3 bg-[#252525] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-[#333] text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{username}</p>
                        <p className="text-xs text-gray-400">
                          {users[username]?.verified ? '✅ Verified' : '⏳ Unverified'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(balance)}</p>
                      <p className="text-xs text-gray-500">earned</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p>No seller earnings yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Money Flow Explanation */}
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#252525] rounded-xl p-6 border border-gray-800 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-[#ff950e]" />
              How Your Money Machine Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="h-8 w-8 text-blue-400" />
                </div>
                <h4 className="font-bold text-white mb-2">1. Buyer Deposits</h4>
                <p className="text-sm text-gray-400">Buyer adds $100 to wallet → You collect $100 upfront</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#ff950e]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="h-8 w-8 text-[#ff950e]" />
                </div>
                <h4 className="font-bold text-white mb-2">2. Purchase Made</h4>
                <p className="text-sm text-gray-400">$100 spent → $20 stays yours, $80 goes to seller</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
                <h4 className="font-bold text-white mb-2">3. Pure Profit</h4>
                <p className="text-sm text-gray-400">You keep $20 profit, pay out $80 when seller withdraws</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#ff950e]" />
                Recent Money Activity
              </h3>
              <div className="text-sm text-gray-400">
                Last {filteredActions.length} actions
              </div>
            </div>
            
            {filteredActions.length > 0 ? (
              <div className="overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    {filteredActions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 15)
                      .map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              action.type === 'credit' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {action.type === 'credit' ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {action.type === 'credit' ? '💰 Money In' : '🔧 Adjustment'}
                              </p>
                              <p className="text-sm text-gray-400">{action.reason}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              action.type === 'credit' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {action.type === 'credit' ? '+' : '-'}{formatCurrency(action.amount)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(action.date)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No Activity Yet</h4>
                <p className="text-sm">Start making money and it'll show up here! 🚀</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
