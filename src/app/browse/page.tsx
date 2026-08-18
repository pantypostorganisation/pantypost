// src/app/browse/page.tsx
//
// Server component. The interactive catalogue lives in BrowseClient.tsx
// and is rendered unchanged.
//
// Until this wrapper existed, /browse was a client component with no
// metadata of its own, so it inherited everything from the root layout:
// the homepage title, the homepage description and -- fatally -- the
// homepage canonical, which told Google this page was a duplicate of
// '/'. It also carries the adult-rating tags, because this is the page
// where explicit listing imagery actually appears.

import type { Metadata } from 'next';
import BrowseClient from './BrowseClient';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';

export const metadata: Metadata = {
  title: 'Browse Worn Underwear Listings',
  description:
    'Browse worn underwear from identity-verified sellers. Every listing is reviewed before it goes live. Discreet, anonymous delivery.',
  alternates: { canonical: '/browse' },
  /* SafeSearch signals belong on the explicit surfaces ONLY -- they were
     removed from the root layout, where they were filtering the blog and
     help pages out of search along with everything else. */
  other: {
    rating: 'adult',
    RATING: 'RTA-5042-1996-1400-1577-RTA',
  },
  openGraph: {
    title: 'Browse Worn Underwear Listings | PantyPost',
    description:
      'Worn underwear from identity-verified sellers. Every listing reviewed before it goes live.',
    url: `${BASE_URL}/browse`,
    type: 'website',
  },
};

export default function BrowsePage() {
  return <BrowseClient />;
}
