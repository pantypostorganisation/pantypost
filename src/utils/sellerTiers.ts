// src/utils/sellerTiers.ts

// Import Order type from shared types to avoid circular dependencies
import type { Order } from '@/types/order';

export type TierLevel = 'Tease' | 'Flirt' | 'Obsession' | 'Desire' | 'Goddess' | 'None';

export interface TierInfo {
  tier: TierLevel;
  credit: number;
  minSales: number;
  minAmount: number;
  badgeImage: string;
  color: string;
}

export const TIER_LEVELS: Record<TierLevel, TierInfo> = {
  None: {
    tier: 'None',
    credit: 0,
    minSales: 0,
    minAmount: 0,
    badgeImage: '',
    color: 'gray'
  },
  Tease: {
    tier: 'Tease',
    credit: 0,
    minSales: 0, // 0-10 sales
    minAmount: 0,
    badgeImage: '/Tease_Badge.png',
    color: 'gray'
  },
  Flirt: {
    tier: 'Flirt',
    credit: 0.01, // 1% credit
    minSales: 10, // 10-100 sales
    minAmount: 5000, // or >$5,000
    badgeImage: '/Flirt_Badge.png',
    color: 'pink'
  },
  Obsession: {
    tier: 'Obsession',
    credit: 0.02, // 2% credit
    minSales: 101, // 101-250 sales
    minAmount: 12500, // or >$12,500
    badgeImage: '/Obsession_Badge.png',
    color: 'purple'
  },
  Desire: {
    tier: 'Desire',
    credit: 0.03, // 3% credit
    minSales: 251, // 251-1000 sales
    minAmount: 75000, // or >$75,000
    badgeImage: '/Desire_Badge.png',
    color: 'blue'
  },
  Goddess: {
    tier: 'Goddess',
    credit: 0.05, // 5% credit
    minSales: 1001, // >1000 sales
    minAmount: 150000, // or >$150,000
    badgeImage: '/Goddess_Badge.png',
    color: 'amber'
  }
};

/**
 * Calculate a seller's tier level based on their sales history
 * @param sellerUsername The username of the seller
 * @param orderHistory Array of all orders in the system
 * @returns Object containing tier information including level and credit percentage
 */
export const getSellerTier = (
  sellerUsername: string,
  orderHistory: Order[]
): TierInfo => {
  if (!sellerUsername) {
    return TIER_LEVELS.None;
  }

  // Filter orders for this seller
  const sellerOrders = orderHistory.filter(
    (order) => order.seller === sellerUsername
  );

  // Calculate total sales count and amount
  const totalSales = sellerOrders.length;
  const totalAmount = sellerOrders.reduce(
    (sum, order) => sum + (order?.price ?? 0),
    0
  );

  // Determine tier based on either sales count OR total amount
  // Check from highest to lowest to ensure correct tier assignment
  if (totalSales >= TIER_LEVELS.Goddess.minSales || totalAmount >= TIER_LEVELS.Goddess.minAmount) {
    return TIER_LEVELS.Goddess;
  } else if (totalSales >= TIER_LEVELS.Desire.minSales || totalAmount >= TIER_LEVELS.Desire.minAmount) {
    return TIER_LEVELS.Desire;
  } else if (totalSales >= TIER_LEVELS.Obsession.minSales || totalAmount >= TIER_LEVELS.Obsession.minAmount) {
    return TIER_LEVELS.Obsession;
  } else if (totalSales >= TIER_LEVELS.Flirt.minSales || totalAmount >= TIER_LEVELS.Flirt.minAmount) {
    return TIER_LEVELS.Flirt;
  } else {
    return TIER_LEVELS.Tease;
  }
};

// Cache tier calculations to prevent redundant calculations
// and avoid re-render loops
const tierCache = new Map<string, { tier: TierInfo; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache TTL

/**
 * Memoized version of getSellerTier to prevent recalculation
 * when used in components to avoid performance issues
 */
export const getSellerTierMemoized = (
  sellerUsername: string,
  orderHistory: Order[]
): TierInfo => {
  if (!sellerUsername) {
    return TIER_LEVELS.None;
  }
  
  const now = Date.now();
  const cacheKey = `${sellerUsername}:${orderHistory.length}`;
  const cachedValue = tierCache.get(cacheKey);
  
  // Use cached value if it exists and hasn't expired
  if (cachedValue && now - cachedValue.timestamp < CACHE_TTL) {
    return cachedValue.tier;
  }
  
  // Calculate new tier
  const tier = getSellerTier(sellerUsername, orderHistory);
  
  // Cache the result
  tierCache.set(cacheKey, { tier, timestamp: now });
  
  return tier;
};

// Additional helper functions needed by the hooks

/**
 * Get tier info by tier name (string)
 */
export function getTierInfo(tier: string): TierInfo {
  return TIER_LEVELS[tier as TierLevel] || TIER_LEVELS.Tease;
}

/**
 * Get user stats (simplified version for profile settings)
 */
export function getUserStats(user: any): { totalSales: number; totalRevenue: number } {
  return {
    totalSales: user?.totalSales || 0,
    totalRevenue: user?.totalRevenue || 0
  };
}

/**
 * Get the next tier level
 */
export function getNextTier(currentTier: string): TierLevel {
  const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
  const currentIndex = tiers.indexOf(currentTier as TierLevel);
  
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return 'None';
  }
  
  return tiers[currentIndex + 1];
}

/**
 * Calculate tier progress
 */
export function calculateTierProgress(currentTier: TierLevel, stats: { totalSales: number; totalRevenue: number }): {
  currentTier: TierLevel;
  nextTier: TierLevel | null;
  salesProgress: number;
  revenueProgress: number;
  salesNeeded: number;
  revenueNeeded: number;
} {
  const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return {
      currentTier,
      nextTier: null,
      salesProgress: 100,
      revenueProgress: 100,
      salesNeeded: 0,
      revenueNeeded: 0
    };
  }
  
  const nextTier = tiers[currentIndex + 1];
  const nextTierInfo = TIER_LEVELS[nextTier];
  
  const salesProgress = Math.min(100, (stats.totalSales / nextTierInfo.minSales) * 100);
  const revenueProgress = Math.min(100, (stats.totalRevenue / nextTierInfo.minAmount) * 100);
  const salesNeeded = Math.max(0, nextTierInfo.minSales - stats.totalSales);
  const revenueNeeded = Math.max(0, nextTierInfo.minAmount - stats.totalRevenue);
  
  return {
    currentTier,
    nextTier,
    salesProgress,
    revenueProgress,
    salesNeeded,
    revenueNeeded
  };
}

/**
 * Get tier benefits
 */
export function getTierBenefits(tier: TierLevel): string[] {
  switch(tier) {
    case 'Tease':
      return ['Basic seller badge', 'Access to marketplace', 'Standard support'];
    case 'Flirt':
      return ['1% bonus on all sales', 'Flirt badge upgrade', 'Priority in search results'];
    case 'Obsession':
      return ['2% bonus on all sales', 'Obsession badge upgrade', 'Featured seller status'];
    case 'Desire':
      return ['3% bonus on all sales', 'Desire badge upgrade', 'Premium seller tools'];
    case 'Goddess':
      return ['5% bonus on all sales', 'Goddess badge upgrade', 'VIP seller status', 'Exclusive features'];
    default:
      return [];
  }
}