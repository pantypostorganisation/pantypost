// src/components/ErrorBoundary.tsx
'use client';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, errorInfo: React.ErrorInfo) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  // Enhanced componentDidUpdate to handle prop changes
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        prevProps.resetKeys?.[index] !== key
      );
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error state if any props changed and resetOnPropsChange is true
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error logging with more context
    const errorContext = {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'PantyPost ErrorBoundary'
    };

    console.error('[PantyPost] Uncaught error:', error);
    console.error('[PantyPost] Error context:', errorContext);
    console.error('[PantyPost] Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('[PantyPost] Error in onError handler:', handlerError);
      }
    }

    // Report to error monitoring service (placeholder for future implementation)
    this.reportError(error, errorContext);
  }

  // Enhanced error reporting method
  private reportError = (error: Error, context: any) => {
    try {
      // In production, you would send this to your error monitoring service
      // For now, we'll just log it to localStorage for debugging
      if (typeof window !== 'undefined') {
        const errorLog = {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          context,
          timestamp: new Date().toISOString()
        };

        const existingLogs = JSON.parse(localStorage.getItem('panty_error_logs') || '[]');
        existingLogs.push(errorLog);
        
        // Keep only the last 50 error logs to prevent storage bloat
        const trimmedLogs = existingLogs.slice(-50);
        localStorage.setItem('panty_error_logs', JSON.stringify(trimmedLogs));
      }
    } catch (reportingError) {
      console.error('[PantyPost] Failed to report error:', reportingError);
    }
  };

  // Enhanced reset functionality
  resetErrorBoundary = () => {
    // Clear any pending timeouts
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  // Auto-retry functionality
  private scheduleAutoRetry = (delayMs: number = 5000) => {
    this.resetTimeoutId = window.setTimeout(() => {
      console.log('[PantyPost] Auto-retrying after error...');
      this.resetErrorBoundary();
    }, delayMs);
  };

  // Enhanced cleanup
  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }
  
  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error!, this.state.errorInfo!);
        }
        return this.props.fallback;
      }
      
      // Enhanced default fallback UI
      return (
        <div className="p-8 max-w-md mx-auto bg-[#1a1a1a] border border-red-800 rounded-lg my-8 text-white shadow-lg error-state">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-500">Something went wrong</h2>
            <p className="text-gray-400 text-sm">
              We're sorry, but something unexpected happened. This error has been logged.
            </p>
          </div>
          
          <div className="mb-6 p-4 bg-[#121212] rounded-lg overflow-hidden">
            <details className="cursor-pointer">
              <summary className="text-red-400 font-mono text-sm font-semibold mb-2 hover:text-red-300">
                Error Details {this.state.errorId ? `(${this.state.errorId.slice(-8)})` : ''}
              </summary>
              <p className="text-red-400 font-mono text-xs whitespace-pre-wrap break-words">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              {this.state.error?.stack && process.env.NODE_ENV === 'development' && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <pre className="text-red-500 text-xs whitespace-pre-wrap break-words">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
            </details>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={this.resetErrorBoundary}
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] font-medium transition focus-ring"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition focus-ring"
            >
              Go to Home Page
            </button>

            <button
              onClick={() => {
                this.scheduleAutoRetry(2000);
                // Provide user feedback
                const button = document.activeElement as HTMLButtonElement;
                if (button) {
                  const originalText = button.textContent;
                  button.textContent = 'Auto-retry in 2s...';
                  button.disabled = true;
                  setTimeout(() => {
                    if (button && originalText) {
                      button.textContent = originalText;
                      button.disabled = false;
                    }
                  }, 2000);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm focus-ring"
            >
              Auto-retry in 2 seconds
            </button>
          </div>
          
          {/* Development-only debug info */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <div className="mt-6 p-4 bg-[#121212] rounded-lg">
              <details className="cursor-pointer">
                <summary className="text-gray-400 text-xs mb-2 hover:text-gray-300 font-semibold">
                  Component Stack (Development Only)
                </summary>
                <pre className="text-red-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            </div>
          )}

          {/* Error ID for support reference */}
          {this.state.errorId && (
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-xs">
                Error ID: <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">{this.state.errorId}</code>
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Please include this ID when reporting the issue
              </p>
            </div>
          )}
        </div>
      );
    }

    // Enhanced children safety check
    if (!this.props.children) {
      console.warn('ErrorBoundary: children prop is undefined or null');
      return (
        <div className="p-4 text-center text-gray-500">
          <p className="text-sm">No content to display</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for accessing error boundary context
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
};

// Enhanced error boundary for specific error types
export const AsyncErrorBoundary: React.FC<ErrorBoundaryProps & {
  onRetry?: () => Promise<void>;
  maxRetries?: number;
}> = ({ onRetry, maxRetries = 3, ...props }) => {
  const [retryCount, setRetryCount] = React.useState(0);

  const handleRetry = React.useCallback(async () => {
    if (retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) exceeded`);
      return;
    }

    try {
      setRetryCount(prev => prev + 1);
      if (onRetry) {
        await onRetry();
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }, [onRetry, retryCount, maxRetries]);

  const fallback = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    return (
      <div className="p-6 text-center error-state rounded-lg">
        <h3 className="text-lg font-semibold text-red-400 mb-2">
          Loading Error
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          {error.message}
        </p>
        {retryCount < maxRetries && onRetry && (
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] transition focus-ring"
          >
            Retry ({retryCount + 1}/{maxRetries})
          </button>
        )}
        {retryCount >= maxRetries && (
          <p className="text-red-400 text-sm">
            Maximum retry attempts reached. Please refresh the page.
          </p>
        )}
      </div>
    );
  }, [handleRetry, retryCount, maxRetries, onRetry]);

  return <ErrorBoundary {...props} fallback={fallback} />;
};