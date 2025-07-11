// src/components/TierBadge.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { TierInfo, TierLevel, TIER_LEVELS } from '@/utils/sellerTiers';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface TierBadgeProps {
  tier?: TierLevel | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showTooltip?: boolean;
  className?: string;
}

// Valid tier levels for validation
const VALID_TIER_LEVELS: TierLevel[] = ['None', 'Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
const VALID_SIZES = ['sm', 'md', 'lg', 'xl', '2xl'] as const;

// Helper functions defined outside the component
// Get user-friendly tier number
const getTierNumber = (tierName: TierLevel): string => {
  const tierMap: Record<TierLevel, string> = {
    None: "0",
    Tease: "tier 1",
    Flirt: "tier 2",
    Obsession: "tier 3", 
    Desire: "tier 4",
    Goddess: "tier 5"
  };
  return tierMap[tierName] || "tier 1";
};

// Get display name (capitalize first letter) with sanitization
const getTierDisplayName = (tierName: TierLevel): string => {
  const sanitized = sanitizeStrict(tierName);
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};

// Get tier-specific colors for text
const getTierColor = (tierName: TierLevel): string => {
  const tierColorMap: Record<TierLevel, string> = {
    None: "#ffffff",
    Tease: "#e37c89",
    Flirt: "#711b2a",
    Obsession: "#2e0c29",
    Desire: "#541831",
    Goddess: "#fddc93"
  };
  return tierColorMap[tierName] || "#e37c89";
};

const TierBadge = ({
  tier = 'Tease',
  size = 'md',
  showTooltip = true,
  className = '',
}: TierBadgeProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Validate tier level
  const validatedTier = tier && VALID_TIER_LEVELS.includes(tier) ? tier : 'Tease';
  
  // Validate size
  const validatedSize = VALID_SIZES.includes(size as typeof VALID_SIZES[number]) ? size : 'md';
  
  // If no tier provided or "None", don't render anything
  if (!tier || tier === 'None') {
    return null;
  }
  
  const tierInfo = TIER_LEVELS[validatedTier] || TIER_LEVELS.Tease;
  
  // Size mappings for the badge with expanded sizes
  const sizeClasses = {
    sm: {
      image: 20,
      tooltip: 'w-48',
    },
    md: {
      image: 32,
      tooltip: 'w-52',
    },
    lg: {
      image: 48,
      tooltip: 'w-56',
    },
    xl: {
      image: 64,
      tooltip: 'w-60',
    },
    '2xl': {
      image: 96,
      tooltip: 'w-64',
    },
  };
  
  // Get the image size based on the selected size
  const imageSize = sizeClasses[validatedSize]?.image || 64;
  
  // Sanitize numerical values
  const sanitizedMinSales = sanitizeNumber(tierInfo.minSales, 0, 999999, 0);
  const sanitizedMinAmount = sanitizeNumber(tierInfo.minAmount, 0, 9999999, 2);
  const sanitizedCredit = sanitizeNumber(tierInfo.credit, 0, 1, 2);
  
  return (
    <div
      className={`relative inline-block ${sanitizeStrict(className)}`}
      onMouseEnter={() => showTooltip && setShowDetails(true)}
      onMouseLeave={() => showTooltip && setShowDetails(false)}
    >
      {/* Badge image with higher quality and better rendering */}
      {tierInfo.badgeImage ? (
        <div className="flex items-center justify-center">
          <Image
            src={tierInfo.badgeImage}
            alt={`${getTierDisplayName(validatedTier)} Seller Badge`}
            width={imageSize}
            height={imageSize}
            className="object-contain drop-shadow-lg"
            quality={100}
            priority={size === 'xl' || size === '2xl'}
            unoptimized={false}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <span className="font-bold text-center text-xl">
            <SecureMessageDisplay 
              content={validatedTier.charAt(0)}
              allowBasicFormatting={false}
            />
          </span>
        </div>
      )}
      
      {/* Tooltip */}
      {showDetails && showTooltip && (
        <div
          className={`absolute z-10 ${sizeClasses[validatedSize]?.tooltip || 'w-60'} bg-[#1a1a1a] rounded-md shadow-lg p-4 text-sm
                   border border-gray-700 -translate-x-1/2 left-1/2 mt-1`}
          role="tooltip"
        >
          <div className="font-bold text-center mb-2" style={{ color: getTierColor(validatedTier) }}>
            <SecureMessageDisplay 
              content={`${getTierDisplayName(validatedTier)} ${validatedTier !== 'Goddess' ? 'Seller' : ''}`}
              allowBasicFormatting={false}
            />
          </div>
          
          <div className="text-gray-200 space-y-2">
            <p>This seller is {getTierNumber(validatedTier)} out of 5 as they have:</p>
            <p>• {sanitizedMinSales.toLocaleString()}+ sales <span className="text-gray-400">OR</span></p>
            <p>• ${sanitizedMinAmount.toLocaleString()}+ in total sales</p>
            <p className="pt-1 text-[#ff950e] font-medium">
              This seller earns an extra {(sanitizedCredit * 100).toFixed(0)}% on all sales made
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierBadge;
