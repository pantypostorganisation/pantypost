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
// SecureImage is exported from SecureMessageDisplay -- there is no
// separate SecureImage module in this codebase.
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import type { TierInfo } from '@/utils/sellerTiers';

interface ProfileHeaderProps {
  username: string;
  profilePic: string | null;
  /* Approved banner only. Falls back to a flat raised surface when the
     seller has not set one. */
  coverPhoto?: string | null;
  bio: string;
  isVerified: boolean;
  sellerTierInfo?: TierInfo | null;

  averageRating: number | null;
  reviewCount: number;
  totalSales: number;
  listingCount: number;
  /* ISO date. Rendered as days, months or years on Panty Post. */
  memberSince?: string | null;
  /* Only pass this when the seller has location sharing switched on --
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

/* Days, then months, then years -- in that order.
   The previous version floored to months with a Math.max(1, ...), so
   an account created five minutes ago announced "1 month on Panty
   Post". On a marketplace whose entire pitch is that nothing here is
   fabricated, a stat that rounds a brand new seller up to a month is
   exactly the wrong thing to get wrong. */
function membershipLabel(memberSince?: string | null): string | null {
  if (!memberSince) return null;

  const joined = new Date(memberSince);
  if (Number.isNaN(joined.getTime())) return null;

  const elapsed = Date.now() - joined.getTime();
  if (elapsed < 0) return null;

  const DAY = 24 * 60 * 60 * 1000;
  const days = Math.floor(elapsed / DAY);

  if (days < 1) return 'Joined today';
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} on Panty Post`;

  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} on Panty Post`;

  const years = Math.floor(days / 365.25);
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
  // plain surface show through instead.
  const [coverFailed, setCoverFailed] = useState(false);
  // A profilePic URL can point at a file that no longer exists on the
  // server -- the DB row outlives the upload. Falling back to another
  // file only chains one 404 to the next, so a failed avatar drops to
  // the initial instead, which cannot break.
  const [avatarFailed, setAvatarFailed] = useState(false);

  const safeUsername = sanitizeStrict(username);
  const hasRating = typeof averageRating === 'number' && averageRating > 0;
  const membership = membershipLabel(memberSince);
  const showCover = Boolean(coverPhoto) && !coverFailed;
  const showAvatar = Boolean(profilePic) && !avatarFailed;

  const priceLabel =
    typeof subscriptionPrice === 'number' && subscriptionPrice > 0
      ? `$${subscriptionPrice.toFixed(2)}`
      : null;

  const showActions = !isOwnProfile;

  return (
    <header>
      {/* --- Cover ---
          Full-bleed banner. With no image it is a single flat surface
          from the token scale, not a gradient: a gradient here was the
          only decorative surface treatment left on the page. */}
      <div className="relative h-40 w-full overflow-hidden bg-surface-overlay sm:h-56 md:h-64">
        {showCover && (
          <>
            <SecureImage
              src={coverPhoto as string}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setCoverFailed(true)}
            />
            {/* Scrim exists to keep the avatar edge legible against a
                photo. Over the flat fallback there is nothing to
                separate, so it only renders with an image behind it. */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          </>
        )}
      </div>

      {/* --- Identity --- */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-12 flex flex-col gap-5 pb-6 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          {/* Mobile stacks the name and stats BELOW the avatar; only
              from sm up do they sit beside it, bottom-aligned.
              Bottom-aligning on a phone was the bug: the stats row
              wraps to two or three lines on a narrow screen, and
              because the block grows upward from its baseline, the
              extra height pushed the username and the first stats line
              up behind the cover photo. Desktop never showed it because
              the stats fit on one line there. */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-lg border-4 border-surface bg-surface-overlay sm:h-28 sm:w-28">
                {showAvatar ? (
                  <SecureImage
                    src={profilePic as string}
                    alt={safeUsername}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-3xl font-bold text-primary">
                    {safeUsername.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Sat at -bottom-2 -right-2, overlapping the avatar's own
                  4px border, which read as squashed rather than layered.
                  Pushed out so it clears the border and sits ON the
                  corner instead of inside it. */}
              {sellerTierInfo && sellerTierInfo.tier !== 'None' && (
                <div className="absolute -bottom-3 -right-3">
                  <TierBadge tier={sellerTierInfo.tier} size="md" showTooltip />
                </div>
              )}
            </div>

            <div className="min-w-0 sm:pb-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                <span className="truncate">{safeUsername}</span>
                {isVerified && (
                  <BadgeCheck
                    className="h-5 w-5 shrink-0 text-primary"
                    aria-label="Identity verified"
                  />
                )}
              </h1>

              {/* Stats row. Reads as one sentence of credentials rather
                  than a grid of boxes, which is what keeps a shop header
                  compact. */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                {hasRating ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="font-semibold text-ink">
                      {(averageRating as number).toFixed(1)}
                    </span>
                    <span>
                      ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </span>
                ) : (
                  <span className="text-ink-faint">No reviews yet</span>
                )}

                <span className="text-ink-faint">{'\u00B7'}</span>

                <span className="inline-flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {totalSales.toLocaleString()} {totalSales === 1 ? 'sale' : 'sales'}
                </span>

                <span className="text-ink-faint">{'\u00B7'}</span>

                <span className="inline-flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {listingCount} {listingCount === 1 ? 'item' : 'items'}
                </span>

                {membership && (
                  <>
                    <span className="text-ink-faint">{'\u00B7'}</span>
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
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-faint">
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
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isFavorited
                      ? 'border-primary-line bg-primary-soft text-primary'
                      : 'border-line text-ink hover:border-line-strong'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-primary' : ''}`} />
                </button>
              )}

              {onMessage && (
                <button
                  onClick={onMessage}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-line-strong sm:flex-none"
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
                  className="group flex flex-1 items-center justify-center gap-2 rounded-md border border-primary-line bg-primary-soft px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:border-danger hover:text-danger sm:flex-none"
                >
                  <Check className="h-4 w-4 group-hover:hidden" />
                  <span className="group-hover:hidden">Subscribed</span>
                  <span className="hidden group-hover:inline">Unsubscribe</span>
                </button>
              ) : (
                !hasAccess &&
                onSubscribe && (
                  /* Black text on the accent is 9.56:1. White would be
                     2.20:1 and fail WCAG AA. */
                  <button
                    onClick={onSubscribe}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover sm:flex-none"
                  >
                    <Heart className="h-4 w-4" />
                    Subscribe{priceLabel ? ` \u00B7 ${priceLabel}` : ''}
                  </button>
                )
              )}

              {onTip && (
                <button
                  onClick={onTip}
                  className="hidden items-center justify-center rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-line-strong sm:flex"
                >
                  Tip
                </button>
              )}
            </div>
          )}
        </div>

        {bio && (
          <p className="max-w-3xl pb-6 text-sm leading-relaxed text-ink-muted">
            {sanitizeStrict(bio)}
          </p>
        )}
      </div>
    </header>
  );
}

