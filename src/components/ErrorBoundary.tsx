// src/components/ErrorBoundary.tsx
'use client';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to your preferred error reporting service
    console.error('[PantyPost] Uncaught error:', error);
    console.error('[PantyPost] Component stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }
  
  handleTryAgain = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
  }
  
  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-8 max-w-md mx-auto bg-[#1a1a1a] border border-red-800 rounded-lg my-8 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong</h2>
          
          <div className="mb-4 p-4 bg-[#121212] rounded-lg overflow-hidden">
            <p className="text-red-400 font-mono text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={this.handleTryAgain}
              className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#e88800] font-medium transition"
            >
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition"
            >
              Go to Home Page
            </button>
          </div>
          
          {/* For development debugging only - remove in production */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <div className="mt-6 p-4 bg-[#121212] rounded-lg">
              <p className="text-gray-400 text-xs mb-2">Component Stack Error:</p>
              <pre className="text-red-400 font-mono text-xs overflow-x-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    // ✅ FIXED: Ensure children is not undefined or null
    if (!this.props.children) {
      console.warn('ErrorBoundary: children prop is undefined or null');
      return null;
    }

    return this.props.children;
  }
}