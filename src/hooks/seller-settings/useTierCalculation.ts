// src/hooks/seller-settings/useTierCalculation.ts
import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext.enhanced';
import { getSellerTierMemoized, TierLevel } from '@/utils/sellerTiers';

// Define TIER_LEVELS locally to match the structure in sellerTiers.ts
const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number }> = {
  'None': { minSales: 0, minAmount: 0 },
  'Tease': { minSales: 0, minAmount: 0 },
  'Flirt': { minSales: 10, minAmount: 5000 },
  'Obsession': { minSales: 101, minAmount: 12500 },
  'Desire': { minSales: 251, minAmount: 75000 },
  'Goddess': { minSales: 1001, minAmount: 150000 }
};

export function useTierCalculation() {
  const { user } = useAuth();
  const { orderHistory } = useWallet();

  // Calculate seller tier info
  const sellerTierInfo = useMemo(() => {
    return user ? getSellerTierMemoized(user.username, orderHistory) : null;
  }, [user, orderHistory]);

  // Calculate user's current stats
  const userStats = useMemo(() => {
    if (!user) return { totalSales: 0, totalRevenue: 0 };
    
    const userOrders = orderHistory.filter(order => order.seller === user.username);
    return {
      totalSales: userOrders.length,
      totalRevenue: userOrders.reduce((sum, order) => sum + order.price, 0)
    };
  }, [user, orderHistory]);

  // Get next tier info
  const getNextTier = (currentTier: TierLevel): TierLevel => {
    const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    const currentIndex = tiers.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return currentTier;
    }
    return tiers[currentIndex + 1];
  };

  // Get tier progress percentages
  const getTierProgress = () => {
    if (!sellerTierInfo) return { salesProgress: 0, revenueProgress: 0 };

    const currentTier = sellerTierInfo.tier;
    const currentRequirements = TIER_LEVELS[currentTier];
    const nextTier = getNextTier(currentTier);
    const nextRequirements = TIER_LEVELS[nextTier];

    if (currentTier === 'Goddess' || !nextRequirements) {
      return { salesProgress: 100, revenueProgress: 100 };
    }

    const salesProgress = Math.min(
      ((userStats.totalSales - currentRequirements.minSales) / 
       (nextRequirements.minSales - currentRequirements.minSales)) * 100,
      100
    );

    const revenueProgress = Math.min(
      ((userStats.totalRevenue - currentRequirements.minAmount) / 
       (nextRequirements.minAmount - currentRequirements.minAmount)) * 100,
      100
    );

    return { 
      salesProgress: Math.max(0, salesProgress), 
      revenueProgress: Math.max(0, revenueProgress) 
    };
  };

  return {
    sellerTierInfo,
    userStats,
    getNextTier,
    getTierProgress
  };
}
