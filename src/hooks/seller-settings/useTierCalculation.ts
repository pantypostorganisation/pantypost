// src/hooks/seller-settings/useTierCalculation.ts

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { getSellerTierMemoized, TierLevel } from '@/utils/sellerTiers';
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

export function useTierCalculation() {
  const { user } = useAuth();
  const { orderHistory } = useWallet();

  // Sanitize username to prevent injection
  const sanitizedUsername = user?.username ? sanitizeUsername(user.username) : null;

  // Calculate seller tier info
  const sellerTierInfo = useMemo(() => {
    return sanitizedUsername ? getSellerTierMemoized(sanitizedUsername, orderHistory) : null;
  }, [sanitizedUsername, orderHistory]);

  // Calculate user's current stats with validation
  const userStats = useMemo(() => {
    if (!sanitizedUsername) return { totalSales: 0, totalRevenue: 0 };
    
    const userOrders = orderHistory.filter(order => 
      order.seller === sanitizedUsername && 
      typeof order.price === 'number' && 
      order.price >= 0
    );

    const totalSales = userOrders.length;
    const totalRevenue = userOrders.reduce((sum, order) => {
      // Validate each price to prevent NaN or negative values
      const price = typeof order.price === 'number' && order.price >= 0 ? order.price : 0;
      return sum + price;
    }, 0);

    // Ensure values are within reasonable bounds
    return {
      totalSales: Math.min(totalSales, 999999), // Cap at reasonable max
      totalRevenue: Math.min(totalRevenue, 99999999) // Cap at reasonable max
    };
  }, [sanitizedUsername, orderHistory]);

  // Get next tier info with validation
  const getNextTier = (currentTier: TierLevel): TierLevel => {
    // Validate input tier
    if (!VALID_TIERS.includes(currentTier)) {
      return 'Tease'; // Default to lowest tier if invalid
    }

    const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return currentTier;
    }
    
    return tiers[currentIndex + 1];
  };

  // Get tier progress percentages with bounds checking
  const getTierProgress = () => {
    if (!sellerTierInfo) return { salesProgress: 0, revenueProgress: 0 };

    const currentTier = sellerTierInfo.tier;
    
    // Validate current tier
    if (!VALID_TIERS.includes(currentTier)) {
      return { salesProgress: 0, revenueProgress: 0 };
    }

    const currentRequirements = TIER_LEVELS[currentTier];
    const nextTier = getNextTier(currentTier);
    const nextRequirements = TIER_LEVELS[nextTier];

    if (currentTier === 'Goddess' || !nextRequirements) {
      return { salesProgress: 100, revenueProgress: 100 };
    }

    // Calculate progress with bounds checking
    const salesDiff = nextRequirements.minSales - currentRequirements.minSales;
    const revenueDiff = nextRequirements.minAmount - currentRequirements.minAmount;

    let salesProgress = 0;
    let revenueProgress = 0;

    if (salesDiff > 0) {
      salesProgress = Math.min(
        ((userStats.totalSales - currentRequirements.minSales) / salesDiff) * 100,
        100
      );
    }

    if (revenueDiff > 0) {
      revenueProgress = Math.min(
        ((userStats.totalRevenue - currentRequirements.minAmount) / revenueDiff) * 100,
        100
      );
    }

    return { 
      salesProgress: Math.max(0, Math.floor(salesProgress)), 
      revenueProgress: Math.max(0, Math.floor(revenueProgress))
    };
  };

  // Validate tier level
  const isValidTier = (tier: string): tier is TierLevel => {
    return VALID_TIERS.includes(tier as TierLevel);
  };

  return {
    sellerTierInfo,
    userStats,
    getNextTier,
    getTierProgress,
    isValidTier,
    validTiers: VALID_TIERS
  };
}