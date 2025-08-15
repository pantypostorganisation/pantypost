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
import { useEffect, useMemo, useState } from 'react';

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

type IconType = React.ComponentType<{ className?: string }>;

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
  icon: IconType;
  iconColor: string;
  bgGradient: string;
  growthRate?: number;
  breakdown?: { label: string; value: number }[];
  loading?: boolean;
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);

  const formatValue = (val: number) => (currency ? formatCurrency(val) : (Number.isFinite(val) ? val : 0).toLocaleString());

  const cleanGrowth = Number.isFinite(growthRate as number) ? (growthRate as number) : 0;

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-xl p-6 border relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 rounded-full -translate-y-16 translate-x-16" aria-hidden="true"></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 ${iconColor} rounded-lg`} aria-hidden="true">
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
              {cleanGrowth !== 0 && (
                <span className={`text-sm flex items-center gap-1 ml-2 ${cleanGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {cleanGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(cleanGrowth).toFixed(1)}%
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
    filteredActions = [],
    filteredOrders = [],
    filteredDeposits = [],
    filteredSellerWithdrawals = [],
    filteredAdminWithdrawals = [],
    adminBalance,
    orderHistory = [],
    adminActions = [],
    depositLogs = [],
    sellerWithdrawals = {},
    adminWithdrawals = []
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

  const safeAdminBalance = useMemo(() => (typeof adminBalance === 'number' && Number.isFinite(adminBalance) ? adminBalance : 0), [adminBalance]);

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

      const periodTotalRevenue = (Number.isFinite(periodSalesRevenue) ? periodSalesRevenue : 0) + (Number.isFinite(periodSubscriptionRevenue) ? periodSubscriptionRevenue : 0);
      const allTimeTotalRevenue = (Number.isFinite(allTimeSalesRevenue) ? allTimeSalesRevenue : 0) + (Number.isFinite(allTimeSubscriptionRevenue) ? allTimeSubscriptionRevenue : 0);

      const periodAverageOrderValue =
        filteredOrders.length > 0 && Number.isFinite(periodSalesRevenue) && periodSalesRevenue > 0
          ? periodSalesRevenue / filteredOrders.length
          : 0;

      const allTimeAverageOrderValue =
        orderHistory.length > 0 && Number.isFinite(allTimeSalesRevenue) && allTimeSalesRevenue > 0
          ? allTimeSalesRevenue / orderHistory.length
          : 0;

      // Real balance for "all"
      const displayTotalProfit =
        timeFilter === 'all' ? safeAdminBalance : (Number.isFinite(periodSalesProfit) ? periodSalesProfit : 0) + (Number.isFinite(periodSubscriptionProfit) ? periodSubscriptionProfit : 0);

      const displayTotalRevenue = timeFilter === 'all' ? allTimeTotalRevenue : periodTotalRevenue;
      const displayAverageOrderValue = timeFilter === 'all' ? allTimeAverageOrderValue : periodAverageOrderValue;

      const totalDepositsAllTime = (depositLogs || [])
        .filter((d: any) => d?.status === 'completed')
        .reduce((sum: number, d: any) => sum + (Number.isFinite(Number(d?.amount)) ? Number(d.amount) : 0), 0);

      const periodTotalDeposits = (filteredDeposits || [])
        .filter((d: any) => d?.status === 'completed')
        .reduce((sum: number, d: any) => sum + (Number.isFinite(Number(d?.amount)) ? Number(d.amount) : 0), 0);

      const displayTotalDeposits = timeFilter === 'all' ? totalDepositsAllTime : periodTotalDeposits;

      const withdrawalMetrics = calculateWithdrawals(filteredSellerWithdrawals, filteredAdminWithdrawals);
      const allTimeWithdrawalData =
        timeFilter === 'all'
          ? {
              totalWithdrawals:
                getAllSellerWithdrawals(sellerWithdrawals).reduce((sum: number, w: any) => sum + (Number.isFinite(Number(w?.amount)) ? Number(w.amount) : 0), 0) +
                (adminWithdrawals || []).reduce((sum: number, w: any) => sum + (Number.isFinite(Number(w?.amount)) ? Number(w.amount) : 0), 0)
            }
          : withdrawalMetrics;

      const {
        orders: previousPeriodOrders,
        deposits: previousPeriodDeposits,
        withdrawals: previousPeriodWithdrawals,
        actions: previousPeriodActions
      } = getPreviousPeriodData(
        timeFilter,
        orderHistory,
        depositLogs,
        getAllSellerWithdrawals(sellerWithdrawals),
        adminActions
      );

      const previousPeriodProfit =
        calculatePlatformProfit(previousPeriodOrders) + calculateSubscriptionProfit(previousPeriodActions);

      const previousPeriodDepositAmount = (previousPeriodDeposits || [])
        .filter((d: any) => d?.status === 'completed')
        .reduce((sum: number, d: any) => sum + (Number.isFinite(Number(d?.amount)) ? Number(d.amount) : 0), 0);

      const previousPeriodWithdrawalAmount = (previousPeriodWithdrawals || [])
        .reduce((sum: number, w: any) => sum + (Number.isFinite(Number(w?.amount)) ? Number(w.amount) : 0), 0);

      const growthRate =
        timeFilter !== 'all' && Number(previousPeriodProfit) > 0
          ? ((displayTotalProfit - previousPeriodProfit) / previousPeriodProfit) * 100
          : 0;

      const depositGrowthRate =
        timeFilter !== 'all' && Number(previousPeriodDepositAmount) > 0
          ? ((periodTotalDeposits - previousPeriodDepositAmount) / previousPeriodDepositAmount) * 100
          : 0;

      const withdrawalGrowthRate =
        timeFilter !== 'all' && Number(previousPeriodWithdrawalAmount) > 0
          ? ((withdrawalMetrics.totalWithdrawals - previousPeriodWithdrawalAmount) / previousPeriodWithdrawalAmount) * 100
          : 0;

      setMetrics({
        platformProfit: timeFilter === 'all' ? allTimeSalesProfit : periodSalesProfit,
        subscriptionProfit: timeFilter === 'all' ? allTimeSubscriptionProfit : periodSubscriptionProfit,
        totalProfit: Number.isFinite(displayTotalProfit) ? displayTotalProfit : 0,
        totalDeposits: Number.isFinite(displayTotalDeposits) ? displayTotalDeposits : 0,
        totalWithdrawals: Number.isFinite(allTimeWithdrawalData.totalWithdrawals) ? allTimeWithdrawalData.totalWithdrawals : 0,
        totalRevenue: Number.isFinite(displayTotalRevenue) ? displayTotalRevenue : 0,
        averageOrderValue: Number.isFinite(displayAverageOrderValue) ? displayAverageOrderValue : 0,
        growthRate: Number.isFinite(growthRate) ? growthRate : 0,
        depositGrowthRate: Number.isFinite(depositGrowthRate) ? depositGrowthRate : 0,
        withdrawalGrowthRate: Number.isFinite(withdrawalGrowthRate) ? withdrawalGrowthRate : 0
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
    adminWithdrawals,
    safeAdminBalance
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <MetricCard
        title="Money Made"
        subtitle={timeFilter === 'all' ? 'Total platform wallet balance' : 'Platform profit this period'}
        value={metrics.totalProfit}
        icon={DollarSign}
        iconColor="bg-[#ff950e]"
        bgGradient="from-[#ff950e]/20 to-[#ff6b00]/10 border-[#ff950e]/30"
        growthRate={timeFilter !== 'all' ? metrics.growthRate : undefined}
        breakdown={
          timeFilter !== 'all'
            ? [
                { label: 'Sales', value: Number(metrics.platformProfit) || 0 },
                { label: 'Subs', value: Number(metrics.subscriptionProfit) || 0 }
              ]
            : [
                { label: 'Real Balance', value: safeAdminBalance },
                { label: 'In Wallet', value: safeAdminBalance }
              ]
        }
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
