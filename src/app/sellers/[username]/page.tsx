// src/app/sellers/[username]/page.tsx
//
// Server component. Its ONLY job is generateMetadata; the interactive
// page lives in SellerClient.tsx and is rendered unchanged.
//
// Why this exists: every seller shop served the generic homepage title
// and description, so Google saw dozens of near-duplicate pages and
// indexed almost none. That is the same failure that kept the two blog
// guides out of the index -- and metadata only reaches a crawler if it is
// rendered on the server, which a page using hooks cannot do.

import type { Metadata } from 'next';
import SellerClient from './SellerClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pantypost.com';

interface SellerProfile {
  username?: string;
  bio?: string | null;
  profilePic?: string | null;
  coverPhoto?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  totalSales?: number | null;
  isVerified?: boolean;
}

/* GET /api/users/:username/profile is public and needs no auth, which is
   what makes this possible at build/request time.
   
   Deliberately tolerant: if the fetch fails, metadata falls back to
   something generic rather than throwing. A profile page that renders
   with a plain title is far better than one that 500s. */
async function getSeller(username: string): Promise<SellerProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}/profile`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as SellerProfile;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const seller = await getSeller(username);

  const name = seller?.username || username;
  const canonical = `/sellers/${encodeURIComponent(username)}`;

  if (!seller) {
    return {
      title: `${name} on Panty Post`,
      description: `Browse ${name}'s listings on Panty Post.`,
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

  const sales = typeof seller.totalSales === 'number' ? seller.totalSales : 0;
  const rating = typeof seller.rating === 'number' ? seller.rating : null;
  const reviews = typeof seller.reviewCount === 'number' ? seller.reviewCount : 0;

  /* The description is built from real figures, and only mentions the
     ones that exist. A shop with no sales yet should not advertise "0
     sales" -- an empty claim is worse than none. */
  const credentials: string[] = [];
  if (rating !== null && reviews > 0) {
    credentials.push(`${rating.toFixed(1)} stars from ${reviews} review${reviews === 1 ? '' : 's'}`);
  }
  if (sales > 0) {
    credentials.push(`${sales} sale${sales === 1 ? '' : 's'}`);
  }

  const bio = (seller.bio || '').trim().replace(/\s+/g, ' ').slice(0, 110);

  const description =
    [
      bio || `Shop worn underwear from ${name} on Panty Post.`,
      credentials.length ? credentials.join(', ') + '.' : '',
      'Discreet, anonymous delivery.',
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 160);

  const image = seller.coverPhoto || seller.profilePic || undefined;

  return {
    title: `${name} — worn underwear on Panty Post`,
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
      title: `${name} on Panty Post`,
      description,
      url: `${BASE_URL}${canonical}`,
      type: 'profile',
      ...(image ? { images: [{ url: image, alt: `${name} on Panty Post` }] } : {}),
    },
  };
}

/* The seller record is fetched once, here, and used for BOTH the
   metadata above and the initial render below.
   
   Next dedupes identical fetch() calls within a single request, so
   calling getSeller twice costs one network round trip -- generateMetadata
   and this function share the result.
   
   The page previously rendered a client component that fetched
   everything itself, so the first HTML was a spinner. Now the seller's
   name, bio and avatar are in the markup before it leaves the server. */
export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const seller = await getSeller(username);

  return <SellerClient initialSeller={seller ?? undefined} />;
}

