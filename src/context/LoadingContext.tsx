// src/context/LoadingContext.tsx a
'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface LoadingContextType {
  // Global loading state
  globalLoading: LoadingState;
  setGlobalLoading: (loading: boolean, message?: string, progress?: number) => void;
  
  // Named loading states (for specific features)
  loadingStates: Map<string, LoadingState>;
  setLoading: (key: string, loading: boolean, message?: string, progress?: number) => void;
  isLoading: (key: string) => boolean;
  
  // Utilities
  withLoading: <T>(
    key: string,
    fn: () => Promise<T>,
    message?: string
  ) => Promise<T>;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [globalLoading, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false,
  });
  
  const [loadingStates] = useState<Map<string, LoadingState>>(new Map());
  const [, forceUpdate] = useState({});
  const loadingCountRef = useRef<Map<string, number>>(new Map());

  // Set global loading
  const setGlobalLoading = useCallback((
    isLoading: boolean,
    message?: string,
    progress?: number
  ) => {
    setGlobalLoadingState({ isLoading, message, progress });
  }, []);

  // Set named loading state
  const setLoading = useCallback((
    key: string,
    isLoading: boolean,
    message?: string,
    progress?: number
  ) => {
    if (isLoading) {
      // Increment loading count for this key
      const currentCount = loadingCountRef.current.get(key) || 0;
      loadingCountRef.current.set(key, currentCount + 1);
      
      loadingStates.set(key, { isLoading: true, message, progress });
    } else {
      // Decrement loading count
      const currentCount = loadingCountRef.current.get(key) || 0;
      const newCount = Math.max(0, currentCount - 1);
      
      if (newCount === 0) {
        loadingStates.delete(key);
        loadingCountRef.current.delete(key);
      } else {
        loadingCountRef.current.set(key, newCount);
      }
    }
    
    forceUpdate({});
  }, [loadingStates]);

  // Check if specific key is loading
  const isLoading = useCallback((key: string): boolean => {
    return loadingStates.has(key);
  }, [loadingStates]);

  // Execute function with loading state
  const withLoading = useCallback(async <T,>(
    key: string,
    fn: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    setLoading(key, true, message);
    try {
      return await fn();
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    loadingStates.clear();
    loadingCountRef.current.clear();
    setGlobalLoadingState({ isLoading: false });
    forceUpdate({});
  }, [loadingStates]);

  const value: LoadingContextType = {
    globalLoading,
    setGlobalLoading,
    loadingStates,
    setLoading,
    isLoading,
    withLoading,
    clearAllLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {globalLoading.isLoading && <GlobalLoadingOverlay {...globalLoading} />}
    </LoadingContext.Provider>
  );
}

// Global Loading Overlay Component
function GlobalLoadingOverlay({ message, progress }: LoadingState) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#ff950e] animate-spin" />
          
          {message && (
            <p className="text-white text-sm font-medium">{message}</p>
          )}
          
          {progress !== undefined && (
            <div className="w-48">
              <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#ff950e] h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-1 text-center">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to use loading
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

// Loading Spinner Component
export function LoadingSpinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={`animate-spin text-[#ff950e] ${sizeClasses[size]} ${className}`} />
  );
}

// Loading Button Component
export function LoadingButton({
  isLoading,
  children,
  loadingText,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading: boolean;
  loadingText?: string;
}) {
  return (
    <button
      disabled={isLoading}
      className={`relative ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" />
          {loadingText || 'Loading...'}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
