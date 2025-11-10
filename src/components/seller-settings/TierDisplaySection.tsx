// src/components/seller-settings/TierDisplaySection.tsx
'use client';

import { Award, TrendingUp, Star, Gift, Target, Crown } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import type { TierLevel } from '@/utils/sellerTiers';
import { z } from 'zod';
import { formatCurrency } from '@/utils/url';

// Define TIER_LEVELS locally
const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number; credit: number }> = {
  None: { minSales: 0, minAmount: 0, credit: 0 },
  Tease: { minSales: 0, minAmount: 0, credit: 0 },
  Flirt: { minSales: 10, minAmount: 5000, credit: 0.01 },
  Obsession: { minSales: 101, minAmount: 12500, credit: 0.02 },
  Desire: { minSales: 251, minAmount: 75000, credit: 0.03 },
  Goddess: { minSales: 1001, minAmount: 150000, credit: 0.05 },
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
  sellerTierInfo: z
    .object({
      tier: z.unknown(),
      credit: z.number().optional(),
    }),
  userStats: z.object({
    totalSales: z.number().int().nonnegative().catch(0),
    totalRevenue: z.number().nonnegative().catch(0),
  }),
  nextTier: z.unknown(), // normalize to TierLevel
  selectedTierDetails: z.unknown().nullable(), // normalize
  onTierSelect: z.function().args(z.unknown()).returns(z.void()),
});

interface TierDisplaySectionProps extends z.infer<typeof PropsSchema> {}

