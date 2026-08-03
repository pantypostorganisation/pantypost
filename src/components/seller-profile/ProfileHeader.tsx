// src/components/seller-profile/ProfileHeader.tsx
'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Star,
  MessageCircle,
  Heart,
  Package,
  Calendar,
  ShoppingBag,
  Check,
  MapPin,
} from 'lucide-react';
import TierBadge from '@/components/TierBadge';
// SecureImage is exported from SecureMessageDisplay — there is no
// separate SecureImage module in this codebase.
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import type { TierInfo } from '@/utils/sellerTiers';

interface ProfileHeaderProps {
  username: string;
  profilePic: string | null;
  /* Approved banner only. Falls back to a brand gradient when the seller
     has not set one, so a new profile still looks finished. */
  coverPhoto?: string | null;
  bio: string;
  isVerified: boolean;
  sellerTierInfo?: TierInfo | null;

  averageRating: number | null;
  reviewCount: number;
  totalSales: number;
  listingCount: number;
  /* ISO date. Rendered as "X years on Panty Post". */
  memberSince?: string | null;
  /* Only pass this when the seller has location sharing switched on —
     the component does not know about the privacy flag. */
  location?: string | null;

  isOwnProfile?: boolean;

  /* Subscription state. hasAccess is undefined until the check resolves,
     so the button stays in its neutral state rather than flashing
     "Subscribe" and then correcting itself. */
  hasAccess?: boolean;
  subscriptionPrice?: number | null;

  isFavorited?: boolean;
  onToggleFavorite?: () => void;

  onMessage?: () => void;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  onTip?: () => void;
}

