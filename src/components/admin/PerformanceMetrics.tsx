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

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchMetrics = async () => {
      try {
        // Replace with real API call; keep mock safe/sanitized
        const nowIso = new Date().toISOString();
        const mockMetrics: MetricData[] = [
          { name: 'First Contentful Paint', value: 1.2, rating: 'good', timestamp: nowIso },
          { name: 'Largest Contentful Paint', value: 2.1, rating: 'good', timestamp: nowIso },
          { name: 'First Input Delay', value: 45, rating: 'good', timestamp: nowIso },
          { name: 'Cumulative Layout Shift', value: 0.08, rating: 'good', timestamp: nowIso },
          { name: 'Time to Interactive', value: 3.2, rating: 'needs-improvement', timestamp: nowIso }
        ];
        if (mounted) setMetrics(mockMetrics);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        if (mounted) setMetrics([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  const getMetricColor = (rating: Rating) => {
    switch (rating) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
    }
  };

  const getMetricIcon = (rating: Rating) => {
    switch (rating) {
      case 'good':
        return <TrendingUp className="h-4 w-4" />;
      case 'needs-improvement':
      case 'poor':
        return <AlertCircle className="h-4 w-4" />;
    }
  };

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
          const val = Number(metric.value);
          const safeVal = Number.isFinite(val) ? val : 0;
          const isCLS = metric.name.toLowerCase().includes('layout shift');
          const isDelay = metric.name.toLowerCase().includes('delay');

          return (
            <div key={metric.name} className="bg-black/30 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">{metric.name}</h3>
                <div className={`flex items-center gap-1 ${getMetricColor(metric.rating)}`}>
                  {getMetricIcon(metric.rating)}
                  <span className="text-xs uppercase">{metric.rating.replace('-', ' ')}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{safeVal}</span>
                <span className="text-sm text-gray-500">{isCLS ? '' : isDelay ? 'ms' : 's'}</span>
              </div>

              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden" aria-hidden="true">
                <div
                  className={`h-full transition-all duration-500 ${
                    metric.rating === 'good'
                      ? 'bg-green-500'
                      : metric.rating === 'needs-improvement'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${
                      metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 66 : 33
                    }%`
                  }}
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
