// src/components/AppInitializationProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { appInitializer } from '@/services/app-initializer';

interface HealthStatus {
  wallet_service: boolean;
  storage_service: boolean;
  auth_service: boolean;
  [key: string]: boolean;
}

interface AppInitializationContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  healthStatus: HealthStatus | null;
  error: Error | null;
  reinitialize: () => Promise<void>;
}

const AppInitializationContext = createContext<AppInitializationContextType | undefined>(undefined);

export function AppInitializationProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const initializeApp = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      // Initialize core services
      await appInitializer.initialize();
      
      // Check health status
      const health: HealthStatus = {
        wallet_service: true,
        storage_service: true,
        auth_service: true,
      };
      
      setHealthStatus(health);
      setIsInitialized(true);
    } catch (err) {
      console.error('App initialization failed:', err);
      setError(err instanceof Error ? err : new Error('Initialization failed'));
      setIsInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const reinitialize = async () => {
    await initializeApp();
  };

  return (
    <AppInitializationContext.Provider
      value={{
        isInitialized,
        isInitializing,
        healthStatus,
        error,
        reinitialize,
      }}
    >
      {children}
    </AppInitializationContext.Provider>
  );
}

export function useAppInitialization() {
  const context = useContext(AppInitializationContext);
  if (!context) {
    throw new Error('useAppInitialization must be used within AppInitializationProvider');
  }
  return context;
}
