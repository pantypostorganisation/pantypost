// src/hooks/useWalletHealth.ts
'use client';

import { useEffect, useState } from 'react';
import { useAppInitialization } from '@/components/AppInitializationProvider';
import { useWallet } from '@/context/WalletContext.enhanced';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to monitor wallet health and initialization status
 */
export function useWalletHealth() {
  const { isInitialized, healthStatus } = useAppInitialization();
  const { reconcileBalance } = useWallet();
  const { user } = useAuth();
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    if (!isInitialized || !user) return;

    const checkHealth = async () => {
      try {
        // Check wallet service health
        const walletHealthy = healthStatus?.wallet_service ?? false;
        
        // Perform reconciliation check
        if (user.role === 'buyer' || user.role === 'seller') {
          const reconciliation = await reconcileBalance(user.username, user.role);
          const isReconciled = reconciliation.isReconciled;
          
          setIsHealthy(walletHealthy && isReconciled);
        } else {
          setIsHealthy(walletHealthy);
        }
        
        setLastCheck(new Date());
      } catch (error) {
        console.error('Wallet health check failed:', error);
        setIsHealthy(false);
      }
    };

    // Check immediately
    checkHealth();

    // Check every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isInitialized, user, healthStatus, reconcileBalance]);

  return {
    isHealthy,
    lastCheck,
    healthStatus: healthStatus?.wallet_service ?? false
  };
}
