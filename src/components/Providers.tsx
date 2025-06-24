// src/components/Providers.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ListingProvider } from '@/context/ListingContext';
import { MessageProvider } from '@/context/MessageContext';
import { RequestProvider } from '@/context/RequestContext';
import { BanProvider } from '@/context/BanContext';
import { WalletProvider } from '@/context/WalletContext';
import { ReviewProvider } from '@/context/ReviewContext';
import { apiClient, API_BASE_URL, FEATURES } from '@/services/api.config';

/**
 * Hook to set up API interceptors for automatic auth handling
 * This is embedded here to avoid creating a new file
 */
function useApiInterceptor() {
  const { logout } = useAuth();

  useEffect(() => {
    // Only set up interceptor if we're using API auth
    if (!FEATURES.USE_API_AUTH) return;

    // Store original fetch
    const originalFetch = window.fetch;

    // Create intercepted fetch
    const interceptedFetch: typeof fetch = async (input, init) => {
      try {
        const response = await originalFetch(input, init);
        
        // If we get a 401 and it's not already a refresh request
        if (response.status === 401 && API_BASE_URL) {
          const url = typeof input === 'string' ? input : input.toString();
          if (!url.includes('/auth/refresh') && url.startsWith(API_BASE_URL)) {
            // Token might be expired, trigger logout
            await logout();
            // Use window.location to ensure clean redirect
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
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
      if (apiClient && apiClient.cancelAllRequests) {
        apiClient.cancelAllRequests();
      }
    };
  }, [logout]);
}

// Component to set up API interceptor after auth is available
function ApiInterceptorSetup({ children }: { children: ReactNode }) {
  useApiInterceptor();
  return <>{children}</>;
}

/**
 * Root provider component that wraps the entire app with necessary contexts
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ApiInterceptorSetup>
        <BanProvider>
          <ListingProvider>
            <WalletProvider>
              <MessageProvider>
                <RequestProvider>
                  <ReviewProvider>
                    {children}
                  </ReviewProvider>
                </RequestProvider>
              </MessageProvider>
            </WalletProvider>
          </ListingProvider>
        </BanProvider>
      </ApiInterceptorSetup>
    </AuthProvider>
  );
}
