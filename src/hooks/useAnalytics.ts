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
    gtag?: (command: string, ...args: any[]) => void;
  }
}

const safeSlice = (s: string, max = 256) => (typeof s === 'string' ? s.slice(0, max) : s);

export function useAnalytics() {
  const pathname = usePathname();

  const trackEvent = useCallback(
    (event: AnalyticsEvent) => {
      // GA4 (client only)
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', safeSlice(event.action, 64), {
          event_category: safeSlice(event.category, 64),
          event_label: event.label ? safeSlice(event.label, 128) : undefined,
          value: typeof event.value === 'number' ? event.value : undefined,
          ...(event.customData && typeof event.customData === 'object' ? event.customData : {}),
        });
      }

      // Custom analytics endpoint
      const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
      if (endpoint) {
        try {
          const ua = typeof navigator !== 'undefined' ? safeSlice(navigator.userAgent, 256) : undefined;
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
          const id = controller ? setTimeout(() => controller.abort(), 4000) : null;

          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            signal: controller?.signal,
            body: JSON.stringify({
              action: safeSlice(event.action, 64),
              category: safeSlice(event.category, 64),
              label: event.label ? safeSlice(event.label, 128) : undefined,
              value: typeof event.value === 'number' ? event.value : undefined,
              customData: event.customData && typeof event.customData === 'object' ? event.customData : undefined,
              timestamp: new Date().toISOString(),
              page: safeSlice(String(pathname || '/'), 256),
              userAgent: ua,
            }),
          })
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .catch(() => {})
            .finally(() => {
              if (id) clearTimeout(id);
            });
        } catch {
          // fail silently
        }
      }
    },
    [pathname],
  );

  const trackPageView = useCallback((url: string) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      if (gaId) {
        window.gtag('config', gaId, {
          page_path: safeSlice(url, 256),
        });
      }
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
          transaction_id: safeSlice(data.transactionId, 64),
          currency: safeSlice(data.currency, 16),
          items: data.items?.slice(0, 30), // bound payload
        },
      });
    },
    [trackEvent],
  );

  const trackSearch = useCallback(
    (searchTerm: string, resultsCount: number) => {
      trackEvent({
        action: 'search',
        category: 'engagement',
        label: safeSlice(searchTerm, 128),
        value: Number.isFinite(resultsCount) ? resultsCount : undefined,
      });
    },
    [trackEvent],
  );

  const trackSocialShare = useCallback(
    (platform: string, contentId: string) => {
      trackEvent({
        action: 'share',
        category: 'social',
        label: safeSlice(platform, 64),
        customData: {
          content_id: safeSlice(contentId, 64),
        },
      });
    },
    [trackEvent],
  );

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackSearch,
    trackSocialShare,
  };
}
