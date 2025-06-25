// src/components/Providers.enhanced.tsx
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { BanProvider } from '@/context/BanContext';
import { WalletProvider } from '@/context/WalletContext';
import { ListingProvider } from '@/context/ListingContext';
import { MessageProvider } from '@/context/MessageContext';
import { ReviewProvider } from '@/context/ReviewContext';
import { RequestProvider } from '@/context/RequestContext';
import { LoadingProvider } from '@/context/LoadingContext';
import { AppInitializationProvider } from './AppInitializationProvider';
import { FinancialErrorBoundary } from './FinancialErrorBoundary';

/**
 * Enhanced Providers with proper initialization order
 * 
 * Order matters:
 * 1. AppInitialization - Must be first to ensure services are ready
 * 2. Auth - Many other providers depend on user state
 * 3. Toast - Used by other providers for notifications
 * 4. Ban - Needs auth but used by many components
 * 5. Wallet - Depends on auth and initialization
 * 6. Listing - Depends on auth and wallet
 * 7. Others - Depend on the above
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppInitializationProvider>
      <AuthProvider>
        <ToastProvider>
          <BanProvider>
            <FinancialErrorBoundary>
              <WalletProvider>
                <ListingProvider>
                  <MessageProvider>
                    <ReviewProvider>
                      <RequestProvider>
                        <LoadingProvider>
                          {children}
                        </LoadingProvider>
                      </RequestProvider>
                    </ReviewProvider>
                  </MessageProvider>
                </ListingProvider>
              </WalletProvider>
            </FinancialErrorBoundary>
          </BanProvider>
        </ToastProvider>
      </AuthProvider>
    </AppInitializationProvider>
  );
}

// src/components/FinancialErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  isFinancialError: boolean;
}

/**
 * Error boundary specifically for financial operations
 * Provides enhanced error handling for wallet-related failures
 */
export class FinancialErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isFinancialError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a financial error
    const isFinancialError = 
      error.message.toLowerCase().includes('wallet') ||
      error.message.toLowerCase().includes('balance') ||
      error.message.toLowerCase().includes('payment') ||
      error.message.toLowerCase().includes('transaction') ||
      error.stack?.includes('wallet') ||
      error.stack?.includes('WalletContext');

    return {
      hasError: true,
      error,
      isFinancialError
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error reporting service
    console.error('Financial Error Boundary caught:', error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isFinancialError: false
    });
    
    // Optionally reload the page for financial errors
    if (this.state.isFinancialError) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isFinancialError) {
        return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center">
              <div className="bg-red-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                Financial System Error
              </h1>
              <p className="text-gray-400 mb-6">
                We encountered an error with the wallet system. Your funds are safe, but we need to refresh the page.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full bg-purple-600 text-white rounded-lg py-3 font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh Page
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-800 text-white rounded-lg py-3 font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Go to Homepage
                </button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
                    Error details (dev only)
                  </summary>
                  <pre className="mt-2 p-3 bg-black/50 rounded-lg text-xs text-gray-400 overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Non-financial error - use simpler UI
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg p-8 text-center shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={this.handleReset}
              className="bg-purple-600 text-white rounded-lg px-6 py-2 font-semibold hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/hooks/useWalletHealth.ts
'use client';

import { useEffect, useState } from 'react';
import { useAppInitialization } from '@/components/AppInitializationProvider';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to monitor wallet health and initialization status
 */
export function useWalletHealth() {
  const { isInitialized, healthStatus } = useAppInitialization();
  const { reconcileBalance } = useWallet();
  const { user } = useAuth();
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    if (!isInitialized || !user) return;

    const checkHealth = async () => {
      try {
        // Check wallet service health
        const walletHealthy = healthStatus?.wallet_service ?? false;
        
        // Perform reconciliation check
        if (user.role === 'buyer' || user.role === 'seller') {
          const reconciliation = await reconcileBalance(user.username, user.role);
          const isReconciled = reconciliation.isReconciled;
          
          setIsHealthy(walletHealthy && isReconciled);
        } else {
          setIsHealthy(walletHealthy);
        }
        
        setLastCheck(new Date());
      } catch (error) {
        console.error('Wallet health check failed:', error);
        setIsHealthy(false);
      }
    };

    // Check immediately
    checkHealth();

    // Check every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isInitialized, user, healthStatus, reconcileBalance]);

  return {
    isHealthy,
    lastCheck,
    healthStatus: healthStatus?.wallet_service ?? false
  };
}
