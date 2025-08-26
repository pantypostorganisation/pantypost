// src/components/seller-settings/TierProgressCard.tsx
'use client';

import { Award, TrendingUp, Crown, Star, Gift, Target } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import type { TierLevel } from '@/utils/sellerTiers';
import { z } from 'zod';
import { formatCurrency } from '@/utils/url';

// Define TIER_LEVELS locally to match the structure with proper typing
const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number }> = {
  None: { minSales: 0, minAmount: 0 },
  Tease: { minSales: 0, minAmount: 0 },
  Flirt: { minSales: 10, minAmount: 5000 },
  Obsession: { minSales: 101, minAmount: 12500 },
  Desire: { minSales: 251, minAmount: 75000 },
  Goddess: { minSales: 1001, minAmount: 150000 },
};

const VALID_TIERS: TierLevel[] = ['None', 'Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
function isTierLevel(v: unknown): v is TierLevel {
  return typeof v === 'string' && (VALID_TIERS as readonly string[]).includes(v);
}
function normalizeTier(v: unknown): TierLevel | null {
  if (isTierLevel(v)) return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    switch (s) {
      case 'none':
        return 'None';
      case 'tease':
        return 'Tease';
      case 'flirt':
        return 'Flirt';
      case 'obsession':
        return 'Obsession';
      case 'desire':
        return 'Desire';
      case 'goddess':
        return 'Goddess';
      default:
        return null;
    }
  }
  return null;
}

const PropsSchema = z.object({
  sellerTierInfo: z.object({ tier: z.unknown() }),
  userStats: z.object({
    totalSales: z.number().int().nonnegative().catch(0),
    totalRevenue: z.number().nonnegative().catch(0),
  }),
  tierProgress: z.object({
    salesProgress: z.number().nonnegative().catch(0),
    revenueProgress: z.number().nonnegative().catch(0),
  }),
  nextTier: z.unknown(), // normalize to TierLevel
  onTierClick: z.function().args(z.unknown()).returns(z.void()),
});

interface TierProgressCardProps extends z.infer<typeof PropsSchema> {}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function getTierIcon(tier: TierLevel | null) {
  switch (tier) {
    case 'Tease':
      return <Star className="w-5 h-5" />;
    case 'Flirt':
      return <Gift className="w-5 h-5" />;
    case 'Obsession':
      return <Award className="w-5 h-5" />;
    case 'Desire':
      return <Crown className="w-5 h-5" />;
    case 'Goddess':
      return <Target className="w-5 h-5" />;
    default:
      return <Award className="w-5 h-5" />;
  }
}

export default function TierProgressCard(rawProps: TierProgressCardProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const { sellerTierInfo, userStats, tierProgress, nextTier: rawNextTier, onTierClick } = parsed.success
    ? parsed.data
    : {
        sellerTierInfo: { tier: 'None' },
        userStats: { totalSales: 0, totalRevenue: 0 },
        tierProgress: { salesProgress: 0, revenueProgress: 0 },
        nextTier: 'Tease',
        onTierClick: () => {},
      };

  const currentTier = normalizeTier(sellerTierInfo.tier);
  const nextTier = normalizeTier(rawNextTier) ?? 'Tease';

  if (!currentTier) return null;

  const currentRequirements = TIER_LEVELS[currentTier];
  const nextRequirements = TIER_LEVELS[nextTier];

  const salesPct = clampPercent(tierProgress.salesProgress);
  const revenuePct = clampPercent(tierProgress.revenueProgress);

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 opacity-10">{getTierIcon(currentTier)}</div>

      <h2 className="text-xl font-bold mb-6 text-white">Seller Tier Progress</h2>

      {/* Current Tier Display */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Current Tier</p>
          <div className="flex items-center gap-2">
            {currentTier !== 'None' ? <TierBadge tier={currentTier} size="md" /> : null}
            <span className="text-lg font-bold text-white">{currentTier}</span>
          </div>
        </div>
        <button onClick={() => onTierClick(currentTier)} className="text-[#ff950e] text-sm hover:underline" type="button">
          View Details
        </button>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black rounded-lg p-3">
          <p className="text-xs text-gray-400">Total Sales</p>
          <p className="text-xl font-bold text-[#ff950e]">{userStats.totalSales}</p>
        </div>
        <div className="bg-black rounded-lg p-3">
          <p className="text-xs text-gray-400">Total Revenue</p>
          <p className="text-xl font-bold text-[#ff950e]">{formatCurrency(userStats.totalRevenue)}</p>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {currentTier !== 'Goddess' && nextRequirements && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Progress to {nextTier}</p>
            <TierBadge tier={nextTier} size="sm" />
          </div>

          {/* Sales Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>
                Sales: {userStats.totalSales}/{nextRequirements.minSales}
              </span>
              <span>{salesPct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] h-2 rounded-full transition-all duration-500"
                style={{ width: `${salesPct}%` }}
              />
            </div>
          </div>

          {/* Revenue Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>
                Revenue: {formatCurrency(userStats.totalRevenue)}/{formatCurrency(nextRequirements.minAmount)}
              </span>
              <span>{revenuePct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] h-2 rounded-full transition-all duration-500"
                style={{ width: `${revenuePct}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">Reach both milestones to unlock {nextTier} tier</p>
        </div>
      )}

      {/* Max Tier Reached */}
      {currentTier === 'Goddess' && (
        <div className="text-center">
          <div className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black p-3 rounded-lg">
            <p className="font-bold">🎉 Maximum Tier Achieved!</p>
            <p className="text-sm">You've reached the highest seller tier</p>
          </div>
        </div>
      )}
    </div>
  );
}
