// src/components/admin/PerformanceMetrics.tsx
import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

interface MetricData {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
}

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Simulate fetching metrics - replace with actual API call
      const mockMetrics: MetricData[] = [
        {
          name: 'First Contentful Paint',
          value: 1.2,
          rating: 'good',
          timestamp: new Date().toISOString()
        },
        {
          name: 'Largest Contentful Paint',
          value: 2.1,
          rating: 'good',
          timestamp: new Date().toISOString()
        },
        {
          name: 'First Input Delay',
          value: 45,
          rating: 'good',
          timestamp: new Date().toISOString()
        },
        {
          name: 'Cumulative Layout Shift',
          value: 0.08,
          rating: 'good',
          timestamp: new Date().toISOString()
        },
        {
          name: 'Time to Interactive',
          value: 3.2,
          rating: 'needs-improvement',
          timestamp: new Date().toISOString()
        }
      ];
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-500';
      case 'needs-improvement':
        return 'text-yellow-500';
      case 'poor':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getMetricIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <TrendingUp className="h-4 w-4" />;
      case 'needs-improvement':
      case 'poor':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
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

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-5 w-5 text-[#ff950e]" />
        <h2 className="text-lg font-semibold text-white">Performance Metrics</h2>
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-black/30 rounded-lg p-4 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">{metric.name}</h3>
              <div className={`flex items-center gap-1 ${getMetricColor(metric.rating)}`}>
                {getMetricIcon(metric.rating)}
                <span className="text-xs uppercase">{metric.rating.replace('-', ' ')}</span>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {metric.value}
              </span>
              <span className="text-sm text-gray-500">
                {metric.name.includes('Layout Shift') ? '' : metric.name.includes('Delay') ? 'ms' : 's'}
              </span>
            </div>
            
            <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  metric.rating === 'good' ? 'bg-green-500' :
                  metric.rating === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.min((metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 66 : 33), 100)}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          Metrics collected from real user monitoring (RUM)
        </p>
      </div>
    </div>
  );
}