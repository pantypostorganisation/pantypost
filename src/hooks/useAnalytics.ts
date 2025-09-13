// src/hooks/useAnalytics.ts

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customData?: Record<string, any>;
}

declare global {
  interface Window {
    gtag?: (
      command: string,
      ...args: any[]
    ) => void;
  }
}

export function useAnalytics() {
  const pathname = usePathname();

  const trackEvent = useCallback((event: AnalyticsEvent) => {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.customData
      });
    }

    // Custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          page: pathname,
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Fail silently
      });
    }
  }, [pathname]);

  const trackPageView = useCallback((url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        page_path: url,
      });
    }
  }, []);

  const trackPurchase = useCallback((data: {
    transactionId: string;
    value: number;
    currency: string;
    items: Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    trackEvent({
      action: 'purchase',
      category: 'ecommerce',
      value: data.value,
      customData: {
        transaction_id: data.transactionId,
        currency: data.currency,
        items: data.items
      }
    });
  }, [trackEvent]);

  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    trackEvent({
      action: 'search',
      category: 'engagement',
      label: searchTerm,
      value: resultsCount
    });
  }, [trackEvent]);

  const trackSocialShare = useCallback((platform: string, contentId: string) => {
    trackEvent({
      action: 'share',
      category: 'social',
      label: platform,
      customData: {
        content_id: contentId
      }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackSearch,
    trackSocialShare
  };
}