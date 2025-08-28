// src/components/analytics/SellerRevenueChart.tsx
'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingBag,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface RevenueDataPoint {
  _id: string | number;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
}

interface SellerRevenueChartProps {
  data: RevenueDataPoint[];
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  isLoading?: boolean;
}

type ChartRow = {
  label: string;
  revenue: number;
  orders: number;
  avgOrder: number;
};

export default function SellerRevenueChart({
  data = [],
  period,
  isLoading = false
}: SellerRevenueChartProps) {
  // Normalize/format rows (cap at most recent 20 like before)
  const chartData: ChartRow[] = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return data.slice(-20).map((point) => {
      let label = '';

      if (typeof point._id === 'string') {
        if (period === 'daily' && point._id.includes('-')) {
          const d = new Date(point._id);
          if (!Number.isNaN(d.getTime())) {
            label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } else {
            label = point._id;
          }
        } else {
          label = point._id;
        }
      } else if (typeof point._id === 'number') {
        if (period === 'weekly') {
          label = `Week ${point._id}`;
        } else if (period === 'monthly') {
          label = monthNames[Math.max(0, Math.min(11, Number(point._id) - 1))] ?? `Month ${point._id}`;
        } else if (period === 'yearly') {
          label = String(point._id);
        } else {
          label = String(point._id);
        }
      }

      const revenue = Number.isFinite(point.totalRevenue) ? Math.round(point.totalRevenue * 100) / 100 : 0;
      const orders = Number.isFinite(point.orderCount) ? point.orderCount : 0;
      const avgOrder = Number.isFinite(point.avgOrderValue) ? Math.round(point.avgOrderValue * 100) / 100 : 0;

      return { label, revenue, orders, avgOrder };
    });
  }, [data, period]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const revenues = chartData.map((d) => d.revenue);
    const totalRevenue = revenues.reduce((s, v) => s + v, 0);
    const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;
    const maxRevenue = Math.max(...revenues);

    const orders = chartData.map((d) => d.orders);
    const totalOrders = orders.reduce((s, v) => s + v, 0);

    // Simple trend: avg of second half vs first half
    const mid = Math.floor(chartData.length / 2);
    const firstAvg =
      chartData.slice(0, mid).reduce((s, v) => s + v.revenue, 0) / Math.max(1, mid);
    const secondAvg =
      chartData.slice(mid).reduce((s, v) => s + v.revenue, 0) /
      Math.max(1, chartData.length - mid);
    const trend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    const bestPeriod = chartData.reduce((best, cur) => (cur.revenue > best.revenue ? cur : best), chartData[0]);

    return { totalRevenue, avgRevenue, maxRevenue, totalOrders, trend, bestPeriod };
  }, [chartData]);

  const maxOrders = useMemo(
    () => (chartData.length ? Math.max(...chartData.map((d) => d.orders), 1) : 1),
    [chartData]
  );
  const maxAOV = useMemo(
    () => (chartData.length ? Math.max(...chartData.map((d) => d.avgOrder), 1) : 1),
    [chartData]
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);

  const formatCompactCurrency = (amount: number) => {
    if (!Number.isFinite(amount)) return '$0';
    if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${Math.round(amount)}`;
  };

  const chartPeriodDescription = (() => {
    switch (period) {
      case 'daily':
        return 'Daily revenue (last 30 days)';
      case 'weekly':
        return 'Weekly revenue (last 12 weeks)';
      case 'monthly':
        return 'Monthly revenue (last 12 months)';
      case 'yearly':
        return 'Yearly revenue (last 5 years)';
      default:
        return 'Revenue over time';
    }
  })();

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500">
            <div className="w-8 h-8 border-2 border-[#ff950e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading revenue data...
          </div>
        </div>
      </div>
    );
  }

  if (!stats || chartData.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#ff950e]" />
          Revenue Trend
        </h3>
        <div className="h-96 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No revenue data available for this period</p>
            <p className="text-sm mt-2">Start making sales to see your revenue chart!</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Reusable Bar Row (admin-style) ----------
  const BarRow = ({
    rows,
    max,
    valueSelector,
    barAriaPrefix,
    tooltipFormatter,
    barGradient = 'from-[#ff950e] to-[#ff6b00]'
  }: {
    rows: ChartRow[];
    max: number;
    valueSelector: (r: ChartRow) => number;
    barAriaPrefix: string;
    tooltipFormatter: (n: number, row: ChartRow) => string;
    barGradient?: string;
  }) => {
    const safeMax = Math.max(1, max);
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px] h-64 flex items-end justify-between gap-1 mb-4">
          {rows.map((row, idx) => {
            const v = Math.max(0, valueSelector(row));
            const heightPx = Math.max((v / safeMax) * 200, 4); // min bar height for visibility
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex justify-center mb-2">
                  <div
                    className={`w-8 bg-gradient-to-t ${barGradient} rounded-t-lg transition-all duration-300 group-hover:from-[#ff6b00] group-hover:to-[#ff950e] min-h-[4px]`}
                    style={{ height: `${heightPx}px` }}
                    aria-label={`${barAriaPrefix} ${row.label}: ${v}`}
                    role="img"
                  />
                  <div className="absolute -top-8 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {tooltipFormatter(v, row)}
                  </div>
                </div>
                <span className="text-xs text-gray-500 transform -rotate-45 origin-center whitespace-nowrap block mt-1">
                  {row.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-5 w-5 text-[#ff950e]" />
            {stats.trend !== 0 && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  stats.trend > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {stats.trend > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(stats.trend).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-white">
            {formatCompactCurrency(stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <ShoppingBag className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-xl font-bold text-white">{stats.totalOrders}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <Activity className="h-5 w-5 text-blue-400 mb-2" />
          <p className="text-xs text-gray-500 mb-1">Avg Order Value</p>
          <p className="text-xl font-bold text-white">
            {formatCurrency(stats.totalRevenue / Math.max(stats.totalOrders, 1))}
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
          <TrendingUp className="h-5 w-5 text-purple-400 mb-2" />
          <p className="text-xs text-gray-500 mb-1">
            Best {period === 'yearly' ? 'Year' : period === 'monthly' ? 'Month' : period === 'weekly' ? 'Week' : 'Day'}
          </p>
          <p className="text-xl font-bold text-white">
            {formatCompactCurrency(stats.maxRevenue)}
          </p>
        </div>
      </div>

      {/* Main Revenue Chart (admin-style bars) */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#ff950e]" />
            Revenue Trend
          </h3>
        </div>

        <div className="text-sm text-gray-400 mb-2">{chartPeriodDescription}</div>

        <BarRow
          rows={chartData}
          max={stats.maxRevenue}
          valueSelector={(r) => r.revenue}
          barAriaPrefix="Revenue"
          tooltipFormatter={(v, r) => `${formatCurrency(v)} • ${r.orders} orders`}
          barGradient="from-[#ff950e] to-[#ff6b00]"
        />

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Highest {period === 'yearly' ? 'Year' : period === 'monthly' ? 'Month' : period === 'weekly' ? 'Week' : 'Day'}
            </p>
            <p className="font-bold text-green-400">{formatCurrency(stats.maxRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.bestPeriod.label}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Average {period === 'yearly' ? 'Year' : period === 'monthly' ? 'Month' : period === 'weekly' ? 'Week' : 'Day'}
            </p>
            <p className="font-bold text-white">{formatCurrency(stats.avgRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Period</p>
            <p className="font-bold text-[#ff950e]">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">{chartData.length} periods</p>
          </div>
        </div>
      </div>

      {/* Secondary Charts (admin-style bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-green-400" />
            Order Volume Distribution
          </h3>

          <BarRow
            rows={chartData}
            max={maxOrders}
            valueSelector={(r) => r.orders}
            barAriaPrefix="Orders"
            tooltipFormatter={(v, r) => `${v} orders • ${r.label}`}
            barGradient="from-green-500 to-emerald-400"
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="font-bold text-green-400 text-xl">{stats.totalOrders}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Avg per {period === 'yearly' ? 'Year' : period === 'monthly' ? 'Month' : period === 'weekly' ? 'Week' : 'Day'}
              </p>
              <p className="font-bold text-white text-xl">
                {Math.round(stats.totalOrders / Math.max(1, chartData.length))}
              </p>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Average Order Value Trend
          </h3>

          <BarRow
            rows={chartData}
            max={maxAOV}
            valueSelector={(r) => r.avgOrder}
            barAriaPrefix="Average order value"
            tooltipFormatter={(v, r) => `${formatCurrency(v)} AOV • ${r.label}`}
            barGradient="from-blue-500 to-sky-400"
          />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
            <div className="text-center">
              <p className="text-xs text-gray-500">Overall Average</p>
              <p className="font-bold text-blue-400 text-xl">
                {formatCurrency(stats.totalRevenue / Math.max(stats.totalOrders, 1))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Highest AOV</p>
              <p className="font-bold text-white text-xl">
                {formatCurrency(maxAOV)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
