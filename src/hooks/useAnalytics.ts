// src/hooks/useAnalytics.ts

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trafficService } from '@/services/traffic.service';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customData?: Record<string, any>;
}

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}

/**
 * Analytics.
 *
 * Events now go to our own backend as well as Google Analytics.
 * Previously they went only to window.gtag and, optionally, to
 * NEXT_PUBLIC_ANALYTICS_ENDPOINT — which was never configured, so every
 * trackEvent and trackSearch call in the app was firing into nothing.
 */
export function useAnalytics() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  // Record a pageview whenever the route changes. Guarded against
  // duplicates, since this hook is used on several components that may
  // mount on the same page.
  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath.current) return;
    lastTrackedPath.current = pathname;
    trafficService.trackPageview(pathname);
  }, [pathname]);

  const trackEvent = useCallback(
    (event: AnalyticsEvent) => {
      // First-party
      trafficService.trackEvent({
        action: event.action,
        category: event.category,
        label: event.label,
        value: event.value,
        path: pathname,
      });

      // Google Analytics, where configured
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          ...event.customData,
        });
      }
    },
    [pathname]
  );

  const trackPageView = useCallback((url: string) => {
    trafficService.trackPageview(url);

    if (typeof window !== 'undefined' && window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }, []);

  const trackPurchase = useCallback(
    (data: {
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
          items: data.items,
        },
      });
    },
    [trackEvent]
  );

  const trackSearch = useCallback(
    (searchTerm: string, resultsCount: number) => {
      trackEvent({
        action: 'search',
        category: 'engagement',
        label: searchTerm,
        value: resultsCount,
      });
    },
    [trackEvent]
  );

  const trackSocialShare = useCallback(
    (platform: string, contentId: string) => {
      trackEvent({
        action: 'share',
        category: 'social',
        label: platform,
        customData: { content_id: contentId },
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackSearch,
    trackSocialShare,
  };
}