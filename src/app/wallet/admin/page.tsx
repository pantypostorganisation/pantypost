// src/app/wallet/admin/page.tsx
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
  TrendingDown,
  Heart,
  CreditCard,
  PlusCircle,
  Download
} from 'lucide-react';

export default function AdminProfitDashboard() {
  const { 
    adminBalance, 
    adminActions, 
    orderHistory, 
    wallet, 
    depositLogs, 
    getTotalDeposits, 
    getDepositsByTimeframe 
  } = useWallet();
  const { user, users, listings } = useListings();
  const [showDetails, setShowDetails] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | '3months' | 'year' | 'all'>('today');

  const isAdmin = user?.username === 'oakley' || user?.username === 'gerome';

  // Calculate comprehensive metrics
  const allUsers = Object.values(users).filter(u => u.role !== 'admin');
  const buyers = allUsers.filter(u => u.role === 'buyer');
  const sellers = allUsers.filter(u => u.role === 'seller');
  const verifiedSellers = sellers.filter(u => u.verified || u.verificationStatus === 'verified');
  
  // Helper function to filter data by time period
  const getTimeFilteredData = () => {
    const now = new Date();
    const filterDate = new Date();
    
    switch (timeFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return { 
          actions: adminActions, 
          orders: orderHistory, 
          deposits: depositLogs 
        };
    }
    
    const filteredActions = adminActions.filter(action => new Date(action.date) >= filterDate);
    const filteredOrders = orderHistory.filter(order => new Date(order.date) >= filterDate);
    const filteredDeposits = depositLogs.filter(deposit => new Date(deposit.date) >= filterDate);
    
    return { 
      actions: filteredActions, 
      orders: filteredOrders, 
      deposits: filteredDeposits 
    };
  };

  const { actions: filteredActions, orders: filteredOrders, deposits: filteredDeposits } = getTimeFilteredData();

  // 🚀 FIX: Improved revenue calculation logic
  const calculatePlatformRevenue = (actions: typeof adminActions) => {
    return actions
      .filter(action => {
        if (action.type !== 'credit') return false;
        
        const reason = action.reason.toLowerCase();
        
        // 🚀 FIX: Explicitly include legitimate platform revenue sources
        const isLegitimateRevenue = 
          reason.includes('platform fee') ||
          reason.includes('commission') ||
          reason.includes('subscription') ||
          reason.includes('sale revenue') ||
          reason.includes('auction commission') ||
          reason.includes('premium listing') ||
          reason.includes('listing fee') ||
          reason.includes('transaction fee') ||
          reason.includes('service fee') ||
          // Include sales-related revenue patterns
          reason.includes('sold') ||
          reason.includes('purchase') ||
          reason.includes('order') ||
          // Include percentage-based fees
          reason.includes('10%') ||
          reason.includes('20%') ||
          reason.includes('25%');
        
        // 🚀 FIX: Explicitly exclude non-revenue items (more precise filtering)
        const isNonRevenue = 
          reason.includes('wallet deposit') ||
          reason.includes('add funds') ||
          reason.includes('credit adjustment') ||
          reason.includes('balance correction') ||
          reason.includes('refund') ||
          reason.includes('withdrawal') ||
          reason.includes('manual credit') ||
          reason.includes('test transaction') ||
          reason.includes('admin adjustment');
        
        // Include if it's legitimate revenue and not a non-revenue item
        return isLegitimateRevenue && !isNonRevenue;
      })
      .reduce((sum, action) => sum + action.amount, 0);
  };

  // 🚀 FIX: Calculate revenue from actual sales data as fallback
  const calculateRevenueFromSales = (orders: typeof orderHistory) => {
    return orders.reduce((sum, order) => {
      // Platform gets 20% of each sale (10% markup on buyer side)
      const salePrice = order.markedUpPrice || order.price;
      const platformFee = salePrice * 0.2; // 20% of total sale
      return sum + platformFee;
    }, 0);
  };

  // 🚀 FIX: Calculate subscription revenue separately
  const calculateSubscriptionRevenue = (actions: typeof adminActions) => {
    return actions
      .filter(action => {
        if (action.type !== 'credit') return false;
        const reason = action.reason.toLowerCase();
        return reason.includes('subscription') || reason.includes('premium') || reason.includes('monthly');
      })
      .reduce((sum, action) => sum + action.amount, 0);
  };

  // 🚀 NEW: Deposit analytics
  const totalDepositsAllTime = getTotalDeposits();
  const periodTotalDeposits = filteredDeposits
    .filter(deposit => deposit.status === 'completed')
    .reduce((sum, deposit) => sum + deposit.amount, 0);
  const periodDepositCount = filteredDeposits.filter(deposit => deposit.status === 'completed').length;
  const averageDepositAmount = periodDepositCount > 0 ? periodTotalDeposits / periodDepositCount : 0;

  // 🚀 FIX: Updated revenue calculations using new logic
  const periodPlatformRevenue = calculatePlatformRevenue(filteredActions);
  const periodSalesRevenueFromOrders = calculateRevenueFromSales(filteredOrders);
  const periodSubscriptionRevenue = calculateSubscriptionRevenue(filteredActions);
  
  // 🚀 FIX: Use sales data as primary source, admin actions as secondary
  const actualPeriodRevenue = Math.max(periodPlatformRevenue, periodSalesRevenueFromOrders);
  
  // Calculate total sales revenue for the period (what buyers actually paid)
  const periodSalesRevenue = filteredOrders.reduce((sum, order) => {
    return sum + (order.markedUpPrice || order.price);
  }, 0);
  
  const periodAverageOrderValue = filteredOrders.length > 0 ? (periodSalesRevenue / filteredOrders.length) : 0;
  
  // 🚀 FIX: For "All" time, use improved calculations
  const allTimePlatformRevenue = timeFilter === 'all' ? 
    Math.max(calculatePlatformRevenue(adminActions), calculateRevenueFromSales(orderHistory)) :
    actualPeriodRevenue;
    
  const allTimeSubscriptionRevenue = calculateSubscriptionRevenue(adminActions);
    
  const displayPlatformRevenue = timeFilter === 'all' ? allTimePlatformRevenue : actualPeriodRevenue;
  const displaySalesRevenue = timeFilter === 'all' ? 
    orderHistory.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0) : 
    periodSalesRevenue;
  const displayAverageOrderValue = timeFilter === 'all' ? 
    (orderHistory.length > 0 ? displaySalesRevenue / orderHistory.length : 0) : 
    periodAverageOrderValue;
  const displayTotalDeposits = timeFilter === 'all' ? totalDepositsAllTime : periodTotalDeposits;
  const displaySubscriptionRevenue = timeFilter === 'all' ? allTimeSubscriptionRevenue : periodSubscriptionRevenue;

  // 🚀 FIX: Calculate sales commission more accurately
  const displaySalesCommission = filteredOrders.length > 0 ? 
    calculateRevenueFromSales(timeFilter === 'all' ? orderHistory : filteredOrders) : 0;

  // User engagement metrics - FIX #2: Division by zero protection
  const activeListings = listings.length;
  const avgListingsPerSeller = sellers.length > 0 ? (activeListings / sellers.length).toFixed(1) : '0.0';
  const buyerToSellerRatio = sellers.length > 0 ? (buyers.length / sellers.length).toFixed(1) : '0.0';

  // 🚀 NEW: Top depositing users
  const topDepositors = Object.entries(
    filteredDeposits
      .filter(deposit => deposit.status === 'completed')
      .reduce((acc, deposit) => {
        acc[deposit.username] = (acc[deposit.username] || 0) + deposit.amount;
        return acc;
      }, {} as Record<string, number>)
  )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // 🚀 FIX: Calculate growth metrics with improved revenue calculation
  const getPreviousPeriodData = () => {
    const now = new Date();
    const currentPeriodStart = new Date();
    const previousPeriodStart = new Date();
    const previousPeriodEnd = new Date();
    
    switch (timeFilter) {
      case 'today':
        currentPeriodStart.setHours(0, 0, 0, 0);
        previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
        previousPeriodStart.setDate(previousPeriodEnd.getDate());
        previousPeriodStart.setHours(0, 0, 0, 0);
        break;
      case 'week':
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
        previousPeriodStart.setDate(previousPeriodEnd.getDate() - 7);
        break;
      case 'month':
        currentPeriodStart.setMonth(now.getMonth() - 1);
        previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
        previousPeriodStart.setMonth(previousPeriodEnd.getMonth() - 1);
        break;
      case '3months':
        currentPeriodStart.setMonth(now.getMonth() - 3);
        previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
        previousPeriodStart.setMonth(previousPeriodEnd.getMonth() - 3);
        break;
      case 'year':
        currentPeriodStart.setFullYear(now.getFullYear() - 1);
        previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
        previousPeriodStart.setFullYear(previousPeriodEnd.getFullYear() - 1);
        break;
      default:
        return { actions: [], orders: [], deposits: [] };
    }
    
    const previousActions = adminActions.filter(action => {
      const actionDate = new Date(action.date);
      return actionDate >= previousPeriodStart && actionDate <= previousPeriodEnd;
    });
    
    const previousOrders = orderHistory.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= previousPeriodStart && orderDate <= previousPeriodEnd;
    });

    const previousDeposits = depositLogs.filter(deposit => {
      const depositDate = new Date(deposit.date);
      return depositDate >= previousPeriodStart && depositDate <= previousPeriodEnd;
    });
    
    return { actions: previousActions, orders: previousOrders, deposits: previousDeposits };
  };

  const { actions: previousPeriodActions, orders: previousPeriodOrders, deposits: previousPeriodDeposits } = getPreviousPeriodData();
  
  // 🚀 FIX: Use improved revenue calculation for growth comparison
  const previousPeriodRevenue = Math.max(
    calculatePlatformRevenue(previousPeriodActions),
    calculateRevenueFromSales(previousPeriodOrders)
  );

  const previousPeriodDepositAmount = previousPeriodDeposits
    .filter(deposit => deposit.status === 'completed')
    .reduce((sum, deposit) => sum + deposit.amount, 0);

  const growthRate = timeFilter !== 'all' && previousPeriodRevenue > 0 ? 
    ((actualPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0;

  const depositGrowthRate = timeFilter !== 'all' && previousPeriodDepositAmount > 0 ? 
    ((periodTotalDeposits - previousPeriodDepositAmount) / previousPeriodDepositAmount) * 100 : 0;

  // Top performing sellers by wallet balance
  const topSellers = Object.entries(wallet)
    .filter(([username]) => users[username]?.role === 'seller')
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // 🚀 FIX: Revenue distribution by day (improved chart data)
  const getRevenueByDay = () => {
    const days = [];
    const now = new Date();
    let daysToShow = 30;
    let dateIncrement = 1; // days
    
    switch (timeFilter) {
      case 'today':
        daysToShow = 24; // hours
        break;
      case 'week':
        daysToShow = 7;
        break;
      case 'month':
        daysToShow = 30;
        break;
      case '3months':
        daysToShow = 90;
        break;
      case 'year':
        daysToShow = 12; // months
        dateIncrement = 30; // approximately monthly
        break;
      default:
        daysToShow = 30;
    }
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      
      if (timeFilter === 'today') {
        date.setHours(now.getHours() - i);
        const hourActions = adminActions.filter(action => {
          const actionDate = new Date(action.date);
          return actionDate.getHours() === date.getHours() && 
                 actionDate.toDateString() === date.toDateString();
        });
        
        const hourOrders = orderHistory.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.getHours() === date.getHours() && 
                 orderDate.toDateString() === date.toDateString();
        });
        
        // 🚀 FIX: Use improved revenue calculation for chart
        const hourRevenue = Math.max(
          calculatePlatformRevenue(hourActions),
          calculateRevenueFromSales(hourOrders)
        );
        
        days.push({
          date: date.toLocaleTimeString('en-US', { hour: 'numeric' }),
          revenue: hourRevenue,
          transactions: hourActions.length + hourOrders.length
        });
      } else if (timeFilter === 'year') {
        date.setMonth(now.getMonth() - i);
        const monthActions = adminActions.filter(action => {
          const actionDate = new Date(action.date);
          return actionDate.getMonth() === date.getMonth() && 
                 actionDate.getFullYear() === date.getFullYear();
        });
        
        const monthOrders = orderHistory.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.getMonth() === date.getMonth() && 
                 orderDate.getFullYear() === date.getFullYear();
        });
        
        const monthRevenue = Math.max(
          calculatePlatformRevenue(monthActions),
          calculateRevenueFromSales(monthOrders)
        );
        
        days.push({
          date: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          transactions: monthActions.length + monthOrders.length
        });
      } else {
        date.setDate(now.getDate() - i);
        const dayActions = adminActions.filter(action => {
          const actionDate = new Date(action.date);
          return actionDate.toDateString() === date.toDateString();
        });
        
        const dayOrders = orderHistory.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.toDateString() === date.toDateString();
        });
        
        const dayRevenue = Math.max(
          calculatePlatformRevenue(dayActions),
          calculateRevenueFromSales(dayOrders)
        );
        
        days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          transactions: dayActions.length + dayOrders.length
        });
      }
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

  // Get period display name
  const getPeriodDisplayName = () => {
    switch (timeFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case '3months': return 'Last 3 Months';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  // Get chart period description
  const getChartPeriodDescription = () => {
    switch (timeFilter) {
      case 'today': return 'Hourly revenue today';
      case 'week': return 'Daily revenue this week';
      case 'month': return 'Daily revenue this month';
      case '3months': return 'Daily revenue over 3 months';
      case 'year': return 'Monthly revenue this year';
      default: return 'Daily revenue over last 30 days';
    }
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
            </div>
          </div>

          {/* 🚀 FIX: Enhanced Main Money Metrics with accurate revenue calculation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Money Made - Period Specific */}
            <div className="bg-gradient-to-br from-[#ff950e]/20 to-[#ff6b00]/10 rounded-xl p-6 border border-[#ff950e]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff950e]/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#ff950e] rounded-lg">
                    <DollarSign className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">
                      {timeFilter === 'all' ? 'Total Money Made' : `Money Made - ${getPeriodDisplayName()}`}
                    </h3>
                    <p className="text-xs text-gray-500">Your platform profit</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">{formatCurrency(displayPlatformRevenue)}</span>
                  <span className="text-lg text-[#ff950e] font-medium">💰</span>
                  {timeFilter !== 'all' && growthRate !== 0 && (
                    <span className={`text-sm flex items-center gap-1 ml-2 ${
                      growthRate > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {growthRate > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(growthRate).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Sales: {formatCurrency(displaySalesCommission)} • Subs: {formatCurrency(displaySubscriptionRevenue)}
                </p>
              </div>
            </div>

            {/* Total Deposits Collected */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <PlusCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">
                      {timeFilter === 'all' ? 'Total Deposits' : `Deposits - ${getPeriodDisplayName()}`}
                    </h3>
                    <p className="text-xs text-gray-500">Cash collected upfront</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">{formatCurrency(displayTotalDeposits)}</span>
                  <span className="text-lg text-blue-400 font-medium">💳</span>
                  {timeFilter !== 'all' && depositGrowthRate !== 0 && (
                    <span className={`text-sm flex items-center gap-1 ml-2 ${
                      depositGrowthRate > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {depositGrowthRate > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(depositGrowthRate).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {periodDepositCount} deposits • Avg: {formatCurrency(averageDepositAmount)}
                </p>
              </div>
            </div>

            {/* Total Platform Revenue - Period Specific */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">
                      {timeFilter === 'all' ? 'Total Platform Revenue' : `Revenue - ${getPeriodDisplayName()}`}
                    </h3>
                    <p className="text-xs text-gray-500">All sales + subscriptions</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">{formatCurrency(displaySalesRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-green-400" />
                    <span className="text-gray-400">
                      Sales: {formatCurrency(displaySalesRevenue - displaySubscriptionRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-pink-400" />
                    <span className="text-gray-400">
                      Subs: {formatCurrency(displaySubscriptionRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Order Value - Period Specific */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-300">
                      {timeFilter === 'all' ? 'Avg Order Value' : `Avg Order - ${getPeriodDisplayName()}`}
                    </h3>
                    <p className="text-xs text-gray-500">per transaction</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">{formatCurrency(displayAverageOrderValue)}</span>
                  <span className="text-xs text-gray-500">per sale</span>
                </div>
                <p className="text-xs text-gray-500">
                  = {formatCurrency(displayAverageOrderValue * 0.2)} profit each
                </p>
                {timeFilter !== 'all' && (
                  <p className="text-xs text-gray-400 mt-1">
                    {filteredOrders.length} orders this period
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Revenue Chart - Updated descriptions - FIX #4: Chart label spacing */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 mb-8 overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#ff950e]" />
                Revenue Trend
              </h3>
              <div className="text-sm text-gray-400">
                {getChartPeriodDescription()}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[600px] h-64 flex items-end justify-between gap-1 mb-4">
                {chartData.map((period, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex justify-center mb-2">
                      <div
                        className="w-8 bg-gradient-to-t from-[#ff950e] to-[#ff6b00] rounded-t-lg transition-all duration-300 group-hover:from-[#ff6b00] group-hover:to-[#ff950e] min-h-[4px]"
                        style={{
                          height: `${Math.max((period.revenue / maxRevenue) * 200, 4)}px`
                        }}
                      ></div>
                      <div className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {formatCurrency(period.revenue)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 transform -rotate-45 origin-center whitespace-nowrap block mt-1">
                      {period.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
              <div className="text-center">
                <p className="text-xs text-gray-500">Highest {timeFilter === 'today' ? 'Hour' : timeFilter === 'year' ? 'Month' : 'Day'}</p>
                <p className="font-bold text-green-400">{formatCurrency(Math.max(...chartData.map(d => d.revenue)))}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Average {timeFilter === 'today' ? 'Hour' : timeFilter === 'year' ? 'Month' : 'Day'}</p>
                <p className="font-bold text-white">{formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0) / chartData.length)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Period</p>
                <p className="font-bold text-[#ff950e]">{formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0))}</p>
              </div>
            </div>
          </div>

          {/* Platform Health & User Metrics + Top Depositors - FIX #6: Type fix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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
                      {avgListingsPerSeller} avg per seller
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

            {/* Top Depositors */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#ff950e]" />
                Top Depositors
              </h3>
              <div className="space-y-3">
                {topDepositors.length > 0 ? topDepositors.map(([username, totalDeposited], index) => (
                  <div key={username} className="flex items-center justify-between p-3 bg-[#252525] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-blue-500 text-white' :
                        index === 1 ? 'bg-blue-400 text-white' :
                        index === 2 ? 'bg-blue-300 text-black' :
                        'bg-[#333] text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{username}</p>
                        <p className="text-xs text-gray-400">
                          {users[username]?.role === 'buyer' ? '💳 Buyer' : '🏪 Seller'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-400">{formatCurrency(totalDeposited)}</p>
                      <p className="text-xs text-gray-500">deposited</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <p>No deposits yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 🚀 FIX: Updated Money Flow Explanation with accurate info */}
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
                <p className="text-sm text-gray-400">Buyer adds $100 to wallet → You collect $100 upfront cash flow</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#ff950e]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="h-8 w-8 text-[#ff950e]" />
                </div>
                <h4 className="font-bold text-white mb-2">2. Purchase Made</h4>
                <p className="text-sm text-gray-400">$100 item → $20 platform fee stays yours, $80 goes to seller</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
                <h4 className="font-bold text-white mb-2">3. Pure Profit</h4>
                <p className="text-sm text-gray-400">20% profit margin on all sales + 25% from subscriptions</p>
              </div>
            </div>
          </div>

          {/* Enhanced Recent Activity - Now includes deposits */}
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#ff950e]" />
                Recent Money Activity
              </h3>
              <div className="text-sm text-gray-400">
                Last {Math.max(filteredActions.length, filteredDeposits.length)} actions {timeFilter !== 'all' ? `(${getPeriodDisplayName()})` : ''}
              </div>
            </div>
            
            {(filteredActions.length > 0 || filteredDeposits.length > 0) ? (
              <div className="overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    {/* Combine and sort actions and deposits by date */}
                    {[
                      ...filteredActions
                        .filter(action => calculatePlatformRevenue([action]) > 0) // 🚀 FIX: Only show revenue-generating actions
                        .map(action => ({
                          type: 'action' as const,
                          data: action,
                          date: action.date
                        })),
                      ...filteredDeposits
                        .filter(deposit => deposit.status === 'completed')
                        .map(deposit => ({
                          type: 'deposit' as const,
                          data: deposit,
                          date: deposit.date
                        }))
                    ]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 15)
                      .map((item, index) => {
                        if (item.type === 'action') {
                          const action = item.data;
                          return (
                            <div key={`action-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${
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
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-white truncate">
                                    {action.type === 'credit' ? '💰 Revenue In' : '🔧 Adjustment'}
                                  </p>
                                  <p className="text-sm text-gray-400 truncate">{action.reason}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <p className={`font-bold ${
                                  action.type === 'credit' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {action.type === 'credit' ? '+' : '-'}{formatCurrency(action.amount)}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(action.date)}</p>
                              </div>
                            </div>
                          );
                        } else {
                          const deposit = item.data;
                          return (
                            <div key={`deposit-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-blue-500/50">
                              <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="p-2 rounded-lg flex-shrink-0 bg-blue-500/20 text-blue-400">
                                  <Download className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-white truncate">
                                    💳 Deposit Received
                                  </p>
                                  <p className="text-sm text-gray-400 truncate">
                                    {deposit.username} via {deposit.method.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <p className="font-bold text-blue-400">
                                  +{formatCurrency(deposit.amount)}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(deposit.date)}</p>
                              </div>
                            </div>
                          );
                        }
                      })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h4 className="text-lg font-medium text-gray-400 mb-2">No Activity Yet</h4>
                <p className="text-sm">
                  {timeFilter === 'all' ? 
                    'Start making money and it\'ll show up here! 🚀' : 
                    `No activity for ${getPeriodDisplayName().toLowerCase()}`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}