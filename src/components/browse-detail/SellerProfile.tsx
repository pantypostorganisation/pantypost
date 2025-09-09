// src/components/browse-detail/SellerProfile.tsx
'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import StarRating from '@/components/StarRating';
import { SellerProfileProps } from '@/types/browseDetail';
import { sanitizeUsername } from '@/utils/security/sanitization';

export default function SellerProfile({
  seller,
  sellerProfile,
  sellerTierInfo,
  sellerAverageRating,
  sellerReviewCount,
  isVerified,
}: SellerProfileProps) {
  const safeUsername = sanitizeUsername(seller);

  // Ensure we have valid review data
  const hasReviews = sellerReviewCount > 0;
  
  // Force use the actual rating value if it exists
  let displayRating = 0;
  if (sellerAverageRating !== null && sellerAverageRating !== undefined) {
    displayRating = Number(sellerAverageRating);
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* Profile Photo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#ff950e] bg-gray-700 flex items-center justify-center overflow-hidden">
            {sellerProfile.pic ? (
              <img
                src={sellerProfile.pic}
                alt={safeUsername}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.src = '/default-avatar.png';
                  img.onerror = null;
                }}
              />
            ) : (
              <span className="text-lg font-bold text-[#ff950e]">{safeUsername?.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {/* Tier Badge */}
          {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
            <div className="absolute -bottom-1.5 -right-1.5" style={{ transform: 'translate(6px, 6px)' }}>
              <TierBadge tier={sellerTierInfo.tier} size="md" showTooltip />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium truncate">{safeUsername}</h3>
            {isVerified && <img src="/verification_badge.png" alt="Verified" className="w-4 h-4" />}
          </div>

          {/* Star Rating Display */}
          {hasReviews && displayRating > 0 ? (
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={displayRating} size="sm" />
              <span className="text-[#ff950e] text-sm font-semibold">
                {displayRating.toFixed(1)}
              </span>
              <span className="text-gray-400 text-xs">
                ({sellerReviewCount} review{sellerReviewCount !== 1 ? 's' : ''})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={0} size="sm" />
              <span className="text-gray-500 text-xs">No reviews yet</span>
            </div>
          )}

          <p className="text-gray-400 text-sm leading-relaxed break-words">{sellerProfile.bio || 'No bio provided.'}</p>
        </div>

        <Link href={`/sellers/${safeUsername}`} className="text-[#ff950e] text-sm font-medium hover:text-[#e88800] transition-colors whitespace-nowrap">
          View Profile
        </Link>
      </div>
    </div>
  );
}
