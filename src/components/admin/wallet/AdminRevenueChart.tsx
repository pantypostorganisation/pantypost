// src/components/admin/wallet/AdminRevenueChart.tsx
'use client';

import { BarChart3 } from 'lucide-react';
import { getRevenueByDay } from '@/utils/admin/walletHelpers';

interface AdminRevenueChartProps {
  timeFilter: string;
  orderHistory: any[];
  adminActions: any[];
}

export default function AdminRevenueChart({ timeFilter, orderHistory, adminActions }: AdminRevenueChartProps) {
  const chartData = getRevenueByDay(timeFilter, orderHistory, adminActions);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);
  const totalChartRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const averageChartRevenue = chartData.length > 0 ? totalChartRevenue / chartData.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  return (
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
          <p className="font-bold text-white">{formatCurrency(averageChartRevenue)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Total Period</p>
          <p className="font-bold text-[#ff950e]">{formatCurrency(totalChartRevenue)}</p>
        </div>
      </div>
    </div>
  );
}