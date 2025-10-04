// src/components/buyers/dashboard/SubscribedSellers.tsx
'use client';

import Link from 'next/link';
import { Crown, CheckCircle, ExternalLink } from 'lucide-react';
import { SubscribedSellersProps } from '@/types/dashboard';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';

export default function SubscribedSellers({ subscriptions }: SubscribedSellersProps) {
  // 👇 Ensure the fallback isn't typed as never[]
  const list = (Array.isArray(subscriptions) ? subscriptions : []) as SubscribedSellersProps['subscriptions'];

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-200">
            <Crown className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
        </div>
        <span className="rounded-full bg-orange-400/20 px-3 py-1 text-xs font-semibold text-orange-200">
          {list.length}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-[#181818] p-10 text-center">
          <Crown className="mx-auto mb-3 h-12 w-12 text-gray-600" />
          <p className="text-sm text-gray-400">No active subscriptions yet.</p>
          <Link
            href="/browse"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] px-5 py-2 text-sm font-semibold text-black shadow-lg transition hover:shadow-[#ff950e]/30"
          >
            Browse sellers
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {list.map((sub) => {
            const sanitizedUsername = sanitizeUsername(sub.seller);

            // Robust number formatting (handles string/undefined)
            const monthlyPrice =
              typeof sub.price === 'number'
                ? sub.price
                : typeof sub.price === 'string'
                ? Number(sub.price)
                : 0;
            const priceDisplay = Number.isFinite(monthlyPrice) ? monthlyPrice.toFixed(2) : '0.00';

            const newListings =
              typeof sub.newListings === 'number'
                ? Math.max(0, sub.newListings)
                : Number.isFinite(Number(sub.newListings))
                ? Math.max(0, Number(sub.newListings))
                : 0;

            return (
              <article
                key={sub.seller}
                className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-gradient-to-br from-[#181818] to-[#0f0f0f] p-4 transition hover:border-[#ff950e]/40 hover:bg-[#161616]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {sub.pic ? (
                      <SecureImage
                        src={sub.pic}
                        alt={sub.seller}
                        className="h-12 w-12 rounded-full border border-white/10 object-cover"
                        fallbackSrc="/placeholder-avatar.png"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                        <Crown className="h-5 w-5" />
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/sellers/${sanitizedUsername}`}
                          className="text-sm font-medium text-white transition hover:text-[#ff950e]"
                        >
                          <SecureMessageDisplay content={sub.seller} allowBasicFormatting={false} className="inline" />
                        </Link>
                        {sub.verified && (
                          <span title="Verified" className="text-blue-200">
                            <CheckCircle className="h-4 w-4" />
                          </span>
                        )}
                        {sub.tier && (
                          <span className={`text-[10px] uppercase tracking-wide ${getTierColor(sub.tier)}`}>
                            {sub.tier}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                        <SecureMessageDisplay
                          content={sub.bio}
                          allowBasicFormatting={false}
                          maxLength={200}
                          className="inline"
                        />
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/sellers/${sanitizedUsername}`}
                    className="rounded-full border border-white/10 p-2 text-gray-500 transition hover:border-[#ff950e] hover:text-[#ff950e]"
                    title="View profile"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-wide text-gray-500">
                  <span>{newListings} new listings</span>
                  <span className="text-white/20">•</span>
                  <span>${priceDisplay}/month</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

const getTierColor = (tier?: string) => {
  switch (tier) {
    case 'Goddess':
      return 'text-purple-200';
    case 'Desire':
      return 'text-pink-200';
    case 'Obsession':
      return 'text-red-200';
    case 'Flirt':
      return 'text-orange-200';
    default:
      return 'text-amber-200';
  }
};
