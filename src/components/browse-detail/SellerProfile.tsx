// src/components/browse-detail/SellerProfile.tsx
'use client';

import Link from 'next/link';
import { BadgeCheck, ChevronRight } from 'lucide-react';
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
  const hasReviews = sellerReviewCount > 0;
  const displayRating =
    sellerAverageRating !== null && sellerAverageRating !== undefined
      ? Number(sellerAverageRating)
      : 0;

  return (
    <Link
      href={`/sellers/${safeUsername}`}
      className="group flex items-start gap-4 rounded-lg border border-line bg-surface-raised p-4 transition-colors hover:border-line-strong"
    >
      <div className="relative shrink-0">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-surface-overlay ring-1 ring-line">
          {sellerProfile.pic ? (
            <img
              src={sellerProfile.pic}
              alt={safeUsername}
              className="h-full w-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                img.src = '/default-avatar.png';
                img.onerror = null;
              }}
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-lg font-semibold text-primary">
              {safeUsername?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
          <div className="absolute -bottom-1 -right-1">
            <TierBadge tier={sellerTierInfo.tier} size="sm" showTooltip />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <h3 className="font-display truncate text-lg text-ink">{safeUsername}</h3>
          {isVerified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified seller" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <StarRating rating={hasReviews ? displayRating : 0} size="sm" />
          {hasReviews && displayRating > 0 ? (
            <span className="text-xs text-ink-muted">
              {displayRating.toFixed(1)} · {sellerReviewCount}{' '}
              {sellerReviewCount === 1 ? 'review' : 'reviews'}
            </span>
          ) : (
            <span className="text-xs text-ink-faint">No reviews yet</span>
          )}
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {sellerProfile.bio || 'No bio provided.'}
        </p>
      </div>

      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-ink-muted" />
    </Link>
  );
}
