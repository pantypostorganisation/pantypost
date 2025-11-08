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
  accentBackground,
  accentColor,
  growthRate,
  breakdown,
  loading = false
}: {
  title: string;
  subtitle: string;
  value: number;
  currency?: boolean;
  icon: IconType;
  accentBackground: string;
  accentColor: string;
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
    <div
      className="h-full rounded-xl border border-[#1f1f1f] bg-[#101010] p-6 shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-colors duration-200 hover:border-[#ff950e]/40 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBackground}`} aria-hidden="true">
            <Icon className={`h-5 w-5 ${accentColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          Calculating...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-2 text-white">
            <span className="text-3xl font-semibold tracking-tight">{formatValue(value)}</span>
            {cleanGrowth !== 0 && (
              <span
                className={`text-xs font-medium uppercase tracking-wide flex items-center gap-1 rounded-full px-2 py-1 ${
                  cleanGrowth > 0 ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'
                }`}
              >
                {cleanGrowth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(cleanGrowth).toFixed(1)}%
              </span>
            )}
          </div>

          {breakdown && breakdown.length > 0 && (
            <div className="space-y-1 text-xs text-gray-500">
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="uppercase tracking-wide text-[10px] text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-200">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 lg:gap-5 mb-10">
      <MetricCard
        title="Money Made"
        subtitle={timeFilter === 'all' ? 'Total platform wallet balance' : 'Platform profit'}
        value={metrics.totalProfit}
        icon={DollarSign}
        accentBackground="bg-[#ff950e]/10"
        accentColor="text-[#ff950e]"
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
        accentBackground="bg-blue-500/10"
        accentColor="text-blue-400"
        growthRate={timeFilter !== 'all' ? metrics.depositGrowthRate : undefined}
      />

      <MetricCard
        title="Withdrawals"
        subtitle="Money paid out"
        value={metrics.totalWithdrawals}
        icon={Upload}
        accentBackground="bg-red-500/10"
        accentColor="text-red-400"
        growthRate={timeFilter !== 'all' ? metrics.withdrawalGrowthRate : undefined}
      />

      <MetricCard
        title="Revenue"
        subtitle="All revenue"
        value={metrics.totalRevenue}
        icon={BarChart3}
        accentBackground="bg-purple-500/10"
        accentColor="text-purple-400"
      />

      <MetricCard
        title="Avg Order Value"
        subtitle="Per transaction"
        value={metrics.averageOrderValue}
        icon={Target}
        accentBackground="bg-green-500/10"
        accentColor="text-green-400"
      />
    </div>
  );
}
