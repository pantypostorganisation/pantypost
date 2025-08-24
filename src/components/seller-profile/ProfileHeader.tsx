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
  .passthrough()
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
  .passthrough()
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
  onToggleFavorite: z.function().args().returns(z.void()).optional(),
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
    <div className="bg-[#1a1a1a] rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center border border-gray-800 relative overflow-visible">
      {/* Favorite button - high z-index and better positioning */}
      {user?.role === 'buyer' && user.username !== username && onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-lg bg-[#222] hover:bg-[#333] transition-colors group z-50"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          type="button"
        >
          <Heart
            size={20}
            className={isFavorited ? 'fill-[#ff950e] text-[#ff950e]' : 'text-gray-400 group-hover:text-gray-300'}
            style={{ pointerEvents: 'none' }}
          />
        </button>
      )}

      {/* Profile section with centered profile pic and badge to the right */}
      <div className="flex flex-col items-center relative mb-6 w-full">
        {/* Profile Picture - Centered */}
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden shadow-lg relative z-10">
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
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-6xl font-bold">
              {sanitizedUsername ? sanitizedUsername.charAt(0).toUpperCase() : '?'}
            </div>
          )}

          {/* Online indicator - bottom left of profile picture */}
          {activityStatus.isOnline && !activityLoading && (
            <div className="absolute bottom-2 left-2 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a1a] z-20" />
          )}
        </div>

        {/* Badge positioned to the right of profile pic */}
        {normalizedTier && normalizedTier !== 'None' && (
          <div className="absolute right-0 sm:right-1/4 top-1/2 transform -translate-y-1/2 z-10">
            <TierBadge tier={normalizedTier} size="2xl" showTooltip={true} />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-white">{sanitizedUsername}</span>
          {isVerified ? (
            <div className="relative group">
              <img src="/verification_badge.png" alt="Verified" className="w-6 h-6" />
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                Verified Seller
              </div>
            </div>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-yellow-600 text-black px-2 py-1 rounded-full font-bold shadow">
              <AlertTriangle className="w-4 h-4" />
              Unverified
            </span>
          )}
          {getStatusBadge()}
        </div>

        <div className="text-sm text-gray-400 mb-1">Location: Private</div>
        <div className="text-sm text-gray-400 mb-3">{getActivityDisplay()}</div>

        <div className="text-base text-gray-300 font-medium max-w-2xl leading-relaxed">
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

      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-8 w-full border-t border-b border-gray-700 py-4">
        <div className="flex flex-col items-center">
          <Camera className="w-6 h-6 text-[#ff950e] mb-1" />
          <span className="text-lg font-bold text-white">{safePhotos}</span>
          <span className="text-xs text-gray-400">Photos</span>
        </div>
        <div className="flex flex-col items-center">
          <Video className="w-6 h-6 text-gray-500 mb-1" />
          <span className="text-lg font-bold text-white">{safeVideos}</span>
          <span className="text-xs text-gray-400">Videos</span>
        </div>
        <div className="flex flex-col items-center">
          <Users className="w-6 h-6 text-[#ff950e] mb-1" />
          <span className="text-lg font-bold text-white">{safeFollowers}</span>
          <span className="text-xs text-gray-400">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <Star className="w-6 h-6 text-[#ff950e] mb-1" />
          {safeAvg !== null ? (
            <>
              <span className="text-lg font-bold text-white">{safeAvg.toFixed(1)}</span>
              <span className="text-xs text-gray-400 mt-1">({safeReviews} reviews)</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-white">--</span>
              <span className="text-xs text-gray-400">Rating</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center w-full max-w-lg">
        {showSubscribeButton && (
          <button
            onClick={onShowSubscribeModal}
            className="flex items-center gap-2 bg-[#ff950e] text-black font-bold px-6 py-3 rounded-full shadow-lg hover:bg-[#e0850d] transition text-base"
            type="button"
          >
            <DollarSign className="w-5 h-5" />
            {typeof subscriptionPrice === 'number' && subscriptionPrice > 0
              ? `Subscribe ($${subscriptionPrice.toFixed(2)}/mo)`
              : 'Subscribe'}
          </button>
        )}

        {showUnsubscribeButton && (
          <button
            onClick={onShowUnsubscribeModal}
            className="flex items-center gap-2 bg-gray-700 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition text-base"
            type="button"
          >
            <Lock className="w-5 h-5" />
            Unsubscribe
          </button>
        )}

        {user?.role === 'buyer' && user.username !== username && (
          <button
            className="flex items-center gap-2 bg-gray-800 text-[#ff950e] font-bold px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition text-base"
            onClick={onShowTipModal}
            type="button"
          >
            <Gift className="w-5 h-5" />
            Tip Seller
          </button>
        )}

        {user?.role === 'buyer' && user.username !== username && (
          <Link
            href={`/buyers/messages?thread=${encodeURIComponent(username)}`}
            className="flex items-center gap-2 bg-gray-800 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-gray-700 transition text-base"
          >
            <Mail className="w-5 h-5" />
            Message
          </Link>
        )}

        {user?.role === 'buyer' && user.username !== username && (
          <button
            className="flex items-center gap-2 bg-gray-800 text-gray-500 font-bold px-6 py-3 rounded-full shadow-lg cursor-not-allowed text-base"
            disabled
            type="button"
          >
            <MessageCircle className="w-5 h-5" />
            Custom Request
          </button>
        )}
      </div>
    </div>
  );
}
