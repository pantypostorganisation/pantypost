// src/hooks/useNetworkStatus.tsx
'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from '@/context/ToastContext';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

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

const NetworkStatusContext = createContext<NetworkStatusContextType | undefined>(undefined);

// Network quality thresholds
const SLOW_CONNECTION_THRESHOLD = {
  rtt: 400, // Round trip time in ms
  downlink: 1, // Mbps
  effectiveType: ['slow-2g', '2g'],
};

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
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

  // Get connection info
  const getConnectionInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return null;
    
    // TypeScript doesn't know about NetworkInformation API yet
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (!connection) return null;
    
    return {
      type: connection.type || null,
      effectiveType: connection.effectiveType || null,
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false,
    };
  }, []);

  // Check if connection is slow
  const isSlowConnection = useCallback((info: ReturnType<typeof getConnectionInfo>) => {
    if (!info) return false;
    
    const { rtt, downlink, effectiveType } = info;
    
    return (
      (rtt !== null && rtt > SLOW_CONNECTION_THRESHOLD.rtt) ||
      (downlink !== null && downlink < SLOW_CONNECTION_THRESHOLD.downlink) ||
      (effectiveType !== null && SLOW_CONNECTION_THRESHOLD.effectiveType.includes(effectiveType))
    );
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    const connectionInfo = getConnectionInfo();
    const slow = isSlowConnection(connectionInfo);
    
    setNetworkStatus({
      isOnline,
      isSlowConnection: slow,
      connectionType: connectionInfo?.type || null,
      effectiveType: connectionInfo?.effectiveType || null,
      downlink: connectionInfo?.downlink || null,
      rtt: connectionInfo?.rtt || null,
      saveData: connectionInfo?.saveData || false,
    });
    
    return { isOnline, isSlowConnection: slow };
  }, [getConnectionInfo, isSlowConnection]);

  // Check connectivity by making a request
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource with cache bypass
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      }).catch(() => 
        // Fallback to a public endpoint if our API is down
        fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
        })
      );
      
      return true;
    } catch {
      return false;
    }
  }, []);

  // Retry failed request with exponential backoff
  const retryFailedRequest = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Check if we're online before attempting
        if (!navigator.onLine) {
          throw new Error('No internet connection');
        }
        
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if it's not a network error
        if (error instanceof Error && !error.message.includes('network')) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
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
    
    // Connection change listener
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    // Initial check
    updateNetworkStatus();
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
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
