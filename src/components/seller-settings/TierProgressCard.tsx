// src/components/seller-settings/TierProgressCard.tsx
'use client';

import { Award, TrendingUp, Crown, Star, Gift, Target } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { TierLevel } from '@/utils/sellerTiers';

// Define TIER_LEVELS locally to match the structure with proper typing
const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number }> = {
  'None': { minSales: 0, minAmount: 0 },
  'Tease': { minSales: 0, minAmount: 0 },
  'Flirt': { minSales: 10, minAmount: 5000 },
  'Obsession': { minSales: 101, minAmount: 12500 },
  'Desire': { minSales: 251, minAmount: 75000 },
  'Goddess': { minSales: 1001, minAmount: 150000 }
};

interface TierProgressCardProps {
  sellerTierInfo: any;
  userStats: {
    totalSales: number;
    totalRevenue: number;
  };
  tierProgress: {
    salesProgress: number;
    revenueProgress: number;
  };
  nextTier: TierLevel;
  onTierClick: (tier: TierLevel) => void;
}

export default function TierProgressCard({
  sellerTierInfo,
  userStats,
  tierProgress,
  nextTier,
  onTierClick
}: TierProgressCardProps) {
  if (!sellerTierInfo) return null;

  const currentTier = sellerTierInfo.tier as TierLevel;
  const currentRequirements = TIER_LEVELS[currentTier];
  const nextRequirements = TIER_LEVELS[nextTier];

  const getTierIcon = (tier: TierLevel) => {
    switch(tier) {
      case 'Tease': return <Star className="w-5 h-5" />;
      case 'Flirt': return <Gift className="w-5 h-5" />;
      case 'Obsession': return <Award className="w-5 h-5" />;
      case 'Desire': return <Crown className="w-5 h-5" />;
      case 'Goddess': return <Target className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

  if (!sellerTierInfo) return null;

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 opacity-10">
        {getTierIcon(sellerTierInfo.tier)}
      </div>
      
      <h2 className="text-xl font-bold mb-6 text-white">Seller Tier Progress</h2>
      
      {/* Current Tier Display */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Current Tier</p>
          <div className="flex items-center gap-2">
            <TierBadge tier={currentTier} size="md" />
            <span className="text-lg font-bold text-white">{currentTier}</span>
          </div>
        </div>
        <button
          onClick={() => onTierClick(currentTier)}
          className="text-[#ff950e] text-sm hover:underline"
        >
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
          <p className="text-xl font-bold text-[#ff950e]">${userStats.totalRevenue.toFixed(2)}</p>
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
              <span>Sales: {userStats.totalSales}/{nextRequirements.minSales}</span>
              <span>{tierProgress.salesProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] h-2 rounded-full transition-all duration-500"
                style={{ width: `${tierProgress.salesProgress}%` }}
              />
            </div>
          </div>
          
          {/* Revenue Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Revenue: ${userStats.totalRevenue.toFixed(0)}/${nextRequirements.minAmount}</span>
              <span>{tierProgress.revenueProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#ff950e] to-[#ff6b00] h-2 rounded-full transition-all duration-500"
                style={{ width: `${tierProgress.revenueProgress}%` }}
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Reach both milestones to unlock {nextTier} tier
          </p>
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
