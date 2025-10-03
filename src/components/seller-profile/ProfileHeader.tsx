// src/components/seller-profile/ProfileHeader.tsx
'use client';

import Link from 'next/link';
import {
  Lock,
  ArrowRight,
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
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-300 bg-white/10 px-3 py-1.5 rounded-full">
          Loading...
        </span>
      );
    }

    if (activityStatus.isOnline) {
      return (
        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-full">
          Active Now
        </span>
      );
    }

    const activityText = formatActivityStatus(activityStatus.isOnline, activityStatus.lastActive);
    return (
      <span className="flex items-center gap-2 text-xs font-semibold text-gray-300 bg-white/10 px-3 py-1.5 rounded-full">
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
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b0f12] via-[#0f0b0c] to-[#050505] shadow-[0_25px_80px_-30px_rgba(0,0,0,0.8)] px-6 sm:px-10 py-10">
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute -top-32 left-1/3 h-64 w-64 bg-[#ff950e]/30 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-72 w-72 bg-pink-500/10 blur-3xl" />
      </div>

      {user?.role === 'buyer' && user.username !== username && onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition-colors hover:bg-white/10 group z-20"
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

      <div className="relative flex flex-col gap-10 md:flex-row md:items-start">
        <div className="flex flex-col items-center md:items-start gap-6 md:w-64">
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden shadow-2xl shadow-black/40">
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
                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400 text-6xl font-bold">
                  {sanitizedUsername ? sanitizedUsername.charAt(0).toUpperCase() : '?'}
                </div>
              )}

              {activityStatus.isOnline && !activityLoading && (
                <div className="absolute bottom-2 left-2 w-4 h-4 bg-emerald-400 rounded-full border-2 border-black" />
              )}
            </div>

            {normalizedTier && normalizedTier !== 'None' && (
              <div className="absolute -right-4 bottom-0 translate-y-1/2">
                <TierBadge tier={normalizedTier} size="2xl" showTooltip={true} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-2 text-[11px] uppercase tracking-[0.18em] text-gray-400">
            <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5">Premium Marketplace</span>
            {normalizedTier && normalizedTier !== 'None' && (
              <span className="px-3 py-1 rounded-full border border-[#ff950e]/40 text-[#ff950e] bg-[#ff950e]/10">{normalizedTier} Tier</span>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-8 text-center md:text-left">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{sanitizedUsername}</span>
                  {isVerified ? (
                    <div className="relative group">
                      <img src="/verification_badge.png" alt="Verified" className="w-6 h-6" />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        Verified Seller
                      </div>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                      <AlertTriangle className="w-4 h-4" />
                      Unverified
                    </span>
                  )}
                  {getStatusBadge()}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-300">
                  <span className="text-gray-400">Location: Private</span>
                  <span className="hidden sm:inline text-gray-600">•</span>
                  <span>{getActivityDisplay()}</span>
                </div>
              </div>

              {user?.role === 'buyer' && user.username !== username && (
                <div className="flex justify-center sm:justify-end">
                  <a
                    href="#listings"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 hover:border-[#ff950e]/50 hover:text-white"
                  >
                    Explore Listings
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="text-base text-gray-200/90 leading-relaxed max-w-3xl mx-auto md:mx-0">
              <SecureMessageDisplay
                content={
                  bio ||
                  '🧾 Seller bio goes here. This is where the seller can share details about themselves, their offerings, and what subscribers can expect.'
                }
                allowBasicFormatting={false}
                maxLength={500}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center shadow-inner shadow-black/20">
              <Camera className="mx-auto mb-3 h-6 w-6 text-[#ff950e]" />
              <p className="text-2xl font-semibold text-white">{safePhotos}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400">Photos</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center shadow-inner shadow-black/20">
              <Video className="mx-auto mb-3 h-6 w-6 text-pink-300" />
              <p className="text-2xl font-semibold text-white">{safeVideos}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400">Videos</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center shadow-inner shadow-black/20">
              <Users className="mx-auto mb-3 h-6 w-6 text-[#ff950e]" />
              <p className="text-2xl font-semibold text-white">{safeFollowers}</p>
              <p className="text-xs uppercase tracking-widest text-gray-400">Followers</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-5 text-center shadow-inner shadow-black/20">
              <Star className="mx-auto mb-3 h-6 w-6 text-yellow-300" />
              {safeAvg !== null ? (
                <>
                  <p className="text-2xl font-semibold text-white">{safeAvg.toFixed(1)}</p>
                  <p className="text-xs uppercase tracking-widest text-gray-400">{safeReviews} reviews</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold text-white">--</p>
                  <p className="text-xs uppercase tracking-widest text-gray-400">Rating</p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {showSubscribeButton && (
              <button
                onClick={onShowSubscribeModal}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff950e] to-[#f97316] px-6 py-3 text-base font-semibold text-black shadow-lg shadow-[#ff950e]/30 transition hover:from-[#ffa733] hover:to-[#fb923c]"
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
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-red-500/40 hover:text-red-200"
                type="button"
              >
                <Lock className="h-5 w-5" />
                Unsubscribe
              </button>
            )}

            {user?.role === 'buyer' && user.username !== username && (
              <button
                className="flex items-center gap-2 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-6 py-3 text-base font-semibold text-[#ff950e] transition hover:border-[#ff950e]/60 hover:bg-[#ff950e]/20"
                onClick={onShowTipModal}
                type="button"
              >
                <Gift className="h-5 w-5" />
                Tip Seller
              </button>
            )}

            {user?.role === 'buyer' && user.username !== username && (
              <Link
                href={`/buyers/messages?thread=${encodeURIComponent(username)}`}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:border-white/30"
              >
                <Mail className="h-5 w-5" />
                Message
              </Link>
            )}

            {user?.role === 'buyer' && user.username !== username && (
              <button
                className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-6 py-3 text-base font-semibold text-gray-500 cursor-not-allowed"
                disabled
                type="button"
              >
                <MessageCircle className="h-5 w-5" />
                Custom Request
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            <a href="#listings" className="rounded-full border border-white/10 px-4 py-2 hover:border-[#ff950e]/40 hover:text-white">
              Listings
            </a>
            <a href="#gallery" className="rounded-full border border-white/10 px-4 py-2 hover:border-[#ff950e]/40 hover:text-white">
              Gallery
            </a>
            <a href="#reviews" className="rounded-full border border-white/10 px-4 py-2 hover:border-[#ff950e]/40 hover:text-white">
              Reviews
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
