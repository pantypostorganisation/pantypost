// src/hooks/useNetworkStatus.tsx
'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { useToast } from '@/context/ToastContext';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

interface NetworkStatusContextType extends NetworkStatus {
  checkConnectivity: () => Promise<boolean>;
  retryFailedRequest: <T>(fn: () => Promise<T>, maxRetries?: number) => Promise<T>;
}

// TypeScript definition for Network Information API
interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

// Network quality thresholds
const SLOW_CONNECTION_THRESHOLD = {
  rtt: 400, // Round trip time in ms
  downlink: 1, // Mbps
  effectiveType: ['slow-2g', '2g'],
};

// Rate limiting for connectivity checks
const CONNECTIVITY_CHECK_COOLDOWN = 5000; // 5 seconds
const MAX_RETRIES = 3;
const MAX_RETRY_DELAY = 10000; // 10 seconds

// Whitelisted URLs for connectivity checks
const CONNECTIVITY_CHECK_URLS = {
  primary: '/api/health',
  fallback: 'https://www.google.com/favicon.ico'
} as const;

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const lastConnectivityCheck = useRef<number>(0);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  });
  
  const [wasOffline, setWasOffline] = useState(false);

  // Get connection info with type safety
  const getConnectionInfo = useCallback((): NetworkInformation | null => {
    if (typeof navigator === 'undefined') return null;
    
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (!connection) return null;
    
    // Validate and sanitize connection data
    return {
      type: connection.type ? sanitizeStrict(connection.type) : undefined,
      effectiveType: connection.effectiveType ? sanitizeStrict(connection.effectiveType) : undefined,
      downlink: typeof connection.downlink === 'number' && connection.downlink >= 0 ? connection.downlink : undefined,
      rtt: typeof connection.rtt === 'number' && connection.rtt >= 0 ? connection.rtt : undefined,
      saveData: Boolean(connection.saveData),
    };
  }, []);

  // Check if connection is slow with validation
  const isSlowConnection = useCallback((info: NetworkInformation | null): boolean => {
    if (!info) return false;
    
    const { rtt, downlink, effectiveType } = info;
    
    return (
      (typeof rtt === 'number' && rtt > SLOW_CONNECTION_THRESHOLD.rtt) ||
      (typeof downlink === 'number' && downlink < SLOW_CONNECTION_THRESHOLD.downlink) ||
      (typeof effectiveType === 'string' && SLOW_CONNECTION_THRESHOLD.effectiveType.includes(effectiveType))
    );
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const connectionInfo = getConnectionInfo();
    const slow = isSlowConnection(connectionInfo);
    
    setNetworkStatus({
      isOnline,
      isSlowConnection: slow,
      connectionType: connectionInfo?.type || null,
      effectiveType: connectionInfo?.effectiveType || null,
      downlink: typeof connectionInfo?.downlink === 'number' ? connectionInfo.downlink : null,
      rtt: typeof connectionInfo?.rtt === 'number' ? connectionInfo.rtt : null,
      saveData: connectionInfo?.saveData || false,
    });
    
    return { isOnline, isSlowConnection: slow };
  }, [getConnectionInfo, isSlowConnection]);

  // Check connectivity with rate limiting
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    // Rate limit connectivity checks
    const now = Date.now();
    if (now - lastConnectivityCheck.current < CONNECTIVITY_CHECK_COOLDOWN) {
      // Return current online status without making a new request
      return networkStatus.isOnline;
    }
    lastConnectivityCheck.current = now;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        // Try primary endpoint first
        const response = await fetch(CONNECTIVITY_CHECK_URLS.primary, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch (primaryError) {
        // Try fallback endpoint
        try {
          const fallbackResponse = await fetch(CONNECTIVITY_CHECK_URLS.fallback, {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          // no-cors mode doesn't give us response details, so we assume success
          return true;
        } catch {
          clearTimeout(timeoutId);
          return false;
        }
      }
    } catch {
      return false;
    }
  }, [networkStatus.isOnline]);

  // Retry failed request with exponential backoff and validation
  const retryFailedRequest = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxRetries = MAX_RETRIES
  ): Promise<T> => {
    // Validate maxRetries
    const validatedMaxRetries = Math.min(Math.max(1, maxRetries), 5);
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < validatedMaxRetries; attempt++) {
      try {
        // Check if we're online before attempting
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new Error('No internet connection');
        }
        
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Sanitize error message
        const errorMessage = error instanceof Error ? sanitizeStrict(error.message) : 'Unknown error';
        
        // Don't retry if it's not a network error
        if (!errorMessage.toLowerCase().includes('network') && 
            !errorMessage.toLowerCase().includes('fetch') &&
            !errorMessage.toLowerCase().includes('connection')) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff with cap)
        if (attempt < validatedMaxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), MAX_RETRY_DELAY);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus();
      
      if (wasOffline) {
        toast.success('Back Online', 'Your internet connection has been restored');
        setWasOffline(false);
      }
    };
    
    const handleOffline = () => {
      updateNetworkStatus();
      toast.error('No Internet Connection', 'Please check your network settings');
      setWasOffline(true);
    };
    
    const handleConnectionChange = () => {
      const status = updateNetworkStatus();
      
      if (status.isSlowConnection && status.isOnline) {
        toast.warning(
          'Slow Connection Detected',
          'You may experience delays loading content'
        );
      }
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Connection change listener with type safety
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection && connection.addEventListener) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    // Initial check
    updateNetworkStatus();
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection && connection.removeEventListener) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkStatus, toast, wasOffline]);

  const value: NetworkStatusContextType = {
    ...networkStatus,
    checkConnectivity,
    retryFailedRequest,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
      {!networkStatus.isOnline && <OfflineIndicator />}
    </NetworkStatusContext.Provider>
  );
}

// Offline Indicator Component
function OfflineIndicator() {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
      <div className="bg-red-900/90 backdrop-blur-sm border border-red-700 rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-white font-medium">You're offline</p>
            <p className="text-red-200 text-sm">Check your internet connection</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to use network status
export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
}

// HOC for network-aware components
export function withNetworkStatus<P extends object>(
  Component: React.ComponentType<P & { networkStatus: NetworkStatusContextType }>,
  FallbackComponent?: React.ComponentType<{ networkStatus: NetworkStatusContextType }>
) {
  return function NetworkAwareComponent(props: P) {
    const networkStatus = useNetworkStatus();
    
    if (!networkStatus.isOnline && FallbackComponent) {
      return <FallbackComponent networkStatus={networkStatus} />;
    }
    
    return <Component {...props} networkStatus={networkStatus} />;
  };
}

// Utility component for offline-first features
export function OfflineSupport({ 
  children,
  fallback,
  showWarning = true,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showWarning?: boolean;
}) {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  
  if (!isOnline) {
    return (
      <>
        {fallback || (
          <div className="p-8 text-center">
            <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">This feature requires an internet connection</p>
          </div>
        )}
      </>
    );
  }
  
  return (
    <>
      {showWarning && isSlowConnection && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-200 text-sm">
              Slow connection detected. Content may load slowly.
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
