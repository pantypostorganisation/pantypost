// src/components/seller-settings/modals/TierDetailsModal.tsx
'use client';

import { X, Award, TrendingUp, Crown, Star, Gift, Target, CheckCircle } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { TierLevel } from '@/utils/sellerTiers';

// Define TIER_LEVELS locally with proper typing
const TIER_LEVELS: Record<TierLevel, { minSales: number; minAmount: number }> = {
  'None': { minSales: 0, minAmount: 0 },
  'Tease': { minSales: 0, minAmount: 0 },
  'Flirt': { minSales: 10, minAmount: 5000 },
  'Obsession': { minSales: 101, minAmount: 12500 },
  'Desire': { minSales: 251, minAmount: 75000 },
  'Goddess': { minSales: 1001, minAmount: 150000 }
};

interface TierDetailsModalProps {
  selectedTier: TierLevel | null;
  onClose: () => void;
}

export default function TierDetailsModal({ selectedTier, onClose }: TierDetailsModalProps) {
  if (!selectedTier) return null;

  const tierInfo = TIER_LEVELS[selectedTier];
  const tiers: TierLevel[] = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
  
  // Helper function to get benefits for each tier
  const getBenefitsForTier = (tier: TierLevel): string[] => {
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
  };
  
  const getTierIcon = (tier: TierLevel) => {
    switch(tier) {
      case 'Tease': return <Star className="w-8 h-8" />;
      case 'Flirt': return <Gift className="w-8 h-8" />;
      case 'Obsession': return <Award className="w-8 h-8" />;
      case 'Desire': return <Crown className="w-8 h-8" />;
      case 'Goddess': return <Target className="w-8 h-8" />;
      default: return <Award className="w-8 h-8" />;
    }
  };

  const getTierColor = (tier: TierLevel) => {
    switch(tier) {
      case 'Tease': return 'from-gray-500 to-gray-700';
      case 'Flirt': return 'from-blue-500 to-blue-700';
      case 'Obsession': return 'from-purple-500 to-purple-700';
      case 'Desire': return 'from-pink-500 to-pink-700';
      case 'Goddess': return 'from-[#ff950e] to-[#ff6b00]';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getTierColor(selectedTier)} p-6 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-white">
              {getTierIcon(selectedTier)}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">{selectedTier} Tier</h2>
              <p className="text-white/80">Seller Achievement Level</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Requirements */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#ff950e]" />
              Requirements
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black rounded-lg p-4">
                <p className="text-sm text-gray-400">Minimum Sales</p>
                <p className="text-2xl font-bold text-[#ff950e]">{tierInfo.minSales}</p>
              </div>
              <div className="bg-black rounded-lg p-4">
                <p className="text-sm text-gray-400">Minimum Revenue</p>
                <p className="text-2xl font-bold text-[#ff950e]">${tierInfo.minAmount}</p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Benefits
            </h3>
            <ul className="space-y-2">
              {getBenefitsForTier(selectedTier).map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tier Progression */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#ff950e]" />
              Tier Progression
            </h3>
            <div className="flex items-center justify-between">
              {tiers.map((tier, index) => (
                <div key={tier} className="flex items-center">
                  <div className={`flex flex-col items-center ${tier === selectedTier ? 'scale-110' : ''}`}>
                    <TierBadge 
                      tier={tier} 
                      size="sm" 
                      className={tier === selectedTier ? 'ring-2 ring-[#ff950e]' : 'opacity-60'}
                    />
                    <span className={`text-xs mt-1 ${tier === selectedTier ? 'text-[#ff950e] font-bold' : 'text-gray-500'}`}>
                      {tier}
                    </span>
                  </div>
                  {index < tiers.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-700 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
