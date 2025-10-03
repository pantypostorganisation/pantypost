// src/components/seller-profile/ProfileHeader.tsx
'use client';

import Link from 'next/link';
import {
  Lock,
  Mail,
  Gift,
  DollarSign,
  MessageCircle,
  Camera,
  Video,
  Users,
  Star,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { formatActivityStatus } from '@/utils/format';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';
import { z } from 'zod';
import { resolveApiUrl } from '@/utils/url';
import type { TierLevel } from '@/utils/sellerTiers';

/** Valid TierLevel literals we accept */
const VALID_TIERS: TierLevel[] = ['None', 'Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];

/** Type guard for TierLevel */
function isTierLevel(val: unknown): val is TierLevel {
  return typeof val === 'string' && (VALID_TIERS as readonly string[]).includes(val);
}

/** Normalize arbitrary input to a valid TierLevel or null */
function normalizeTier(input: unknown): TierLevel | null {
  if (isTierLevel(input)) return input;

  if (typeof input === 'string') {
    const s = input.trim().toLowerCase();
    switch (s) {
      case 'none':
        return 'None';
      case 'tease':
        return 'Tease';
      case 'flirt':
        return 'Flirt';
      case 'obsession':
        return 'Obsession';
      case 'desire':
        return 'Desire';
      case 'goddess':
        return 'Goddess';
      default:
        return null;
    }
  }
  return null;
}

const UserSchema = z
  .object({
    username: z.string().default(''),
    role: z.enum(['buyer', 'seller', 'admin']).optional(),
  })
  .nullable()
  .optional();

/**
 * Keep sellerTierInfo flexible (backend may send any shape).
 * We'll normalize the .tier field at runtime to TierLevel | null.
 */
const SellerTierInfoSchema = z
  .object({
    tier: z.unknown().optional(),
  })
  .nullable()
  .optional();

const PropsSchema = z.object({
  username: z.string().default(''),
  profilePic: z.string().nullable().optional(),
  bio: z.string().default(''),
  isVerified: z.boolean().default(false),
  sellerTierInfo: SellerTierInfoSchema,
  user: UserSchema,
  onShowSubscribeModal: z.function().args().returns(z.void()),
  onShowUnsubscribeModal: z.function().args().returns(z.void()),
  onShowTipModal: z.function().args().returns(z.void()),
  hasAccess: z.boolean().optional(),
  subscriptionPrice: z.number().nullable().optional(),
  totalPhotos: z.number().int().nonnegative().default(0),
  totalVideos: z.number().int().nonnegative().default(0),
  followers: z.number().int().nonnegative().default(0),
  averageRating: z.number().nullable().optional(),
  reviewsCount: z.number().int().nonnegative().default(0),
  isFavorited: z.boolean().optional(),
  // ⬇⬇⬇ FIX: accept async functions (Promise<void>) for the favorite toggle
  onToggleFavorite: z.function().args().returns(z.promise(z.void())).optional(),
});

interface ProfileHeaderProps extends z.infer<typeof PropsSchema> {}

export default function ProfileHeader(rawProps: ProfileHeaderProps) {
  // Validate props (safe defaults to avoid crashes)
  const parsed = PropsSchema.safeParse(rawProps);
  const {
    username,
    profilePic,
    bio,
    isVerified,
    sellerTierInfo,
    user,
    onShowSubscribeModal,
    onShowUnsubscribeModal,
    onShowTipModal,
    hasAccess,
    subscriptionPrice,
    totalPhotos,
    totalVideos,
    followers,
    averageRating,
    reviewsCount,
    isFavorited = false,
    onToggleFavorite,
  } = parsed.success ? parsed.data : rawProps;

  const showSubscribeButton = user?.role === 'buyer' && user.username !== username && !hasAccess;
  const showUnsubscribeButton = user?.role === 'buyer' && user.username !== username && !!hasAccess;

  const sanitizedUsername = sanitizeStrict(username);

  // Get user activity status using the hook
  const { activityStatus, loading: activityLoading } = useUserActivityStatus(username);

  // Format the activity status for display
  const getActivityDisplay = () => {
    if (activityLoading) return 'Loading...';
    return formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
  };

  // Determine the status badge color and text based on activity
  const getStatusBadge = () => {
    if (activityLoading) {
      return (
        <span className="flex items-center gap-1 text-xs bg-gray-600 text-white px-2 py-1 rounded-full font-bold shadow">
          Loading...
        </span>
      );
    }

    if (activityStatus.isOnline) {
      return (
        <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold shadow">
          Active Now
        </span>
      );
    }

    const activityText = formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
    return (
      <span className="flex items-center gap-1 text-xs bg-gray-600 text-white px-2 py-1 rounded-full font-bold shadow">
        {activityText}
      </span>
    );
  };

  // Resolve profile picture URL so it loads correctly from backend when on :3000
  const resolvedProfilePic = resolveApiUrl(profilePic);

  // Normalize tier safely for TierBadge
  const normalizedTier: TierLevel | null = normalizeTier(sellerTierInfo?.tier);

  // Safe number rendering
  const safePhotos = Number.isFinite(totalPhotos) ? totalPhotos : 0;
  const safeVideos = Number.isFinite(totalVideos) ? totalVideos : 0;
  const safeFollowers = Number.isFinite(followers) ? followers : 0;
  const safeAvg = typeof averageRating === 'number' && Number.isFinite(averageRating) ? averageRating : null;
  const safeReviews = Number.isFinite(reviewsCount) ? reviewsCount : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(255,149,14,0.08)] backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-[#ff950e0d]" aria-hidden="true" />
      <div className="absolute -top-24 -right-10 h-56 w-56 rounded-full bg-[#ff950e1a] blur-3xl" aria-hidden="true" />
      <div className="relative p-6 sm:p-10">
        {/* Favorite button - high z-index and better positioning */}
        {user?.role === 'buyer' && user.username !== username && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 transition-colors group"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            type="button"
          >
            <Heart
              size={20}
              className={isFavorited ? 'fill-[#ff950e] text-[#ff950e]' : 'text-gray-300 group-hover:text-white'}
              style={{ pointerEvents: 'none' }}
            />
          </button>
        )}

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          {/* Profile visual */}
          <div className="flex flex-col items-center lg:items-start gap-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#ff950e33] blur-xl" aria-hidden="true" />
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full ring-4 ring-[#ff950e] ring-offset-4 ring-offset-black/60 overflow-hidden shadow-2xl">
                {resolvedProfilePic ? (
                  <img
                    src={resolvedProfilePic}
                    alt={`${sanitizedUsername}'s profile`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-gray-200 text-5xl font-bold">
                    {sanitizedUsername ? sanitizedUsername.charAt(0).toUpperCase() : '?'}
                  </div>
                )}

                {/* Online indicator */}
                {activityStatus.isOnline && !activityLoading && (
                  <span className="absolute bottom-3 right-3 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500 border-2 border-black" />
                  </span>
                )}
              </div>

              {normalizedTier && normalizedTier !== 'None' && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:-right-8 lg:bottom-6">
                  <TierBadge tier={normalizedTier} size="2xl" showTooltip={true} />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-2">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{sanitizedUsername}</span>
                {isVerified ? (
                  <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    <img src="/verification_badge.png" alt="Verified" className="w-4 h-4" /> Verified Seller
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                    <AlertTriangle className="w-4 h-4" /> Unverified
                  </span>
                )}
                {getStatusBadge()}
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <Lock className="w-4 h-4 text-[#ff950e]" /> Private Location
                </span>
                <span className="text-gray-400">{getActivityDisplay()}</span>
              </div>
            </div>
          </div>

          {/* Bio and quick info */}
          <div className="flex-1">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-base text-gray-200 leading-relaxed shadow-inner">
              <SecureMessageDisplay
                content={
                  bio ||
                  '🧾 Seller bio goes here. This is where the seller can share details about themselves, their offerings, and what subscribers can expect.'
                }
                allowBasicFormatting={false}
                maxLength={500}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <Camera className="mx-auto mb-2 h-6 w-6 text-[#ff950e]" />
                <p className="text-2xl font-semibold text-white">{safePhotos}</p>
                <p className="text-xs uppercase tracking-wide text-gray-400">Photos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <Video className="mx-auto mb-2 h-6 w-6 text-[#ff950e]" />
                <p className="text-2xl font-semibold text-white">{safeVideos}</p>
                <p className="text-xs uppercase tracking-wide text-gray-400">Videos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <Users className="mx-auto mb-2 h-6 w-6 text-[#ff950e]" />
                <p className="text-2xl font-semibold text-white">{safeFollowers}</p>
                <p className="text-xs uppercase tracking-wide text-gray-400">Followers</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <Star className="mx-auto mb-2 h-6 w-6 text-[#ff950e]" />
                {safeAvg !== null ? (
                  <>
                    <p className="text-2xl font-semibold text-white">{safeAvg.toFixed(1)}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-400">{safeReviews} Reviews</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-white">--</p>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Rating</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-between">
          <div className="flex flex-wrap gap-3 justify-center">
            {showSubscribeButton && (
              <button
                onClick={onShowSubscribeModal}
                className="flex items-center gap-2 rounded-full bg-[#ff950e] px-7 py-3 text-base font-semibold text-black shadow-lg shadow-[#ff950e33] transition hover:bg-[#e0850d]"
                type="button"
              >
                <DollarSign className="h-5 w-5" />
                {typeof subscriptionPrice === 'number' && subscriptionPrice > 0
                  ? `Subscribe ($${subscriptionPrice.toFixed(2)}/mo)`
                  : 'Subscribe'}
              </button>
            )}

            {showUnsubscribeButton && (
              <button
                onClick={onShowUnsubscribeModal}
                className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
                type="button"
              >
                <Lock className="h-5 w-5" />
                Unsubscribe
              </button>
            )}

            {user?.role === 'buyer' && user.username !== username && (
              <button
                className="flex items-center gap-2 rounded-full border border-[#ff950e] px-6 py-3 text-base font-semibold text-[#ff950e] transition hover:bg-[#ff950e]/10"
                onClick={onShowTipModal}
                type="button"
              >
                <Gift className="h-5 w-5" />
                Tip Seller
              </button>
            )}
          </div>

          {user?.role === 'buyer' && user.username !== username && (
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href={`/buyers/messages?thread=${encodeURIComponent(username)}`}
                className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
              >
                <Mail className="h-5 w-5" />
                Message
              </Link>

              <button
                className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 text-base font-semibold text-gray-500 cursor-not-allowed"
                disabled
                type="button"
              >
                <MessageCircle className="h-5 w-5" />
                Custom Request
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
