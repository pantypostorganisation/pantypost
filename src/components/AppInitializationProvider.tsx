// src/components/AppInitializationProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { appInitializer, InitializationResult } from '@/services/app-initializer';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

interface AppInitializationContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  initResult: InitializationResult | null;
  hasErrors: boolean;
  retry: () => Promise<void>;
  healthStatus: Record<string, boolean> | null;
}

const AppInitializationContext = createContext<AppInitializationContextType | undefined>(undefined);

/**
 * App Initialization Provider
 * Handles critical app initialization with proper error handling and loading states
 */
export function AppInitializationProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initResult, setInitResult] = useState<InitializationResult | null>(null);
  const [healthStatus, setHealthStatus] = useState<Record<string, boolean> | null>(null);
  const [showError, setShowError] = useState(false);

  const initialize = async () => {
    setIsInitializing(true);
    setShowError(false);

    try {
      const result = await appInitializer.initialize();
      setInitResult(result);
      
      // Check if we have critical errors
      const hasCriticalErrors = result.errors.some(e => e.step !== 'wallet_migration');
      
      if (hasCriticalErrors) {
        setShowError(true);
        console.error('[AppInit] Critical initialization errors detected');
      } else {
        setIsInitialized(true);
        
        // Perform health checks after initialization
        const health = await appInitializer.performHealthChecks();
        setHealthStatus(health);
      }
    } catch (error) {
      console.error('[AppInit] Unexpected initialization error:', error);
      setShowError(true);
      setInitResult({
        success: false,
        errors: [{ step: 'unknown', error: error as Error }],
        warnings: [],
        timings: {}
      });
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const retry = async () => {
    await appInitializer.reset();
    await initialize();
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <AppInitializationLoading />
    );
  }

  // Show error screen for critical failures
  if (showError && initResult?.errors.length) {
    return (
      <AppInitializationError 
        errors={initResult.errors} 
        onRetry={retry}
      />
    );
  }

  // Render app with initialization context
  return (
    <AppInitializationContext.Provider
      value={{
        isInitialized,
        isInitializing,
        initResult,
        hasErrors: showError,
        retry,
        healthStatus
      }}
    >
      {/* Show warnings banner if any non-critical issues */}
      {initResult?.warnings.length ? (
        <AppInitializationWarnings warnings={initResult.warnings} />
      ) : null}
      
      {children}
    </AppInitializationContext.Provider>
  );
}

/**
 * Hook to access initialization status
 */
export function useAppInitialization() {
  const context = useContext(AppInitializationContext);
  if (!context) {
    throw new Error('useAppInitialization must be used within AppInitializationProvider');
  }
  return context;
}

/**
 * Loading component shown during initialization
 */
function AppInitializationLoading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-xl opacity-50 animate-pulse" />
          
          {/* Logo/Icon */}
          <div className="relative bg-black rounded-full p-8 mb-6">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Initializing PantyPost
        </h2>
        <p className="text-gray-400">
          Setting up your marketplace experience...
        </p>
        
        {/* Progress indicator */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error component for critical initialization failures
 */
function AppInitializationError({ 
  errors, 
  onRetry 
}: { 
  errors: Array<{ step: string; error: Error }>;
  onRetry: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 text-center">
        <div className="bg-red-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Initialization Failed
        </h2>
        <p className="text-gray-400 mb-6">
          We couldn't set up some critical services. Please try again.
        </p>
        
        {/* Error details (collapsible in production) */}
        <details className="text-left mb-6">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">
            Technical details
          </summary>
          <div className="mt-2 p-3 bg-black/50 rounded-lg text-xs text-gray-400 space-y-1">
            {errors.map((error, index) => (
              <div key={index}>
                <span className="text-red-400">{error.step}:</span> {error.error.message}
              </div>
            ))}
          </div>
        </details>
        
        <button
          onClick={onRetry}
          className="w-full bg-purple-600 text-white rounded-lg py-3 font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
        
        <p className="mt-4 text-xs text-gray-500">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

/**
 * Warnings banner for non-critical issues
 */
function AppInitializationWarnings({ 
  warnings 
}: { 
  warnings: Array<{ step: string; message: string }> 
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-900/20 border-b border-yellow-900/50 px-4 py-2 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-yellow-400">
          <AlertTriangle className="w-4 h-4" />
          <span>Some features may be limited. {warnings[0].message}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-400 hover:text-yellow-300"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * CSS for shimmer animation
 * Add this to your global CSS or Tailwind config
 */
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;