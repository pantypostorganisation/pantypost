'use client';

import Image from 'next/image';
import { useState } from 'react';
import { TierInfo, TierLevel, TIER_LEVELS } from '@/utils/sellerTiers';

interface TierBadgeProps {
  tier?: TierLevel | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const TierBadge = ({
  tier = 'Tease',
  size = 'md',
  showTooltip = true,
  className = '',
}: TierBadgeProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // If no tier provided or "None", don't render anything
  if (!tier || tier === 'None') {
    return null;
  }
  
  const tierInfo = TIER_LEVELS[tier] || TIER_LEVELS.Tease;
  
  // Size mappings for the badge
  const sizeClasses = {
    sm: {
      wrapper: 'h-4 w-4',
      tooltip: 'w-48',
    },
    md: {
      wrapper: 'h-6 w-6',
      tooltip: 'w-52',
    },
    lg: {
      wrapper: 'h-8 w-8',
      tooltip: 'w-56',
    },
  };
  
  // Color classes based on tier
  const tierColorClasses = {
    Tease: 'bg-gray-100 border-gray-300',
    Flirt: 'bg-pink-100 border-pink-300',
    Obsession: 'bg-purple-100 border-purple-300',
    Desire: 'bg-blue-200 border-blue-400',
    Goddess: 'bg-gradient-to-r from-yellow-300 to-amber-500 border-amber-600',
  };
  
  // Display credit as percentage
  const creditPercent = (tierInfo.credit * 100).toFixed(0);
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => showTooltip && setShowDetails(true)}
      onMouseLeave={() => showTooltip && setShowDetails(false)}
    >
      <div 
        className={`${sizeClasses[size].wrapper} rounded-full overflow-hidden border-2 
                   ${tierColorClasses[tier]} flex items-center justify-center cursor-help`}
      >
        {tierInfo.badgeImage ? (
          <Image
            src={tierInfo.badgeImage}
            alt={`${tier} Seller Badge`}
            width={size === 'lg' ? 32 : size === 'md' ? 24 : 16}
            height={size === 'lg' ? 32 : size === 'md' ? 24 : 16}
            className="object-contain"
          />
        ) : (
          <span className={`text-${size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'base'} font-bold text-center`}>
            {tier.charAt(0)}
          </span>
        )}
      </div>
      
      {/* Tooltip */}
      {showDetails && showTooltip && (
        <div 
          className={`absolute z-10 ${sizeClasses[size].tooltip} bg-white rounded-md shadow-lg p-3 text-sm
                     border border-gray-200 -translate-x-1/2 left-1/2 mt-1`}
        >
          <div className="font-bold text-center mb-1">
            {tier === 'Goddess' ? (
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-700">
                {tier} Seller
              </span>
            ) : (
              <span>{tier} Seller</span>
            )}
          </div>
          
          <div className="text-xs space-y-1">
            <p>• {creditPercent}% credit on all sales</p>
            <p>• Unlocked at {tierInfo.minSales}+ sales</p>
            <p>• Or ${tierInfo.minAmount.toLocaleString()}+ in total sales</p>
            
            {tier === 'Goddess' && (
              <p className="text-amber-700 font-medium mt-1">• Top-tier seller status</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TierBadge;