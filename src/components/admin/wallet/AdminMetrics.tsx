// src/components/admin/wallet/AdminMetrics.tsx
'use client';

import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Upload,
  BarChart3,
  Target,
  Loader2
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
import { useEffect, useState } from 'react';

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

function MetricCard({
  title,
  subtitle,
  value,
  currency = true,
  icon: Icon,
  iconColor,
  bgGradient,
  growthRate,
  breakdown,
  loading = false
}: {
  title: string;
  subtitle: string;
  value: number;
  currency?: boolean;
  icon: any;
  iconColor: string;
  bgGradient: string;
  growthRate?: number;
  breakdown?: { label: string; value: number }[];
  loading?: boolean;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatValue = (val: number) => {
    if (currency) return formatCurrency(val);
    return val.toLocaleString();
  };

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-xl p-6 border relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 ${iconColor} rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">Calculating...</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white">{formatValue(value)}</span>
              {growthRate !== undefined && growthRate !== 0 && (
                <span className={`text-sm flex items-center gap-1 ml-2 ${
                  growthRate > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {growthRate > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(growthRate).toFixed(1)}%
                </span>
              )}
            </div>

            {breakdown && breakdown.length > 0 && (
              <p className="text-sm text-gray-400">
                {breakdown.map((item, idx) => (
                  <span key={idx}>
                    {idx > 0 && ' • '}
                    {item.label}: {formatCurrency(item.value)}
                  </span>
                ))}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
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

  const [metrics, setMetrics] = useState({
    platformProfit: 0,
    subscriptionProfit: 0,
    totalProfit: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    growthRate: 0,
    depositGrowthRate: 0,
    withdrawalGrowthRate: 0
  });

  useEffect(() => {
    try {
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

      const displayTotalRevenue = timeFilter === 'all' ? allTimeTotalRevenue : periodTotalRevenue;
      const displayAverageOrderValue = timeFilter === 'all' ? allTimeAverageOrderValue : periodAverageOrderValue;

      const totalDepositsAllTime = depositLogs
        .filter((deposit: any) => deposit.status === 'completed')
        .reduce((sum: number, deposit: any) => sum + deposit.amount, 0);
      const periodTotalDeposits = filteredDeposits
        .filter((deposit: any) => deposit.status === 'completed')
        .reduce((sum: number, deposit: any) => sum + deposit.amount, 0);
      const displayTotalDeposits = timeFilter === 'all' ? totalDepositsAllTime : periodTotalDeposits;

      const withdrawalMetrics = calculateWithdrawals(filteredSellerWithdrawals, filteredAdminWithdrawals);
      const allTimeWithdrawalData = timeFilter === 'all' ? {
        totalWithdrawals: getAllSellerWithdrawals(sellerWithdrawals).reduce((sum: number, w: any) => sum + w.amount, 0) + 
                         adminWithdrawals.reduce((sum: number, w: any) => sum + w.amount, 0)
      } : withdrawalMetrics;

      const { orders: previousPeriodOrders, deposits: previousPeriodDeposits, withdrawals: previousPeriodWithdrawals, actions: previousPeriodActions } =
        getPreviousPeriodData(timeFilter, orderHistory, depositLogs, getAllSellerWithdrawals(sellerWithdrawals), adminActions);

      const previousPeriodProfit = calculatePlatformProfit(previousPeriodOrders) + calculateSubscriptionProfit(previousPeriodActions);
      const previousPeriodDepositAmount = previousPeriodDeposits
        .filter((deposit: any) => deposit.status === 'completed')
        .reduce((sum: number, deposit: any) => sum + deposit.amount, 0);
      const previousPeriodWithdrawalAmount = previousPeriodWithdrawals
        .reduce((sum: number, withdrawal: any) => sum + withdrawal.amount, 0);

      const growthRate = timeFilter !== 'all' && previousPeriodProfit > 0 ?
        ((displayTotalProfit - previousPeriodProfit) / previousPeriodProfit) * 100 : 0;

      const depositGrowthRate = timeFilter !== 'all' && previousPeriodDepositAmount > 0 ?
        ((periodTotalDeposits - previousPeriodDepositAmount) / previousPeriodDepositAmount) * 100 : 0;

      const withdrawalGrowthRate = timeFilter !== 'all' && previousPeriodWithdrawalAmount > 0 ?
        ((withdrawalMetrics.totalWithdrawals - previousPeriodWithdrawalAmount) / previousPeriodWithdrawalAmount) * 100 : 0;

      setMetrics({
        platformProfit: displayPlatformProfit,
        subscriptionProfit: displaySubscriptionProfit,
        totalProfit: displayTotalProfit,
        totalDeposits: displayTotalDeposits,
        totalWithdrawals: allTimeWithdrawalData.totalWithdrawals,
        totalRevenue: displayTotalRevenue,
        averageOrderValue: displayAverageOrderValue,
        growthRate,
        depositGrowthRate,
        withdrawalGrowthRate
      });

    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  }, [
    timeFilter,
    filteredActions,
    filteredOrders,
    filteredDeposits,
    filteredSellerWithdrawals,
    filteredAdminWithdrawals,
    orderHistory,
    adminActions,
    depositLogs,
    sellerWithdrawals,
    adminWithdrawals
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <MetricCard
        title="Money Made"
        subtitle="Your platform profit"
        value={metrics.totalProfit}
        icon={DollarSign}
        iconColor="bg-[#ff950e]"
        bgGradient="from-[#ff950e]/20 to-[#ff6b00]/10 border-[#ff950e]/30"
        growthRate={timeFilter !== 'all' ? metrics.growthRate : undefined}
        breakdown={[
          { label: 'Sales', value: metrics.platformProfit },
          { label: 'Subs', value: metrics.subscriptionProfit }
        ]}
      />

      <MetricCard
        title="Deposits"
        subtitle="Cash collected upfront"
        value={metrics.totalDeposits}
        icon={Download}
        iconColor="bg-blue-500"
        bgGradient="from-blue-500/20 to-blue-600/10 border-blue-500/30"
        growthRate={timeFilter !== 'all' ? metrics.depositGrowthRate : undefined}
      />

      <MetricCard
        title="Withdrawals"
        subtitle="Money paid out"
        value={metrics.totalWithdrawals}
        icon={Upload}
        iconColor="bg-red-500"
        bgGradient="from-red-500/20 to-red-600/10 border-red-500/30"
        growthRate={timeFilter !== 'all' ? metrics.withdrawalGrowthRate : undefined}
      />

      <MetricCard
        title="Revenue"
        subtitle="All revenue"
        value={metrics.totalRevenue}
        icon={BarChart3}
        iconColor="bg-purple-500"
        bgGradient="from-purple-500/20 to-purple-600/10 border-purple-500/30"
      />

      <MetricCard
        title="Avg Order Value"
        subtitle="Per transaction"
        value={metrics.averageOrderValue}
        icon={Target}
        iconColor="bg-green-500"
        bgGradient="from-green-500/20 to-green-600/10 border-green-500/30"
      />
    </div>
  );
}
