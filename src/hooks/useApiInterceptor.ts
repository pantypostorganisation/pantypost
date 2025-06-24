// src/hooks/useApiInterceptor.ts

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/services/api.config';

/**
 * Hook to set up API interceptors for automatic auth handling
 * Use this in your root layout or app component
 */
export function useApiInterceptor() {
  const { logout } = useAuth();

  useEffect(() => {
    // Store original fetch
    const originalFetch = window.fetch;

    // Create intercepted fetch
    const interceptedFetch: typeof fetch = async (input, init) => {
      try {
        const response = await originalFetch(input, init);
        
        // If we get a 401 and it's not already a refresh request
        if (response.status === 401) {
          const url = typeof input === 'string' ? input : input.toString();
          if (!url.includes('/auth/refresh')) {
            // Token might be expired, trigger logout
            await logout();
            window.location.href = '/login';
          }
        }
        
        return response;
      } catch (error) {
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
    };
  }, [logout]);
}

/**
 * Hook to cancel API requests on unmount
 * Useful for preventing state updates on unmounted components
 */
export function useCancelApiOnUnmount(requestKeys: string[]) {
  useEffect(() => {
    return () => {
      requestKeys.forEach(key => {
        apiClient.cancelRequest(key);
      });
    };
  }, [requestKeys]);
}