export default function TierDisplaySection(rawProps: TierDisplaySectionProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const {
    sellerTierInfo,
    userStats,
    nextTier: rawNextTier,
    selectedTierDetails: rawSelected,
    onTierSelect,
  } = parsed.success
    ? parsed.data
    : {
        sellerTierInfo: { tier: 'None', credit: 0 },
        userStats: { totalSales: 0, totalRevenue: 0 },
        nextTier: 'Tease',
        selectedTierDetails: null,
        onTierSelect: () => {},
      };

  const currentTier = normalizeTier(sellerTierInfo.tier);
  const nextTier = normalizeTier(rawNextTier) ?? 'Tease';
  const selectedTierDetails = normalizeTier(rawSelected);

  const credit = typeof sellerTierInfo.credit === 'number' && Number.isFinite(sellerTierInfo.credit) ? sellerTierInfo.credit : 0;

  return (
    <div className="relative flex flex-col gap-8 rounded-3xl bg-gradient-to-br from-[#191919] via-[#111] to-[#1f1f1f] p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-[#ff950e]/10 blur-3xl" />
      <section className="relative z-10 flex flex-col gap-6 rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {currentTier && currentTier !== 'None' ? <TierBadge tier={currentTier} size="2xl" showTooltip={true} /> : null}
          </div>
          <div className="space-y-2">
            <h2 className="flex items-center text-2xl font-semibold text-white">
              <Award className="mr-3 h-6 w-6 text-[#ff950e]" />
              Your Seller Tier
            </h2>
            <p className="text-base text-gray-300">
              Current level:{' '}
              <span className="font-semibold text-[#ff950e]">
                {currentTier && currentTier !== 'None' ? currentTier : '—'}
              </span>
            </p>
            <p className="text-sm text-gray-400">
              {credit > 0 ? (
                <>
                  You earn an additional <span className="font-semibold text-green-400">{(credit * 100).toFixed(0)}%</span> on
                  all your sales!
                </>
              ) : (
                <>Make more sales to earn additional credits on your sales</>
              )}
            </p>
          </div>
        </div>

        {currentTier !== 'Goddess' && nextTier && (
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/5 bg-black/60 p-5 shadow-inner lg:w-auto lg:max-w-xs">
            <div className="text-sm font-medium text-gray-300">
              Next tier:{' '}
              <span className="text-purple-400">{nextTier}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-300">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span>
                Need {TIER_LEVELS[nextTier].minSales.toLocaleString()} sales or {formatCurrency(TIER_LEVELS[nextTier].minAmount)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Simple Interactive Tier Table */}
      <section className="relative z-10 flex-1 rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-200">
            <Star className="h-5 w-5 text-[#ff950e]" />
            Seller Tier Overview
          </h3>
          <span className="text-xs uppercase tracking-wide text-gray-500">Click a tier to explore benefits</span>
        </div>

        {/* Tier Badges Row */}
        <div className="flex w-full flex-nowrap gap-4 overflow-x-auto pb-2 pr-2 sm:overflow-x-visible sm:pb-0 sm:pr-0">
          {(['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'] as TierLevel[]).map((tier) => {
            const isCurrentTier = currentTier === tier;
            const isSelected = selectedTierDetails === tier;

            return (
              <button
                key={tier}
                onClick={() => onTierSelect(isSelected ? null : tier)}
                className={`group relative flex min-w-[220px] flex-shrink-0 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-300 ${
                  isCurrentTier
                    ? 'border-[#ff950e] bg-[#ff950e]/10 shadow-[0_12px_30px_-20px_rgba(255,149,14,0.8)]'
                    : isSelected
                    ? 'border-purple-400 bg-purple-400/15 shadow-[0_12px_30px_-20px_rgba(168,85,247,0.7)]'
                    : 'border-gray-700 bg-gray-900/60 hover:border-[#ff950e]/50 hover:bg-gray-900'
                }`}
                type="button"
                aria-pressed={isSelected}
                aria-label={`View ${tier} details`}
              >
                <div className="flex items-center gap-3">
                  <TierBadge tier={tier} size="lg" showTooltip={false} />
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white">{tier}</div>
                    <div className="text-xs text-gray-400">+{(TIER_LEVELS[tier].credit * 100).toFixed(0)}% bonus</div>
                  </div>
                </div>
                {isCurrentTier && <div className="text-xs font-semibold text-[#ff950e]">Current</div>}
              </button>
            );
          })}
        </div>

        {/* Expanded Details */}
        {selectedTierDetails && (
          <div className="mt-6 rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-inner animate-in slide-in-from-top duration-300">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <TierBadge tier={selectedTierDetails} size="lg" showTooltip={false} />
                <div>
                  <h4 className="text-xl font-bold text-[#ff950e]">{selectedTierDetails} Tier</h4>
                  <p className="text-sm text-gray-400">
                    Level {(['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'] as TierLevel[]).indexOf(selectedTierDetails) + 1} of 5
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Requirements */}
              <div>
                <h5 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Target className="h-4 w-4 text-green-400" />
                  Requirements
                </h5>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/60 p-3">
                    <span className="text-gray-300">Total Sales</span>
                    <span className="font-medium text-[#ff950e]">{TIER_LEVELS[selectedTierDetails].minSales}+</span>
                  </div>
                  <div className="text-center text-xs uppercase tracking-wide text-gray-500">or</div>
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/60 p-3">
                    <span className="text-gray-300">Total Revenue</span>
                    <span className="font-medium text-[#ff950e]">
                      {formatCurrency(TIER_LEVELS[selectedTierDetails].minAmount)}+
                    </span>
                  </div>

                  {/* User Progress */}
                  <div className="mt-4 rounded-xl border border-white/5 bg-black/50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Your progress</p>
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="flex items-center justify-between">
                        <span>Sales: {userStats.totalSales}</span>
                        <span>Revenue: {formatCurrency(userStats.totalRevenue)}</span>
                      </div>
                      {selectedTierDetails !== currentTier && (
                        <p className="text-sm text-green-400">
                          Need {Math.max(0, TIER_LEVELS[selectedTierDetails].minSales - userStats.totalSales)} more sales or{' '}
                          {formatCurrency(Math.max(0, TIER_LEVELS[selectedTierDetails].minAmount - userStats.totalRevenue))} more revenue
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h5 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Gift className="h-4 w-4 text-purple-400" />
                  Benefits
                </h5>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/60 p-3">
                    <span className="text-gray-300">Bonus Credits</span>
                    <span className="font-bold text-green-400">
                      {TIER_LEVELS[selectedTierDetails].credit > 0
                        ? `+${(TIER_LEVELS[selectedTierDetails].credit * 100).toFixed(0)}%`
                        : 'None'}
                    </span>
                  </div>

                  {selectedTierDetails !== 'Tease' && (
                    <>
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/60 p-3">
                        <span className="text-gray-300">Priority Support</span>
                        <span className="text-green-400">✓</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/60 p-3">
                        <span className="text-gray-300">Featured Profile</span>
                        <span className="text-green-400">✓</span>
                      </div>
                    </>
                  )}

                  {(selectedTierDetails === 'Desire' || selectedTierDetails === 'Goddess') && (
                    <>
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/60 p-3">
                        <span className="text-gray-300">Custom Badge</span>
                        <span className="text-green-400">✓</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/60 p-3">
                        <span className="text-gray-300">VIP Events</span>
                        <span className="text-green-400">✓</span>
                      </div>
                    </>
                  )}

                  {selectedTierDetails === 'Goddess' && (
                    <div className="flex items-center justify-between rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-3">
                      <span className="text-gray-300">Elite Status</span>
                      <span className="flex items-center gap-1 text-purple-400">
                        <Crown className="h-4 w-4" />
                        VIP
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
