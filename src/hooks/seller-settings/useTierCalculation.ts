// src/hooks/seller-settings/useTierCalculation.ts
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TierLevel } from '@/utils/sellerTiers';
import { sanitizeUsername } from '@/utils/security/sanitization';

const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number }> = {
  None: { minSales: 0, minAmount: 0 },
  Tease: { minSales: 0, minAmount: 0 },
  Flirt: { minSales: 10, minAmount: 5000 },
  Obsession: { minSales: 101, minAmount: 12500 },
  Desire: { minSales: 251, minAmount: 75000 },
  Goddess: { minSales: 1001, minAmount: 150000 }
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

  const [backendTierData, setBackendTierData] = useState<BackendTierData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const sanitizedUsername = user?.username ? sanitizeUsername(user.username) : null;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTierData = async () => {
      if (!sanitizedUsername || !token) {
        if (mountedRef.current) {
          setIsLoading(false);
          setBackendTierData(null);
        }
        return;
      }

      if (mountedRef.current) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(`http://localhost:5000/api/tiers/progress`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && mountedRef.current) {
            setBackendTierData(data.data);
          }
        } else if (response.status === 403) {
          if (mountedRef.current) setBackendTierData(null);
        } else {
          if (mountedRef.current) setError('Failed to load tier information');
        }

        const statsResponse = await fetch(`http://localhost:5000/api/tiers/stats/${sanitizedUsername}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success && statsData.data && mountedRef.current) {
            setBackendTierData((prev) => ({
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
      } catch {
        if (mountedRef.current) {
          setError('Failed to load tier information');
          setBackendTierData(null);
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    void fetchTierData();
    return () => controller.abort();
  }, [sanitizedUsername, token]);

  const sellerTierInfo = useMemo(() => {
    const tierName = backendTierData?.currentTier as TierLevel | undefined;
    if (!tierName || !VALID_TIERS.includes(tierName)) return null;

    const tierInfo = TIER_LEVELS[tierName];
    return {
      tier: tierName,
      credit:
        tierInfo.minSales > 0
          ? tierInfo.minSales === 10
            ? 0.01
            : tierInfo.minSales === 101
            ? 0.02
            : tierInfo.minSales === 251
            ? 0.03
            : tierInfo.minSales === 1001
            ? 0.05
            : 0
          : 0,
      minSales: tierInfo.minSales,
      minAmount: tierInfo.minAmount,
      badgeImage: `/${tierName}_Badge.png`,
      color:
        tierName === 'Tease'
          ? 'gray'
          : tierName === 'Flirt'
          ? 'pink'
          : tierName === 'Obsession'
          ? 'purple'
          : tierName === 'Desire'
          ? 'blue'
          : 'amber'
    };
  }, [backendTierData]);

  const userStats = useMemo(() => {
    if (backendTierData?.stats) {
      return {
        totalSales: backendTierData.stats.totalSales || 0,
        totalRevenue: backendTierData.stats.totalRevenue || 0
      };
    }
    return { totalSales: 0, totalRevenue: 0 };
  }, [backendTierData]);

  const getNextTier = (currentTier: TierLevel): TierLevel => {
    if (backendTierData?.nextTier && VALID_TIERS.includes(backendTierData.nextTier as TierLevel)) {
      return backendTierData.nextTier as TierLevel;
    }
    const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    const idx = tiers.indexOf(currentTier);
    if (idx === -1 || idx === tiers.length - 1) return currentTier;
    return tiers[idx + 1];
  };

  const getTierProgress = () => {
    if (
      backendTierData?.salesProgress !== undefined &&
      backendTierData?.revenueProgress !== undefined
    ) {
      return {
        salesProgress: Math.max(0, Math.min(100, Math.floor(backendTierData.salesProgress))),
        revenueProgress: Math.max(0, Math.min(100, Math.floor(backendTierData.revenueProgress)))
      };
    }
    return { salesProgress: 0, revenueProgress: 0 };
  };

  const isValidTier = (tier: string): tier is TierLevel => VALID_TIERS.includes(tier as TierLevel);

  const refreshTierData = async () => {
    if (!sanitizedUsername || !token) return;
    const controller = new AbortController();
    try {
      const response = await fetch(`http://localhost:5000/api/tiers/progress`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && mountedRef.current) setBackendTierData(data.data);
      }

      const statsResponse = await fetch(`http://localhost:5000/api/tiers/stats/${sanitizedUsername}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data && mountedRef.current) {
          setBackendTierData((prev) => ({ ...(prev as BackendTierData), stats: statsData.data }));
        }
      }
    } catch {
      // swallow
    } finally {
      controller.abort();
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
