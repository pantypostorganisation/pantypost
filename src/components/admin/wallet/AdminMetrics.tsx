// src/components/admin/wallet/AdminMetrics.tsx
'use client';

import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Upload,
  BarChart3,
  Target
} from 'lucide-react';
import {
  calculatePlatformProfit,
  calculateTotalRevenue,
  calculateSubscriptionRevenue,
  calculateSubscriptionProfit,
  calculateWithdrawals,
  getPreviousPeriodData,
  getAllSellerWithdrawals
} from '@/utils/admin/walletHelpers';
import { useEffect } from 'react';

interface AdminMetricsProps {
  timeFilter: string;
  filteredActions: any[];
  filteredOrders: any[];
  filteredDeposits: any[];
  filteredSellerWithdrawals: any[];
  filteredAdminWithdrawals: any[];
  adminBalance: number;
  orderHistory: any[];
  adminActions: any[];
  depositLogs: any[];
  sellerWithdrawals: any;
  adminWithdrawals: any[];
}

export default function AdminMetrics(props: AdminMetricsProps) {
  const {
    timeFilter,
    filteredActions,
    filteredOrders,
    filteredDeposits,
    filteredSellerWithdrawals,
    filteredAdminWithdrawals,
    adminBalance,
    orderHistory,
    adminActions,
    depositLogs,
    sellerWithdrawals,
    adminWithdrawals
  } = props;

  // Debug logging
  useEffect(() => {
    console.log('AdminMetrics Debug:', {
      timeFilter,
      adminActions: adminActions.length,
      filteredActions: filteredActions.length,
      subscriptionActions: adminActions.filter(a => 
        a.type === 'credit' && 
        a.reason.toLowerCase().includes('subscription') && 
        a.reason.toLowerCase().includes('revenue')
      )
    });
  }, [timeFilter, adminActions, filteredActions]);

  // All the calculation logic from the original file
  const periodSalesProfit = calculatePlatformProfit(filteredOrders);
  const allTimeSalesProfit = calculatePlatformProfit(orderHistory);
  
  const periodSubscriptionProfit = calculateSubscriptionProfit(filteredActions);
  const allTimeSubscriptionProfit = calculateSubscriptionProfit(adminActions);
  
  const periodSubscriptionRevenue = calculateSubscriptionRevenue(filteredActions);
  const allTimeSubscriptionRevenue = calculateSubscriptionRevenue(adminActions);
  
  const periodSalesRevenue = calculateTotalRevenue(filteredOrders);
  const allTimeSalesRevenue = calculateTotalRevenue(orderHistory);
  
  const periodTotalRevenue = periodSalesRevenue + periodSubscriptionRevenue;
  const allTimeTotalRevenue = allTimeSalesRevenue + allTimeSubscriptionRevenue;
  
  const periodAverageOrderValue = filteredOrders.length > 0 ? (periodSalesRevenue / filteredOrders.length) : 0;
  const allTimeAverageOrderValue = orderHistory.length > 0 ? (allTimeSalesRevenue / orderHistory.length) : 0;
  
  const displayPlatformProfit = timeFilter === 'all' ? allTimeSalesProfit : periodSalesProfit;
  const displaySubscriptionProfit = timeFilter === 'all' ? allTimeSubscriptionProfit : periodSubscriptionProfit;
  const displayTotalProfit = displayPlatformProfit + displaySubscriptionProfit;
  
  const displaySalesRevenue = timeFilter === 'all' ? allTimeSalesRevenue : periodSalesRevenue;
  const displaySubscriptionRevenue = timeFilter === 'all' ? allTimeSubscriptionRevenue : periodSubscriptionRevenue;
  const displayTotalRevenue = displaySalesRevenue + displaySubscriptionRevenue;
  
  const displayAverageOrderValue = timeFilter === 'all' ? allTimeAverageOrderValue : periodAverageOrderValue;
  
  const totalDepositsAllTime = depositLogs
    .filter(deposit => deposit.status === 'completed')
    .reduce((sum, deposit) => sum + deposit.amount, 0);
  const periodTotalDeposits = filteredDeposits
    .filter(deposit => deposit.status === 'completed')
    .reduce((sum, deposit) => sum + deposit.amount, 0);
  const periodDepositCount = filteredDeposits.filter(deposit => deposit.status === 'completed').length;
  const averageDepositAmount = periodDepositCount > 0 ? periodTotalDeposits / periodDepositCount : 0;
  
  const displayTotalDeposits = timeFilter === 'all' ? totalDepositsAllTime : periodTotalDeposits;

  const withdrawalMetrics = calculateWithdrawals(filteredSellerWithdrawals, filteredAdminWithdrawals);
  const allTimeWithdrawals = timeFilter === 'all' ? {
    totalSellerWithdrawals: getAllSellerWithdrawals(sellerWithdrawals).reduce((sum, w) => sum + w.amount, 0),
    totalAdminWithdrawals: adminWithdrawals.reduce((sum, w) => sum + w.amount, 0),
    totalWithdrawals: getAllSellerWithdrawals(sellerWithdrawals).reduce((sum, w) => sum + w.amount, 0) + adminWithdrawals.reduce((sum, w) => sum + w.amount, 0),
    withdrawalCount: getAllSellerWithdrawals(sellerWithdrawals).length + adminWithdrawals.length,
    averageWithdrawal: (getAllSellerWithdrawals(sellerWithdrawals).length + adminWithdrawals.length) > 0 ? 
      (getAllSellerWithdrawals(sellerWithdrawals).reduce((sum, w) => sum + w.amount, 0) + adminWithdrawals.reduce((sum, w) => sum + w.amount, 0)) / (getAllSellerWithdrawals(sellerWithdrawals).length + adminWithdrawals.length) : 0
  } : withdrawalMetrics;

  const { orders: previousPeriodOrders, deposits: previousPeriodDeposits, withdrawals: previousPeriodWithdrawals, actions: previousPeriodActions } = 
    getPreviousPeriodData(timeFilter, orderHistory, depositLogs, getAllSellerWithdrawals(sellerWithdrawals), adminActions);
  
  const previousPeriodProfit = calculatePlatformProfit(previousPeriodOrders) + calculateSubscriptionProfit(previousPeriodActions);
  const previousPeriodDepositAmount = previousPeriodDeposits
    .filter(deposit => deposit.status === 'completed')
    .reduce((sum, deposit) => sum + deposit.amount, 0);
  const previousPeriodWithdrawalAmount = previousPeriodWithdrawals
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  const growthRate = timeFilter !== 'all' && previousPeriodProfit > 0 ? 
    ((displayTotalProfit - previousPeriodProfit) / previousPeriodProfit) * 100 : 0;

  const depositGrowthRate = timeFilter !== 'all' && previousPeriodDepositAmount > 0 ? 
    ((periodTotalDeposits - previousPeriodDepositAmount) / previousPeriodDepositAmount) * 100 : 0;

  const withdrawalGrowthRate = timeFilter !== 'all' && previousPeriodWithdrawalAmount > 0 ? 
    ((withdrawalMetrics.totalWithdrawals - previousPeriodWithdrawalAmount) / previousPeriodWithdrawalAmount) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {/* Total Money Made */}
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
            <span className="text-3xl font-bold text-white">{formatCurrency(displayTotalProfit)}</span>
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
            Sales: {formatCurrency(displayPlatformProfit)} • Subs: {formatCurrency(displaySubscriptionProfit)}
          </p>
        </div>
      </div>

      {/* Total Deposits */}
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Download className="w-6 h-6 text-white" />
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

      {/* Total Withdrawals */}
      <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl p-6 border border-red-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">
                {timeFilter === 'all' ? 'Total Withdrawals' : `Withdrawals - ${getPeriodDisplayName()}`}
              </h3>
              <p className="text-xs text-gray-500">Money paid out</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-white">{formatCurrency(allTimeWithdrawals.totalWithdrawals)}</span>
            <span className="text-lg text-red-400 font-medium">💸</span>
            {timeFilter !== 'all' && withdrawalGrowthRate !== 0 && (
              <span className={`text-sm flex items-center gap-1 ml-2 ${
                withdrawalGrowthRate > 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {withdrawalGrowthRate > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(withdrawalGrowthRate).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {allTimeWithdrawals.withdrawalCount} payouts • Avg: {formatCurrency(allTimeWithdrawals.averageWithdrawal)}
          </p>
        </div>
      </div>

      {/* Total Platform Revenue */}
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
            <span className="text-3xl font-bold text-white">{formatCurrency(displayTotalRevenue)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-400" />
              <span className="text-gray-400">
                Sales: {formatCurrency(displaySalesRevenue)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-pink-400" />
              <span className="text-gray-400">
                Subs: {formatCurrency(displaySubscriptionRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Average Order Value */}
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
            = {formatCurrency(filteredOrders.length > 0 ? (displayPlatformProfit / filteredOrders.length) : 0)} profit each
          </p>
          {timeFilter !== 'all' && (
            <p className="text-xs text-gray-400 mt-1">
              {filteredOrders.length} orders this period
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
