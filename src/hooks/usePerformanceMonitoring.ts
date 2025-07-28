// src/hooks/usePerformanceMonitoring.ts

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}

export function usePerformanceMonitoring() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Report web vitals
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);  // Note: FID is replaced with INP in newer versions
    onLCP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      // Track page navigation performance
      if (window.performance && window.performance.mark) {
        window.performance.mark('route-change-start');
      }
    };

    const handleRouteChangeComplete = () => {
      if (window.performance && window.performance.mark && window.performance.measure) {
        window.performance.mark('route-change-end');
        window.performance.measure(
          'route-change',
          'route-change-start',
          'route-change-end'
        );

        const measure = window.performance.getEntriesByName('route-change')[0];
        if (measure) {
          sendToAnalytics({
            name: 'route-change',
            value: measure.duration,
            id: 'route-change',
            delta: measure.duration
          });
        }
      }
    };

    // Since we're using Next.js App Router, we need to track route changes differently
    handleRouteChange();
    return () => {
      handleRouteChangeComplete();
    };
  }, [pathname]);
}

function sendToAnalytics(metric: any) {
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }

  // Send to custom endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(`${process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        timestamp: new Date().toISOString(),
        page: window.location.pathname
      })
    }).catch(() => {
      // Fail silently
    });
  }
}