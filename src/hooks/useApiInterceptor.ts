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

  useEffect(() => {
    // Store original fetch
    const originalFetch = window.fetch;

    // Create intercepted fetch with security enhancements
    const interceptedFetch: typeof fetch = async (input, init) => {
      try {
        // Add secure headers to all requests
        const secureHeaders = securityService.getSecureHeaders();
        const enhancedInit = {
          ...init,
          headers: {
            ...secureHeaders,
            ...init?.headers,
          },
        };

        // Validate URL to prevent potential security issues
        const url = typeof input === 'string' ? input : input.toString();
        
        // Basic URL validation to prevent malicious redirects
        if (url.startsWith('javascript:') || url.startsWith('data:')) {
          throw new Error('Invalid URL protocol');
        }

        const response = await originalFetch(input, enhancedInit);
        
        // If we get a 401 and it's not already a refresh request
        if (response.status === 401) {
          if (!url.includes('/auth/refresh')) {
            // Log security event
            console.warn('[Security] Unauthorized access attempt detected');
            
            // Token might be expired, trigger logout
            await logout();
            
            // Use replace to prevent back button issues
            window.location.replace('/login');
          }
        }
        
        // Check for other security-related status codes
        if (response.status === 403) {
          console.warn('[Security] Forbidden access attempt');
        }
        
        return response;
      } catch (error) {
        // Log network errors for monitoring
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.error('[Network] Request failed - possible network issue or CORS error');
        }
        
        throw error;
      }
    };

    // Only override if not already overridden by auth service
    if (!window.fetch.toString().includes('Authorization')) {
      window.fetch = interceptedFetch;
    }

    // Cleanup function
    return () => {
      // Cancel any pending requests when component unmounts
      apiClient.cancelAllRequests();
      
      // Restore original fetch if needed
      if (window.fetch === interceptedFetch) {
        window.fetch = originalFetch;
      }
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
    const validKeys = requestKeys.filter(key => 
      typeof key === 'string' && key.length > 0 && key.length < 100
    );

    return () => {
      validKeys.forEach(key => {
        try {
          apiClient.cancelRequest(key);
        } catch (error) {
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

  const throttledRequest = useCallback(async (options?: RequestInit) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;

    if (timeSinceLastRequest < throttleMs) {
      throw new Error(`Please wait ${Math.ceil((throttleMs - timeSinceLastRequest) / 1000)} seconds before retrying`);
    }

    lastRequestTime.current = now;
    return fetch(endpoint, options);
  }, [endpoint, throttleMs]);

  return throttledRequest;
}
