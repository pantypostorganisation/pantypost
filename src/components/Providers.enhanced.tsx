// src/components/Providers.enhanced.tsx
'use client';

import { ReactNode, useEffect, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ListingProvider } from '@/context/ListingContext';
import { MessageProvider } from '@/context/MessageContext';
import { RequestProvider } from '@/context/RequestContext';
import { BanProvider } from '@/context/BanContext';
import { WalletProvider } from '@/context/WalletContext';
import { ReviewProvider } from '@/context/ReviewContext';
import { ToastProvider, useToast } from '@/context/ToastContext';
import { LoadingProvider, LoadingSpinner, useLoading } from '@/context/LoadingContext';
import { NetworkStatusProvider, useNetworkStatus } from '@/hooks/useNetworkStatus';
import { ErrorBoundary, AsyncErrorBoundary } from '@/components/ErrorBoundary';
import { apiClient, API_BASE_URL, FEATURES } from '@/services/api.config';
import { useErrorHandler } from '@/utils/errorHandling';
import { ErrorFallback } from '@/components/ui/ErrorFallback';

/**
 * Loading fallback for suspense boundaries
 */
function SuspenseLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-gray-400 mt-4">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Hook to set up API interceptors for automatic auth handling
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
 * Core providers that are needed for error handling
 */
function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LoadingProvider>
          <NetworkStatusProvider>
            {children}
          </NetworkStatusProvider>
        </LoadingProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

/**
 * Auth-dependent providers
 */
function AuthDependentProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ApiInterceptorSetup>
        <BanProvider>
          <AsyncErrorBoundary
            fallback={
              <div className="p-8 text-center">
                <p className="text-red-400">Failed to load application data</p>
              </div>
            }
            maxRetries={3}
          >
            <Suspense fallback={<SuspenseLoading />}>
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
            </Suspense>
          </AsyncErrorBoundary>
        </BanProvider>
      </ApiInterceptorSetup>
    </AuthProvider>
  );
}

/**
 * Root provider component that wraps the entire app with necessary contexts
 * Now includes error handling and loading state management
 */
export default function EnhancedProviders({ children }: { children: ReactNode }) {
  return (
    <CoreProviders>
      <AuthDependentProviders>
        {children}
      </AuthDependentProviders>
    </CoreProviders>
  );
}

// Export a hook to access all error/loading utilities
export function useAppState() {
  const { user, isAuthReady } = useAuth();
  const loading = useLoading();
  const network = useNetworkStatus();
  const toast = useToast();
  const errorHandler = useErrorHandler();

  return {
    // Auth
    user,
    isAuthReady,
    
    // Loading
    setGlobalLoading: loading.setGlobalLoading,
    setLoading: loading.setLoading,
    isLoading: loading.isLoading,
    withLoading: loading.withLoading,
    
    // Network
    isOnline: network.isOnline,
    isSlowConnection: network.isSlowConnection,
    checkConnectivity: network.checkConnectivity,
    
    // Toast
    showToast: toast.showToast,
    success: toast.success,
    error: toast.error,
    info: toast.info,
    warning: toast.warning,
    
    // Error handling
    handleError: errorHandler.handleError,
    executeWithErrorHandling: errorHandler.executeWithErrorHandling,
  };
}
