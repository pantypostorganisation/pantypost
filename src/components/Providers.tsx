// src/components/Providers.tsx
'use client';

import React, { Component, ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { BanProvider } from '@/context/BanContext';
import { WalletProvider } from '@/context/WalletContext';
import { ListingProvider } from '@/context/ListingContext';
import { MessageProvider } from '@/context/MessageContext';
import { ReviewProvider } from '@/context/ReviewContext';
import { RequestProvider } from '@/context/RequestContext';
import { LoadingProvider } from '@/context/LoadingContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { AppInitializationProvider } from './AppInitializationProvider';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Financial Error Boundary component
interface FinancialErrorBoundaryProps {
  children: ReactNode;
}

interface FinancialErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  isFinancialError: boolean;
}

class FinancialErrorBoundary extends Component<FinancialErrorBoundaryProps, FinancialErrorBoundaryState> {
  constructor(props: FinancialErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isFinancialError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<FinancialErrorBoundaryState> {
    // Sanitize error message to prevent XSS
    const sanitizedMessage = sanitizeStrict(error.message || 'Unknown error');
    
    const isFinancialError = 
      sanitizedMessage.toLowerCase().includes('wallet') ||
      sanitizedMessage.toLowerCase().includes('balance') ||
      sanitizedMessage.toLowerCase().includes('payment') ||
      sanitizedMessage.toLowerCase().includes('transaction');

    // Create sanitized error object
    const sanitizedError = new Error(sanitizedMessage);
    sanitizedError.name = sanitizeStrict(error.name || 'Error');

    return {
      hasError: true,
      error: sanitizedError,
      isFinancialError
    };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    // Log full error details only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Financial Error Boundary caught:', error, errorInfo);
    } else {
      // In production, log sanitized version
      console.error('Application error occurred');
    }
    
    if (process.env.NODE_ENV === 'production') {
      // Send sanitized error to monitoring service
      // Example: Sentry.captureException(error, { 
      //   contexts: { 
      //     react: { 
      //       componentStack: errorInfo.componentStack 
      //     } 
      //   },
      //   // Sanitize any user data before sending
      //   sanitizeKeys: ['user', 'email', 'password']
      // });
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
    
    if (this.state.isFinancialError) {
      // Clear any potentially corrupted data before reload
      try {
        sessionStorage.clear();
      } catch (e) {
        // Ignore storage errors
      }
      window.location.reload();
    }
  };

  override render() {
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
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
                    Error details (dev only)
                  </summary>
                  <div className="mt-2 p-3 bg-black/50 rounded-lg overflow-auto">
                    <p className="text-xs text-gray-400 font-mono break-all">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">
                        {sanitizeStrict(this.state.error.stack)}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        );
      }

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
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-600">
                  Error details (dev only)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-600 overflow-auto">
                  <p className="font-mono break-all">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced Providers with proper initialization order
 * 
 * Order matters:
 * 1. AppInitialization - Must be first to ensure services are ready
 * 2. Auth - Many other providers depend on user state
 * 3. Toast - Used by other providers for notifications
 * 4. Ban - Needs auth but used by many components
 * 5. WebSocket - Needs auth for connection but provides real-time features to others
 * 6. Wallet - Depends on auth and initialization
 * 7. Favorites - Depends on auth, placed after wallet for consistency
 * 8. Listing - Depends on auth and wallet
 * 9. Others - Depend on the above
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppInitializationProvider>
      <AuthProvider>
        <ToastProvider>
          <BanProvider>
            <WebSocketProvider>
              <FinancialErrorBoundary>
                <WalletProvider>
                  <FavoritesProvider>
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
                  </FavoritesProvider>
                </WalletProvider>
              </FinancialErrorBoundary>
            </WebSocketProvider>
          </BanProvider>
        </ToastProvider>
      </AuthProvider>
    </AppInitializationProvider>
  );
}

// Default export for layout.tsx
export default Providers;
