// src/components/admin/wallet/AdminRevenueChart.tsx
'use client';

import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { getRevenueByDay } from '@/utils/admin/walletHelpers';

interface AdminRevenueChartProps {
  timeFilter: string;
  orderHistory: any[];
  adminActions: any[];
}

export default function AdminRevenueChart({ timeFilter, orderHistory, adminActions }: AdminRevenueChartProps) {
  const [touchedBarIndex, setTouchedBarIndex] = useState<number | null>(null);

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

  const handleTouchStart = (index: number) => {
    setTouchedBarIndex(index);
  };

  const handleTouchEnd = () => {
    // Keep the tooltip visible for a moment after release
    setTimeout(() => {
      setTouchedBarIndex(null);
    }, 2000);
  };

  const handleTouchCancel = () => {
    setTouchedBarIndex(null);
  };

  return (
    <div className="bg-[#101010] rounded-xl p-6 border border-[#1f1f1f] shadow-[0_8px_24px_rgba(0,0,0,0.35)] mb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#ff950e]" />
          Revenue Trend
        </h3>
        <div className="text-sm text-gray-400">{getChartPeriodDescription()}</div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center text-gray-600 py-12 border border-dashed border-[#1f1f1f] rounded-lg">
          No revenue data for this period
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[600px] mb-4">
              <div className="relative h-64">

                <div className="absolute inset-x-3 bottom-3 top-6 flex items-end justify-between gap-2 pr-6">
                  {chartData.map((period, index) => {
                    const heightPx = Math.max((period.revenue / maxRevenue) * 200, 4);
                    const isActive = touchedBarIndex === index;

                    return (
                      <div
                        key={index}
                        className="group flex flex-1 flex-col items-center gap-3"
                        onTouchStart={() => handleTouchStart(index)}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                      >
                        <div className="relative flex w-full justify-center">
                          <div
                            className={`w-9 rounded-lg bg-[#ff950e] transition-all duration-200 ease-out group-hover:bg-[#ffa53a] ${
                              isActive ? 'ring-2 ring-[#ff950e]/40' : ''
                            }`}
                            style={{ height: `${heightPx}px` }}
                            aria-label={`${period.date}: ${formatCurrency(period.revenue)}`}
                            role="img"
                          />
                          <div
                            className={`absolute -top-9 whitespace-nowrap rounded-md border border-[#2a2a2a] bg-[#0c0c0c] px-2 py-1 text-xs text-gray-100 shadow-sm transition-opacity ${
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {formatCurrency(period.revenue)}
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-gray-500 transform -rotate-45 origin-top whitespace-nowrap">
                          {period.date}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-3 border-t border-[#1f1f1f] mt-6">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Peak {timeFilter === 'today' ? 'Hour' : timeFilter === 'year' ? 'Month' : 'Day'}
              </p>
              <p className="text-lg font-semibold text-emerald-300">
                {formatCurrency(chartData.reduce((m, d) => Math.max(m, d.revenue), 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Avg {timeFilter === 'today' ? 'Hour' : timeFilter === 'year' ? 'Month' : 'Day'}
              </p>
              <p className="text-lg font-semibold text-gray-100">{formatCurrency(averageChartRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Total Period</p>
              <p className="text-lg font-semibold text-[#ff950e]">{formatCurrency(totalChartRevenue)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
