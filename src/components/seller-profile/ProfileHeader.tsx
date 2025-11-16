// src/components/seller-profile/ProfileHeader.tsx
'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  Mail,
  Gift,
  DollarSign,
  Camera,
  Video,
  Users,
  Star,
  AlertTriangle,
  Heart,
  ChevronDown,
} from 'lucide-react';
import TierBadge from '@/components/TierBadge';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { formatActivityStatus } from '@/utils/format';
import { useUserActivityStatus } from '@/hooks/useUserActivityStatus';
import { z } from 'zod';
import { resolveApiUrl } from '@/utils/url';
import type { TierLevel } from '@/utils/sellerTiers';
import { getCountryCode } from '@/utils/countries';
import { flagFromIso2 } from '@/constants/countries';

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
  country: z.string().nullable().optional(),
  isLocationPublic: z.boolean().optional(),
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
  onToggleFavorite: z.function().args().returns(z.promise(z.void())).optional(),
});

interface ProfileHeaderProps extends z.infer<typeof PropsSchema> {}

const ACTION_BUTTON_BASE =
  'group inline-flex h-12 min-w-[13rem] flex-shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm sm:text-base font-semibold transition-all duration-150 shadow-[0_8px_20px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';

export default function ProfileHeader(rawProps: ProfileHeaderProps) {
  // Validate props (safe defaults to avoid crashes)
  const parsed = PropsSchema.safeParse(rawProps);
  const {
    username,
    profilePic,
    bio,
    isVerified,
    sellerTierInfo,
    country,
    isLocationPublic,
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

  const [subscriptionMenuOpen, setSubscriptionMenuOpen] = useState(false);
  const subscriptionButtonRef = useRef<HTMLDivElement | null>(null);

  const shouldShowSubscriptionButton = user?.role === 'buyer' && user.username !== username;
  const isSubscribed = !!hasAccess;
  const subscribeLabel =
    typeof subscriptionPrice === 'number' && subscriptionPrice > 0
      ? `Subscribe ($${subscriptionPrice.toFixed(2)}/mo)`
      : 'Subscribe';

  const sanitizedUsername = sanitizeStrict(username);
  const sanitizedCountry = country ? sanitizeStrict(country) : '';
  const canDisplayLocation = Boolean(isLocationPublic && sanitizedCountry);
  const isoCode = canDisplayLocation ? getCountryCode(sanitizedCountry) : '';
  const normalizedIso = isoCode ? isoCode.toUpperCase() : '';
  const hasValidIso = normalizedIso && normalizedIso !== 'XX';
  const countryFlag = canDisplayLocation
    ? hasValidIso
      ? flagFromIso2(normalizedIso)
      : '🌐'
    : '';

  // Get user activity status using the hook
  const { activityStatus, loading: activityLoading } = useUserActivityStatus(username);

  useEffect(() => {
    if (!subscriptionMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (subscriptionButtonRef.current && !subscriptionButtonRef.current.contains(event.target as Node)) {
        setSubscriptionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [subscriptionMenuOpen]);

  useEffect(() => {
    if (!isSubscribed) {
      setSubscriptionMenuOpen(false);
    }
  }, [isSubscribed]);

  const handleSubscriptionClick = () => {
    if (isSubscribed) {
      if (subscriptionMenuOpen) {
        setSubscriptionMenuOpen(false);
      }
      return;
    }
    onShowSubscribeModal();
  };

  const handleToggleMenu = (event?: ReactMouseEvent<HTMLElement>) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (isSubscribed) {
      setSubscriptionMenuOpen(prev => !prev);
    }
  };

  const handleArrowKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggleMenu();
    }
  };

  const handleUnsubscribeClick = () => {
    setSubscriptionMenuOpen(false);
    onShowUnsubscribeModal();
  };

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
    <div className="bg-[#1a1a1a] rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col items-center border border-[#ff950e]/20 relative overflow-visible">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff950e]/5 via-transparent to-[#ff950e]/5 pointer-events-none"></div>
      
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
        {/* Profile Picture - Larger size */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-[#ff950e] bg-black flex items-center justify-center overflow-hidden shadow-lg relative z-10">
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

          {/* Online indicator - bottom right of profile picture */}
          {activityStatus.isOnline && !activityLoading && (
            <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#ff950e] rounded-full border-3 border-[#1a1a1a] z-20 shadow-lg"></div>
          )}
        </div>

        {/* Badge positioned to the right of profile pic - smaller */}
        {normalizedTier && normalizedTier !== 'None' && (
          <div className="absolute right-[15%] sm:right-[20%] top-1/2 transform -translate-y-1/2 z-10">
            <TierBadge tier={normalizedTier} size="lg" showTooltip={true} />
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

        {canDisplayLocation && (
          <div className="mb-2 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/30 bg-black/60 px-3 py-1 text-xs font-semibold text-gray-100 shadow-[0_0_18px_rgba(255,149,14,0.15)]">
              <span aria-hidden="true" className="text-base">
                {countryFlag}
              </span>
              <span className="text-sm">{sanitizedCountry}</span>
            </span>
          </div>
        )}

        <div className="text-base text-gray-300 font-medium max-w-2xl leading-relaxed mt-3">
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

      <div className="flex flex-wrap sm:flex-nowrap justify-center items-center gap-2 sm:gap-4 w-full max-w-3xl mx-auto">
        {shouldShowSubscriptionButton && (
          <div className="relative flex-shrink-0" ref={subscriptionButtonRef}>
            <button
              type="button"
              onClick={handleSubscriptionClick}
              className={`${ACTION_BUTTON_BASE} ${
                isSubscribed
                  ? 'bg-[#121212] border border-[#ff950e]/70 text-[#ff950e] hover:bg-[#1b1b1b]'
                  : 'bg-[#151515] border border-[#ff950e] text-white hover:bg-[#1f1f1f]'
              } hover:scale-[1.02]`}
              aria-haspopup={isSubscribed ? 'menu' : undefined}
              aria-expanded={isSubscribed ? subscriptionMenuOpen : undefined}
            >
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff950e]" />
              <span>{isSubscribed ? 'Subscribed' : subscribeLabel}</span>
              {isSubscribed && (
                <span
                  className="ml-1 flex items-center rounded-lg bg-[#ff950e]/10 p-1 text-[#ff950e] transition duration-150 group-hover:bg-[#ff950e]/20"
                  role="button"
                  tabIndex={0}
                  aria-label="Subscription options"
                  aria-haspopup="menu"
                  aria-expanded={subscriptionMenuOpen}
                  onClick={handleToggleMenu}
                  onKeyDown={handleArrowKeyDown}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${subscriptionMenuOpen ? 'rotate-180' : ''}`} />
                </span>
              )}
            </button>

            {isSubscribed && subscriptionMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-700 bg-[#111111] py-2 shadow-xl ring-1 ring-black/5">
                <button
                  type="button"
                  onClick={handleUnsubscribeClick}
                  className="flex w-full items-center justify-start px-4 py-2 text-sm font-medium text-white transition duration-150 hover:bg-[#1f1f1f] hover:text-[#ff950e]"
                >
                  Unsubscribe
                </button>
              </div>
            )}
          </div>
        )}

        {user?.role === 'buyer' && user.username !== username && (
          <button
            className={`${ACTION_BUTTON_BASE} bg-[#0e0e0e] text-[#ff950e] hover:bg-[#050505] hover:shadow-[0_0_12px_rgba(255,149,14,0.25)]`}
            onClick={onShowTipModal}
            type="button"
          >
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff950e]" />
            Tip Seller
          </button>
        )}

        {user?.role === 'buyer' && user.username !== username && (
          <Link
            href={`/buyers/messages?thread=${encodeURIComponent(username)}`}
            className={`${ACTION_BUTTON_BASE} bg-[#0e0e0e] text-[#ff950e] hover:bg-[#050505] hover:shadow-[0_0_12px_rgba(255,149,14,0.25)]`}
          >
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff950e]" />
            Message
          </Link>
        )}
      </div>
    </div>
  );
}
