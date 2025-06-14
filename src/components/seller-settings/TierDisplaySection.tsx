// src/components/seller-settings/TierDisplaySection.tsx
'use client';

import { Award, TrendingUp, Crown, Star, Gift, Target } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { TierLevel } from '@/utils/sellerTiers';

// Define TIER_LEVELS locally
const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number; credit: number }> = {
  'None': { minSales: 0, minAmount: 0, credit: 0 },
  'Tease': { minSales: 0, minAmount: 0, credit: 0 },
  'Flirt': { minSales: 10, minAmount: 5000, credit: 0.01 },
  'Obsession': { minSales: 101, minAmount: 12500, credit: 0.02 },
  'Desire': { minSales: 251, minAmount: 75000, credit: 0.03 },
  'Goddess': { minSales: 1001, minAmount: 150000, credit: 0.05 }
};

interface TierDisplaySectionProps {
  sellerTierInfo: any;
  userStats: {
    totalSales: number;
    totalRevenue: number;
  };
  nextTier: TierLevel;
  selectedTierDetails: TierLevel | null;
  onTierSelect: (tier: TierLevel | null) => void;
}

export default function TierDisplaySection({
  sellerTierInfo,
  userStats,
  nextTier,
  selectedTierDetails,
  onTierSelect
}: TierDisplaySectionProps) {
  return (
    <div className="mt-8 bg-gradient-to-r from-[#1a1a1a] to-[#272727] rounded-xl border border-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <div className="pr-6 flex-shrink-0">
            <TierBadge tier={sellerTierInfo.tier} size="2xl" showTooltip={true} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1 flex items-center">
              <Award className="w-5 h-5 mr-2 text-[#ff950e]" />
              Your Seller Tier: <span className="ml-2 text-[#ff950e]">{sellerTierInfo.tier}</span>
            </h2>
            <p className="text-gray-300">
              {sellerTierInfo.credit > 0 ? (
                <>You earn an additional <span className="font-bold text-green-400">{(sellerTierInfo.credit * 100).toFixed(0)}%</span> on all your sales!</>
              ) : (
                <>Make more sales to earn additional credits on your sales</>
              )}
            </p>
          </div>
        </div>
        
        {sellerTierInfo.tier !== 'Goddess' && (
          <div className="bg-[#111] border border-gray-800 rounded-lg p-3 shadow-inner">
            <div className="text-sm text-gray-400">Next tier: <span className="font-medium text-purple-400">{nextTier}</span></div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">
                Need: {TIER_LEVELS[nextTier].minSales} sales or ${TIER_LEVELS[nextTier].minAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Simple Interactive Tier Table */}
      <div className="bg-[#111] rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#ff950e]" />
          All Seller Tiers <span className="text-sm text-gray-500 font-normal">(Click to view details)</span>
        </h3>
        
        {/* Tier Badges Row */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {(['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'] as TierLevel[]).map((tier) => {
            const isCurrentTier = sellerTierInfo.tier === tier;
            const isSelected = selectedTierDetails === tier;
            
            return (
              <button
                key={tier}
                onClick={() => onTierSelect(isSelected ? null : tier)}
                className={`relative p-3 rounded-lg border-2 transition-all duration-300 ${
                  isCurrentTier 
                    ? 'border-[#ff950e] bg-[#ff950e]/10' 
                    : isSelected
                    ? 'border-purple-400 bg-purple-400/10'
                    : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <TierBadge tier={tier} size="xl" showTooltip={false} />
                  <div className="text-center">
                    <div className="font-medium text-white text-sm">{tier}</div>
                    <div className="text-xs text-gray-400">
                      +{(TIER_LEVELS[tier].credit * 100).toFixed(0)}%
                    </div>
                    {isCurrentTier && (
                      <div className="text-xs text-[#ff950e] font-medium mt-1">Current</div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Expanded Details */}
        {selectedTierDetails && (
          <div className="border-t border-gray-700 pt-4 animate-in slide-in-from-top duration-300">
            <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <TierBadge tier={selectedTierDetails} size="lg" showTooltip={false} />
                <div>
                  <h4 className="text-xl font-bold text-[#ff950e]">{selectedTierDetails} Tier</h4>
                  <p className="text-gray-400 text-sm">Level {['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'].indexOf(selectedTierDetails) + 1} of 5</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                <div>
                  <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Requirements
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-[#111] rounded">
                      <span className="text-gray-300">Total Sales</span>
                      <span className="text-[#ff950e] font-medium">{TIER_LEVELS[selectedTierDetails].minSales}+</span>
                    </div>
                    <div className="text-center text-gray-500 text-xs">OR</div>
                    <div className="flex items-center justify-between p-2 bg-[#111] rounded">
                      <span className="text-gray-300">Total Revenue</span>
                      <span className="text-[#ff950e] font-medium">${TIER_LEVELS[selectedTierDetails].minAmount.toLocaleString()}+</span>
                    </div>
                    
                    {/* User Progress */}
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <p className="text-xs text-gray-400 mb-2">Your Progress:</p>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Sales: {userStats.totalSales}</span>
                          <span className="text-gray-300">Revenue: ${userStats.totalRevenue.toLocaleString()}</span>
                        </div>
                        {selectedTierDetails !== sellerTierInfo.tier && (
                          <p className="text-green-400 mt-2">
                            Need: {Math.max(0, TIER_LEVELS[selectedTierDetails].minSales - userStats.totalSales)} more sales OR ${Math.max(0, TIER_LEVELS[selectedTierDetails].minAmount - userStats.totalRevenue).toLocaleString()} more revenue
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Benefits */}
                <div>
                  <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-400" />
                    Benefits
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-[#111] rounded">
                      <span className="text-gray-300">Bonus Credits</span>
                      <span className="text-green-400 font-bold">
                        {TIER_LEVELS[selectedTierDetails].credit > 0 ? `+${(TIER_LEVELS[selectedTierDetails].credit * 100).toFixed(0)}%` : 'None'}
                      </span>
                    </div>
                    
                    {selectedTierDetails !== 'Tease' && (
                      <>
                        <div className="flex items-center justify-between p-2 bg-[#111] rounded">
                          <span className="text-gray-300">Priority Support</span>
                          <span className="text-green-400">✓</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-[#111] rounded">
                          <span className="text-gray-300">Featured Profile</span>
                          <span className="text-green-400">✓</span>
                        </div>
                      </>
                    )}
                    
                    {(selectedTierDetails === 'Desire' || selectedTierDetails === 'Goddess') && (
                      <>
                        <div className="flex items-center justify-between p-2 bg-[#111] rounded">
                          <span className="text-gray-300">Custom Badge</span>
                          <span className="text-green-400">✓</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-[#111] rounded">
                          <span className="text-gray-300">VIP Events</span>
                          <span className="text-green-400">✓</span>
                        </div>
                      </>
                    )}
                    
                    {selectedTierDetails === 'Goddess' && (
                      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded border border-purple-500/30">
                        <span className="text-gray-300">Elite Status</span>
                        <span className="text-purple-400 flex items-center gap-1">
                          <Crown className="w-4 h-4" />
                          VIP
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
