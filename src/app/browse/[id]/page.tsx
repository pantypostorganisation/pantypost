// src/app/browse/[id]/page.tsx
//
// Server component supplying generateMetadata. The interactive page is
// ListingClient.tsx, rendered unchanged.
//
// TWO problems are being fixed here.
//
// 1. Every listing served the generic homepage title and description, so
//    Google saw near-identical pages and indexed almost none.
//
// 2. `useBrowseDetail` calls useSearchParams(). Any client component
//    doing that makes the SERVER render the nearest Suspense fallback
//    instead of the page -- and the only boundary was the one wrapping
//    the whole app in ClientLayout, so a crawler got an empty body for
//    this route specifically. The <Suspense> below is that boundary,
//    placed low enough that everything above it still renders.

import { Suspense } from 'react';
import type { Metadata } from 'next';
import ListingClient from './ListingClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pantypost.com';

interface Listing {
  id?: string;
  title?: string;
  description?: string | null;
  price?: number | string | null;
  markedUpPrice?: number | null;
  imageUrls?: string[] | null;
  seller?: string;
  isPremium?: boolean;
  auction?: { isAuction?: boolean; highestBid?: number; startingPrice?: number } | null;
}

/* GET /api/listings/:id returns 404 for unapproved listings to anyone but
   the owner and admins -- so metadata cannot leak an unreviewed item.
   That is worth stating: this endpoint is safe to call unauthenticated
   precisely because moderation is enforced on the server. */
async function getListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_BASE}/api/listings/${encodeURIComponent(id)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as Listing;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  const canonical = `/browse/${encodeURIComponent(id)}`;

  if (!listing?.title) {
    return {
      title: 'Listing on Panty Post',
      description: 'Browse worn underwear from verified sellers on Panty Post.',
      alternates: { canonical },
    /* SafeSearch: this page carries explicit imagery, so it is tagged
       adult HERE, per-page -- the tags were removed from the root layout
       where they were filtering the whole site including the blog. */
    other: {
      rating: 'adult',
      RATING: 'RTA-5042-1996-1400-1577-RTA',
    },
    };
  }

  const isAuction = Boolean(listing.auction?.isAuction);
  const price = Number(
    isAuction
      ? listing.auction?.highestBid ?? listing.auction?.startingPrice ?? listing.price
      : listing.price
  );
  const priceLabel = Number.isFinite(price) ? `$${Math.round(price)}` : '';

  /* Title carries the item, the price and the seller -- the three things
     someone scanning a results page decides on. */
  const title = [
    listing.title,
    priceLabel ? `${isAuction ? 'bidding from' : ''} ${priceLabel}`.trim() : '',
    listing.seller ? `by ${listing.seller}` : '',
  ]
    .filter(Boolean)
    .join(' — ')
    .slice(0, 70);

  const body = (listing.description || '').trim().replace(/\s+/g, ' ');
  const description = (
    body
      ? `${body.slice(0, 120)}${body.length > 120 ? '...' : ''} Discreet, anonymous delivery from a verified seller.`
      : `${listing.title} from ${listing.seller || 'a verified seller'} on Panty Post. Discreet, anonymous delivery.`
  ).slice(0, 160);

  const image = listing.imageUrls?.[0];

  return {
    title,
    description,
    alternates: { canonical },
    /* SafeSearch: this page carries explicit imagery, so it is tagged
       adult HERE, per-page -- the tags were removed from the root layout
       where they were filtering the whole site including the blog. */
    other: {
      rating: 'adult',
      RATING: 'RTA-5042-1996-1400-1577-RTA',
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}${canonical}`,
      type: 'website',
      ...(image ? { images: [{ url: image, alt: listing.title }] } : {}),
    },
  };
}

/* The listing is fetched once and used for BOTH the metadata above and
   the first render below. Next dedupes identical fetch() calls within a
   request, so this costs one round trip, not two.

   The Suspense boundary stays: useBrowseDetail calls useSearchParams(),
   which makes the server render the nearest fallback. Without a boundary
   here that would be the one wrapping the whole app, and this route
   would serve an empty body again. */
export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ListingClient initialListing={listing ?? undefined} />
    </Suspense>
  );
}

