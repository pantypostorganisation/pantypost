// src/hooks/useApiInterceptor.ts

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api.config';
import { securityService } from '@/services/security.service';

/**
 * Hook to set up API interceptors for automatic auth handling
 * Use this in your root layout or app component
 */
export function useApiInterceptor() {
  const { logout } = useAuth();
  const installedRef = useRef(false);
  const isHandling401Ref = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard
    if (installedRef.current) return;

    // Store original fetch safely
    const originalFetch = window.fetch.bind(window);

    // Create intercepted fetch with security enhancements
    const interceptedFetch: typeof fetch = async (input, init) => {
      try {
        // Add secure headers to all requests (fallback to empty object if undefined)
        const secureHeaders = (securityService?.getSecureHeaders?.() ?? {}) as Record<string, string>;
        const existingHeaders =
          (init?.headers instanceof Headers
            ? Object.fromEntries(init.headers.entries())
            : (init?.headers as Record<string, string> | undefined)) || {};

        const enhancedInit: RequestInit = {
          ...init,
          headers: {
            ...secureHeaders,
            ...existingHeaders,
          },
        };

        // Extract URL robustly
        let url = '';
        if (typeof input === 'string') {
          url = input;
        } else if (typeof URL !== 'undefined' && input instanceof Request) {
          url = input.url;
        } else {
          url = String(input);
        }

        // Basic URL validation to prevent malicious protocols
        const lowered = url.toLowerCase().trim();
        if (lowered.startsWith('javascript:') || lowered.startsWith('data:')) {
          throw new Error('Invalid URL protocol');
        }

        const response = await originalFetch(input as any, enhancedInit);

        // If we get a 401 and it's not already a refresh request
        if (response.status === 401) {
          if (!lowered.includes('/auth/refresh') && !isHandling401Ref.current) {
            isHandling401Ref.current = true;

            try {
              // Log security event
              console.warn('[Security] Unauthorized access attempt detected');

              // Token might be expired, trigger logout
              await logout();

              // Prevent back navigation to protected pages
              if (typeof window !== 'undefined') {
                window.location.replace('/login');
              }
            } finally {
              // Slight delay before allowing another 401 flow to avoid redirect storms
              setTimeout(() => {
                isHandling401Ref.current = false;
              }, 1000);
            }
          }
        }

        // Check for other security-related status codes
        if (response.status === 403) {
          console.warn('[Security] Forbidden access attempt');
        }

        return response;
      } catch (error) {
        // Log network errors for monitoring
        if (error instanceof TypeError && (error as TypeError).message === 'Failed to fetch') {
          console.error('[Network] Request failed - possible network issue or CORS error');
        }
        throw error;
      }
    };

    // Only override once
    if (!(window as any).__PP_FETCH_INTERCEPTOR__) {
      (window as any).__PP_FETCH_INTERCEPTOR__ = true;
      window.fetch = interceptedFetch;
      installedRef.current = true;
    }

    // Cleanup function
    return () => {
      // Cancel any pending requests when component unmounts
      try {
        apiClient?.cancelAllRequests?.();
      } catch {
        // ignore
      }

      // Restore original fetch if our interceptor is still installed
      if ((window as any).__PP_FETCH_INTERCEPTOR__ && window.fetch === interceptedFetch) {
        window.fetch = originalFetch;
        delete (window as any).__PP_FETCH_INTERCEPTOR__;
      }
      installedRef.current = false;
    };
  }, [logout]);
}

/**
 * Hook to cancel API requests on unmount
 * Useful for preventing state updates on unmounted components
 */
export function useCancelApiOnUnmount(requestKeys: string[]) {
  useEffect(() => {
    // Validate request keys
    const validKeys = (requestKeys || []).filter(
      (key) => typeof key === 'string' && key.length > 0 && key.length < 100,
    );

    return () => {
      validKeys.forEach((key) => {
        try {
          apiClient?.cancelRequest?.(key);
        } catch {
          // Silently handle errors during cleanup
          console.debug(`[Cleanup] Failed to cancel request: ${key}`);
        }
      });
    };
  }, [requestKeys]);
}

/**
 * Hook to add request throttling for specific endpoints
 * Prevents rapid-fire requests to sensitive endpoints
 */
export function useThrottledApi(endpoint: string, throttleMs: number = 1000) {
  const lastRequestTime = useRef<number>(0);

  const throttledRequest = useCallback(
    async (options?: RequestInit) => {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;

      if (timeSinceLastRequest < throttleMs) {
        const waitSeconds = Math.ceil((throttleMs - timeSinceLastRequest) / 1000);
        throw new Error(`Please wait ${waitSeconds} seconds before retrying`);
      }

      lastRequestTime.current = now;
      return fetch(endpoint, options);
    },
    [endpoint, throttleMs],
  );

  return throttledRequest;
}
