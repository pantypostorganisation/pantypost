// src/components/AppInitializationProvider.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
  useCallback,
} from 'react';

interface HealthStatus {
  wallet_service: boolean;
  storage_service: boolean;
  auth_service: boolean;
  websocket_service: boolean;
  [key: string]: boolean | undefined;
}

interface AppInitializationContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  healthStatus: HealthStatus | null;
  error: Error | null;
  warnings: string[];
  reinitialize: () => Promise<void>;
}

const AppInitializationContext = createContext<AppInitializationContextType | undefined>(undefined);

// ---------- Helpers ----------
const DEFAULT_BASE = 'http://localhost:5000';
const DEFAULT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 10000);

function normalizeBaseUrl(url?: string | null) {
  const s = (url ?? '').trim();
  if (!s) return DEFAULT_BASE;
  return s.replace(/\/+$/, ''); // strip trailing slash(es)
}

/**
 * Build the health URL robustly regardless of whether the env contains '/api' already.
 * Priority: NEXT_PUBLIC_API_URL (kept for backward-compat), then NEXT_PUBLIC_API_BASE_URL.
 */
function buildHealthUrl() {
  const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
  const rawApiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim();

  // Prefer API_URL if provided; otherwise fallback to API_BASE_URL; otherwise default.
  const base = normalizeBaseUrl(rawApiUrl || rawApiBase || DEFAULT_BASE);

  // If base already ends with '/api', just add '/health'; otherwise add '/api/health'.
  if (base.toLowerCase().endsWith('/api')) {
    return `${base}/health`;
  }
  return `${base}/api/health`;
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), Math.max(3000, timeoutMs)); // minimum 3s
  try {
    const res = await fetch(input, { ...init, signal: controller.signal, credentials: 'omit', mode: 'cors' });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Loading component
function InitializationLoader(): React.ReactElement {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-400">Initializing PantyPost...</p>
        <p className="text-xs text-gray-600 mt-2">Connecting to server...</p>
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
        <h1 className="text-2xl font-bold mb-2">Connection Error</h1>
        <p className="text-gray-400 mb-4">{error.message || 'Failed to connect to the server'}</p>
        <button onClick={onRetry} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Retry Connection
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
  const hasInitializedRef = useRef(false);

  const initializeApp = useCallback(async () => {
    // Use cached session state if available and we haven't initialized in-memory yet
    if (typeof window !== 'undefined') {
      const sessionInit = sessionStorage.getItem('app_initialized');
      const sessionHealth = sessionStorage.getItem('app_health_status');

      if (sessionInit === 'true' && !hasInitializedRef.current) {
        console.log('[AppInitializer] Using cached initialization state');
        setIsInitialized(true);
        setIsInitializing(false);

        if (sessionHealth) {
          try {
            setHealthStatus(JSON.parse(sessionHealth));
          } catch (e) {
            console.error('[AppInitializer] Failed to parse cached health status:', e);
          }
        }

        hasInitializedRef.current = true;
        return;
      }
    }

    // Prevent duplicate concurrent inits
    if (hasInitializedRef.current) {
      console.log('[AppInitializer] Initialization already in-flight; skipping duplicate call');
      return;
    }

    hasInitializedRef.current = true;
    setIsInitializing(true);
    setError(null);
    setWarnings([]);

    try {
      const healthUrl = buildHealthUrl();
      console.log('[AppInitializer] Checking API health at:', healthUrl);

      const res = await fetchWithTimeout(
        healthUrl,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
        DEFAULT_TIMEOUT_MS
      ).catch((err) => {
        console.error('[AppInitializer] Health check fetch failed:', err);
        throw new Error('Cannot connect to backend server. Please ensure the API is running.');
      });

      if (!res || !res.ok) {
        const statusText = res ? `${res.status} ${res.statusText}` : 'no response';
        throw new Error(`Backend server is not responding correctly (${statusText})`);
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error('Backend server is not responding correctly (invalid JSON)');
      }

      console.log('[AppInitializer] API health check response:', data);

      // Accept either data.services or data.features as service map
      const services = (data?.services ?? data?.features ?? {}) as Record<string, any>;

      const health: HealthStatus = {
        wallet_service: services.wallet ?? true,
        storage_service: services.storage ?? true,
        auth_service: services.auth ?? true,
        websocket_service: services.websocket ?? true,
        // keep any extra flags the backend may add:
        ...Object.fromEntries(Object.entries(services).map(([k, v]) => [k, Boolean(v)])),
      };

      setHealthStatus(health);
      setIsInitialized(true);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('app_initialized', 'true');
        sessionStorage.setItem('app_health_status', JSON.stringify(health));
      }

      console.log('[AppInitializer] Initialization complete:', { initialized: true, health });
    } catch (err) {
      console.error('[AppInitializer] Initialization failed:', err);
      setError(err instanceof Error ? err : new Error('Initialization failed'));
      setIsInitialized(false);
      hasInitializedRef.current = false;

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('app_initialized');
        sessionStorage.removeItem('app_health_status');
      }
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    void initializeApp();
  }, [initializeApp]);

  const reinitialize = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('app_initialized');
      sessionStorage.removeItem('app_health_status');
    }
    hasInitializedRef.current = false;
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
        reinitialize,
      }}
    >
      {children}
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
