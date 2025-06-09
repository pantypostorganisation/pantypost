// src/components/browse-detail/SellerProfile.tsx
'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import StarRating from '@/components/StarRating';
import { SellerProfileProps } from '@/types/browseDetail';

export default function SellerProfile({
  seller,
  sellerProfile,
  sellerTierInfo,
  sellerAverageRating,
  sellerReviewCount,
  isVerified
}: SellerProfileProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* Profile Photo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#ff950e] bg-gray-700 flex items-center justify-center overflow-hidden">
            {sellerProfile.pic ? (
              <img src={sellerProfile.pic} alt={seller} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-[#ff950e]">
                {seller?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Tier Badge */}
          {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
            <div className="absolute -bottom-1.5 -right-1.5" style={{ transform: 'translate(6px, 6px)' }}>
              <TierBadge tier={sellerTierInfo.tier} size="md" showTooltip={true} />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium">{seller}</h3>
            {isVerified && (
              <img src="/verification_badge.png" alt="Verified" className="w-4 h-4" />
            )}
          </div>
          
          {/* Star Rating Display */}
          {sellerAverageRating !== null && sellerAverageRating !== undefined ? (
            <div className="flex items-center gap-2 mb-2">
              <StarRating rating={sellerAverageRating} size="sm" />
              <span className="text-yellow-400 text-sm font-medium">
                {sellerAverageRating.toFixed(1)}
              </span>
              <span className="text-gray-500 text-xs">
                ({sellerReviewCount} review{sellerReviewCount !== 1 ? 's' : ''})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-gray-500">
                <Star className="w-4 h-4" />
                <span className="text-xs">No reviews yet</span>
              </div>
            </div>
          )}
          
          <p className="text-gray-400 text-sm leading-relaxed">
            {sellerProfile.bio || 'No bio provided.'}
          </p>
        </div>
        
        <Link
          href={`/sellers/${seller}`}
          className="text-[#ff950e] text-sm font-medium hover:text-[#e88800] transition-colors whitespace-nowrap"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}