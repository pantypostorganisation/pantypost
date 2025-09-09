// src/hooks/seller-settings/useTierCalculation.ts

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TierLevel } from '@/utils/sellerTiers';
import { sanitizeUsername } from '@/utils/security/sanitization';

// Define TIER_LEVELS locally to match the structure in sellerTiers.ts
const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number }> = {
  'None': { minSales: 0, minAmount: 0 },
  'Tease': { minSales: 0, minAmount: 0 },
  'Flirt': { minSales: 10, minAmount: 5000 },
  'Obsession': { minSales: 101, minAmount: 12500 },
  'Desire': { minSales: 251, minAmount: 75000 },
  'Goddess': { minSales: 1001, minAmount: 150000 }
};

const VALID_TIERS: readonly TierLevel[] = ['None', 'Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'] as const;

interface BackendTierData {
  currentTier: string;
  nextTier: string | null;
  salesProgress: number;
  revenueProgress: number;
  salesNeeded: number;
  revenueNeeded: number;
  stats: {
    totalSales: number;
    totalRevenue: number;
  };
}

export function useTierCalculation() {
  const { user, token } = useAuth();

  // State for backend data - NO LOCAL STORAGE
  const [backendTierData, setBackendTierData] = useState<BackendTierData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sanitize username to prevent injection
  const sanitizedUsername = user?.username ? sanitizeUsername(user.username) : null;

  // Fetch tier data from backend ONLY
  useEffect(() => {
    const fetchTierData = async () => {
      if (!sanitizedUsername || !token) {
        setIsLoading(false);
        setBackendTierData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get tier progress from the backend
        const response = await fetch(`http://localhost:5000/api/tiers/progress`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[useTierCalculation] Backend tier data:', data);
          
          if (data.success && data.data) {
            setBackendTierData(data.data);
          }
        } else if (response.status === 403) {
          // Not a seller, no tier data
          console.log('[useTierCalculation] User is not a seller');
          setBackendTierData(null);
        } else {
          console.error('[useTierCalculation] Failed to fetch tier data:', response.status);
          setError('Failed to load tier information');
        }

        // Also fetch tier stats
        const statsResponse = await fetch(`http://localhost:5000/api/tiers/stats/${sanitizedUsername}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('[useTierCalculation] Backend stats data:', statsData);
          
          if (statsData.success && statsData.data) {
            // Update backend tier data with stats
            setBackendTierData(prev => ({
              currentTier: prev?.currentTier || 'Tease',
              nextTier: prev?.nextTier || 'Flirt',
              salesProgress: prev?.salesProgress || 0,
              revenueProgress: prev?.revenueProgress || 0,
              salesNeeded: prev?.salesNeeded || 0,
              revenueNeeded: prev?.revenueNeeded || 0,
              stats: statsData.data,
              ...prev
            }));
          }
        }
      } catch (error) {
        console.error('[useTierCalculation] Error fetching tier data:', error);
        setError('Failed to load tier information');
        setBackendTierData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTierData();
  }, [sanitizedUsername, token]);

  // Calculate seller tier info from backend data ONLY
  const sellerTierInfo = useMemo(() => {
    if (!backendTierData?.currentTier) {
      return null;
    }

    const tierName = backendTierData.currentTier as TierLevel;
    if (!VALID_TIERS.includes(tierName)) {
      return null;
    }

    const tierInfo = TIER_LEVELS[tierName];
    return {
      tier: tierName,
      credit: tierInfo.minSales > 0 ? (tierInfo.minSales === 10 ? 0.01 : 
               tierInfo.minSales === 101 ? 0.02 : 
               tierInfo.minSales === 251 ? 0.03 : 
               tierInfo.minSales === 1001 ? 0.05 : 0) : 0,
      minSales: tierInfo.minSales,
      minAmount: tierInfo.minAmount,
      badgeImage: `/${tierName}_Badge.png`,
      color: tierName === 'Tease' ? 'gray' : 
             tierName === 'Flirt' ? 'pink' : 
             tierName === 'Obsession' ? 'purple' : 
             tierName === 'Desire' ? 'blue' : 'amber'
    };
  }, [backendTierData]);

  // Use backend stats ONLY
  const userStats = useMemo(() => {
    if (backendTierData?.stats) {
      return {
        totalSales: backendTierData.stats.totalSales || 0,
        totalRevenue: backendTierData.stats.totalRevenue || 0
      };
    }
    return { totalSales: 0, totalRevenue: 0 };
  }, [backendTierData]);

  // Get next tier info
  const getNextTier = (currentTier: TierLevel): TierLevel => {
    // Use backend data if available
    if (backendTierData?.nextTier) {
      const nextTier = backendTierData.nextTier as TierLevel;
      if (VALID_TIERS.includes(nextTier)) {
        return nextTier;
      }
    }

    // Simple fallback logic
    if (!VALID_TIERS.includes(currentTier)) {
      return 'Tease';
    }

    const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return currentTier;
    }
    
    return tiers[currentIndex + 1];
  };

  // Get tier progress percentages from backend ONLY
  const getTierProgress = () => {
    if (backendTierData?.salesProgress !== undefined && backendTierData?.revenueProgress !== undefined) {
      return {
        salesProgress: Math.max(0, Math.min(100, Math.floor(backendTierData.salesProgress))),
        revenueProgress: Math.max(0, Math.min(100, Math.floor(backendTierData.revenueProgress)))
      };
    }
    return { salesProgress: 0, revenueProgress: 0 };
  };

  // Validate tier level
  const isValidTier = (tier: string): tier is TierLevel => {
    return VALID_TIERS.includes(tier as TierLevel);
  };

  // Force refresh tier data from backend
  const refreshTierData = async () => {
    if (!sanitizedUsername || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/tiers/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setBackendTierData(data.data);
        }
      }

      // Also refresh stats
      const statsResponse = await fetch(`http://localhost:5000/api/tiers/stats/${sanitizedUsername}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setBackendTierData(prev => ({
            ...prev!,
            stats: statsData.data
          }));
        }
      }
    } catch (error) {
      console.error('[useTierCalculation] Error refreshing tier data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sellerTierInfo,
    userStats,
    getNextTier,
    getTierProgress,
    isValidTier,
    validTiers: VALID_TIERS,
    isLoading,
    error,
    refreshTierData
  };
}