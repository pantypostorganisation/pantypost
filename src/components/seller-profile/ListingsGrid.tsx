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
    <div className="mt-16">
      <div className="mb-8 flex flex-col gap-2 text-center sm:text-left">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff950e]">Intimates</span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Curated listings by <span className="text-[#ff950e]">{sanitizedUsername}</span>
        </h2>
        <p className="text-sm text-gray-400">
          Explore ready-to-ship pieces and premium experiences tailored for admirers.
        </p>
      </div>

      {allListings.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] backdrop-blur-sm text-gray-400 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <p className="text-lg mb-2">This seller hasn&apos;t dropped any listings yet.</p>
          {user?.username === username && (
            <p className="text-sm mt-1">
              Head over to{' '}
              <Link href="/sellers/my-listings" className="text-[#ff950e] hover:underline">
                My Listings
              </Link>{' '}
              to create your first offer.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-[0_20px_45px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative w-full h-60 overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={sanitizedTitle || 'Listing image'}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      listing.isPremium && !hasAccess ? 'blur-lg scale-105' : ''
                    }`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />

                  {listing.isPremium && !hasAccess && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-black/10 via-black/70 to-black/90 text-center text-white">
                      <div className="rounded-full bg-[#ff950e]/20 p-3">
                        <Lock className="h-7 w-7 text-[#ff950e]" />
                      </div>
                      <span className="text-lg font-semibold tracking-wide">Premium Reveal</span>
                      <p className="px-6 text-sm text-gray-200">
                        Subscribe to {sanitizedUsername} to unlock their most intimate drops.
                      </p>
                      {user?.role === 'buyer' && user.username !== username && (
                        <button
                          onClick={onShowSubscribeModal}
                          className="rounded-full bg-[#ff950e] px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-[#ff950e33] transition hover:bg-[#e0850d]"
                          type="button"
                        >
                          Subscribe Now
                        </button>
                      )}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {listing.isPremium && hasAccess && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="flex items-center gap-1 rounded-full bg-[#ff950e] px-3 py-1 text-xs font-bold text-black shadow">
                        <Crown className="h-4 w-4" /> Premium
                      </span>
                    </div>
                  )}

                  {typeof listing.hoursWorn === 'number' && Number.isFinite(listing.hoursWorn) && (
                    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                      <Clock className="h-4 w-4" /> {listing.hoursWorn} Hours Worn
                    </div>
                  )}
                </div>

                <div className="flex flex-grow flex-col gap-4 p-6">
                  <h3 className="text-xl font-semibold text-white">
                    <SecureMessageDisplay content={sanitizedTitle} allowBasicFormatting={false} />
                  </h3>

                  <div className="flex-grow text-sm text-gray-300 line-clamp-3">
                    <SecureMessageDisplay content={sanitizedDescription} allowBasicFormatting={false} />
                  </div>

                  {listing.tags && listing.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.slice(0, 12).map((tag, idx) => (
                        <span
                          key={`${listing.id}-tag-${idx}`}
                          className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-200"
                        >
                          {sanitizeStrict(tag)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 px-5 py-4">
                    <p className="text-2xl font-semibold text-[#ff950e]">{priceLabel}</p>

                    {(!listing.isPremium || hasAccess) && (
                      <Link
                        href={`/browse/${encodeURIComponent(listing.id)}`}
                        className="inline-flex items-center gap-2 rounded-full bg-[#ff950e] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#e0850d]"
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
