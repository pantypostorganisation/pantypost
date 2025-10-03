// src/components/seller-profile/ListingsGrid.tsx
'use client';

import Link from 'next/link';
import { Lock, Crown, Clock, ArrowRight } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { z } from 'zod';
import { safeImageSrc, formatCurrency } from '@/utils/url';

const ListingSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().default(''),
  description: z.string().default(''),
  price: z.number().nonnegative().catch(0),
  markedUpPrice: z.number().nonnegative().optional(),
  imageUrls: z.array(z.string()).optional(),
  isPremium: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  hoursWorn: z.number().int().nonnegative().optional(),
});

const UserSchema = z
  .object({
    username: z.string().default(''),
    role: z.enum(['buyer', 'seller', 'admin']).optional(),
  })
  .nullable()
  .optional();

const PropsSchema = z.object({
  standardListings: z.array(ListingSchema).default([]),
  premiumListings: z.array(ListingSchema).default([]),
  hasAccess: z.boolean().optional(),
  username: z.string().default(''),
  user: UserSchema,
  onShowSubscribeModal: z.function().args().returns(z.void()),
});

type Listing = z.infer<typeof ListingSchema>;

interface ListingsGridProps extends z.infer<typeof PropsSchema> {}

export default function ListingsGrid(props: ListingsGridProps) {
  // Validate props defensively (no throw; we'll use safe defaults)
  const parsed = PropsSchema.safeParse(props);
  const {
    standardListings = [],
    premiumListings = [],
    hasAccess,
    username,
    user,
    onShowSubscribeModal,
  } = parsed.success ? parsed.data : { ...props, standardListings: [], premiumListings: [], username: '' };

  const allListings: Listing[] = [...standardListings, ...premiumListings];
  const sanitizedUsername = sanitizeStrict(username);

  return (
    <div className="mt-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          Listings by {sanitizedUsername}
        </h2>
        <p className="text-sm text-gray-400 max-w-xl">
          Explore intimate drops curated exclusively for our premium marketplace. Unlock full access by subscribing.
        </p>
      </div>

      {allListings.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border border-dashed border-white/15 bg-black/40 text-gray-400 italic shadow-inner shadow-black/40">
          <p className="text-lg mb-2">This seller has no active listings.</p>
          {user?.username === username && (
            <p className="text-sm mt-1 text-gray-500">
              Go to{' '}
              <Link href="/sellers/my-listings" className="text-[#ff950e] hover:underline">
                My Listings
              </Link>{' '}
              to create one.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {allListings.map((listing, index) => {
            const sanitizedTitle = sanitizeStrict(listing.title);
            const sanitizedDescription = sanitizeStrict(listing.description);
            const imageSrc = safeImageSrc(listing.imageUrls?.[0], { placeholder: '/placeholder-image.png' });

            // Price formatting - robust against undefined/NaN
            const basePrice =
              typeof listing.markedUpPrice === 'number' && Number.isFinite(listing.markedUpPrice)
                ? listing.markedUpPrice
                : listing.price;
            const priceLabel = formatCurrency(basePrice);

            return (
              <div
                key={listing.id || `listing-${index}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)] transition hover:border-[#ff950e]/40 hover:shadow-[0_30px_70px_-40px_rgba(255,149,14,0.5)]"
              >
                <div className="relative w-full overflow-hidden">
                  <div className="aspect-[3/4] w-full overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={sanitizedTitle || 'Listing image'}
                      className={`h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105 ${
                        listing.isPremium && !hasAccess ? 'blur-sm' : ''
                      }`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  {listing.isPremium && !hasAccess && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center text-white">
                      <Lock className="h-8 w-8 text-[#ff950e]" />
                      <div className="space-y-1">
                        <p className="text-lg font-semibold tracking-wide">Premium Reveal</p>
                        <p className="text-sm text-gray-300">
                          Subscribe to {sanitizedUsername} to unlock this listing.
                        </p>
                      </div>
                      {user?.role === 'buyer' && user.username !== username && (
                        <button
                          onClick={onShowSubscribeModal}
                          className="rounded-full bg-[#ff950e] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#ffa733]"
                          type="button"
                        >
                          Subscribe Now
                        </button>
                      )}
                    </div>
                  )}

                  {listing.isPremium && hasAccess && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ff950e] px-3 py-1 text-xs font-semibold text-black shadow">
                        <Crown className="h-4 w-4" /> Premium
                      </span>
                    </div>
                  )}

                  {typeof listing.hoursWorn === 'number' && Number.isFinite(listing.hoursWorn) && (
                    <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {listing.hoursWorn} hrs worn
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    <SecureMessageDisplay content={sanitizedTitle} allowBasicFormatting={false} />
                  </h3>

                  <div className="mt-2 flex-1 text-xs sm:text-sm text-gray-400 line-clamp-3">
                    <SecureMessageDisplay content={sanitizedDescription} allowBasicFormatting={false} />
                  </div>

                  {listing.tags && listing.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {listing.tags.slice(0, 8).map((tag, idx) => (
                        <span
                          key={`${listing.id}-tag-${idx}`}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-300"
                        >
                          {sanitizeStrict(tag)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <p className="text-lg font-semibold text-[#ff950e]">{priceLabel}</p>

                    {(!listing.isPremium || hasAccess) && (
                      <Link
                        href={`/browse/${encodeURIComponent(listing.id)}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff950e] transition hover:border-[#ff950e]/60 hover:bg-[#ff950e]/20"
                      >
                        View <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
