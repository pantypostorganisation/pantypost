// src/components/AppInitializationProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import type { InitializationResult } from '@/services/app-initializer';

interface HealthStatus {
  wallet_service: boolean;
  storage_service: boolean;
  auth_service: boolean;
  mock_api?: boolean;
  [key: string]: boolean | undefined;
}

interface AppInitializationContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  healthStatus: HealthStatus | null;
  error: Error | null;
  warnings: string[];
  mockApiEnabled: boolean;
  mockScenario?: string;
  reinitialize: () => Promise<void>;
}

const AppInitializationContext = createContext<AppInitializationContextType | undefined>(undefined);

// Loading component
function InitializationLoader(): React.ReactElement {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Initializing PantyPost...</p>
        <p className="text-xs text-gray-600 mt-2">Setting up services...</p>
      </div>
    </div>
  );
}

// Error component
function InitializationError({ error, onRetry }: { error: Error; onRetry: () => void }): React.ReactElement {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Initialization Error</h1>
        <p className="text-gray-400 mb-4">{error.message || 'Failed to initialize the application'}</p>
        <button onClick={onRetry} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Retry
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-300">Technical details</summary>
            <pre className="mt-2 text-xs bg-black/50 p-3 rounded overflow-auto max-h-48">{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function AppInitializationProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [mockApiEnabled, setMockApiEnabled] = useState(false);
  const [mockScenario, setMockScenario] = useState<string | undefined>();
  const hasInitializedRef = useRef(false);

  const initializeApp = async () => {
    // Check if already initialized in this session
    if (typeof window !== 'undefined') {
      const sessionInit = sessionStorage.getItem('app_initialized');
      const sessionHealth = sessionStorage.getItem('app_health_status');
      const sessionMockEnabled = sessionStorage.getItem('app_mock_enabled');
      const sessionMockScenario = sessionStorage.getItem('app_mock_scenario');

      if (sessionInit === 'true' && !hasInitializedRef.current) {
        console.log('[AppInitializer] Already initialized in this session, using cached state');

        setIsInitialized(true);
        setIsInitializing(false);
        setMockApiEnabled(sessionMockEnabled === 'true');
        setMockScenario(sessionMockScenario || undefined);

        if (sessionHealth) {
          try {
            setHealthStatus(JSON.parse(sessionHealth));
          } catch (e) {
            console.error('Failed to parse cached health status:', e);
          }
        }

        hasInitializedRef.current = true;
        return;
      }
    }

    // Prevent multiple simultaneous initializations
    if (hasInitializedRef.current) {
      console.log('[AppInitializer] Already initializing, skipping duplicate call');
      return;
    }

    hasInitializedRef.current = true;
    setIsInitializing(true);
    setError(null);
    setWarnings([]);

    try {
      // Import and initialize dynamically to avoid circular dependencies
      const { appInitializer } = await import('@/services/app-initializer');
      const result: InitializationResult = await appInitializer.initialize();

      // Get app status including mock API info
      const status = appInitializer.getStatus();
      setMockApiEnabled(status.mockApiEnabled);
      setMockScenario(status.mockScenario);

      // Check health status
      const health: HealthStatus = {
        wallet_service: true,
        storage_service: true,
        auth_service: true,
        mock_api: status.mockApiEnabled,
      };

      // Update health based on any errors
      if (result && !result.success && result.errors) {
        result.errors.forEach((err: string) => {
          if (err.includes('wallet') || err.includes('Wallet')) health.wallet_service = false;
          if (err.includes('storage') || err.includes('Storage')) health.storage_service = false;
          if (err.includes('auth') || err.includes('Auth')) health.auth_service = false;
          if (err.includes('mock') || err.includes('Mock')) health.mock_api = false;
        });
      }

      // Set warnings
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);

        if (process.env.NODE_ENV === 'development') {
          console.warn('Initialization warnings:', result.warnings);
        }
      }

      setHealthStatus(health);
      setIsInitialized(!!result?.success);

      // Cache initialization state in session storage
      if (typeof window !== 'undefined' && result?.success) {
        sessionStorage.setItem('app_initialized', 'true');
        sessionStorage.setItem('app_health_status', JSON.stringify(health));
        sessionStorage.setItem('app_mock_enabled', status.mockApiEnabled.toString());
        sessionStorage.setItem('app_mock_scenario', status.mockScenario || '');
      }

      // If initialization failed with errors, throw to show error UI
      if (!result.success && result.errors.length > 0) {
        throw new Error(result.errors[0]);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('App initialization complete:', {
          initialized: result.success,
          mockApiEnabled: status.mockApiEnabled,
          mockScenario: status.mockScenario,
          health,
          warnings: result.warnings,
        });
      }
    } catch (err) {
      console.error('App initialization failed:', err);
      setError(err instanceof Error ? err : new Error('Initialization failed'));
      setIsInitialized(false);
      hasInitializedRef.current = false;

      // Clear cached state on error
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('app_initialized');
        sessionStorage.removeItem('app_health_status');
        sessionStorage.removeItem('app_mock_enabled');
        sessionStorage.removeItem('app_mock_scenario');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    void initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reinitialize = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('app_initialized');
      sessionStorage.removeItem('app_health_status');
      sessionStorage.removeItem('app_mock_enabled');
      sessionStorage.removeItem('app_mock_scenario');
    }

    hasInitializedRef.current = false;

    try {
      const { appInitializer } = await import('@/services/app-initializer');
      appInitializer.reset();
    } catch (err) {
      console.error('Failed to reset app initializer:', err);
    }

    await initializeApp();
  };

  if (error && !isInitializing) {
    return (
      <AppInitializationContext.Provider
        value={{
          isInitialized,
          isInitializing,
          healthStatus,
          error,
          warnings,
          mockApiEnabled,
          mockScenario,
          reinitialize,
        }}
      >
        <InitializationError error={error} onRetry={reinitialize} />
      </AppInitializationContext.Provider>
    );
  }

  if (isInitializing && !isInitialized) {
    return (
      <AppInitializationContext.Provider
        value={{
          isInitialized,
          isInitializing,
          healthStatus,
          error,
          warnings,
          mockApiEnabled,
          mockScenario,
          reinitialize,
        }}
      >
        <InitializationLoader />
      </AppInitializationContext.Provider>
    );
  }

  if (process.env.NODE_ENV === 'development' && warnings.length > 0 && isInitialized) {
    console.warn('🚧 Initialization completed with warnings:', warnings);
  }

  return (
    <AppInitializationContext.Provider
      value={{
        isInitialized,
        isInitializing,
        healthStatus,
        error,
        warnings,
        mockApiEnabled,
        mockScenario,
        reinitialize,
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' &&
        mockApiEnabled && (
          <div className="fixed top-4 right-4 z-50 bg-purple-600/20 text-purple-300 px-3 py-1 rounded-md text-xs backdrop-blur-sm">
            🎭 Mock API: {mockScenario}
          </div>
        )}
    </AppInitializationContext.Provider>
  );
}

export function useAppInitialization(): AppInitializationContextType {
  const context = useContext(AppInitializationContext);
  if (!context) {
    throw new Error('useAppInitialization must be used within AppInitializationProvider');
  }
  return context;
}
