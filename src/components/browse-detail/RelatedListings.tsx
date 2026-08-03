// src/components/browse-detail/RelatedListings.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Star } from 'lucide-react';
import { listingsService } from '@/services/listings.service';
import { sanitizeUsername } from '@/utils/security/sanitization';

interface RelatedListingsProps {
  currentListingId: string;
  seller: string;
  tags?: string[];
  /** Tiles per row. Four matches the browse grid at xl. */
  limit?: number;
}

interface RelatedItem {
  id: string;
  title: string;
  seller: string;
  price?: number;
  markedUpPrice?: number;
  imageUrls?: string[];
  isPremium?: boolean;
  sellerProfile?: { rating?: number; reviewCount?: number };
}

function priceOf(listing: RelatedItem): string {
  const value = listing.markedUpPrice ?? listing.price ?? 0;
  return `$${String(Number(value).toFixed(2)).replace(/\.00$/, '')}`;
}

/**
 * One tile. Deliberately the same reading order as the browse card —
 * square image, then title, rating, seller, price — but without the
 * auction timer, favourite and admin controls, which do not belong in a
 * secondary row. No border or background: the photo defines the tile.
 */
function RelatedTile({ listing }: { listing: RelatedItem }) {
  const rating = listing.sellerProfile?.rating;
  const reviewCount = listing.sellerProfile?.reviewCount;
  const hasRating = typeof rating === 'number' && rating > 0;
  const image = listing.imageUrls?.[0];

  return (
    <Link href={`/browse/${listing.id}`} className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-md bg-surface-raised">
        {image ? (
          <img
            src={image}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={(e) => {
              const target = e.currentTarget;
              target.src = '/placeholder-panty.png';
              target.onerror = null;
            }}
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Package className="h-7 w-7 text-ink-faint" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 pt-2">
        <h3 className="line-clamp-2 text-sm leading-snug text-ink-muted transition-colors group-hover:underline">
          {listing.title}
        </h3>

        {hasRating && (
          <span className="inline-flex items-center gap-0.5 text-xs">
            <span className="font-medium text-ink-muted">{rating.toFixed(1)}</span>
            <Star className="h-3 w-3 fill-primary text-primary" />
            {typeof reviewCount === 'number' && reviewCount > 0 && (
              <span className="text-ink-faint">({reviewCount})</span>
            )}
          </span>
        )}

        <span className="truncate text-xs text-ink-faint">{listing.seller}</span>
        <p className="mt-0.5 text-sm font-semibold text-ink">{priceOf(listing)}</p>
      </div>
    </Link>
  );
}

function Row({
  heading,
  action,
  listings,
}: {
  heading: string;
  action?: { label: string; href: string };
  listings: RelatedItem[];
}) {
  if (listings.length === 0) return null;

  return (
    <section className="border-t border-line pt-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">{heading}</h2>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            {action.label}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {listings.map((listing) => (
          <RelatedTile key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

export default function RelatedListings({
  currentListingId,
  seller,
  tags,
  limit = 4,
}: RelatedListingsProps) {
  const safeSeller = sanitizeUsername(seller);

  const [fromSeller, setFromSeller] = useState<RelatedItem[]>([]);
  const [similar, setSimilar] = useState<RelatedItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Premium listings are excluded from both rows: a locked tile in a
      // recommendation strip is an advert for something the viewer
      // cannot see, and it would need the whole subscription-state
      // apparatus to render honestly.
      const usable = (items: RelatedItem[]) =>
        items.filter((item) => item.id !== currentListingId && !item.isPremium);

      try {
        const sellerResult = await listingsService.getListingsBySeller(safeSeller);
        if (!cancelled && sellerResult.success && sellerResult.data) {
          setFromSeller(usable(sellerResult.data as unknown as RelatedItem[]).slice(0, limit));
        }
      } catch (error) {
        console.error('[RelatedListings] Failed to load seller listings:', error);
      }

      const topTags = (tags || []).filter(Boolean).slice(0, 3);
      if (topTags.length === 0) return;

      try {
        // Over-fetch, because the current listing and the same seller's
        // other items are filtered out client-side and would otherwise
        // eat into the row.
        const tagResult = await listingsService.getListings({
          tags: topTags,
          isActive: true,
          limit: limit * 4,
        });

        if (!cancelled && tagResult.success && tagResult.data) {
          const others = usable(tagResult.data as unknown as RelatedItem[]).filter(
            (item) => item.seller !== safeSeller
          );
          setSimilar(others.slice(0, limit));
        }
      } catch (error) {
        console.error('[RelatedListings] Failed to load similar listings:', error);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentListingId, safeSeller, tags, limit]);

  if (fromSeller.length === 0 && similar.length === 0) return null;

  return (
    <div className="mt-10 space-y-8">
      <Row
        heading={`More from ${safeSeller}`}
        action={{ label: 'Visit shop', href: `/sellers/${safeSeller}` }}
        listings={fromSeller}
      />
      <Row heading="You may also like" listings={similar} />
    </div>
  );
}