/** Whole years, or a month count for anything under a year. */
function membershipLabel(memberSince?: string | null): string | null {
  if (!memberSince) return null;

  const joined = new Date(memberSince);
  if (Number.isNaN(joined.getTime())) return null;

  const years = Math.floor((Date.now() - joined.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  if (years < 1) {
    const months = Math.max(
      1,
      Math.floor((Date.now() - joined.getTime()) / (30.44 * 24 * 60 * 60 * 1000))
    );
    return `${months} ${months === 1 ? 'month' : 'months'} on Panty Post`;
  }

  return `${years} ${years === 1 ? 'year' : 'years'} on Panty Post`;
}

export default function ProfileHeader({
  username,
  profilePic,
  coverPhoto,
  bio,
  isVerified,
  sellerTierInfo,
  averageRating,
  reviewCount,
  totalSales,
  listingCount,
  memberSince,
  location,
  isOwnProfile = false,
  hasAccess,
  subscriptionPrice,
  isFavorited = false,
  onToggleFavorite,
  onMessage,
  onSubscribe,
  onUnsubscribe,
  onTip,
}: ProfileHeaderProps) {
  // SecureImage swaps to its fallback on error, which for a banner would
  // mean a grey "Invalid image" block. Tracking the failure here lets the
  // gradient show through instead.
  const [coverFailed, setCoverFailed] = useState(false);

  const safeUsername = sanitizeStrict(username);
  const hasRating = typeof averageRating === 'number' && averageRating > 0;
  const membership = membershipLabel(memberSince);
  const showCover = Boolean(coverPhoto) && !coverFailed;

  const priceLabel =
    typeof subscriptionPrice === 'number' && subscriptionPrice > 0
      ? `$${subscriptionPrice.toFixed(2)}`
      : null;

  const showActions = !isOwnProfile;

  return (
    <header>
      {/* --- Cover ---
          Full-bleed banner, as on a shop page. Falls back to a subtle
          brand gradient rather than a grey block when no image exists. */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#241505] to-[#0f0f0f] sm:h-56 md:h-64">
        {showCover && (
          <SecureImage
            src={coverPhoto as string}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setCoverFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* --- Identity --- */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-12 flex flex-col gap-5 pb-6 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-black bg-[#1a1a1a] sm:h-28 sm:w-28">
                {profilePic ? (
                  <SecureImage
                    src={profilePic}
                    alt={safeUsername}
                    className="h-full w-full object-cover"
                    fallbackSrc="/default-avatar.png"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-3xl font-bold text-[#ff950e]">
                    {safeUsername.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
                <div className="absolute -bottom-2 -right-2">
                  <TierBadge tier={sellerTierInfo.tier} size="md" showTooltip />
                </div>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
                <span className="truncate">{safeUsername}</span>
                {isVerified && (
                  <BadgeCheck
                    className="h-5 w-5 shrink-0 text-[#ff950e]"
                    aria-label="Identity verified"
                  />
                )}
              </h1>

              {/* Stats row. Reads as one sentence of credentials rather
                  than a grid of boxes, which is what keeps a shop header
                  compact. */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
                {hasRating ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-[#ff950e] text-[#ff950e]" />
                    <span className="font-semibold text-white">
                      {(averageRating as number).toFixed(1)}
                    </span>
                    <span>
                      ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-500">No reviews yet</span>
                )}

                <span className="text-gray-700">·</span>

                <span className="inline-flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {totalSales.toLocaleString()} {totalSales === 1 ? 'sale' : 'sales'}
                </span>

                <span className="text-gray-700">·</span>

                <span className="inline-flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {listingCount} {listingCount === 1 ? 'item' : 'items'}
                </span>

                {membership && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {membership}
                    </span>
                  </>
                )}
              </div>

              {/* Kept on its own line so the credentials row above stays
                  exactly as specified. */}
              {location && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Ships from {sanitizeStrict(location)}
                </p>
              )}
            </div>
          </div>

          {/* Actions, right-aligned on desktop and full-width on mobile
              so they sit in the thumb zone. */}
          {showActions && (
            <div className="flex shrink-0 items-center gap-2">
              {onToggleFavorite && (
                <button
                  onClick={onToggleFavorite}
                  aria-pressed={isFavorited}
                  aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
                  title={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                    isFavorited
                      ? 'border-[#ff950e] bg-[#ff950e]/10 text-[#ff950e]'
                      : 'border-gray-700 text-white hover:border-gray-500'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-[#ff950e]' : ''}`} />
                </button>
              )}

              {onMessage && (
                <button
                  onClick={onMessage}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-700 px-5 py-2.5 text-sm font-medium text-white transition hover:border-gray-500 sm:flex-none"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </button>
              )}

              {/* One button covers both directions. When the viewer is
                  already subscribed it reads as state, not as another
                  invitation to subscribe. */}
              {hasAccess && onUnsubscribe ? (
                <button
                  onClick={onUnsubscribe}
                  className="group flex flex-1 items-center justify-center gap-2 rounded-full border border-[#ff950e]/60 bg-[#ff950e]/10 px-5 py-2.5 text-sm font-semibold text-[#ff950e] transition hover:border-red-500/60 hover:bg-red-500/10 hover:text-red-300 sm:flex-none"
                >
                  <Check className="h-4 w-4 group-hover:hidden" />
                  <span className="group-hover:hidden">Subscribed</span>
                  <span className="hidden group-hover:inline">Unsubscribe</span>
                </button>
              ) : (
                !hasAccess &&
                onSubscribe && (
                  /* Black text on #ff950e is 9.56:1. White would be
                     2.20:1 and fail WCAG AA. */
                  <button
                    onClick={onSubscribe}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff950e] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#ffa733] sm:flex-none"
                  >
                    <Heart className="h-4 w-4" />
                    Subscribe{priceLabel ? ` · ${priceLabel}` : ''}
                  </button>
                )
              )}

              {onTip && (
                <button
                  onClick={onTip}
                  className="hidden items-center justify-center rounded-full border border-gray-700 px-4 py-2.5 text-sm font-medium text-white transition hover:border-gray-500 sm:flex"
                >
                  Tip
                </button>
              )}
            </div>
          )}
        </div>

        {bio && (
          <p className="max-w-3xl pb-6 text-sm leading-relaxed text-gray-400">
            {sanitizeStrict(bio)}
          </p>
        )}
      </div>
    </header>
  );
}
