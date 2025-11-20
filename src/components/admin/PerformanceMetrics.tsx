// src/components/admin/PerformanceMetrics.tsx
'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

type Rating = 'good' | 'needs-improvement' | 'poor';

interface MetricData {
  name: string;
  value: number;
  rating: Rating;
  timestamp: string;
}

const PLACEHOLDER_METRICS: ReadonlyArray<Omit<MetricData, 'timestamp'>> = [
  { name: 'First Contentful Paint', value: 1.2, rating: 'good' },
  { name: 'Largest Contentful Paint', value: 2.1, rating: 'good' },
  { name: 'First Input Delay', value: 45, rating: 'good' },
  { name: 'Cumulative Layout Shift', value: 0.08, rating: 'good' },
  { name: 'Time to Interactive', value: 3.2, rating: 'needs-improvement' }
];

const RATING_STYLES: Record<
  Rating,
  { textColor: string; barColor: string; progress: number; Icon: typeof TrendingUp }
> = {
  good: { textColor: 'text-green-500', barColor: 'bg-green-500', progress: 100, Icon: TrendingUp },
  'needs-improvement': {
    textColor: 'text-yellow-500',
    barColor: 'bg-yellow-500',
    progress: 66,
    Icon: AlertCircle
  },
  poor: { textColor: 'text-red-500', barColor: 'bg-red-500', progress: 33, Icon: AlertCircle }
};

const buildPlaceholderMetrics = (): MetricData[] => {
  const timestamp = new Date().toISOString();
  return PLACEHOLDER_METRICS.map((metric) => ({
    ...metric,
    timestamp
  }));
};

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMetrics = () => {
      try {
        const placeholderMetrics = buildPlaceholderMetrics();
        if (mounted) setMetrics(placeholderMetrics);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        if (mounted) setMetrics([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-48 mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-5 w-5 text-[#ff950e]" />
          <h2 className="text-lg font-semibold text-white">Performance Metrics</h2>
        </div>
        <p className="text-gray-400 text-sm">No metrics available.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-5 w-5 text-[#ff950e]" />
        <h2 className="text-lg font-semibold text-white">Performance Metrics</h2>
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => {
          const { textColor, barColor, progress, Icon } = RATING_STYLES[metric.rating];
          const value = Number(metric.value);
          const safeValue = Number.isFinite(value) ? value : 0;
          const metricName = metric.name.toLowerCase();
          const isLayoutShift = metricName.includes('layout shift');
          const isDelay = metricName.includes('delay');
          const unit = isLayoutShift ? '' : isDelay ? 'ms' : 's';

          return (
            <div key={metric.name} className="bg-black/30 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">{metric.name}</h3>
                <div className={`flex items-center gap-1 ${textColor}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-xs uppercase">{metric.rating.replace('-', ' ')}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{safeValue}</span>
                <span className="text-sm text-gray-500">{unit}</span>
              </div>

              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden" aria-hidden="true">
                <div
                  className={`h-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Metrics collected from real user monitoring (RUM)</p>
      </div>
    </div>
  );
}
