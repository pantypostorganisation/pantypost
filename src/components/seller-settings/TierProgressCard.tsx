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
    <div className="relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#161616] via-[#101010] to-[#161616] p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute -top-10 -right-6 h-40 w-40 rounded-full bg-[#ff950e]/10 blur-3xl" />
      <div className="absolute top-8 right-8 text-[#ff950e]/40">{getTierIcon(currentTier)}</div>

      <header className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-[#ff950e]/70">Seller insights</p>
          <h2 className="text-2xl font-semibold text-white">Seller Tier Progress</h2>
        </div>
        <button
          onClick={() => onTierClick(currentTier)}
          className="inline-flex items-center rounded-full border border-[#ff950e]/40 px-4 py-2 text-sm font-medium text-[#ff950e] transition hover:border-[#ff950e]/60 hover:bg-[#ff950e]/10"
          type="button"
        >
          View Details
        </button>
      </header>

      {/* Current Tier Display */}
      <section className="flex flex-col justify-between gap-6 rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-400">Current Tier</p>
          <div className="flex items-center gap-3">
            {currentTier !== 'None' ? <TierBadge tier={currentTier} size="lg" /> : null}
            <span className="text-2xl font-semibold text-white">{currentTier}</span>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:w-auto sm:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-black/60 p-4 text-center shadow-inner">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total Sales</p>
            <p className="text-2xl font-bold text-[#ff950e]">{userStats.totalSales}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-black/60 p-4 text-center shadow-inner">
            <p className="text-xs uppercase tracking-wide text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-[#ff950e]">{formatCurrency(userStats.totalRevenue)}</p>
          </div>
        </div>
      </section>

      {/* Progress to Next Tier */}
      {currentTier !== 'Goddess' && nextRequirements && (
        <section className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-gray-200">
              Progress to <span className="text-[#ff950e]">{nextTier}</span>
            </p>
            <div className="flex items-center gap-3">
              <TierBadge tier={nextTier} size="sm" />
              <span className="text-xs uppercase tracking-wide text-gray-400">Next milestone</span>
            </div>
          </div>

          {/* Sales Progress */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                Sales: {userStats.totalSales}/{nextRequirements.minSales}
              </span>
              <span className="text-[#ff950e]">{salesPct.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff950e] via-[#ff7a0a] to-[#ff6b00] transition-all duration-500"
                style={{ width: `${salesPct}%` }}
              />
            </div>
          </div>

          {/* Revenue Progress */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                Revenue: {formatCurrency(userStats.totalRevenue)}/{formatCurrency(nextRequirements.minAmount)}
              </span>
              <span className="text-[#ff950e]">{revenuePct.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ff950e] via-[#ff7a0a] to-[#ff6b00] transition-all duration-500"
                style={{ width: `${revenuePct}%` }}
              />
            </div>
          </div>

          <p className="text-center text-xs text-gray-400">
            Reach both milestones to unlock <span className="text-[#ff950e] font-medium">{nextTier}</span> tier
          </p>
        </section>
      )}

      {/* Max Tier Reached */}
      {currentTier === 'Goddess' && (
        <section className="rounded-2xl border border-[#ff950e]/40 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] p-6 text-center text-black shadow-lg">
          <p className="text-lg font-bold">🎉 Maximum Tier Achieved!</p>
          <p className="text-sm font-medium">You've reached the highest seller tier</p>
        </section>
      )}
    </div>
  );
}
