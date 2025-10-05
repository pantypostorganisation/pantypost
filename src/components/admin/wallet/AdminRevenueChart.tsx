// src/components/admin/wallet/AdminRevenueChart.tsx
'use client';

import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { getRevenueByDay } from '@/utils/admin/walletHelpers';

interface AdminRevenueChartProps {
  timeFilter: string;
  orderHistory: any[];
  adminActions: any[];
}

export default function AdminRevenueChart({ timeFilter, orderHistory, adminActions }: AdminRevenueChartProps) {
  // Get raw data from helper (may be empty / contain NaN)
  const rawData = getRevenueByDay(timeFilter, orderHistory, adminActions) || [];

  // Sanitize / normalize chart data
  const chartData = useMemo(
    () =>
      (Array.isArray(rawData) ? rawData : []).map((d) => ({
        date: String(d?.date ?? ''),
        revenue: Number.isFinite(Number(d?.revenue)) ? Math.max(0, Number(d.revenue)) : 0
      })),
    [rawData]
  );

  const maxRevenue = chartData.reduce((m, d) => Math.max(m, d.revenue), 1);
  const totalChartRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const averageChartRevenue = chartData.length > 0 ? totalChartRevenue / chartData.length : 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);

  const getChartPeriodDescription = () => {
    switch (timeFilter) {
      case 'today':
        return 'Hourly revenue today';
      case 'week':
        return 'Daily revenue this week';
      case 'month':
        return 'Daily revenue this month';
      case '3months':
        return 'Daily revenue over 3 months';
      case 'year':
        return 'Monthly revenue this year';
      default:
        return 'Daily revenue over last 30 days';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-sm shadow-xl shadow-black/30">
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-[#ff6b00]/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <BarChart3 className="h-5 w-5 text-[#ffbf7f]" />
          Revenue Trend
        </h3>
        <div className="text-sm text-gray-400">{getChartPeriodDescription()}</div>
      </div>

      {chartData.length === 0 ? (
        <div className="relative py-12 text-center text-gray-500">No revenue data for this period</div>
      ) : (
        <div className="relative mt-8">
          <div className="overflow-x-auto">
            <div className="flex h-64 min-w-[600px] items-end justify-between gap-1">
              {chartData.map((period, index) => {
                const heightPx = Math.max((period.revenue / maxRevenue) * 200, 4); // min bar height for visibility
                return (
                  <div key={index} className="group flex flex-1 flex-col items-center">
                    <div className="relative mb-2 flex w-full justify-center">
                      <div
                        className="min-h-[4px] w-8 rounded-t-lg bg-gradient-to-t from-[#ff950e] to-[#ff6b00] transition-all duration-300 group-hover:from-[#ff6b00] group-hover:to-[#ff950e]"
                        style={{ height: `${heightPx}px` }}
                        aria-label={`${period.date}: ${formatCurrency(period.revenue)}`}
                        role="img"
                      />
                      <div className="absolute -top-8 z-10 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {formatCurrency(period.revenue)}
                      </div>
                    </div>
                    <span className="mt-1 block origin-center -rotate-45 whitespace-nowrap text-xs text-gray-500">
                      {period.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 text-center sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Highest {timeFilter === 'today' ? 'Hour' : timeFilter === 'year' ? 'Month' : 'Day'}
              </p>
              <p className="font-semibold text-emerald-300">
                {formatCurrency(chartData.reduce((m, d) => Math.max(m, d.revenue), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Average {timeFilter === 'today' ? 'Hour' : timeFilter === 'year' ? 'Month' : 'Day'}
              </p>
              <p className="font-semibold text-white">{formatCurrency(averageChartRevenue)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">Total Period</p>
              <p className="font-semibold text-[#ffbf7f]">{formatCurrency(totalChartRevenue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
